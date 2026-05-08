from __future__ import annotations

import datetime

from sqlalchemy import BigInteger, ForeignKey, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class BotUser(Base):
    __tablename__ = "bot_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    username: Mapped[str | None] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    city: Mapped[str | None] = mapped_column(String(255))
    source: Mapped[str | None] = mapped_column(String(255))
    language: Mapped[str] = mapped_column(String(2), default="ru")
    created_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.now(),
    )

    payments: Mapped[list[BotPayment]] = relationship(back_populates="user")


class BotPayment(Base):
    __tablename__ = "bot_payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("bot_users.id"))
    tariff: Mapped[str] = mapped_column(String(50))
    full_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50))
    city: Mapped[str] = mapped_column(String(255))
    receipt_photo_id: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    admin_message_id: Mapped[int | None] = mapped_column(BigInteger)
    created_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.now(),
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),
    )

    user: Mapped[BotUser] = relationship(back_populates="payments")
