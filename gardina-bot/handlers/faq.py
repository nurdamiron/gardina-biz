from aiogram import Router, F
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup

from texts import t
from utils import get_user_lang

router = Router()


def faq_list_kb(lang: str = "ru") -> InlineKeyboardMarkup:
    faq_items = t("faq_items", lang)
    buttons = [
        [InlineKeyboardButton(text=f"{i+1}. {q}", callback_data=f"faq:{i}")]
        for i, (q, _) in enumerate(faq_items)
    ]
    buttons.append(
        [InlineKeyboardButton(text=t("btn_back_menu", lang), callback_data="menu:back")]
    )
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def faq_answer_kb(lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("btn_back_faq", lang), callback_data="menu:faq")],
            [InlineKeyboardButton(text=t("btn_main_menu", lang), callback_data="menu:back")],
        ]
    )


@router.callback_query(F.data == "menu:faq")
async def show_faq(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("faq_menu", lang), reply_markup=faq_list_kb(lang)
    )
    await callback.answer()


@router.callback_query(F.data.startswith("faq:"))
async def show_faq_answer(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    faq_items = t("faq_items", lang)
    idx = int(callback.data.split(":")[1])
    if 0 <= idx < len(faq_items):
        question, answer = faq_items[idx]
        text = f"<b>{question}</b>\n\n{answer}"
        await callback.message.edit_text(text, reply_markup=faq_answer_kb(lang))
    await callback.answer()
