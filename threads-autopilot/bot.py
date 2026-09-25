"""Telegram control panel + scheduler. Run: python bot.py"""
from __future__ import annotations

import asyncio
import datetime as dt
import html
import logging
import random
import secrets

from aiogram import Bot, Dispatcher, F, Router
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.filters import Command, CommandObject
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from apscheduler.schedulers.asyncio import AsyncIOScheduler

import db
import jobs
import threads_api as api
from settings import ACCOUNTS, ADMIN_IDS, DATA_DIR, POST_JITTER_MIN, TELEGRAM_BOT_TOKEN, TZ

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("autopilot")
router = Router()
bot: Bot


def admins() -> set[int]:
    extra = {int(x) for x in (db.kv_get("admin_ids", "") or "").split(",") if x}
    return ADMIN_IDS | extra


def is_admin(uid: int | None) -> bool:
    return uid is not None and uid in admins()


def esc(s: str | None) -> str:
    return html.escape(s or "")


def when(ts: int | None) -> str:
    if not ts:
        return "без времени"
    d = dt.datetime.fromtimestamp(ts, TZ)
    return d.strftime("%a %d.%m %H:%M").replace("Mon", "пн").replace("Tue", "вт").replace("Wed", "ср") \
        .replace("Thu", "чт").replace("Fri", "пт").replace("Sat", "сб").replace("Sun", "вс")


def kb(kind: str, id_: int, approve_label: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text=f"✅ {approve_label}", callback_data=f"{kind}:ok:{id_}"),
        InlineKeyboardButton(text="✏️ Изменить", callback_data=f"{kind}:edit:{id_}"),
        InlineKeyboardButton(text="❌ Пропустить", callback_data=f"{kind}:no:{id_}"),
    ]])


def post_text(p) -> str:
    s = (f"📝 <b>Пост @{esc(ACCOUNTS[p['account']]['handle'])}</b> · {when(p['scheduled_at'])} · {esc(p['lang'])}\n\n"
         f"{esc(p['text'])}")
    if p["reply_text"]:
        s += f"\n\n<b>↳ Продолжение ответом:</b>\n{esc(p['reply_text'])}"
    if p["note"]:
        s += f"\n\n<i>Идея: {esc(p['note'])}</i>"
    return s


def comment_text(c) -> str:
    label = {"watch": "под популярным постом", "lead": "лид: человек ищет исполнителя", "own_reply": "ответ под нашим постом"}
    age = int((db.now() - (c["target_time"] or db.now())) / 60)
    return (f"💬 <b>@{esc(ACCOUNTS[c['account']]['handle'])}</b> · {label[c['kind']]}\n"
            f"Пост @{esc(c['target_author'])}, {age} мин назад:\n<blockquote>{esc(c['target_text'][:500])}</blockquote>"
            f"{esc(c['target_url'])}\n\n<b>Черновик:</b>\n{esc(c['draft'])}\n\n<i>{esc(c['why'])}</i>")


class TgNotifier(jobs.Notifier):
    async def _send(self, text: str, markup=None) -> int | None:
        mid = None
        for uid in admins():
            try:
                m = await bot.send_message(uid, text, reply_markup=markup, disable_web_page_preview=True)
                mid = m.message_id
            except Exception as e:
                log.error("send to %s failed: %s", uid, e)
        return mid

    async def post_card(self, post_id: int) -> None:
        p = db.one("SELECT * FROM posts WHERE id=?", post_id)
        mid = await self._send(post_text(p), kb("p", post_id, "Одобрить"))
        db.ex("UPDATE posts SET tg_msg_id=? WHERE id=?", mid, post_id)

    async def comment_card(self, comment_id: int) -> None:
        c = db.one("SELECT * FROM comments WHERE id=?", comment_id)
        mid = await self._send(comment_text(c), kb("c", comment_id, "Отправить"))
        db.ex("UPDATE comments SET tg_msg_id=? WHERE id=?", mid, comment_id)

    async def text(self, msg: str) -> None:
        await self._send(esc(msg))


# ---------- pairing ----------

@router.message(Command("start"))
async def start(m: Message, command: CommandObject) -> None:
    if is_admin(m.from_user.id):
        await m.answer("Бот на связи. Команды: /queue, /stats, /plan, /add, /pause, /resume, /status")
        return
    code = db.kv_get("pairing_code")
    if code and command.args and secrets.compare_digest(command.args.strip(), code):
        ids = admins() | {m.from_user.id}
        db.kv_set("admin_ids", ",".join(str(i) for i in ids))
        db.kv_set("pairing_code", "")
        await m.answer("Готово, ты подключён. Сюда будут приходить черновики постов и комментариев.")
        return
    log.info("unauthorized /start from %s (@%s)", m.from_user.id, m.from_user.username)
    await m.answer("Это закрытый бот.")


# ---------- buttons ----------

@router.callback_query(F.data.regexp(r"^[pc]:(ok|edit|no):\d+$"))
async def on_button(cb: CallbackQuery) -> None:
    if not is_admin(cb.from_user.id):
        await cb.answer()
        return
    kind, action, id_ = cb.data.split(":")
    id_ = int(id_)
    if kind == "p":
        p = db.one("SELECT * FROM posts WHERE id=?", id_)
        if p["status"] not in ("draft", "approved"):
            await cb.answer(f"Уже {p['status']}")
            return
        if action == "ok":
            t = p["scheduled_at"] or 0
            t = max(t, db.now() + 120) + random.randint(-POST_JITTER_MIN, POST_JITTER_MIN) * 60
            t = max(t, db.now() + 60)
            db.ex("UPDATE posts SET status='approved', scheduled_at=? WHERE id=?", t, id_)
            await cb.message.edit_text(post_text(db.one("SELECT * FROM posts WHERE id=?", id_))
                                       + f"\n\n✅ Одобрен, выйдет {when(t)}")
        elif action == "no":
            db.ex("UPDATE posts SET status='rejected' WHERE id=?", id_)
            await cb.message.edit_text(post_text(p) + "\n\n❌ Отклонён")
        else:
            db.kv_set(f"edit:{cb.from_user.id}", f"p:{id_}")
            await cb.message.answer("Пришли новый текст. Если нужно продолжение ответом, отдели его строкой ---")
    else:
        c = db.one("SELECT * FROM comments WHERE id=?", id_)
        if c["status"] not in ("pending",):
            await cb.answer(f"Уже {c['status']}")
            return
        if action == "ok":
            db.ex("UPDATE comments SET status='approved' WHERE id=?", id_)
            await cb.message.edit_text(comment_text(c) + "\n\n✅ Отправляю в течение пары минут")
        elif action == "no":
            db.ex("UPDATE comments SET status='rejected' WHERE id=?", id_)
            await cb.message.edit_text(comment_text(c) + "\n\n❌ Пропущен")
        else:
            db.kv_set(f"edit:{cb.from_user.id}", f"c:{id_}")
            await cb.message.answer("Пришли новый текст комментария.")
    await cb.answer()


# ---------- commands ----------

@router.message(Command("queue"))
async def queue(m: Message) -> None:
    if not is_admin(m.from_user.id):
        return
    rows = db.q("SELECT * FROM posts WHERE status IN ('draft','approved') ORDER BY scheduled_at")
    pend = db.one("SELECT COUNT(*) n FROM comments WHERE status='pending'")["n"]
    lines = [f"{'✅' if r['status'] == 'approved' else '📝'} #{r['id']} @{ACCOUNTS[r['account']]['handle']} "
             f"{when(r['scheduled_at'])}: {esc(r['text'][:60])}" for r in rows]
    await m.answer("\n".join(lines or ["Очередь постов пуста."]) + f"\n\nКомментариев ждут решения: {pend}"
                   + ("\n⏸ Пауза включена" if db.paused() else ""))


@router.message(Command("stats"))
async def stats(m: Message) -> None:
    if not is_admin(m.from_user.id):
        return
    rows = db.q("SELECT p.id, p.account, p.text, s.views, s.likes, s.replies FROM posts p "
                "LEFT JOIN stats s ON s.post_id=p.id AND s.day=(SELECT MAX(day) FROM stats WHERE post_id=p.id) "
                "WHERE p.status='published' AND p.published_at>=? ORDER BY p.published_at DESC", db.now() - 7 * 86400)
    cm = db.q("SELECT account, COUNT(*) n FROM comments WHERE status='published' AND published_at>=? GROUP BY account",
              db.now() - 7 * 86400)
    lines = [f"@{ACCOUNTS[r['account']]['handle']} 👁{r['views'] or '?'} ♥{r['likes'] or '?'} 💬{r['replies'] or '?'} "
             f"{esc(r['text'][:50])}" for r in rows]
    lines += [f"Комментариев от @{ACCOUNTS[r['account']]['handle']}: {r['n']}" for r in cm]
    await m.answer("\n".join(lines) or "За неделю ещё ничего не опубликовано.")


@router.message(Command("plan"))
async def plan(m: Message, command: CommandObject) -> None:
    if not is_admin(m.from_user.id):
        return
    acc = (command.args or "").strip().lstrip("@").replace(".", "_") or None
    if acc and acc not in ACCOUNTS:
        await m.answer("Аккаунты: " + ", ".join(ACCOUNTS))
        return
    asyncio.create_task(jobs.weekly_plan(only=acc))
    await m.answer("Запустил, черновики придут сюда через несколько минут.")


@router.message(Command("add"))
async def add(m: Message, command: CommandObject) -> None:
    """/add gardina_kz 28.09 12:00 + text on following lines, continuation after ---"""
    if not is_admin(m.from_user.id):
        return
    try:
        head, body = (command.args or "").split("\n", 1)
        acc, date, hhmm = head.split()
        acc = acc.lstrip("@").replace(".", "_")
        d, mo = map(int, date.split("."))
        h, mi = map(int, hhmm.split(":"))
        now = dt.datetime.now(TZ)
        t = dt.datetime(now.year, mo, d, h, mi, tzinfo=TZ)
        text, _, reply = body.partition("\n---\n")
        assert acc in ACCOUNTS and text.strip()
    except Exception:
        await m.answer("Формат:\n/add gardina_kz 28.09 12:00\nтекст поста\n---\nпродолжение (необязательно)")
        return
    pid = db.ex("INSERT INTO posts(account,lang,text,reply_text,scheduled_at,status,created_at) VALUES(?,?,?,?,?,'draft',?)",
                acc, "", text.strip(), reply.strip(), int(t.timestamp()), db.now())
    await jobs.notify.post_card(pid)


@router.message(Command("pause"))
async def pause(m: Message) -> None:
    if is_admin(m.from_user.id):
        db.kv_set("paused", "1")
        await m.answer("⏸ Пауза: ничего не публикую и не ищу, пока не напишешь /resume")


@router.message(Command("resume"))
async def resume(m: Message) -> None:
    if is_admin(m.from_user.id):
        db.kv_set("paused", "0")
        await m.answer("▶️ Работаю дальше")


@router.message(Command("status"))
async def status(m: Message) -> None:
    if not is_admin(m.from_user.id):
        return
    lines = []
    for acc, cfg in ACCOUNTS.items():
        r = db.one("SELECT refreshed_at FROM tokens WHERE account=?", acc)
        if r:
            days = (db.now() - r["refreshed_at"]) // 86400
            lines.append(f"@{cfg['handle']}: токен обновлён {days} дн. назад (живёт 60)")
        else:
            lines.append(f"@{cfg['handle']}: нет токена")
    lines.append("⏸ пауза" if db.paused() else "▶️ работает")
    await m.answer("\n".join(lines))


@router.message(F.text)
async def edited_text(m: Message) -> None:
    if not is_admin(m.from_user.id):
        return
    target = db.kv_get(f"edit:{m.from_user.id}")
    if not target:
        return
    db.kv_set(f"edit:{m.from_user.id}", "")
    kind, id_ = target.split(":")
    if kind == "p":
        text, _, reply = m.text.partition("\n---\n")
        db.ex("UPDATE posts SET text=?, reply_text=?, status='draft' WHERE id=?", text.strip(), reply.strip(), int(id_))
        await jobs.notify.post_card(int(id_))
    else:
        db.ex("UPDATE comments SET draft=? WHERE id=?", m.text.strip(), int(id_))
        await jobs.notify.comment_card(int(id_))


# ---------- main ----------

def _guard(fn):
    async def run():
        try:
            await fn()
        except Exception as e:
            log.exception("job %s failed", fn.__name__)
            await jobs.notify.text(f"Ошибка в задаче {fn.__name__}: {e}")
    run.__name__ = fn.__name__
    return run


async def main() -> None:
    global bot
    db.init()
    api.seed_tokens()
    if not admins():
        code = secrets.token_hex(3)
        db.kv_set("pairing_code", code)
        (DATA_DIR / "pairing_code.txt").write_text(code)
        log.warning("No admin yet. Send the bot: /start %s", code)
    bot = Bot(TELEGRAM_BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    jobs.notify = TgNotifier()
    dp = Dispatcher()
    dp.include_router(router)

    s = AsyncIOScheduler(timezone=TZ)
    s.add_job(_guard(jobs.publish_due), "interval", minutes=1, max_instances=1, coalesce=True)
    s.add_job(_guard(jobs.watch), "interval", minutes=15, max_instances=1, coalesce=True, next_run_time=dt.datetime.now(TZ))
    s.add_job(_guard(jobs.leads), "interval", minutes=30, max_instances=1, coalesce=True)
    s.add_job(_guard(jobs.own_replies), "interval", minutes=20, max_instances=1, coalesce=True)
    s.add_job(_guard(jobs.daily_stats), "cron", hour=23, minute=30)
    s.add_job(_guard(jobs.weekly_plan), "cron", day_of_week="sun", hour=17, minute=0)
    s.add_job(_guard(jobs.refresh_tokens), "cron", day_of_week="mon", hour=4, minute=0)
    s.start()
    log.info("autopilot started")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
