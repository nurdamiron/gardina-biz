from aiogram import Router, F
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup

from texts import t
from utils import get_user_lang

router = Router()


def course_submenu_kb(lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("btn_program", lang), callback_data="course:program")],
            [InlineKeyboardButton(text=t("btn_audience", lang), callback_data="course:audience")],
            [InlineKeyboardButton(text=t("btn_results", lang), callback_data="course:results")],
            [InlineKeyboardButton(text=t("btn_back_menu", lang), callback_data="menu:back")],
        ]
    )


def course_back_kb(lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("btn_back_course", lang), callback_data="menu:course")],
            [InlineKeyboardButton(text=t("btn_main_menu", lang), callback_data="menu:back")],
        ]
    )


@router.callback_query(F.data == "menu:course")
async def show_course_menu(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("course_menu", lang), reply_markup=course_submenu_kb(lang)
    )
    await callback.answer()


@router.callback_query(F.data == "course:program")
async def show_program(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("program", lang), reply_markup=course_back_kb(lang)
    )
    await callback.answer()


@router.callback_query(F.data == "course:audience")
async def show_audience(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("audience", lang), reply_markup=course_back_kb(lang)
    )
    await callback.answer()


@router.callback_query(F.data == "course:results")
async def show_results(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("results", lang), reply_markup=course_back_kb(lang)
    )
    await callback.answer()
