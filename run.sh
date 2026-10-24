#!/usr/bin/env bash
# Start the Disha API (8000) and web app (5173) locally. No Docker. Ctrl+C stops both.
set -e
cd "$(dirname "$0")"
[ -f .env ] || { cp .env.example .env; echo "Created .env - add your GROQ_API_KEY to it, then re-run."; }
[ -d api/.venv ] || { python3 -m venv api/.venv && api/.venv/bin/pip install -q -r api/requirements.txt; }
[ -d web/node_modules ] || (cd web && npm install)
[ -f web/.env ] || cp web/.env.example web/.env

(cd api && .venv/bin/uvicorn app.main:app --port 8000) &
API=$!
trap 'kill $API 2>/dev/null' EXIT INT TERM
echo "API  : http://localhost:8000/docs"
echo "Web  : http://localhost:5173   (nurse screen: /nurse)"
cd web && npm run dev -- --port 5173
