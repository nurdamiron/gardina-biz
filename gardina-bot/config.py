from __future__ import annotations

import os
from dataclasses import dataclass, field


@dataclass(frozen=True)
class Config:
    bot_token: str = field(default_factory=lambda: os.environ["BOT_TOKEN"])
    admin_ids: list[int] = field(
        default_factory=lambda: [
            int(x.strip()) for x in os.environ["ADMIN_IDS"].split(",") if x.strip()
        ]
    )
    private_channel_id: int = field(
        default_factory=lambda: int(os.environ["PRIVATE_CHANNEL_ID"])
    )
    database_url: str = field(default_factory=lambda: os.environ["DATABASE_URL"])

    # Payment card details
    payment_card_number: str = field(
        default_factory=lambda: os.environ.get("PAYMENT_CARD_NUMBER", "")
    )
    payment_card_holder: str = field(
        default_factory=lambda: os.environ.get("PAYMENT_CARD_HOLDER", "")
    )
    payment_bank_name: str = field(
        default_factory=lambda: os.environ.get("PAYMENT_BANK_NAME", "Kaspi Bank")
    )

    # Contact info
    contact_phone: str = field(
        default_factory=lambda: os.environ.get("CONTACT_PHONE", "")
    )
    contact_instagram: str = field(
        default_factory=lambda: os.environ.get("CONTACT_INSTAGRAM", "")
    )
    contact_whatsapp: str = field(
        default_factory=lambda: os.environ.get("CONTACT_WHATSAPP", "")
    )


config = Config()
