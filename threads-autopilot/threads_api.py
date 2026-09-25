"""Official Threads Graph API: publish, replies, insights, token refresh."""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import ssl
import urllib.error

import certifi
import urllib.parse
import urllib.request

import db
from settings import ACCOUNTS, read_env

log = logging.getLogger(__name__)
API = "https://graph.threads.net/v1.0"


class ThreadsError(Exception):
    pass


_SSL = ssl.create_default_context(cafile=certifi.where())


def _http(method: str, url: str, params: dict) -> dict:
    data = urllib.parse.urlencode(params).encode()
    if method == "GET":
        req = urllib.request.Request(f"{url}?{data.decode()}")
    else:
        req = urllib.request.Request(url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30, context=_SSL) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:400]
        raise ThreadsError(f"HTTP {e.code}: {body}") from None


async def call(method: str, path: str, token: str, **params) -> dict:
    params["access_token"] = token
    url = path if path.startswith("http") else f"{API}/{path}"
    return await asyncio.to_thread(_http, method, url, params)


def seed_tokens() -> None:
    """Copy tokens from env files into the DB once; after that the DB is the source of truth."""
    # A token from the env file is applied only when it is new to us (someone ran `threads-token`).
    # Redeploying the same config must not overwrite a token the bot has refreshed since.
    for acc, cfg in ACCOUNTS.items():
        env = read_env(cfg["env"])
        tok, uid = env.get("THREADS_ACCESS_TOKEN"), env.get("THREADS_USER_ID")
        if not tok:
            continue
        fp = hashlib.sha256(tok.encode()).hexdigest()
        if db.kv_get(f"seeded:{acc}") == fp:
            continue
        db.ex("INSERT INTO tokens(account,token,user_id,refreshed_at) VALUES(?,?,?,?) "
              "ON CONFLICT(account) DO UPDATE SET token=excluded.token, user_id=excluded.user_id, "
              "refreshed_at=excluded.refreshed_at", acc, tok, uid, db.now())
        db.kv_set(f"seeded:{acc}", fp)


def token(account: str) -> str:
    r = db.one("SELECT token FROM tokens WHERE account=?", account)
    if not r or not r["token"]:
        raise ThreadsError(f"нет токена для {account}")
    return r["token"]


def has_token(account: str) -> bool:
    r = db.one("SELECT token FROM tokens WHERE account=?", account)
    return bool(r and r["token"])


async def publish_text(account: str, text: str, reply_to: str | None = None) -> str:
    if len(text) > 500:
        raise ThreadsError(f"текст длиннее 500 символов ({len(text)})")
    tok = token(account)
    params = {"media_type": "TEXT", "text": text}
    if reply_to:
        params["reply_to_id"] = reply_to
    container = (await call("POST", "me/threads", tok, **params))["id"]
    # Meta recommends waiting for the container before publishing.
    for attempt in range(10):
        await asyncio.sleep(3 if attempt else 2)
        st = await call("GET", container, tok, fields="status,error_message")
        if st.get("status") == "FINISHED":
            break
        if st.get("status") in ("ERROR", "EXPIRED"):
            raise ThreadsError(f"контейнер {st}")
    res = await call("POST", "me/threads_publish", tok, creation_id=container)
    return res["id"]


async def permalink(account: str, media_id: str) -> str:
    r = await call("GET", media_id, token(account), fields="permalink")
    return r.get("permalink", "")


async def replies_to(account: str, media_id: str) -> list[dict]:
    r = await call("GET", f"{media_id}/replies", token(account),
                   fields="id,text,username,timestamp,permalink,is_reply_owned_by_me")
    return r.get("data", [])


async def recent_own_posts(account: str, limit: int = 15) -> list[dict]:
    r = await call("GET", "me/threads", token(account), fields="id,text,timestamp,permalink", limit=limit)
    return r.get("data", [])


async def insights(account: str, media_id: str) -> dict:
    r = await call("GET", f"{media_id}/insights", token(account), metric="views,likes,replies,reposts,quotes,shares")
    return {m["name"]: m["values"][0]["value"] for m in r.get("data", [])}


async def refresh_token(account: str) -> None:
    tok = token(account)
    r = await call("GET", "https://graph.threads.net/refresh_access_token", tok, grant_type="th_refresh_token")
    if "access_token" not in r:
        raise ThreadsError(str(r))
    db.ex("UPDATE tokens SET token=?, refreshed_at=? WHERE account=?", r["access_token"], db.now(), account)
