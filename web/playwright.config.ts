import { defineConfig } from "@playwright/test";

// The e2e run uses its own ports and starts its own servers, so it never touches a developer's running app.
// The API starts WITHOUT a Groq key (offline rules + trained classifier): deterministic, no rate limits, no cost.
const API_PORT = 8100, WEB_PORT = 5174;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${WEB_PORT}`, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: "en-IN",
         screenshot: "only-on-failure", trace: "retain-on-failure" },
  webServer: [
    { command: `cd ../api && GROQ_API_KEY= DEMO_AUTO_CONFIRM=false .venv/bin/python -m uvicorn app.main:app --port ${API_PORT}`, url: `http://localhost:${API_PORT}/health`,
      reuseExistingServer: false, timeout: 60_000 },
    { command: `VITE_API_URL=http://localhost:${API_PORT} npx vite --port ${WEB_PORT} --strictPort`, url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false, timeout: 60_000 },
  ],
});
