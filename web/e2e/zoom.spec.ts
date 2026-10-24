import { expect, Page, test } from "@playwright/test";

async function bookPage(page: Page) {
  await page.goto("/start");
  await page.locator("#typed").fill("papa ko 3 din se bukhar hai aur badan dard");
  await page.getByTestId("send-typed").click();
  await expect(page).toHaveURL(/\/q$/);
  await page.getByRole("button", { name: "Nahi" }).click();
  await expect(page).toHaveURL(/\/plan$/);
  await page.getByTestId("find-caregiver").click();
  await expect(page).toHaveURL(/\/book$/);
}

test("the viewport meta never blocks pinch zoom", async ({ page }) => {
  await page.goto("/");
  const meta = await page.locator("meta[name=viewport]").getAttribute("content");
  expect(meta).toContain("width=device-width");
  expect(meta).toContain("initial-scale=1");
  expect(meta).not.toMatch(/user-scalable\s*=\s*(no|0)/i);
  expect(meta).not.toMatch(/maximum-scale/i);
});

test("every form control is at least 16px (iOS Safari zooms in on smaller ones)", async ({ page }) => {
  await page.goto("/start");
  await page.locator("#typed").waitFor();
  const small = await page.evaluate(() => [...document.querySelectorAll("input, textarea, select")].map((e) => parseFloat(getComputedStyle(e).fontSize)).filter((f) => f < 16));
  expect(small).toEqual([]);
});

test("type scales with the browser: the root font size is a percentage, not px", async ({ page }) => {
  await page.goto("/");
  const r = await page.evaluate(() => {
    const h = document.querySelector("h1")!, root = document.documentElement;
    const normal = [getComputedStyle(root).fontSize, parseFloat(getComputedStyle(h).fontSize)] as const;
    root.style.fontSize = "150%";                                      // what a user's larger browser/system font setting does
    const bigger = parseFloat(getComputedStyle(h).fontSize);
    root.style.fontSize = "";
    return { rootPx: normal[0], normal: normal[1], bigger };
  });
  expect(r.rootPx).toBe("18px");                                       // 112.5% of the default 16px
  expect(r.bigger).toBeGreaterThan(r.normal * 1.2);                    // headings follow the root size (rem/clamp), they are not pinned in px
});

test("map: the wheel does not hijack page scrolling until the map is clicked; controls are 44px; it re-measures on resize", async ({ page }) => {
  await bookPage(page);
  const map = page.getByTestId("mini-map");
  await map.scrollIntoViewIfNeeded();
  await expect(map.locator(".leaflet-control-zoom a").first()).toBeVisible();
  for (const a of await map.locator(".leaflet-control-zoom a").all()) {
    const b = (await a.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(43.5);
    expect(b.height).toBeGreaterThanOrEqual(43.5);
  }
  const z0 = await map.getAttribute("data-zoom");
  const box = (await map.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, -400);                                                              // wheel over the map, not yet clicked
  await page.waitForTimeout(400);
  expect(await map.getAttribute("data-zoom")).toBe(z0);
  await map.scrollIntoViewIfNeeded();
  const box2 = (await map.boundingBox())!;                                                      // the wheel scrolled the page: re-measure
  await page.mouse.click(box2.x + 24, box2.y + 24);                                             // click empty map (not a marker): enables wheel zoom
  await page.mouse.move(box2.x + 60, box2.y + 60);
  await page.mouse.wheel(0, -400);
  await expect.poll(async () => await map.getAttribute("data-zoom")).not.toBe(z0);

  await page.setViewportSize({ width: 300, height: 700 });                                      // container shrinks (zoom / rotate / layout)
  await expect.poll(async () => {
    const reported = await map.getAttribute("data-size");
    const [w, h] = await map.evaluate((e) => [e.clientWidth, e.clientHeight]);
    return reported === `${w}x${h}`;                                                            // the map knows its real size: no grey tiles
  }).toBe(true);
});

test("no horizontal scroll on the main screens at 200% zoom on a phone", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 195, height: 422 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  for (const url of ["/", "/start", "/emergency", "/nurse"]) {
    await page.goto(url, { waitUntil: "networkidle" });
    const over = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    expect(over, url).toBeLessThanOrEqual(1);
  }
  await ctx.close();
});
