.PHONY: run test eval tune report e2e
run:    ; ./run.sh
test:   ; cd api && .venv/bin/python -m pytest -q
eval:   ; cd api && .venv/bin/python scripts/evaluate.py --split val
tune:   ; cd api && .venv/bin/python scripts/tune_thresholds.py
report: ; cd api && .venv/bin/python scripts/data_report.py
e2e:    ; cd web && node e2e/demo.mjs   # needs: npm i -D playwright && npx playwright install chromium; servers running
