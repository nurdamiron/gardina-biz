from aiogram import Router

from . import start, course_info, tariffs, faq, payment, admin


def setup_routers() -> Router:
    router = Router()
    router.include_router(admin.router)  # admin first so filters match first
    router.include_router(start.router)
    router.include_router(course_info.router)
    router.include_router(tariffs.router)
    router.include_router(faq.router)
    router.include_router(payment.router)
    return router
