"""Background jobs. Anything that would publish only picks up rows a human approved in Telegram."""
from __future__ import annotations

import datetime as dt
import logging
import random
import re
import time

import db
import drafter
import public
import threads_api as api
from settings import (ACCOUNTS, ANTHROPIC_API_KEY, COMMENT_MAX_AGE_MIN, MAX_COMMENTS_PER_DAY, MAX_POSTS_PER_DAY,
                      MIN_GAP_MINUTES, TZ)

log = logging.getLogger(__name__)


class Notifier:
    """Implemented by the bot; jobs only know these three calls."""
    async def post_card(self, post_id: int) -> None: ...
    async def comment_card(self, comment_id: int) -> None: ...
    async def text(self, msg: str) -> None: ...


notify: Notifier = Notifier()

REQUEST_RX = re.compile(r"(\bнужен\b|\bнужна\b|\bнужно\b|\bищу\b|керек|іздеймін|іздейміз|посоветуйте|порекомендуйте|"
                        r"кто может|кто сделает|барма|бар ма|подскажите)", re.I)


def _day_start() -> int:
    n = dt.datetime.now(TZ)
    return int(n.replace(hour=0, minute=0, second=0, microsecond=0).timestamp())


def _last_publish(account: str) -> int:
    a = db.one("SELECT MAX(published_at) m FROM posts WHERE account=?", account)["m"] or 0
    b = db.one("SELECT MAX(published_at) m FROM comments WHERE account=?", account)["m"] or 0
    return max(a, b)


def _can_publish(account: str) -> bool:
    return time.time() - _last_publish(account) >= MIN_GAP_MINUTES * 60


# ---------- publishing ----------

async def publish_due() -> None:
    if db.paused():
        return
    for p in db.q("SELECT * FROM posts WHERE status='approved' AND scheduled_at<=? ORDER BY scheduled_at", db.now()):
        acc = p["account"]
        if not api.has_token(acc) or not _can_publish(acc):
            continue
        today = db.one("SELECT COUNT(*) n FROM posts WHERE account=? AND status='published' AND published_at>=?",
                       acc, _day_start())["n"]
        if today >= MAX_POSTS_PER_DAY:
            continue
        try:
            mid = await api.publish_text(acc, p["text"])
            db.ex("UPDATE posts SET status='published', threads_id=?, published_at=? WHERE id=?", mid, db.now(), p["id"])
            if p["reply_text"]:
                db.kv_set(f"chain:{p['id']}", str(db.now() + random.randint(60, 150)))
            link = await api.permalink(acc, mid)
            await notify.text(f"Опубликовано в @{ACCOUNTS[acc]['handle']}: {link}")
        except Exception as e:
            db.ex("UPDATE posts SET status='failed', error=? WHERE id=?", str(e)[:500], p["id"])
            await notify.text(f"Не удалось опубликовать пост #{p['id']} в @{ACCOUNTS[acc]['handle']}: {e}")
    await _publish_chains()
    await _publish_comments()


async def _publish_chains() -> None:
    """The continuation goes as our own reply 1-2.5 minutes after the main post."""
    for p in db.q("SELECT * FROM posts WHERE status='published' AND reply_text<>'' AND reply_id IS NULL"):
        due = db.kv_get(f"chain:{p['id']}")
        if not due or int(due) > db.now():
            continue
        try:
            rid = await api.publish_text(p["account"], p["reply_text"], reply_to=p["threads_id"])
            db.ex("UPDATE posts SET reply_id=? WHERE id=?", rid, p["id"])
        except Exception as e:
            db.ex("UPDATE posts SET reply_id='failed', error=? WHERE id=?", str(e)[:500], p["id"])
            await notify.text(f"Продолжение поста #{p['id']} не опубликовалось: {e}")


async def _publish_comments() -> None:
    for c in db.q("SELECT * FROM comments WHERE status='approved' ORDER BY created_at"):
        acc = c["account"]
        if not api.has_token(acc) or not _can_publish(acc):
            continue
        if c["kind"] != "own_reply" and c["target_time"] and time.time() - c["target_time"] > 6 * 3600:
            db.ex("UPDATE comments SET status='expired' WHERE id=?", c["id"])
            await notify.text(f"Комментарий #{c['id']} не отправлен: пост старше 6 часов, смысла уже нет.")
            continue
        today = db.one("SELECT COUNT(*) n FROM comments WHERE account=? AND status='published' AND published_at>=?",
                       acc, _day_start())["n"]
        if today >= MAX_COMMENTS_PER_DAY:
            continue
        try:
            target = c["target_api_id"] or await public.api_media_id(c["target_url"])
            if not target:
                raise RuntimeError("не нашёл ID поста на странице")
            rid = await api.publish_text(acc, c["draft"], reply_to=target)
            db.ex("UPDATE comments SET status='published', reply_id=?, target_api_id=?, published_at=? WHERE id=?",
                  rid, target, db.now(), c["id"])
            await notify.text(f"Комментарий отправлен от @{ACCOUNTS[acc]['handle']} под постом {c['target_url']}")
        except Exception as e:
            db.ex("UPDATE comments SET status='failed', error=? WHERE id=?", str(e)[:500], c["id"])
            await notify.text(f"Комментарий #{c['id']} не отправлен: {e}")


# ---------- finding things to comment on ----------

def _commented_author_today(account: str, author: str) -> bool:
    return bool(db.one("SELECT 1 FROM comments WHERE account=? AND target_author=? AND created_at>=? "
                       "AND status NOT IN ('skipped','rejected')", account, author, _day_start()))


async def _draft_and_offer(account: str, kind: str, post: dict, api_id: str | None = None) -> None:
    if not ANTHROPIC_API_KEY:
        return
    if db.one("SELECT 1 FROM comments WHERE account=? AND target_code=?", account, post["code"]):
        return
    d = await drafter.comment(account, kind, post)
    if d is None:
        return
    status = "skipped" if d["skip"] or not d["comment"].strip() else "pending"
    cid = db.ex("INSERT OR IGNORE INTO comments(account,kind,target_url,target_code,target_api_id,target_author,"
                "target_text,target_time,draft,why,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
                account, kind, post["url"], post["code"], api_id, post["author"], post["text"][:3000],
                post["time"], d["comment"].strip(), d["reason"], status, db.now())
    if status == "pending" and cid:
        await notify.comment_card(cid)


async def watch() -> None:
    if db.paused() or not ANTHROPIC_API_KEY:
        return
    for acc, cfg in ACCOUNTS.items():
        if not api.has_token(acc):
            continue
        for user in cfg["watch"]:
            try:
                posts = await public.profile_posts(user, limit=5)
            except Exception as e:
                log.warning("watch %s: %s", user, e)
                continue
            for p in posts:
                if db.seen(f"w:{acc}:{p['code']}"):
                    continue
                age_min = (time.time() - p["time"]) / 60
                if age_min > COMMENT_MAX_AGE_MIN or len(p["text"]) < 20 or _commented_author_today(acc, user):
                    continue
                await _draft_and_offer(acc, "watch", p)


async def leads() -> None:
    if db.paused() or not ANTHROPIC_API_KEY:
        return
    for acc, cfg in ACCOUNTS.items():
        if not api.has_token(acc):
            continue
        for kw in cfg["lead_keywords"]:
            try:
                posts = await public.search(kw, limit=25)
            except Exception as e:
                log.warning("leads %s: %s", kw, e)
                continue
            for p in posts:
                if db.seen(f"l:{acc}:{p['code']}"):
                    continue
                if time.time() - p["time"] > 6 * 3600 or not REQUEST_RX.search(p["text"]):
                    continue
                if p["author"] in {a["handle"] for a in ACCOUNTS.values()}:
                    continue
                await _draft_and_offer(acc, "lead", p)


async def own_replies() -> None:
    if not ANTHROPIC_API_KEY:
        return
    for acc in ACCOUNTS:
        if not api.has_token(acc):
            continue
        try:
            posts = await api.recent_own_posts(acc, limit=10)
        except Exception as e:
            log.warning("own posts %s: %s", acc, e)
            continue
        for p in posts:
            if time.time() - _iso(p.get("timestamp")) > 7 * 86400:
                continue
            try:
                reps = await api.replies_to(acc, p["id"])
            except Exception:
                continue
            for r in reps:
                if r.get("is_reply_owned_by_me") or db.seen(f"r:{acc}:{r['id']}"):
                    continue
                post = {"code": r["id"], "url": r.get("permalink", ""), "author": r.get("username", ""),
                        "text": r.get("text") or "", "time": _iso(r.get("timestamp")), "parent_text": p.get("text") or ""}
                await _draft_and_offer(acc, "own_reply", post, api_id=r["id"])


def _iso(s: str | None) -> int:
    if not s:
        return 0
    return int(dt.datetime.strptime(s, "%Y-%m-%dT%H:%M:%S%z").timestamp())


# ---------- stats, planning, tokens ----------

async def daily_stats() -> None:
    day = dt.datetime.now(TZ).strftime("%Y-%m-%d")
    for p in db.q("SELECT * FROM posts WHERE status='published' AND published_at>=?", db.now() - 14 * 86400):
        try:
            m = await api.insights(p["account"], p["threads_id"])
        except Exception as e:
            log.warning("insights %s: %s", p["id"], e)
            continue
        db.ex("INSERT OR REPLACE INTO stats VALUES(?,?,?,?,?,?,?,?)", p["id"], day, m.get("views"), m.get("likes"),
              m.get("replies"), m.get("reposts"), m.get("quotes"), m.get("shares"))


DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def _next_week_slots(account: str) -> list[tuple[int, str, str]]:
    """(unix time, 'mon 16:00', lang) for the coming Monday..Saturday."""
    today = dt.datetime.now(TZ).date()
    monday = today + dt.timedelta(days=(7 - today.weekday()) % 7 or 7)
    out = []
    for day, (hhmm, lang) in ACCOUNTS[account]["slots"].items():
        d = monday + dt.timedelta(days=DAYS.index(day))
        h, m = map(int, hhmm.split(":"))
        t = dt.datetime(d.year, d.month, d.day, h, m, tzinfo=TZ)
        out.append((int(t.timestamp()), f"{day} {hhmm}", lang))
    return sorted(out)


async def weekly_plan(only: str | None = None) -> None:
    for acc, cfg in ACCOUNTS.items():
        if only and acc != only:
            continue
        if not api.has_token(acc):
            continue
        if not ANTHROPIC_API_KEY:
            await notify.text("Нет ключа Claude API, план недели не составить. Заполни anthropic.env и перезапусти бота.")
            return
        await notify.text(f"Собираю тренды и пишу план недели для @{cfg['handle']}...")
        week_ago = time.time() - 10 * 86400
        posts = [p for p in await public.profile_engagement(cfg["watch"]) if p["time"] >= week_ago]
        posts.sort(key=lambda p: -(p["likes"] + 2 * p["replies"]))
        trends = "\n\n".join(f"@{p['author']} ♥{p['likes']} 💬{p['replies']}: {p['text'][:400]}" for p in posts[:30])
        mine = db.q("SELECT p.text, s.views, s.likes, s.replies FROM posts p LEFT JOIN stats s ON s.post_id=p.id "
                    "WHERE p.account=? AND p.status='published' ORDER BY p.published_at DESC LIMIT 20", acc)
        stats = "\n".join(f"views {r['views']} likes {r['likes']} replies {r['replies']}: {r['text'][:200]}" for r in mine)
        if not stats:
            try:
                own = await api.recent_own_posts(acc, limit=15)
                stats = "\n".join(f"- {(o.get('text') or '')[:200]}" for o in own)
            except Exception:
                stats = "нет данных"
        slots = _next_week_slots(acc)
        drafts = await drafter.weekly_posts(acc, [f"{s} {lang}" for _, s, lang in slots], trends, stats)
        by_slot = {s: (t, lang) for t, s, lang in slots}
        for d in drafts:
            t, lang = by_slot.get(d["slot"].strip(), (None, d["lang"]))
            if t is None:
                continue
            pid = db.ex("INSERT INTO posts(account,lang,text,reply_text,scheduled_at,status,note,created_at) "
                        "VALUES(?,?,?,?,?,'draft',?,?)", acc, d["lang"], d["text"].strip(), d["reply_text"].strip(),
                        t, d["idea"], db.now())
            await notify.post_card(pid)


async def refresh_tokens() -> None:
    for acc in ACCOUNTS:
        if not api.has_token(acc):
            continue
        try:
            await api.refresh_token(acc)
        except Exception as e:
            await notify.text(f"Не удалось продлить токен @{ACCOUNTS[acc]['handle']}: {e}. "
                              f"Сгенерируй новый и запусти threads-token.")
