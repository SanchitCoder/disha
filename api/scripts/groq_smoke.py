"""Smoke test: one JSON-mode chat call through the wrapper. Needs GROQ_API_KEY."""
import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))
from app import config, groq_client

if not groq_client.available():
    sys.exit("GROQ_API_KEY not set (copy .env.example to .env and fill it)")
out = groq_client.chat_json('Reply with JSON {"ok": true, "word": "<one english word>"}.', "say hi", name="smoke")
print("model:", config.GROQ_LLM_MODEL, "->", out)
sys.exit(0 if out and out.get("ok") is True else 1)
