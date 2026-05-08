from aiogram import Router, F
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup

from keyboards import tariffs_kb
from texts import t
from utils import get_user_lang

router = Router()


def tariff_detail_kb(tariff_key: str, lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=t("btn_enroll_tariff", lang),
                    callback_data=f"enroll:{tariff_key}",
                )
            ],
            [InlineKeyboardButton(text=t("btn_back_tariffs", lang), callback_data="menu:tariffs")],
            [InlineKeyboardButton(text=t("btn_main_menu", lang), callback_data="menu:back")],
        ]
    )


@router.callback_query(F.data == "menu:tariffs")
async def show_tariffs(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("tariffs_menu", lang), reply_markup=tariffs_kb(lang)
    )
    await callback.answer()


@router.callback_query(F.data == "tariff_info:online")
async def show_online_tariff(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("online_tariff", lang), reply_markup=tariff_detail_kb("online", lang)
    )
    await callback.answer()


@router.callback_query(F.data == "tariff_info:offline_kit")
async def show_offline_tariff(callback: CallbackQuery) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await callback.message.edit_text(
        t("offline_tariff", lang), reply_markup=tariff_detail_kb("offline_kit", lang)
    )
    await callback.answer()
