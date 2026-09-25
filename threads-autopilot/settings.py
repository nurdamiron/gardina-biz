"""Runtime settings. Secrets come from env files in CONFIG_DIR (never from the repo)."""
from __future__ import annotations

import json
import os
from pathlib import Path
from zoneinfo import ZoneInfo

BASE_DIR = Path(__file__).parent
CONFIG_DIR = Path(os.environ.get("CONFIG_DIR", Path.home() / ".config/meta-mcp"))
DATA_DIR = Path(os.environ.get("DATA_DIR", BASE_DIR / "data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "autopilot.db"

TZ = ZoneInfo("Asia/Almaty")
THREADS_MCP_BIN = os.environ.get("THREADS_MCP_BIN", str(Path.home() / ".local/bin/threads-mcp"))


def read_env(name: str) -> dict[str, str]:
    path = CONFIG_DIR / name
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
    return out


_tg = read_env("telegram.env")
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN") or _tg.get("TELEGRAM_BOT_TOKEN", "")
ADMIN_IDS = {
    int(x) for x in (os.environ.get("TELEGRAM_ADMIN_IDS") or _tg.get("TELEGRAM_ADMIN_IDS", "")).split(",") if x.strip()
}

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY") or read_env("anthropic.env").get("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.environ.get("CLAUDE_MODEL", "claude-opus-5")

_app = read_env("app.env")
THREADS_APP_SECRET = os.environ.get("META_APP_SECRET") or _app.get("META_APP_SECRET", "")

ACCOUNTS: dict[str, dict] = json.loads((BASE_DIR / "accounts.json").read_text())

# Safety limits. Official API allows 250 posts / 1000 replies a day; we stay far below.
MAX_COMMENTS_PER_DAY = 10
MAX_POSTS_PER_DAY = 2
MIN_GAP_MINUTES = 4          # between any two publications of one account
COMMENT_MAX_AGE_MIN = 120    # don't comment on posts older than this (research: after 12h ~0 likes)
POST_JITTER_MIN = 10         # random shift applied to scheduled posts
