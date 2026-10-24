# Deploying Disha (no Docker)

Two pieces: the **API** (FastAPI) and the **web app** (static files). The web app talks to the API *from the visitor's browser*, so the API needs a public **https** URL,
and the web app must be built with that URL. The error `net::ERR_CONNECTION_REFUSED ... :8000/v1/session/triage` means the web app was built without it and fell back to `localhost:8000`.

## 1. Deploy the API (Render, free tier works)
1. Push this repo to GitHub (the `data/` folder must be included — the API reads it at startup).
2. Render → **New → Blueprint** → pick the repo. `render.yaml` sets everything except secrets.
3. In the service's **Environment** tab set `GROQ_API_KEY` (and optionally `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
4. Open `https://<your-service>.onrender.com/health` → `{"status":"ok","groq":"ok",...}` and `/docs`.
   Other hosts (Railway, Fly without Docker, Heroku): the `Procfile` start command is `cd api && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Free tiers sleep after inactivity; the first request can take ~30 s. The app shows "Waking up the server…" while that happens.
`GROQ_LLM_MODEL` defaults to `llama-3.3-70b-versatile`; if the account can't use it the API automatically falls back to `openai/gpt-oss-120b`.

## 2. Deploy the web app (Vercel / Netlify / Cloudflare Pages)
Project root `web/`, build command `npm run build`, output `dist`. Set the environment variable **before building**:

```
VITE_API_URL=https://<your-service>.onrender.com        # no trailing slash, must be https if the site is https
VITE_SUPABASE_URL=...        # optional (nurse-queue realtime)
VITE_SUPABASE_ANON_KEY=...   # optional
```
Vite bakes these in at build time: after changing them, **redeploy**. `web/vercel.json` and `web/public/_redirects` make deep links like `/start` work on refresh.

## 3. Checks
* Browser devtools → Network: calls go to your API URL, not `localhost`.
* `GET <API>/health` is 200. CORS is open (`*`), so no extra setting is needed.
* Microphone needs https (browsers block it on plain http).
