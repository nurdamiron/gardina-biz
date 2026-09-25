"""Read-only access to public Threads content (no login).

- New posts and keyword search: the threads-mcp binary over stdio (plain HTTP, light).
- Official API media id of someone else's post: needs a rendered page, so headless Chromium,
  used only right before we publish a comment.
"""
from __future__ import annotations

import asyncio
import datetime as dt
import json
import logging
import re
import subprocess
import threading

from settings import THREADS_MCP_BIN

log = logging.getLogger(__name__)


class _MCP:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.p: subprocess.Popen | None = None
        self.n = 0

    def _start(self) -> None:
        self.p = subprocess.Popen([THREADS_MCP_BIN], stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                  stderr=subprocess.DEVNULL, text=True)
        self.n = 0
        self._rpc("initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                                 "clientInfo": {"name": "autopilot", "version": "1"}})
        self.p.stdin.write(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}) + "\n")
        self.p.stdin.flush()

    def _rpc(self, method: str, params: dict) -> dict:
        self.n += 1
        self.p.stdin.write(json.dumps({"jsonrpc": "2.0", "id": self.n, "method": method, "params": params}) + "\n")
        self.p.stdin.flush()
        while True:
            line = self.p.stdout.readline()
            if not line:
                raise RuntimeError("threads-mcp exited")
            msg = json.loads(line)
            if msg.get("id") == self.n:
                return msg

    def tool(self, name: str, args: dict) -> dict:
        with self.lock:
            for attempt in range(2):
                try:
                    if self.p is None or self.p.poll() is not None:
                        self._start()
                    r = self._rpc("tools/call", {"name": name, "arguments": args}).get("result", {})
                    sc = r.get("structuredContent")
                    if sc:
                        return sc.get("result", sc)
                    return json.loads("".join(c.get("text", "") for c in r.get("content", [])) or "{}")
                except Exception as e:  # restart the helper once
                    log.warning("threads-mcp %s failed: %s", name, e)
                    self.p = None
            return {}


_mcp = _MCP()


def _ts(s: str | None) -> int:
    if not s:
        return 0
    return int(dt.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp())


def _norm(it: dict) -> dict:
    url = it.get("permalink") or ""
    code = it.get("shortcode") or (url.split("/post/")[1].split("/")[0] if "/post/" in url else it.get("id"))
    return {"code": code, "url": url, "author": it.get("username", ""), "text": it.get("text") or "",
            "time": _ts(it.get("timestamp"))}


async def profile_posts(username: str, limit: int = 10) -> list[dict]:
    d = await asyncio.to_thread(_mcp.tool, "get_profile_posts", {"username": username, "limit": limit})
    return [_norm(i) for i in d.get("items", [])]


async def search(query: str, limit: int = 25) -> list[dict]:
    d = await asyncio.to_thread(_mcp.tool, "search_posts", {"query": query, "limit": limit})
    return [_norm(i) for i in d.get("items", [])]


def _walk(o, acc: dict) -> None:
    if isinstance(o, list):
        for x in o:
            _walk(x, acc)
        return
    if not isinstance(o, dict):
        return
    if o.get("code") and "like_count" in o and o.get("user"):
        tp = o.get("text_post_app_info") or {}
        acc[o["code"]] = {
            "code": o["code"], "author": o["user"].get("username"),
            "text": (o.get("caption") or {}).get("text") or "", "likes": o.get("like_count") or 0,
            "replies": tp.get("direct_reply_count") or 0, "time": o.get("taken_at") or 0,
            "is_reply": bool(tp.get("reply_to_author")),
        }
    for v in o.values():
        _walk(v, acc)


async def profile_engagement(usernames: list[str], per_user_scrolls: int = 2) -> list[dict]:
    """Posts with like/reply counts from public profile pages. Heavier; used weekly for trends."""
    from playwright.async_api import async_playwright

    out: list[dict] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        ctx = await browser.new_context(locale="ru-RU", viewport={"width": 1200, "height": 2000})
        for u in usernames:
            acc: dict = {}
            page = await ctx.new_page()

            async def on_resp(r, acc=acc):
                if "graphql" in r.url:
                    try:
                        for line in (await r.text()).split("\n"):
                            _walk(json.loads(line), acc)
                    except Exception:
                        pass

            page.on("response", on_resp)
            try:
                await page.goto(f"https://www.threads.com/@{u}", wait_until="domcontentloaded", timeout=45000)
                await page.wait_for_timeout(2500)
                for _ in range(per_user_scrolls):
                    await page.mouse.wheel(0, 6000)
                    await page.wait_for_timeout(1500)
                for s in await page.eval_on_selector_all('script[type="application/json"]', "e => e.map(x => x.textContent)"):
                    try:
                        _walk(json.loads(s), acc)
                    except Exception:
                        pass
            except Exception as e:
                log.warning("engagement %s: %s", u, e)
            await page.close()
            out += [p for p in acc.values() if p["author"] == u and not p["is_reply"]]
            await asyncio.sleep(1.5)
        await browser.close()
    return out


async def api_media_id(url: str) -> str | None:
    """The official API id (text_post_app_info.id) is embedded in the rendered post page."""
    from playwright.async_api import async_playwright

    code = url.split("/post/")[1].split("/")[0]
    async with async_playwright() as pw:
        browser = await pw.chromium.launch()
        try:
            page = await browser.new_page(locale="ru-RU")
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            await page.wait_for_timeout(3000)
            scripts = await page.eval_on_selector_all('script[type="application/json"]', "e => e.map(x => x.textContent)")
        finally:
            await browser.close()
    # Only trust the id that sits inside the very object whose "code" is this post.
    found: set[str] = set()

    def find(o) -> None:
        if isinstance(o, list):
            for x in o:
                find(x)
        elif isinstance(o, dict):
            if o.get("code") == code:
                tid = (o.get("text_post_app_info") or {}).get("id", "")
                m = re.fullmatch(r"XDTTextPostAppMediaInfo:(\d+)", tid or "")
                if m:
                    found.add(m.group(1))
            for v in o.values():
                find(v)

    for s in scripts:
        try:
            find(json.loads(s))
        except Exception:
            pass
    if len(found) != 1:
        log.warning("api id for %s ambiguous or missing: %s", code, found)
        return None
    return found.pop()
