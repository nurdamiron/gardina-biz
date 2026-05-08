from texts.ru import texts as _ru
from texts.kz import texts as _kz

_langs = {
    "ru": _ru,
    "kz": _kz,
}


def t(key: str, lang: str = "ru") -> str | list:
    """Return translated text by key. Falls back to Russian."""
    return _langs.get(lang, _ru).get(key, _ru.get(key, key))
