from __future__ import annotations

import re

from aiogram import Bot, Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from config import config
from database import async_session, BotUser, BotPayment
from keyboards import main_menu_kb, enroll_tariff_kb
from keyboards.admin import admin_review_kb
from states import PaymentForm
from texts import t
from utils import get_user_lang
from sqlalchemy import select

router = Router()

TARIFF_LABELS = {
    "online": "\U0001f4bb Онлайн",
    "offline_kit": "\U0001f3e0 Оффлайн + комплект",
}


# ── Start enrollment ──────────────────────────────────────────────────
@router.callback_query(F.data == "menu:enroll")
async def start_enroll(callback: CallbackQuery, state: FSMContext) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await state.update_data(lang=lang)
    await state.set_state(PaymentForm.choosing_tariff)
    await callback.message.edit_text(
        t("enroll_start", lang),
        reply_markup=enroll_tariff_kb(lang),
    )
    await callback.answer()


@router.callback_query(F.data == "enroll:cancel")
async def cancel_enroll(callback: CallbackQuery, state: FSMContext) -> None:
    lang = await get_user_lang(callback.from_user.id)
    await state.clear()
    await callback.message.edit_text(
        t("enroll_cancel", lang),
        reply_markup=main_menu_kb(lang),
    )
    await callback.answer()


# ── Tariff selection (also from tariff detail page) ───────────────────
@router.callback_query(F.data.startswith("enroll:"), ~F.data.in_({"enroll:cancel"}))
async def choose_tariff(callback: CallbackQuery, state: FSMContext) -> None:
    lang = await get_user_lang(callback.from_user.id)
    tariff = callback.data.split(":")[1]
    if tariff not in TARIFF_LABELS:
        await callback.answer(t("unknown_tariff", lang), show_alert=True)
        return

    tariff_label = t("tariff_online" if tariff == "online" else "tariff_offline", lang)
    await state.update_data(tariff=tariff, lang=lang)
    await state.set_state(PaymentForm.entering_name)
    await callback.message.edit_text(
        t("chosen_tariff", lang).format(tariff=tariff_label)
    )
    await callback.answer()


# ── Name ──────────────────────────────────────────────────────────────
@router.message(PaymentForm.entering_name)
async def enter_name(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    lang = data.get("lang", "ru")
    name = message.text.strip() if message.text else ""
    if len(name) < 3:
        await message.answer(t("enter_name_error", lang))
        return
    await state.update_data(full_name=name)
    await state.set_state(PaymentForm.entering_phone)
    await message.answer(t("enter_phone", lang))


# ── Phone ─────────────────────────────────────────────────────────────
@router.message(PaymentForm.entering_phone)
async def enter_phone(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    lang = data.get("lang", "ru")
    phone = message.text.strip() if message.text else ""
    digits = re.sub(r"\D", "", phone)
    if len(digits) < 10:
        await message.answer(t("enter_phone_error", lang))
        return
    await state.update_data(phone=phone)
    await state.set_state(PaymentForm.entering_city)
    await message.answer(t("enter_city", lang))


# ── City ──────────────────────────────────────────────────────────────
@router.message(PaymentForm.entering_city)
async def enter_city(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    lang = data.get("lang", "ru")
    city = message.text.strip() if message.text else ""
    if len(city) < 2:
        await message.answer(t("enter_city_error", lang))
        return
    await state.update_data(city=city)
    await state.set_state(PaymentForm.uploading_receipt)
    await message.answer(t("payment_info", lang))


# ── Receipt photo ─────────────────────────────────────────────────────
@router.message(PaymentForm.uploading_receipt, F.photo)
async def upload_receipt(message: Message, state: FSMContext, bot: Bot) -> None:
    photo = message.photo[-1]  # highest resolution
    data = await state.get_data()
    lang = data.get("lang", "ru")
    await state.clear()

    # Save to DB
    async with async_session() as session:
        user = (
            await session.execute(
                select(BotUser).where(BotUser.telegram_id == message.from_user.id)
            )
        ).scalar_one()

        # Update user profile with latest info
        user.full_name = data["full_name"]
        user.phone = data["phone"]
        user.city = data["city"]

        payment = BotPayment(
            user_id=user.id,
            tariff=data["tariff"],
            full_name=data["full_name"],
            phone=data["phone"],
            city=data["city"],
            receipt_photo_id=photo.file_id,
            status="pending",
        )
        session.add(payment)
        await session.commit()
        await session.refresh(payment)
        payment_id = payment.id

    await message.answer(t("receipt_accepted", lang))

    # Notify admins (always in Russian)
    admin_text = (
        "\U0001f4e5 <b>Новая заявка на курс!</b>\n\n"
        f"<b>Заявка #{payment_id}</b>\n"
        f"Тариф: {TARIFF_LABELS.get(data['tariff'], data['tariff'])}\n"
        f"ФИО: {data['full_name']}\n"
        f"Телефон: {data['phone']}\n"
        f"Город: {data['city']}\n"
        f"Telegram: @{message.from_user.username or 'N/A'} "
        f"(ID: {message.from_user.id})"
    )

    for admin_id in config.admin_ids:
        try:
            await bot.send_photo(
                chat_id=admin_id,
                photo=photo.file_id,
                caption=admin_text,
                reply_markup=admin_review_kb(payment_id),
            )
        except Exception:
            pass  # admin may have blocked the bot


@router.message(PaymentForm.uploading_receipt)
async def receipt_not_photo(message: Message, state: FSMContext) -> None:
    data = await state.get_data()
    lang = data.get("lang", "ru")
    await message.answer(t("receipt_not_photo", lang))
