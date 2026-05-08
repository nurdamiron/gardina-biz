from __future__ import annotations

import datetime

from aiogram import Bot

from config import config


async def create_one_time_invite(bot: Bot) -> str:
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=48)
    expire_unix = int(expire.timestamp())
    link = await bot.create_chat_invite_link(
        chat_id=config.private_channel_id,
        member_limit=1,
        expire_date=expire_unix,
    )
    return link.invite_link
