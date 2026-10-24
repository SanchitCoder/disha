# Disha — write-up draft

**Status note:** numbers below are from `reports/` on the organisers' dataset (340 labelled requests, 60 caregivers) with Groq `openai/gpt-oss-120b`.

## 1. Approach
Disha is a pipeline, not a single prompt: `normalise → red-flag gate → intake → retrieval → triage → matching → explanation`.
Each stage is small, testable and has a fallback. Only intake, triage scoring and the visit brief use the LLM; routing safety never depends on it.

* **Intake** (Groq JSON): fills a slot record (patient relation/age band, symptoms + duration, four red-flag probes, chronic conditions, procedure need, language). The caller is often a relative, so the patient profile is stored and reused, which cuts questions on repeat requests.
* **Follow-up policy**: at most two yes/no questions, one per turn, chosen from curated templates (`probes.yaml`) in the user's language. Only critical unknown probes are asked; others only if confidence is low. `force_decision` never asks.
* **Retrieval**: char-n-gram TF-IDF (2–5, `char_wb`) over the training split, robust to Hinglish spelling; always shows the model one emergency example for contrast.
* **Triage**: the LLM outputs probability distributions over care types and urgency; a cost-aware decision rule applies tuned thresholds (low bar for emergency/immediate, ties go to the more urgent/capable option) plus consistency rules (emergency ⇔ immediate; risk factors raise urgency on thin margins; procedure needs prefer the nurse label).
* **Matching**: hard filters (role, free slot inside the urgency window, radius 10→20 km→none), then `0.30 skill + 0.25 e^(−d/5) + 0.20 soonness + 0.15 language + 0.10 Bayesian rating`; each match gets a ≤60-character reason from its top contributing factors.

## 2. Models and APIs
Groq chat (`llama-3.3-70b-versatile` by default, JSON mode, temperature 0); Groq Whisper (`whisper-large-v3`); browser `speechSynthesis` for TTS; scikit-learn TF-IDF; Leaflet/OpenStreetMap; Supabase (optional). No other AI provider.

## 3. Safety logic
1. Deterministic multilingual red-flag gate runs first on every turn and over the whole history; negation-aware with an asymmetric window to avoid suppressing real emergencies.
2. Slot-level gate: breathing difficulty / chest pain / confusion answered "yes" ⇒ emergency.
3. Emergency output: `emergency_referral` + `immediate`, red flags listed, no caregiver matching, reasoning says call 112 / 108, three plain steps, one-tap call buttons, location share.
4. Cost-aware thresholds tuned for emergency recall = 1.0 first, macro-F1 second.
5. Output guardrail for medicine/dose/diagnosis wording with template fallback; the system prompt forbids diagnosing.
6. Nurse-in-the-loop for low-confidence cases; Safety Net watch-list and +6 h / +24 h check-ins whose replies are re-triaged and escalate when worse.

## 4. Differentiators
Safety Net · Family-first patient profiles · Visit Brief (5 lines + fixed-list bring-list) · Nurse review queue with Supabase Realtime.

## 5. Evaluation
Held-out request templates (82 requests, none of whose texts appear in retrieval or the urgency prior): care-type macro-F1 1.00, urgency macro-F1 1.00, emergency recall 16/16, 0 false emergencies, 0 under-triage, NDCG@3 of matching 1.00 against the organisers' reference lists. The rules-only gate agrees with the organisers' emergency label on all 340 requests, and our matcher reproduces all 245 reference caregiver lists exactly (including empty ones). Without Groq the nearest-neighbour fallback reaches 0.61 / 0.70 on the same split but keeps emergency recall at 1.0. 120+ automated tests pass.

## 6. Limitations
Only 66 distinct request texts in the data (many translations of one intent), so the hidden test may be harder; interactive latency is ~1.5–2.5 s per request with two sequential LLM calls (target p95 < 2.5 s is tight); the free Groq tier allows ~5 requests/min; kNN fallback is negation-blind; no real SMS; Whisper quality on noisy Hinglish unverified; escalation compares urgency only.
