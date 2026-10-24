import { defineConfig } from "@playwright/test";

// Zoom / layout audit. Own ports; the API starts without Groq so the pages are deterministic.
const API_PORT = 8110, WEB_PORT = 5175;
export default defineConfig({
  testDir: "./audit",
  timeout: 40_000,
  workers: 4,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${WEB_PORT}`, actionTimeout: 8_000 },
  webServer: [
    { command: `cd ../api && GROQ_API_KEY= DEMO_AUTO_CONFIRM=false .venv/bin/python -m uvicorn app.main:app --port ${API_PORT}`, url: `http://localhost:${API_PORT}/health`, reuseExistingServer: false, timeout: 60_000 },
    { command: `VITE_API_URL=http://localhost:${API_PORT} npx vite --port ${WEB_PORT} --strictPort`, url: `http://localhost:${WEB_PORT}`, reuseExistingServer: false, timeout: 60_000 },
  ],
});
