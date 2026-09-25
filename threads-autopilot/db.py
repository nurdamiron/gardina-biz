"""SQLite storage. Small and synchronous: every call is a few ms, fine inside the bot loop."""
from __future__ import annotations

import sqlite3
import time
from contextlib import contextmanager

from settings import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY,
  account TEXT NOT NULL,
  lang TEXT,
  text TEXT NOT NULL,
  reply_text TEXT,
  scheduled_at INTEGER,              -- unix seconds
  status TEXT NOT NULL DEFAULT 'draft', -- draft|approved|published|rejected|failed
  threads_id TEXT, reply_id TEXT,
  error TEXT, note TEXT,
  created_at INTEGER NOT NULL, published_at INTEGER,
  tg_msg_id INTEGER
);
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY,
  account TEXT NOT NULL,
  kind TEXT NOT NULL,                 -- watch|lead|own_reply
  target_url TEXT, target_code TEXT, target_api_id TEXT,
  target_author TEXT, target_text TEXT, target_time INTEGER,
  draft TEXT, why TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|approved|published|rejected|expired|failed|skipped
  reply_id TEXT, error TEXT,
  created_at INTEGER NOT NULL, published_at INTEGER,
  tg_msg_id INTEGER,
  UNIQUE(account, target_code)
);
CREATE TABLE IF NOT EXISTS seen (key TEXT PRIMARY KEY, at INTEGER);
CREATE TABLE IF NOT EXISTS stats (
  post_id INTEGER, day TEXT, views INTEGER, likes INTEGER, replies INTEGER, reposts INTEGER, quotes INTEGER, shares INTEGER,
  PRIMARY KEY (post_id, day)
);
CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS tokens (account TEXT PRIMARY KEY, token TEXT, user_id TEXT, refreshed_at INTEGER);
"""


@contextmanager
def conn():
    c = sqlite3.connect(DB_PATH, timeout=10)
    c.row_factory = sqlite3.Row
    try:
        yield c
        c.commit()
    finally:
        c.close()


def init() -> None:
    with conn() as c:
        c.executescript(SCHEMA)


def now() -> int:
    return int(time.time())


def q(sql: str, *args) -> list[sqlite3.Row]:
    with conn() as c:
        return c.execute(sql, args).fetchall()


def one(sql: str, *args) -> sqlite3.Row | None:
    rows = q(sql, *args)
    return rows[0] if rows else None


def ex(sql: str, *args) -> int:
    with conn() as c:
        cur = c.execute(sql, args)
        return cur.lastrowid


def kv_get(key: str, default: str | None = None) -> str | None:
    r = one("SELECT value FROM kv WHERE key=?", key)
    return r["value"] if r else default


def kv_set(key: str, value: str) -> None:
    ex("INSERT INTO kv(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", key, value)


def seen(key: str) -> bool:
    """Returns True if key was already seen; marks it seen otherwise."""
    with conn() as c:
        if c.execute("SELECT 1 FROM seen WHERE key=?", (key,)).fetchone():
            return True
        c.execute("INSERT INTO seen(key,at) VALUES(?,?)", (key, now()))
        return False


def paused() -> bool:
    return kv_get("paused", "0") == "1"
