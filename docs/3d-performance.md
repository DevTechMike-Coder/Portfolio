# 3D loading and rendering

The portfolio keeps its interactive scenes, but treats them as enhancements rather than prerequisites for showing the page.

## Loading boundaries

- `HeroScene`, `SecurityCoreScene`, and `TechNetworkScene` are lightweight React shells. Keep Three.js and R3F imports out of these modules and their shared loading wrapper. The site no longer uses `@react-three/drei` at all — the four helpers it needed (`Float`, `OrbitControls`, `Html`, `PerformanceMonitor`) are replaced by small local modules (`SceneFloat`, `DragOrbit`, `HtmlLabel`, and the `DprAutotuner` inside `SceneCanvas`) so the shared WebGL chunk stays as small as possible.
- The hero uses Astro's `client:idle` with no forced timeout, so it never interrupts the main thread during load; hydration happens only when the browser is genuinely idle. Once hydrated, the heavy `HeroCanvas` chunk waits behind an **engagement gate** (`engageOn="interaction"`): it is requested only after the visitor's first engagement signal — pointer move/press, wheel, touch, key press, focus, or scroll — with a 15 s fallback timer for completely idle visitors. A bounce visitor therefore downloads and evaluates zero Three.js, and lab audits (which never interact) measure only the lightweight shell plus the static placeholder. Below-the-fold scenes keep `engageOn="visible"` since reaching them already requires scrolling.
- Security and tech islands use `client:visible` with a 150px margin to hydrate shortly before reaching them. Their dynamic canvas imports and WebGL initialization still wait for actual viewport intersection.
- Project tilt cards (`ProjectTiltCard.astro`) are server-rendered HTML with one small shared pointer-handler script — they are not React islands and hydrate nothing.
- Root-level horizontal overflow is clipped so wide content does not enlarge the mobile layout viewport and cause premature intersection/loading.
- `LazyCanvasWrapper` renders the same fixed-size SVG placeholder on the server and on the first client render. The placeholder also remains while downloading the lazy chunk and initializing the first frame. Layout height is reserved at mobile, tablet, and desktop sizes.
- Browsers without JavaScript keep the static illustration and the existing HTML content/technology inventory. Browsers without WebGL2, or with a failed scene import/render, get a static fallback rather than an empty island.
- A single cached WebGL2 capability check releases its temporary context. Three.js no longer supports WebGL1, so a WebGL1-only result is not sufficient.

## Frame policy

`SceneCanvas.tsx` owns the policy and quality settings:

| Scene state | Frame loop |
| --- | --- |
| Visible, page visible, normal motion | `always` — the decorative animation is intentionally continuous, but **capped at 30 fps** (`SceneCanvas` runs R3F in `demand` mode and a `FrameDriver` invalidates at the cap instead of letting R3F render at display rate; on 90–120 Hz screens this is a 3–4× reduction) |
| Reduced motion, or inspecting a technology node | `demand` — only state changes/interaction redraw |
| Persistent hero offscreen or page hidden | `never` — even invalidation requests cannot keep drawing |
| Nonpersistent security/tech scene offscreen or page hidden | Canvas unmounted; WebGL resources released |

The adaptive `DprAutotuner` thresholds are relative to the 30 fps cap so it can still detect real slowdowns and recover under the capped loop.

The persistent hero still has an `IntersectionObserver`: persistence preserves the mounted canvas, **not** permission to animate. Re-entering the viewport resumes it.

There are no global pointer-move invalidation listeners. Technology hover damping only invalidates while the node is moving, snaps to its target at a small epsilon, then stops. Idle auto-rotation and floating pause while inspecting a node. Manual orbit dragging remains available in reduced-motion mode, without inertial damping.

## Animations

Section reveals (hero entrance, about cards, journey timeline) use the ~1 KiB IntersectionObserver + CSS transition system in `src/lib/reveal.ts` instead of GSAP/ScrollTrigger. Elements are hidden with a `.reveal-item` class applied by the client script, so server-rendered and no-JS browsers see fully visible content. `prefers-reduced-motion` disables all transitions.

The background spotlight (`InteractiveGrid`) runs no animation loop at all on touch devices — it paints a static ambient glow and only tracks active touches. On desktop the loop is capped at ~30 fps, which is indistinguishable for a soft glow and halves the style/paint cost.

> Note: a `THREE.WebGLRenderer: Context Lost.` line appears in the console whenever a non-persistent canvas unmounts. React Three Fiber calls `gl.forceContextLoss()` on unmount to release GPU memory, and three.js logs it unconditionally. This is expected cleanup, not a crash — the canvas is unmounted and recreated when scrolled back into view.

## Quality budget

- Start at DPR 1.
- Cap DPR at 1 for coarse pointers or widths up to 767px; otherwise cap at 1.5 and the actual device DPR, whichever is smaller.
- Adaptive resolution runs only during continuous animation. A bounded performance monitor falls back to DPR 1 rather than adjusting indefinitely.
- Disable MSAA (`antialias: false`); thin edges can be less smooth, especially at DPR 1.
- Renderer `powerPreference` is `default`, not `high-performance`. Multiple concurrent canvases then share the integrated GPU on mobile instead of exhausting the discrete context pool (which triggers "Context Lost").
- Hero particles: 50 instead of 100; hero torus segments: 12 × 48 instead of 16 × 100.
- Security torus segments: 12 × 64 instead of 16 × 80.
- Technology spheres use 16 × 16 segments, with hover scaling instead of rebuilding geometry. Network-line geometry is declarative so R3F disposes it on unmount.
- No `transmission`/physical materials: the hero core and security prism use `meshStandardMaterial`. Transmission forces an extra full-scene render pass every frame for a subtle glass look.
- Dead code removed: the legacy `myBento.astro` section and both marquee components were not referenced by any page (the live site renders `GitHubDashboard`, `About`, and the `TechStack` inventory instead) and duplicated element IDs — they are gone from the source tree. The unused Google Maps loader dependency (`@googlemaps/js-api-loader` and `GoogleMapBackground.tsx`) was removed as well.

## Verification

```sh
npm ci
npm run check
npm run build
npx playwright install chromium
npm run test:scenes
```

On Linux, `npx playwright install --with-deps chromium` can also install browser system dependencies. `test:scenes` starts/reuses the local Astro dev server. Avoid running Astro check/build concurrently with dev-server tests, since these commands can re-optimize the same Vite cache.

To test an already running or deployed **production** preview instead:

```sh
PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app npm run test:scenes
```

A system Chromium executable can be supplied through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

The browser tests cover SSR without JavaScript, idle/visible loading boundaries, stable container heights, actual WebGL draw inactivity offscreen/in hidden tabs/with reduced motion, resumption without replacing the hero canvas, mobile DPR/MSAA settings, lower-scene disposal, technology hover settling and manual dragging, and WebGL/download failure fallbacks. GitHub API requests are stubbed; no credentials are needed.

For performance numbers, profile a production deployment with cold-cache mobile throttling. Inspect the network waterfall to confirm that `SceneCanvas` (the shared rendering library chunk) is not fetched before a canvas is eligible to load. Compare LCP, blocking time/INP, and server response time separately from FPS. The 3D payload is **deferred, not eliminated**; these changes do not by themselves establish a particular Lighthouse score or loading-time percentage.
