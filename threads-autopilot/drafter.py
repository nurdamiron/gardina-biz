"""Drafts written by Claude. Every draft goes to Telegram for approval; nothing here publishes."""
from __future__ import annotations

import json
import logging

import anthropic

from settings import ACCOUNTS, ANTHROPIC_API_KEY, CLAUDE_MODEL

log = logging.getLogger(__name__)

_client: anthropic.AsyncAnthropic | None = None


def client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    return _client


# Frozen text first so the prefix caches across calls.
RULES = """Ты помогаешь вести Threads-аккаунты небольшого бизнеса в Казахстане. Пишешь черновики, человек их проверяет.

Что показал анализ ~2000 постов и 595 комментариев казахстанского Threads (сентябрь 2026):
- Комментарии с личным опытом или одним конкретным советом собирают в среднем ~59 лайков. Самореклама в комментарии (контакты, "пишите в лс", ссылки) ~0.8 лайка. Короткие реакции ("согласна") ~0.8.
- Остроумное короткое мнение под трендовым постом тоже работает.
- Комментарий, оставленный позже 12 часов после поста, почти никто не видит.
- Казахская аудитория: списки, юмор про повседневность, практичные подборки ("сақтап қой"). Эмодзи нормально.
- Русскоязычная аудитория Казахстана: мнение, ирония, конкретика с цифрами. В IT-нише хорошо работают вопросы к аудитории. В B2B вопрос в первой строке работает плохо, лучше история или наблюдение.

Правила текста:
- Пиши на языке исходного поста (казахский или русский), как живой человек в чате. Смешение казахского и русского слов нормально, если так написан пост.
- Без длинного тире (—). Без штампов: "в современном мире", "не просто X, а Y", "погрузимся", "ключевой", "уникальный", "раскрыть потенциал".
- Без ссылок, контактов, @упоминаний, хэштегов и призывов написать в директ. Продаёт профиль, не комментарий.
- Не выдумывай личный опыт, цифры и кейсы. Опирайся только на факты из описания аккаунта; если фактов не хватает, давай полезный совет без "я делал".
- Пропускай (skip) посты про трагедии, смерть, политику, религию, личные драмы, конфликты, а также посты, где аккаунту нечего добавить по существу. Лучше пропустить, чем написать пустое.
"""

COMMENT_SCHEMA = {
    "type": "object",
    "properties": {
        "skip": {"type": "boolean"},
        "reason": {"type": "string"},
        "comment": {"type": "string"},
    },
    "required": ["skip", "reason", "comment"],
    "additionalProperties": False,
}

POSTS_SCHEMA = {
    "type": "object",
    "properties": {
        "posts": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "slot": {"type": "string"},
                    "lang": {"type": "string", "enum": ["kz", "ru"]},
                    "text": {"type": "string"},
                    "reply_text": {"type": "string"},
                    "idea": {"type": "string"},
                },
                "required": ["slot", "lang", "text", "reply_text", "idea"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["posts"],
    "additionalProperties": False,
}


def _account_block(account: str) -> str:
    a = ACCOUNTS[account]
    facts = "\n".join(f"- {f}" for f in a["facts"])
    return (f"Аккаунт @{a['handle']}\nО бизнесе: {a['about']}\nПроверенные факты:\n{facts}\n"
            f"Голос: {a['voice']}\nНельзя: {a['avoid']}")


async def _ask(system_extra: str, user: str, schema: dict, effort: str, max_tokens: int = 4000) -> dict | None:
    resp = await client().beta.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=max_tokens,
        betas=["server-side-fallback-2026-07-01"],
        extra_body={"fallbacks": "default"},
        cache_control={"type": "ephemeral"},
        system=[{"type": "text", "text": RULES}, {"type": "text", "text": system_extra}],
        output_config={"effort": effort, "format": {"type": "json_schema", "schema": schema}},
        messages=[{"role": "user", "content": user}],
    )
    if resp.stop_reason == "refusal":
        log.warning("refusal: %s", resp.stop_details)
        return None
    text = next((b.text for b in resp.content if b.type == "text"), "")
    return json.loads(text) if text else None


async def comment(account: str, kind: str, post: dict) -> dict | None:
    """kind: watch (under a popular account), lead (someone asks for a service), own_reply (reply under our post)."""
    task = {
        "watch": "Напиши один комментарий под этим постом от имени аккаунта. Цель: добавить ценность, чтобы люди заметили аккаунт и зашли в профиль. До 250 символов.",
        "lead": "Человек ищет исполнителя или совет. Если аккаунт реально может помочь, напиши короткий ответ: один конкретный совет или уточняющий вопрос по задаче и одно предложение о том, чем аккаунт занимается. Без контактов и ссылок. До 280 символов. Если пост не про услуги аккаунта, skip.",
        "own_reply": "Это комментарий под постом нашего аккаунта. Ответь по-человечески, поддержи разговор, ответь на вопрос если он есть. До 250 символов. Если комментарий спам или грубость, skip.",
    }[kind]
    user = (f"{task}\n\nАвтор: @{post.get('author')}\nТекст:\n{post.get('text', '')[:2500]}"
            + (f"\n\nНаш исходный пост:\n{post['parent_text'][:1500]}" if post.get("parent_text") else ""))
    try:
        return await _ask(_account_block(account), user, COMMENT_SCHEMA, effort="medium", max_tokens=3000)
    except anthropic.APIError as e:
        log.error("claude comment failed: %s", e)
        return None


async def weekly_posts(account: str, slots: list[str], trends: str, stats: str) -> list[dict]:
    user = (
        "Составь посты на следующую неделю, по одному на каждый слот. У каждого поста короткий основной текст "
        "(хук, обычно до 120 символов) и reply_text: продолжение, которое мы опубликуем ответом под своим постом "
        "(до 450 символов; пустая строка, если продолжение не нужно). Темы бери из трендов ниже, если они подходят "
        "аккаунту, и чередуй форматы: полезный список, наблюдение или история, мнение, юмор. Не повторяй темы и "
        "конструкции из прошлых постов. В поле idea коротко объясни, почему выбрана тема.\n\n"
        f"Слоты (день, время, язык):\n" + "\n".join(slots)
        + f"\n\nЧто сейчас набирает в нише (свежие популярные посты):\n{trends[:12000]}"
        + f"\n\nНаши прошлые посты и их статистика:\n{stats[:6000]}"
    )
    try:
        r = await _ask(_account_block(account), user, POSTS_SCHEMA, effort="high", max_tokens=16000)
    except anthropic.APIError as e:
        log.error("claude weekly failed: %s", e)
        return []
    return (r or {}).get("posts", [])
