from aiogram.fsm.state import State, StatesGroup


class PaymentForm(StatesGroup):
    choosing_tariff = State()
    entering_name = State()
    entering_phone = State()
    entering_city = State()
    uploading_receipt = State()
