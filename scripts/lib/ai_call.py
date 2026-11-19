"""The AI usage log for Python scripts (owner rule 2026-11-20: every paid AI request must have a source).

    import sys; sys.path.insert(0, str(ROOT / "scripts" / "lib")); from ai_call import ai_post_json
    data = ai_post_json("deepseek", "https://api.deepseek.com/chat/completions", body, key, source="script:build_pinyin")

Sends one JSON POST, then hands the outcome to `node scripts/ai-usage.mjs record`, which prices it with the site's rules
(src/modules/ai-usage/core.ts) and stores it in the local AiCall table (or artifacts/ai-usage-unsaved.jsonl). Returns the
parsed answer; raises like urllib does. The key is sent only to the provider, never to the log.
"""
import json
import os
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _record(call: dict) -> None:
    try:
        subprocess.run(["node", str(ROOT / "scripts" / "ai-usage.mjs"), "record"], input=json.dumps(call).encode(), cwd=ROOT, timeout=60, check=False)
    except Exception as error:  # never lose the row silently
        (ROOT / "artifacts").mkdir(exist_ok=True)
        with open(ROOT / "artifacts" / "ai-usage-unrecorded-python.jsonl", "a", encoding="utf-8") as file:
            file.write(json.dumps({**call, "error": type(error).__name__}) + "\n")


def ai_post_json(provider: str, url: str, body: dict, key: str, source: str, timeout: int = 240) -> dict:
    at = datetime.now(timezone.utc).isoformat()
    started = time.monotonic()
    call = {"provider": provider, "url": url, "source": source, "model": body.get("model", ""), "at": at, "agent": os.environ.get("AI_USAGE_AGENT")}
    request = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "Authorization": "Bearer " + key})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            data = json.loads(response.read())
            _record({**call, "status": "ok", "httpStatus": response.status, "durationMs": int((time.monotonic() - started) * 1000), "body": data})
            return data
    except urllib.error.HTTPError as error:
        _record({**call, "status": "http", "httpStatus": error.code, "durationMs": int((time.monotonic() - started) * 1000)})
        raise
    except (TimeoutError, urllib.error.URLError) as error:
        timed_out = isinstance(error, TimeoutError) or isinstance(getattr(error, "reason", None), TimeoutError)
        _record({**call, "status": "timeout" if timed_out else "network", "durationMs": int((time.monotonic() - started) * 1000)})
        raise
