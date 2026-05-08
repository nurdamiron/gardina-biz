from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from texts import t


def tariffs_kb(lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=t("btn_online", lang),
                    callback_data="tariff_info:online",
                )
            ],
            [
                InlineKeyboardButton(
                    text=t("btn_offline", lang),
                    callback_data="tariff_info:offline_kit",
                )
            ],
            [InlineKeyboardButton(text=t("btn_back_menu", lang), callback_data="menu:back")],
        ]
    )


def enroll_tariff_kb(lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=t("btn_online", lang),
                    callback_data="enroll:online",
                )
            ],
            [
                InlineKeyboardButton(
                    text=t("btn_offline", lang),
                    callback_data="enroll:offline_kit",
                )
            ],
            [
                InlineKeyboardButton(
                    text=t("btn_cancel", lang),
                    callback_data="enroll:cancel",
                )
            ],
        ]
    )
