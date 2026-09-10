import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const heroShell = '#home astro-island[component-url*="HeroScene"] > div';
const securityShell = '#about astro-island[component-url*="SecurityCoreScene"] > div';
const techShell = '#stack astro-island[component-url*="TechNetworkScene"] > div > div:first-child';
const is3DModule = (url: string) => /HeroCanvas|SecurityCoreCanvas|TechNetworkCanvas|SceneCanvas|react-three|three[._/]/.test(url);

type InstrumentedCanvas = HTMLCanvasElement & { __sceneDrawCalls?: number };
let pageErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  // These tests don't depend on a GitHub token, network availability, or API quota.
  await page.route("**/api/github-contributions.json", (route) => route.fulfill({
    json: { totalContributions: 0, weeks: [] },
  }));
  await page.addInitScript(() => {
    // Count actual GPU draw submissions, not just a DOM 'paused' flag.
    if (typeof WebGL2RenderingContext === "undefined") return;
    for (const name of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"] as const) {
      const original = WebGL2RenderingContext.prototype[name];
      Object.defineProperty(WebGL2RenderingContext.prototype, name, {
        configurable: true,
        value: function (this: WebGL2RenderingContext, ...args: number[]) {
          const canvas = this.canvas as InstrumentedCanvas;
          canvas.__sceneDrawCalls = (canvas.__sceneDrawCalls || 0) + 1;
          return Reflect.apply(original, this, args);
        },
      });
    }
  });
});

test.afterEach(() => {
  expect(pageErrors, "No uncaught browser or hydration errors").toEqual([]);
});

async function scrollToScene(page: Page, selector: string) {
  await page.locator(selector).evaluate((element) => {
    element.scrollIntoView({ block: "center", behavior: "instant" });
  });
}

async function drawCount(canvas: Locator) {
  return canvas.evaluate((element) => (element as InstrumentedCanvas).__sceneDrawCalls || 0);
}

async function expectDrawing(canvas: Locator) {
  await expect(canvas).toBeVisible();
  const before = await drawCount(canvas);
  await expect.poll(() => drawCount(canvas)).toBeGreaterThan(before);
}

async function expectIdle(page: Page, canvas: Locator) {
  // Allow an in-flight frame or hover damping to finish, then verify inactivity.
  await expect.poll(async () => {
    const before = await drawCount(canvas);
    await page.waitForTimeout(350);
    if ((await drawCount(canvas)) !== before) return false;
    // A queued R3F frame can drain after the policy switches. Require both
    // intervals to be quiet, retrying the entire observation if one arrives.
    await page.waitForTimeout(500);
    return (await drawCount(canvas)) === before;
  }).toBe(true);
}

test("server-rendered placeholders reserve space without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(baseURL!);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const selector of [heroShell, securityShell, techShell]) {
        const shell = page.locator(selector);
        await expect(shell.locator("[data-scene-placeholder]")).toHaveCount(1);
        const box = await shell.boundingBox();
        expect(box!.width).toBeGreaterThan(200);
        expect(box!.height).toBeGreaterThanOrEqual(320);
      }
    }
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Micah");
    await expect(page.locator("#stack")).toContainText("TypeScript");
  } finally {
    await context.close();
  }
});

test("hero waits for idle and lower islands wait for visibility", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.addInitScript(() => {
    const callbacks = new Map<number, IdleRequestCallback>();
    const originalRequest = window.requestIdleCallback.bind(window);
    const originalCancel = window.cancelIdleCallback.bind(window);
    let id = 0;
    window.requestIdleCallback = (callback) => {
      callbacks.set(++id, callback);
      return id;
    };
    window.cancelIdleCallback = (handle) => { callbacks.delete(handle); };
    (window as Window & { releaseIdle?: () => void }).releaseIdle = () => {
      window.requestIdleCallback = originalRequest;
      window.cancelIdleCallback = originalCancel;
      callbacks.forEach((callback) => callback({ didTimeout: false, timeRemaining: () => 50 }));
      callbacks.clear();
    };
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator(heroShell).locator("[data-scene-placeholder]")).toBeVisible();
  expect(requests.some(is3DModule)).toBe(false);
  expect(requests.some((url) => /SecurityCoreScene|TechNetworkScene/.test(url))).toBe(false);

  const before = await page.locator(heroShell).boundingBox();
  await page.evaluate(() => (window as Window & { releaseIdle?: () => void }).releaseIdle?.());
  await expectDrawing(page.locator("#home canvas"));
  const after = await page.locator(heroShell).boundingBox();
  expect(after!.height).toBe(before!.height);
  expect(requests.some((url) => url.includes("HeroCanvas"))).toBe(true);
  expect(requests.some((url) => /SecurityCoreCanvas|TechNetworkCanvas/.test(url))).toBe(false);
});

test("persistent hero stops offscreen, in hidden tabs, and for reduced motion, then resumes", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("#home canvas");
  const policy = page.locator("#home [data-frameloop]");
  await expectDrawing(canvas);
  const original = await canvas.elementHandle();

  await page.locator("#contact").evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
  await expect(policy).toHaveAttribute("data-frameloop", "never");
  await expectIdle(page, canvas);
  await page.mouse.move(20, 20);
  await expectIdle(page, canvas);

  await scrollToScene(page, heroShell);
  await expect(policy).toHaveAttribute("data-frameloop", "always");
  await expectDrawing(canvas);
  expect(await original!.evaluate((element) => element === document.querySelector("#home canvas"))).toBe(true);

  // Simulate the visibility event without relying on headless-tab focus behavior.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(policy).toHaveAttribute("data-frameloop", "never");
  await expectIdle(page, canvas);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expectDrawing(canvas);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(policy).toHaveAttribute("data-frameloop", "demand");
  await expectIdle(page, canvas);
  await page.mouse.move(30, 30);
  await expectIdle(page, canvas);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(policy).toHaveAttribute("data-frameloop", "always");
  await expectDrawing(canvas);
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 667 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

  test("defers offscreen 3D, caps DPR, and releases lower canvases on exit", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('#home astro-island[client="idle"]')).not.toHaveAttribute("ssr", "");
    expect((await page.locator(heroShell).boundingBox())!.y).toBeGreaterThanOrEqual(667);
    expect(requests.some(is3DModule)).toBe(false);

    for (const [selector, section] of [[heroShell, "home"], [securityShell, "about"], [techShell, "stack"]]) {
      await scrollToScene(page, selector);
      const canvas = page.locator(`#${section} canvas`);
      await expectDrawing(canvas);
      const settings = await canvas.evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        return {
          dpr: canvas.width / canvas.getBoundingClientRect().width,
          antialias: canvas.getContext("webgl2")!.getContextAttributes()!.antialias,
        };
      });
      expect(settings.dpr).toBeLessThanOrEqual(1.01);
      expect(settings.antialias).toBe(false);
    }

    await expect(page.locator("#home [data-frameloop]")).toHaveAttribute("data-frameloop", "never");
    await expect(page.locator("#about canvas")).toHaveCount(0);
    await page.locator("#contact").evaluate((element) => element.scrollIntoView({ behavior: "instant" }));
    await expect(page.locator("#stack canvas")).toHaveCount(0);
    await scrollToScene(page, securityShell);
    await expectDrawing(page.locator("#about canvas"));
  });
});

test("technology hover settles to idle; drag still works in reduced-motion mode", async ({ page }) => {
  await page.goto("/");
  await scrollToScene(page, techShell);
  const canvas = page.locator("#stack canvas");
  const policy = page.locator("#stack [data-frameloop]");
  await expectDrawing(canvas);
  await expect(page.locator("[data-tech-node]")).toHaveCount(14);

  // Labels are positioned 0.45 world units below their spheres, with distanceFactor 9.
  // Use their projected scale to aim a real pointer event at a visible node.
  const labels = page.locator("[data-tech-node]");
  for (let i = 0; i < 14; i++) {
    const target = await labels.nth(i).evaluate((element) => {
      const label = element as HTMLElement;
      const box = label.getBoundingClientRect();
      const canvas = document.querySelector("#stack canvas")!.getBoundingClientRect();
      const scale = box.height / label.offsetHeight;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 - 0.45 * canvas.height / 9 * scale };
    });
    await page.mouse.move(target.x, target.y);
    if (await policy.getAttribute("data-frameloop") === "demand") break;
  }
  await expect(policy).toHaveAttribute("data-frameloop", "demand");
  await expect(page.locator("[data-tech-inspector]")).toBeVisible();
  await expectIdle(page, canvas);

  await page.mouse.move(20, 20);
  await expect(policy).toHaveAttribute("data-frameloop", "always");
  await expectDrawing(canvas);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(policy).toHaveAttribute("data-frameloop", "demand");
  await expectIdle(page, canvas);
  const label = labels.first();
  const before = await label.boundingBox();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 35, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => Math.abs((await label.boundingBox())!.x - before!.x)).toBeGreaterThan(5);
  await expectIdle(page, canvas);
});

test("WebGL-unavailable browsers keep the static view without downloading 3D", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (/webgl/.test(type)) return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  await page.goto("/");
  await expect(page.locator("#home").getByRole("status")).toContainText("static view active");
  await scrollToScene(page, techShell);
  await expect(page.locator("#stack").getByRole("status")).toContainText("static view active");
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator("[data-tech-inspector]")).toContainText("TypeScript");
  expect(requests.some(is3DModule)).toBe(false);
});

test("a failed 3D chunk leaves a usable static fallback", async ({ page }) => {
  await page.route("**/HeroCanvas*", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#home").getByRole("status")).toContainText("static view active");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Micah");
  await expect(page.locator("#home").getByRole("link", { name: "View Projects" })).toBeVisible();
  await expect(page.locator("#home canvas")).toHaveCount(0);
});

for (const width of [1440, 390]) {
  test(`contribution tooltip stays compact and dismisses correctly at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/github-contributions.json", (route) => route.fulfill({
      json: {
        totalContributions: 44,
        weeks: Array.from({ length: 44 }, () => ({
          contributionDays: [
            { date: "2026-09-09", contributionCount: 1, color: "#0e4429" },
            { date: "2026-09-10", contributionCount: 0, color: "#161b22" },
          ],
        })),
      },
    }));
    await page.goto("/");
    const grid = page.locator("#gh-grid");
    const tooltip = page.getByRole("tooltip");
    await expect(grid.locator(".gh-day")).toHaveCount(88);
    await grid.evaluate((element) => element.scrollIntoView({ behavior: "instant", block: "center" }));

    for (const index of [0, 86]) {
      const day = grid.locator(".gh-day").nth(index);
      const box = (await day.boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      // Mouseover alone must position it; don't let mousemove mask the bug.
      await day.dispatchEvent("mouseover", { clientX: x, clientY: y });
      await expect(tooltip).toHaveText("1 contribution on Sep 9, 2026");
      const tip = (await tooltip.boundingBox())!;
      expect(tip.width).toBeLessThan(300);
      expect(tip.x).toBeGreaterThanOrEqual(12);
      expect(tip.x + tip.width).toBeLessThanOrEqual(width - 12);
      expect(tip.y).toBeGreaterThanOrEqual(12);
      expect(tip.y + tip.height).toBeLessThan(y);
    }

    await grid.dispatchEvent("mousemove", { clientX: 100, clientY: 400 });
    await expect(tooltip).toBeHidden();
    const day = grid.locator(".gh-day").nth(1);
    await day.dispatchEvent("mouseover", { clientX: 100, clientY: 400 });
    await expect(tooltip).toHaveText("No contributions on Sep 10, 2026");
    await grid.locator("..").dispatchEvent("scroll");
    await expect(tooltip).toBeHidden();
    await day.dispatchEvent("mouseover", { clientX: 100, clientY: 400 });
    await grid.dispatchEvent("mouseleave");
    await expect(tooltip).toBeHidden();
  });
}
