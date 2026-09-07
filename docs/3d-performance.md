# 3D loading and rendering

The portfolio keeps its interactive scenes, but treats them as enhancements rather than prerequisites for showing the page.

## Loading boundaries

- `HeroScene`, `SecurityCoreScene`, and `TechNetworkScene` are lightweight React shells. Keep Three.js, R3F, and Drei imports out of these modules and their shared loading wrapper.
- The hero uses Astro's `client:idle` with a 2-second **maximum wait**, not a fixed 2-second delay. Once hydrated, it only requests `HeroCanvas` when its container is visible.
- Security and tech islands use `client:visible` with a 150px margin to hydrate shortly before reaching them. Their dynamic canvas imports and WebGL initialization still wait for actual viewport intersection.
- Root-level horizontal overflow is clipped so wide content does not enlarge the mobile layout viewport and cause premature intersection/loading.
- `LazyCanvasWrapper` renders the same fixed-size SVG placeholder on the server and on the first client render. The placeholder also remains while downloading the lazy chunk and initializing the first frame. Layout height is reserved at mobile, tablet, and desktop sizes.
- Browsers without JavaScript keep the static illustration and the existing HTML content/technology inventory. Browsers without WebGL2, or with a failed scene import/render, get a static fallback rather than an empty island.
- A single cached WebGL2 capability check releases its temporary context. Three.js no longer supports WebGL1, so a WebGL1-only result is not sufficient.

## Frame policy

`SceneCanvas.tsx` owns the policy and quality settings:

| Scene state | Frame loop |
| --- | --- |
| Visible, page visible, normal motion | `always` — the decorative animation is intentionally continuous |
| Reduced motion, or inspecting a technology node | `demand` — only state changes/interaction redraw |
| Persistent hero offscreen or page hidden | `never` — even invalidation requests cannot keep drawing |
| Nonpersistent security/tech scene offscreen or page hidden | Canvas unmounted; WebGL resources released |

The persistent hero still has an `IntersectionObserver`: persistence preserves the mounted canvas, **not** permission to animate. Re-entering the viewport resumes it.

There are no global pointer-move invalidation listeners. Technology hover damping only invalidates while the node is moving, snaps to its target at a small epsilon, then stops. Idle auto-rotation and floating pause while inspecting a node. Manual orbit dragging remains available in reduced-motion mode, without inertial damping.

## Quality budget

- Start at DPR 1.
- Cap DPR at 1 for coarse pointers or widths up to 767px; otherwise cap at 1.5 and the actual device DPR, whichever is smaller.
- Adaptive resolution runs only during continuous animation. A bounded performance monitor falls back to DPR 1 rather than adjusting indefinitely.
- Disable MSAA (`antialias: false`); thin edges can be less smooth, especially at DPR 1.
- Hero particles: 50 instead of 100; hero torus segments: 12 × 48 instead of 16 × 100.
- Security torus segments: 12 × 64 instead of 16 × 80.
- Technology spheres use 16 × 16 segments, with hover scaling instead of rebuilding geometry. Network-line geometry is declarative so R3F disposes it on unmount.

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
