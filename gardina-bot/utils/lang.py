from sqlalchemy import select

from database import async_session, BotUser

_cache: dict[int, str] = {}


async def get_user_lang(telegram_id: int) -> str:
    """Return language code for user. Uses in-memory cache."""
    if telegram_id in _cache:
        return _cache[telegram_id]

    async with async_session() as session:
        result = await session.execute(
            select(BotUser.language).where(BotUser.telegram_id == telegram_id)
        )
        lang = result.scalar_one_or_none() or "ru"

    _cache[telegram_id] = lang
    return lang


def set_user_lang_cache(telegram_id: int, lang: str) -> None:
    """Update the in-memory cache after a language change."""
    _cache[telegram_id] = lang
