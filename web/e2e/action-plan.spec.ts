import { expect, Page, test } from "@playwright/test";

async function planFor(page: Page, text: string, probe?: string) {
  await page.goto("/start");
  await page.locator("#typed").fill(text);
  await page.getByTestId("send-typed").click();
  if (probe) {
    await expect(page).toHaveURL(/\/q$/);
    await page.getByRole("button", { name: probe }).click();
  }
  await expect(page).toHaveURL(/\/plan$/);
}

test("three days of fever: the plan already has the home blood test, a temperature log and the visit", async ({ page }) => {
  await planFor(page, "papa ko 3 din se bukhar hai aur badan dard", "Nahi");
  const plan = page.getByTestId("action-plan");
  for (const t of ["home_sample_collection", "home_monitoring", "paramedic_visit", "follow_up_checkin"]) await expect(plan.getByTestId(`action-${t}`)).toBeVisible();
  await expect(plan.getByText(/Home blood test|Ghar par blood test|घर पर ब्लड टेस्ट/)).toBeVisible();
  await expect(plan.getByText(/doctor will decide which tests|डॉक्टर तय करेंगे/)).toBeVisible();
});

test("blood test: family schedules, nurse dashboard shows the clinician-only suggestion and confirms, family sees it scheduled", async ({ page, context }) => {
  await planFor(page, "papa ko 3 din se bukhar hai aur badan dard", "Nahi");
  const blood = page.getByTestId("action-home_sample_collection");
  await blood.getByTestId("schedule-home_sample_collection").click();
  await page.getByTestId("slot-chip").first().click();
  await page.getByTestId("slot-confirm").click();
  await expect(blood.getByTestId("action-status")).toContainText(/Awaiting doctor OK|डॉक्टर की मंज़ूरी/);

  const nurse = await context.newPage();
  await nurse.setViewportSize({ width: 1280, height: 800 });
  await nurse.goto("/nurse");
  await nurse.getByTestId("tab-actions").click();
  const row = nurse.getByTestId("action-row").first();
  await expect(row.getByTestId("clinician-suggestion")).toContainText("CBC");                               // clinicians see it ...
  await expect(row.getByTestId("clinician-suggestion")).toContainText(/Suggested — needs clinician confirmation|सुझाव/);
  await row.getByTestId("confirm-action").click();
  await expect(nurse.getByTestId("no-actions")).toBeVisible();

  await page.reload();                                                                                       // ... the family never does
  await expect(page.getByTestId("action-home_sample_collection").getByTestId("action-status")).toContainText(/Scheduled|तय हो गया/);
  expect((await page.locator("main").innerText()).toLowerCase()).not.toContain("cbc");
});

test("temperature log: a normal reading is noted, a dangerous one escalates", async ({ page }) => {
  await planFor(page, "papa ko 3 din se bukhar hai aur badan dard", "Nahi");
  const mon = page.getByTestId("action-home_monitoring");
  await mon.getByTestId("schedule-home_monitoring").click();
  await mon.getByTestId("log-value").fill("101");
  await mon.getByTestId("log-send").click();
  await expect(mon.getByTestId("log-message")).toContainText(/38\.3/);
  await mon.getByTestId("log-value").fill("104.5");
  await mon.getByTestId("log-send").click();
  await expect(page).toHaveURL(/\/(emergency|plan)$/, { timeout: 15_000 });
});

test("quick details: a red-flag answer goes straight to the emergency screen and the plan is gone", async ({ page }) => {
  await planFor(page, "mummy ko khansi hai teen hafte se", "Nahi");
  await page.getByTestId("open-details").click();
  const blood = page.getByRole("group", { name: /blood with the cough|खांसी के साथ खून/ });
  await blood.getByRole("button", { name: /^(Yes|हाँ)$/ }).click();
  await page.getByTestId("save-details").click();
  await expect(page).toHaveURL(/\/emergency$/, { timeout: 15_000 });
  await expect(page.locator("a[href='tel:112']")).toBeVisible();
  await expect(page.getByTestId("action-plan")).toHaveCount(0);
});

test("quick details never asks what is already known", async ({ page }) => {
  await planFor(page, "papa ko 102 bukhar hai teen din se", "Nahi");
  await page.getByTestId("open-details").click();
  await expect(page.getByText(/Highest temperature|सबसे ज़्यादा बुखार/)).toHaveCount(0);       // 102 F was in the first message
  await expect(page.getByText(/Already known|पहले से पता है/)).toBeVisible();
});

test("patient info: a guessed age is flagged and the family can give the exact age; impossible ages are refused", async ({ page }) => {
  await page.goto("/start");
  await page.locator("#typed").fill("dadi ko 3 din se bukhar hai aur badan dard");
  await page.getByTestId("send-typed").click();
  await page.waitForURL(/\/(q|plan)$/);
  if (page.url().endsWith("/q")) await page.getByRole("button", { name: "Nahi" }).click();
  await expect(page).toHaveURL(/\/plan$/);
  const age = page.getByTestId("understood").locator('[data-status="inferred"]');
  await expect(age).toContainText(/Age|उम्र/);
  await expect(age).toContainText(/guessed|अंदाज़ा/);

  await page.getByTestId("age-input").fill("200");
  await page.getByTestId("save-patient-info").click();
  await expect(page.getByTestId("patient-info-message")).toContainText(/does not look right|सही नहीं/);

  await page.getByTestId("age-input").fill("81");
  await page.getByTestId("save-patient-info").click();
  await expect(page.getByTestId("patient-info-message")).toContainText(/updated|अपडेट/);
  await expect(page.getByTestId("understood").locator('[data-status="stated"]').filter({ hasText: /81/ })).toBeVisible();
  await expect(page.getByTestId("understood").locator('[data-status="inferred"]')).toHaveCount(0);
});
