from aiogram import Router, F
from aiogram.filters import CommandStart
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup
from sqlalchemy import select

from database import async_session, BotUser
from keyboards import main_menu_kb, back_button_kb
from texts import t
from utils import get_user_lang, set_user_lang_cache

router = Router()


def _lang_select_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="\U0001f1f0\U0001f1ff Қазақша", callback_data="lang:kz")],
            [InlineKeyboardButton(text="\U0001f1f7\U0001f1fa Русский", callback_data="lang:ru")],
        ]
    )


async def _upsert_user(
    telegram_id: int,
    username: str | None,
    full_name: str | None,
    source: str | None,
) -> str | None:
    """Upsert user and return language if already set (returning user), else None."""
    async with async_session() as session:
        result = await session.execute(
            select(BotUser).where(BotUser.telegram_id == telegram_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            user = BotUser(
                telegram_id=telegram_id,
                username=username,
                full_name=full_name,
                source=source,
                language="",  # empty = not chosen yet
            )
            session.add(user)
            await session.commit()
            return None
        else:
            user.username = username
            user.full_name = full_name
            if source and not user.source:
                user.source = source
            await session.commit()
            return user.language or None


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    args = message.text.split(maxsplit=1)
    source = args[1] if len(args) > 1 else None

    lang = await _upsert_user(
        telegram_id=message.from_user.id,
        username=message.from_user.username,
        full_name=message.from_user.full_name,
        source=source,
    )

    if lang:
        # Returning user — show welcome in their language
        set_user_lang_cache(message.from_user.id, lang)
        await message.answer(t("welcome", lang), reply_markup=main_menu_kb(lang))
    else:
        # New user — ask to choose language
        await message.answer(t("choose_lang"), reply_markup=_lang_select_kb())


@router.callback_query(F.data.startswith("lang:"))
async def select_language(callback: CallbackQuery) -> None:
    lang = callback.data.split(":")[1]
    if lang not in ("kz", "ru"):
        await callback.answer()
        return

    async with async_session() as session:
        result = await session.execute(
            select(BotUser).where(BotUser.telegram_id == callback.from_user.id)
        )
        user = result.scalar_one_or_none()
        if user:
            user.language = lang
            await session.commit()

    set_user_lang_cache(callback.from_user.id, lang)
    await callback.message.edit_text(
        t("welcome", lang), reply_markup=main_menu_kb(lang)
    )
    await callback.answer()


@router.callback_query(F.data == "menu:lang")
async def change_language(callback: CallbackQuery) -> None:
    await callback.message.edit_text(
        t("choose_lang"), reply_markup=_lang_select_kb()
    )
    await callback.answer()


@router.callback_query(F.data == "menu:back")
async def back_to_menu(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("welcome", lang), reply_markup=main_menu_kb(lang)
    )
    await callback.answer()


@router.callback_query(F.data == "menu:contacts")
async def show_contacts(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("contacts", lang), reply_markup=back_button_kb(lang)
    )
    await callback.answer()
