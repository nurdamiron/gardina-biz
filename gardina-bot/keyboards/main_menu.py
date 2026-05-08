from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from texts import t


def main_menu_kb(lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("btn_course", lang), callback_data="menu:course")],
            [InlineKeyboardButton(text=t("btn_tariffs", lang), callback_data="menu:tariffs")],
            [InlineKeyboardButton(text=t("btn_faq", lang), callback_data="menu:faq")],
            [InlineKeyboardButton(text=t("btn_contacts", lang), callback_data="menu:contacts")],
            [InlineKeyboardButton(text=t("btn_enroll", lang), callback_data="menu:enroll")],
            [InlineKeyboardButton(text=t("btn_lang", lang), callback_data="menu:lang")],
        ]
    )


def back_button_kb(lang: str = "ru") -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=t("btn_back_menu", lang), callback_data="menu:back")],
        ]
    )
