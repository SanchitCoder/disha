# Disha — home-healthcare routing

Disha turns a messy request ("papa ko do din se bukhar hai aur khansi bhi", text or voice, Hindi / English / Hinglish) into a **care type**, an **urgency**, and the **best caregivers** with a reason for each match.
When information is missing it asks **one** follow-up question; any red-flag symptom skips matching and goes straight to **112 / 108**.
It routes only — it never diagnoses or prescribes (no disease names as conclusions, no medicines, no doses).

> **Data.** Built on the organisers' Sanocare synthetic dataset v1 in `data/` (340 labelled requests, 60 caregivers, 2 multi-turn examples, README). Labels:
> care types `paramedic_home_visit | home_nursing | lab_test_home | teleconsultation | emergency_112`, urgency `scheduled | same_day | emergency`, plus
> **follow-up** (null care type/urgency) for vague requests. The dataset has only 66 distinct request templates repeated with different locations, so plain
> validation numbers are inflated by memorisation: `evaluate.py --unseen` holds out whole templates and is the honest generalisation test.
> Everything file-format-specific is in `api/app/data_loader.py`; label definitions and matching rules in `api/config/taxonomy.yaml`.
>
> **Groq.** Verified live (chat JSON mode, Whisper `whisper-large-v3`). The spec's default `llama-3.3-70b-versatile` is not available on the account whose key was used, so
> `.env` sets `GROQ_LLM_MODEL=openai/gpt-oss-120b` (reasoning effort forced to `low`, ~1.5–2.5 s per request). Free-tier cap is **8,000 tokens/min** (~5 requests/min): when exceeded the
> pipeline falls back to the offline path instead of failing; batch scripts pace themselves and wait for budget.

## Architecture
```
 React PWA (Vite, Tailwind, Leaflet)            FastAPI (Pydantic v2)                      Groq (only AI provider)
 ┌───────────────────────────────┐   REST    ┌───────────────────────────────────┐      ┌──────────────────────────┐
 │ Speak → Question → Plan → Book│ ───────▶ │ POST /triage        (contract)    │      │ chat  (JSON mode, T=0)   │
 │ Emergency · Safety Net · Nurse│          │ POST /v1/session/triage (app)     │ ───▶ │ whisper-large-v3 (STT)   │
 │ browser speechSynthesis (TTS) │ ◀─────── │ /v1/transcribe /book /safety-net  │      └──────────────────────────┘
 └──────────────┬────────────────┘          └───────────────┬───────────────────┘
                │ Realtime (anon, cases awaiting_review)    │ pipeline.run()
                ▼                                           ▼
        Supabase Postgres  ◀─ service role ─  normalise → RED-FLAG GATE (rules, no LLM) → intake → retrieval (TF-IDF)
        (optional: bookings, profiles,                       → triage (LLM + cost-aware thresholds) → matching → explain
         Safety Net, nurse queue)           data/ loaded into memory at startup  ⇒  /triage works with Supabase down
```

## Deploying
See [DEPLOY.md](DEPLOY.md): API on Render (`render.yaml`) or any host that runs `uvicorn`, web app on Vercel/Netlify with `VITE_API_URL` set **at build time**. A build without it shows a "server address not configured" notice instead of calling `localhost`.

## Setup (local, no Docker)
Requirements: Python 3.12, Node 20+. **Quickest:** `./run.sh` (or `make run`) creates `.env`/venv/`node_modules` if missing and starts both servers.
```bash
cp .env.example .env            # fill GROQ_API_KEY (and Supabase vars if you want persistence/realtime)

# API
cd api && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python scripts/data_report.py          # Phase-1 data report + 80/20 stratified splits (seed 42)
.venv/bin/python scripts/groq_smoke.py           # Groq smoke test
.venv/bin/uvicorn app.main:app --port 8000       # docs at http://localhost:8000/docs

# Web (second terminal)
cd web && cp .env.example .env && npm install && npm run dev      # http://localhost:5173  (nurse screen: /nurse)
npm run gen:types                                                  # regenerate src/api-types.ts from the running API
```
**Without Supabase** every app feature still works (in-process store); only the realtime push on `/nurse` falls back to 4 s polling.
**With Supabase:** run `supabase/migrations/001_init.sql` in the SQL editor, then `python api/scripts/seed_supabase.py`.

| Env var | Purpose |
|---|---|
| `GROQ_API_KEY`, `GROQ_LLM_MODEL` (default `llama-3.3-70b-versatile`), `GROQ_STT_MODEL` (default `whisper-large-v3`) | all AI |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | backend persistence (optional) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` | frontend (anon key: nurse-queue realtime only) |
| `DATA_DIR` | organiser data, default `./data` |

## Interface
Landing page at `/`, the app flow at `/start` → `/q` → `/plan` → `/book` → `/checkin/:caseId`, emergency at `/emergency` (works with or without an active case; the header's red 112 pill goes there), nurse ledger at `/nurse`.
Design language "Neel & Brass": soft skeuomorphism (ivory paper, indigo enamel, brass bezels), tokens in `web/src/styles/tokens.css`, materials in `skeuo.css`, components in `web/src/components/sk/`.
Browser end-to-end test of the demo script: `web/e2e/demo.mjs` (needs `npm i -D playwright && npx playwright install chromium`, both servers running, Groq key set).

## Endpoints
```bash
# scoring contract (exact fields, nothing extra). ?force_decision=true never asks a follow-up
curl -s -X POST localhost:8000/triage -H 'Content-Type: application/json' -d '{
  "user_input":"papa ko do din se bukhar hai aur khansi bhi","language":"auto",
  "location":{"lat":28.54,"lng":77.27},"conversation_history":[]}'
# → {"follow_up_question":"Kya saans lene mein dikkat ho rahi hai?","care_type":null,...}
curl -s -X POST 'localhost:8000/triage?force_decision=true' -H 'Content-Type: application/json' -d '{"user_input":"papa behosh ho gaye, saans nahi le rahe"}'
# → emergency_referral / immediate, red_flags filled, matched_caregivers [], reasoning tells the user to call 112 / 108
```
`POST /v1/session/triage` (app: + case_id, confidence, needs_nurse_review, watch_list, follow_up_options, speak_text, caregivers), `POST /v1/transcribe`,
`POST /v1/book`, `GET /v1/caregivers/{id}`, `POST /v1/safety-net/{case}/schedule|simulate?hours=6|reply`, `GET /v1/nurse/queue`, `POST /v1/nurse/{case}/approve`,
`GET /v1/cases/{id}`, `GET /v1/taxonomy`, `GET /health`. Full interactive docs at `/docs`.

## Models and APIs used (declared)
| Use | Model / API |
|---|---|
| Slot extraction, triage scoring, visit brief | **Groq chat completions**, model `GROQ_LLM_MODEL` (default `llama-3.3-70b-versatile`), JSON mode, temperature 0 |
| Speech-to-text | **Groq** `audio.transcriptions`, model `GROQ_STT_MODEL` (default `whisper-large-v3`) |
| Text-to-speech | **Browser `window.speechSynthesis`** (hi-IN, falls back to en-IN). No TTS API |
| Trained classifier | scikit-learn: char 2–5-gram TF-IDF → multinomial logistic regression (care type incl. follow-up, and urgency), trained in-process on the dataset + nurse feedback; no API |
| Similar cases | scikit-learn `TfidfVectorizer(analyzer="char_wb", ngram_range=(2,5))` index over the training examples (few-shot retrieval + last-resort fallback) |
| Maps | Leaflet + OpenStreetMap tiles |
| Database | Supabase (Postgres + Realtime), optional |

Libraries: FastAPI, Pydantic v2, uvicorn, groq, supabase-py, scikit-learn, numpy, PyYAML, indic-transliteration, python-dotenv, python-multipart, pytest, httpx ·
React, Vite, TypeScript 5, Tailwind CSS 3, React Router, Leaflet, @supabase/supabase-js, vite-plugin-pwa, openapi-typescript.

**Public data cited:** India's national emergency number **112** and ambulance **108**; **Tele-MANAS 14416** (Government of India tele-mental-health helpline) is shown for self-harm flags. No real patient data is used or collected.

## How a decision is made (and what is learned)
1. **Rules** (red-flag gate, deterministic) run first; they alone can send a request to 112/108.
2. **Two models score the request independently**: the LLM (Groq, definitions + 6 retrieved examples) and a **trained classifier** (logistic regression on character n-grams, trained on the labelled dataset).
   Their probabilities are blended (`clf_weight` = 0.3 in `config/thresholds.json`), then cost-aware thresholds decide. If Groq is down, the classifier plus the similarity vote take over, and a lexical-only model may not raise an emergency by itself.
3. **Cross-check:** the app shows both models' views; when they *confidently* disagree (both ≥ 0.6) the case goes to the **nurse queue**.
4. **Learning loop:** every nurse approval or edit is appended to `data/feedback.jsonl` and the classifier retrains and the retrieval index grows, in-process, in milliseconds (`POST /v1/model/retrain`, `GET /v1/model/info`).
Not fine-tuned: the LLM's weights are never changed; the *classifier* is a genuinely trained model.

## Routing and matching rules (from the organisers' data)
* **Follow-up vs decide.** `POST /triage` asks a follow-up only when the request is too vague to route ("I need help", "doctor chahiye"); a request that names a need
  ("papa ko do din se bukhar hai aur khansi bhi") is decided immediately, as in the dataset. The *app* endpoint additionally asks one templated safety question (e.g. breathing difficulty) first.
  `?force_decision=true` never asks.
* **Urgency follows care type** in the data (lab → `scheduled`, every other non-emergency → `same_day`, emergency → `emergency`); this is learned from the training split, not hard-coded.
* **Red flags** are returned in the organisers' vocabulary (`chest_pain, breathlessness, unconsciousness, severe_bleeding, stroke_symptoms, seizure, high_fever_infant, suicidal_ideation, severe_dehydration`).
  Note: the dataset tags *every* emergency request `chest_pain;breathlessness` (even bleeding or collapse); Disha returns the flag that actually matched.
* **Matching** reproduces the organisers' reference matcher exactly (all 245 reference lists, including empty ones): active caregiver of the right role (medic / phlebotomist / doctor) with the required
  skill (injection → `injection_im`, dressing → `wound_dressing`, general visit → `vitals_monitoring`) whose own `max_radius_km` covers the request (teleconsultation ignores distance);
  score `0.35·language + 0.30·(1 − km/12) + 0.20·skill + 0.15·(rating−3.8)/1.2`, capped at 0.99, ties by caregiver id, top 3. No radius widening: nobody outside their service radius can serve.

## Safety logic
1. **Rules-first red-flag gate** (`config/red_flags.yaml`, no LLM) runs first on every turn over the full history, in Roman Hinglish, Devanagari (also romanised) and English, tolerant to repeated letters. Negation ("saans mein koi dikkat nahi") suppresses a hit: 4 tokens before, 2 after, within the same clause — deliberately narrower after, so "behosh hain, bukhar nahi" still fires.
2. The gate also runs on LLM-extracted slots and on answered probes (breathing difficulty / chest pain / confusion = yes ⇒ emergency).
3. **Cost-aware thresholds** (`config/thresholds.json`, tuned by `scripts/tune_thresholds.py`): emergency fires at a low probability; ties resolve to the more urgent / more capable option; high-risk patients (<1 y, 60+, pregnant, chronic) with a thin margin are raised one step.
4. **Output guardrail**: any LLM text containing medicine / dose words or diagnosis phrasing is replaced by the template.
5. **Nurse-in-the-loop**: confidence < `t_nurse_review` → `awaiting_review`, nurse approves or edits in one tap, the user's screen updates.
6. **Safety Net**: watch-list after every non-emergency decision; check-ins at +6 h / +24 h; the reply is fully re-triaged; "worse" always escalates at least one step.

## Evaluate / tune / predict
```bash
cd api
.venv/bin/python scripts/evaluate.py --split val          # macro-F1, emergency recall, under-triage, NDCG@3 vs reference matches, confusion, latency → reports/
.venv/bin/python scripts/evaluate.py --unseen             # same, but whole request templates are held out (honest generalisation test)
.venv/bin/python scripts/tune_thresholds.py --unseen      # grid search on held-out templates (scores cached; emergency recall first) → config/thresholds.json
.venv/bin/python scripts/predict.py --input <hidden_test> --output predictions.csv   # same pipeline as POST /triage, resume-safe
.venv/bin/python -m pytest                                # 120+ tests, offline; DISHA_LIVE_TESTS=1 runs them against Groq
```
### Results (real organiser data, Groq `openai/gpt-oss-120b`)
| Split | Care-type macro-F1 | Urgency macro-F1 | Emergency recall | False emergencies | Under-triage | NDCG@3 (matching) |
|---|---|---|---|---|---|---|
| `--unseen` (82 requests, whole templates held out of retrieval and the urgency prior) | 1.00 | 1.00 | 1.00 (16/16) | 0 | 0 | 1.00 |
| trained classifier alone, grouped 5-fold CV over all 340 rows (unseen texts) | 0.77 (accuracy 0.81) | 0.73 | 0.93 (the rules gate covers the rest) | – | – | – |
| offline fallback (classifier + similarity vote, no Groq), same 82-request split | 0.62 | 0.79 | 1.00 | 0 | 4 | 1.00 |
| **blended LLM + classifier (weight 0.3), same 82-request split** | **1.00** | **1.00** | **1.00 (16/16)** | **0** | **0** | **1.00** |

Caveats: 66 distinct templates in 340 rows (many are translations of the same intent), so "unseen" means unseen *text*, not unseen *intent*; the hidden test may differ. Latency in `reports/` is
distorted by the token pacing; interactive requests take ~1.5–2.5 s. Thresholds in `config/thresholds.json` are the brief's starting values (the LLM path needed no tuning); `t_nurse_review = 0.62` is calibrated on a few live outputs.

## Known limitations
- The organisers' file set has no separate API-schema or taxonomy file; the contract follows the brief's example and labels come from the dataset. If a schema file is published, edit the contract block in `api/app/schemas.py`.
- Free-tier Groq rate limit (8k tokens/min) makes concurrent demos fall back to kNN; the kNN fallback is negation-blind (mitigated by the gate and a veto when a red flag is explicitly ruled out).
- No expert-judged caregiver matches available → NDCG@3 not computed (`common.ndcg_at_k` is ready).
- Whisper accuracy on noisy Hinglish audio is unverified; the user always confirms the transcript before sending.
- Notifications to family are records only (no real SMS). Care-type "severity" for escalation uses urgency only.
- `predict.py` column names are auto-detected and the output header defaults to `id,care_type,urgency,red_flags`; confirm against the organisers' spec.
- No Docker (explicit instruction); `docker compose` from the brief was replaced by the local run steps above.
