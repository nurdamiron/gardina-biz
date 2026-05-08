from __future__ import annotations

from aiogram import Bot, Router, F
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message
from sqlalchemy import select, func

from config import config
from database import async_session, BotUser, BotPayment
from texts import t
from utils import create_one_time_invite, get_user_lang

router = Router()

TARIFF_LABELS = {
    "online": "\U0001f4bb Онлайн",
    "offline_kit": "\U0001f3e0 Оффлайн + комплект",
}


def _is_admin(user_id: int) -> bool:
    return user_id in config.admin_ids


# ── Approve / Reject ──────────────────────────────────────────────────
@router.callback_query(F.data.startswith("admin:"))
async def admin_action(callback: CallbackQuery, bot: Bot) -> None:
    if not _is_admin(callback.from_user.id):
        await callback.answer("У вас нет прав", show_alert=True)
        return

    parts = callback.data.split(":")
    action = parts[1]  # approve or reject
    payment_id = int(parts[2])

    async with async_session() as session:
        payment = await session.get(BotPayment, payment_id)
        if payment is None:
            await callback.answer("Заявка не найдена", show_alert=True)
            return

        if payment.status != "pending":
            await callback.answer(
                f"Заявка уже обработана (статус: {payment.status})", show_alert=True
            )
            return

        user = await session.get(BotUser, payment.user_id)
        telegram_id = user.telegram_id
        user_lang = user.language or "ru"

        if action == "approve":
            payment.status = "approved"
            await session.commit()

            # Generate invite link
            invite_link = await create_one_time_invite(bot)

            # Notify user in their language
            try:
                await bot.send_message(
                    chat_id=telegram_id,
                    text=t("approved", user_lang).format(link=invite_link),
                )
            except Exception:
                pass

            await callback.message.edit_caption(
                caption=(
                    callback.message.caption
                    + f"\n\n\u2705 <b>ОДОБРЕНО</b> админом @{callback.from_user.username or callback.from_user.id}"
                ),
            )
            await callback.answer("\u2705 Заявка одобрена, ссылка отправлена")

        elif action == "reject":
            payment.status = "rejected"
            await session.commit()

            # Notify user in their language
            try:
                await bot.send_message(
                    chat_id=telegram_id,
                    text=t("rejected", user_lang),
                )
            except Exception:
                pass

            await callback.message.edit_caption(
                caption=(
                    callback.message.caption
                    + f"\n\n\u274c <b>ОТКЛОНЕНО</b> админом @{callback.from_user.username or callback.from_user.id}"
                ),
            )
            await callback.answer("\u274c Заявка отклонена, пользователь уведомлён")


# ── /stats command ────────────────────────────────────────────────────
@router.message(Command("stats"))
async def cmd_stats(message: Message) -> None:
    if not _is_admin(message.from_user.id):
        return

    async with async_session() as session:
        total_users = (
            await session.execute(select(func.count(BotUser.id)))
        ).scalar_one()

        total_payments = (
            await session.execute(select(func.count(BotPayment.id)))
        ).scalar_one()

        pending = (
            await session.execute(
                select(func.count(BotPayment.id)).where(
                    BotPayment.status == "pending"
                )
            )
        ).scalar_one()

        approved = (
            await session.execute(
                select(func.count(BotPayment.id)).where(
                    BotPayment.status == "approved"
                )
            )
        ).scalar_one()

        rejected = (
            await session.execute(
                select(func.count(BotPayment.id)).where(
                    BotPayment.status == "rejected"
                )
            )
        ).scalar_one()

        # Top UTM sources
        utm_query = (
            select(BotUser.source, func.count(BotUser.id))
            .where(BotUser.source.isnot(None))
            .group_by(BotUser.source)
            .order_by(func.count(BotUser.id).desc())
            .limit(10)
        )
        utm_rows = (await session.execute(utm_query)).all()

    utm_text = ""
    if utm_rows:
        utm_lines = [f"  \u2022 {src}: {cnt}" for src, cnt in utm_rows]
        utm_text = "\n\n\U0001f4ca <b>Источники (UTM):</b>\n" + "\n".join(utm_lines)

    text = (
        "\U0001f4ca <b>Статистика бота</b>\n\n"
        f"\U0001f465 Пользователей: {total_users}\n"
        f"\U0001f4e5 Заявок всего: {total_payments}\n"
        f"\u23f3 Ожидают: {pending}\n"
        f"\u2705 Одобрено: {approved}\n"
        f"\u274c Отклонено: {rejected}"
        f"{utm_text}"
    )
    await message.answer(text)
