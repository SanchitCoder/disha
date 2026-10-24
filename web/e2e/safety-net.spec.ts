import { expect, Page, test } from "@playwright/test";

const FEVER = "papa ko do din se bukhar hai aur khansi bhi";

/** Type the demo case, answer the safety question with "No", and land on the plan. */
async function reachPlan(page: Page) {
  await page.goto("/start");
  await page.locator("#typed").fill(FEVER);
  await page.getByTestId("send-typed").click();
  await expect(page).toHaveURL(/\/q$/);
  await expect(page.getByText("Kya saans lene mein dikkat ho rahi hai?")).toBeVisible();
  await page.getByRole("button", { name: "Nahi" }).click();
  await expect(page).toHaveURL(/\/plan$/);
}

/** The mentor's example: Quick details (chills) add a home blood test to the plan; the family schedules it. */
async function addChillsAndScheduleBloodTest(page: Page) {
  const plan = page.getByTestId("action-plan");
  await expect(plan).toBeVisible();
  await expect(plan.getByTestId("action-home_sample_collection")).toHaveCount(0);        // two days of fever alone: no test yet
  await page.getByTestId("open-details").click();
  await page.getByRole("group", { name: /Shivering or chills|कंपकंपी या ठंड/ }).getByRole("button", { name: /^(Yes|हाँ)$/ }).click();   // chills -> yes
  await page.getByTestId("save-details").click();
  const blood = plan.getByTestId("action-home_sample_collection");
  await expect(blood).toBeVisible();                                                       // the plan changed because of the details
  await blood.getByTestId("schedule-home_sample_collection").click();
  await page.getByTestId("slot-chip").first().click();
  await page.getByTestId("slot-confirm").click();
  await expect(blood.getByTestId("action-status")).toContainText(/Awaiting doctor OK|डॉक्टर की मंज़ूरी/);
  await expect(page.getByTestId("timeline")).toBeVisible();
  const text = (await page.locator("main").innerText()).toLowerCase();
  for (const bad of ["cbc", "platelet", "dengue", "malaria", "suggested — needs clinician"]) expect(text).not.toContain(bad);   // the family never sees tests or suggestions
}

/** Plan -> schedule the blood test -> book the top caregiver -> Safety Net banner. Returns the case id. */
async function bookAndOpenSafetyNet(page: Page): Promise<string> {
  await addChillsAndScheduleBloodTest(page);
  await page.getByTestId("find-caregiver").click();
  await expect(page).toHaveURL(/\/book$/);
  await page.getByTestId("book-top").click();
  const banner = page.getByTestId("safety-banner");
  await expect(banner).toBeVisible();
  await banner.click();
  await expect(page).toHaveURL(/\/checkin\/[0-9a-f-]{36}$/);
  return page.url().split("/").pop()!;
}

test("full demo: fever -> plan -> schedule blood test -> book -> Safety Net -> 'saans phool rahi hai' -> Emergency 112 / 108", async ({ page }) => {
  await reachPlan(page);
  await bookAndOpenSafetyNet(page);

  await page.getByTestId("demo-checkin").click();
  await expect(page.getByTestId("checkin-question")).toBeVisible();
  await page.getByTestId("reply-input").fill("saans phool rahi hai");
  await page.getByTestId("reply-send").click();

  await expect(page).toHaveURL(/\/emergency$/, { timeout: 15_000 });
  await expect(page.locator("a[href='tel:112']")).toBeVisible();
  await expect(page.locator("a[href='tel:108']")).toBeVisible();
});

test("the check-in page survives a reload and a fresh tab", async ({ page, context }) => {
  await reachPlan(page);
  const id = await bookAndOpenSafetyNet(page);

  await page.reload();                                           // state comes from the API, not from React memory
  await expect(page.getByTestId("demo-checkin")).toBeVisible();
  const fresh = await context.newPage();                         // brand-new tab, no app state at all
  await fresh.goto(`/checkin/${id}`);
  await expect(fresh.getByTestId("demo-checkin")).toBeVisible();
  await fresh.getByTestId("demo-checkin").click();
  await expect(fresh.getByTestId("checkin-question")).toBeVisible();

  await page.goto("/checkin/00000000-0000-0000-0000-000000000000");   // unknown case: a clear message, not a blank screen
  await expect(page.getByText(/couldn't find this case|नहीं मिला/)).toBeVisible();
});

test("the demo button animates the clock, then shows the question, and a double-click sends one request", async ({ page }) => {
  await reachPlan(page);
  await bookAndOpenSafetyNet(page);
  let simulateCalls = 0;
  page.on("request", (r) => r.url().includes("/simulate") && simulateCalls++);

  const demo = page.getByTestId("demo-checkin");
  await demo.dblclick();
  await expect(page.getByTestId("checkin-question")).toHaveCount(0);   // hands are still moving: no question yet
  await expect(page.getByTestId("checkin-question")).toBeVisible();    // then it appears
  expect(simulateCalls).toBe(1);
});

test("'Waisa hi' keeps the check-in going and suggests a next step; 'Behtar' closes the case", async ({ page }) => {
  await reachPlan(page);
  await bookAndOpenSafetyNet(page);

  await page.getByTestId("demo-checkin").click();
  await page.getByTestId("reply-chip-1").click();                      // Waisa hi
  await expect(page.getByTestId("next-step")).toBeVisible();
  await expect(page.getByTestId("demo-checkin")).toContainText(/24/);   // the 24 h check-in is next

  await page.getByTestId("demo-checkin").click();
  await page.getByTestId("reply-chip-0").click();                      // Behtar
  await expect(page.getByTestId("case-closed")).toBeVisible();
});

test("'Zyada kharab' escalates to the emergency screen with the read-aloud buttons", async ({ page }) => {
  await reachPlan(page);
  await bookAndOpenSafetyNet(page);
  await page.getByTestId("demo-checkin").click();
  await page.getByTestId("reply-chip-2").click();
  await expect(page).toHaveURL(/\/(emergency|plan)$/, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: /Listen/ })).toBeVisible();
});

test("a worrying home reading escalates", async ({ page }) => {
  await reachPlan(page);
  await bookAndOpenSafetyNet(page);
  await page.getByTestId("reading-spo2").fill("92");
  await page.getByTestId("reading-send").click();
  await expect(page).toHaveURL(/\/emergency$/, { timeout: 15_000 });
});
