from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def admin_review_kb(payment_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="\u2705 Одобрить",
                    callback_data=f"admin:approve:{payment_id}",
                ),
                InlineKeyboardButton(
                    text="\u274c Отклонить",
                    callback_data=f"admin:reject:{payment_id}",
                ),
            ]
        ]
    )
