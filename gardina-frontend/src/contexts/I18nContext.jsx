import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { messages, getByPath } from '../i18n';

const I18nContext = createContext(null);
const LANG_KEY = 'gardina_lang';

const SUPPORTED = ['ru', 'kz'];
const DEFAULT_LANG = 'ru';

function readInitialLang() {
  if (typeof localStorage === 'undefined') return DEFAULT_LANG;
  const stored = localStorage.getItem(LANG_KEY);
  if (SUPPORTED.includes(stored)) return stored;
  // First-time visitor: try browser preference, fall back to RU
  if (typeof navigator !== 'undefined' && Array.isArray(navigator.languages)) {
    for (const tag of navigator.languages) {
      const code = String(tag).slice(0, 2).toLowerCase();
      if (code === 'kk' || code === 'kz') return 'kz';
      if (code === 'ru') return 'ru';
    }
  }
  return DEFAULT_LANG;
}

/**
 * Substitutes a `{name}` style placeholder in a translated string.
 * Example: t('foo.bar', { name: 'World' }) → "Hello World"
 */
function interpolate(template, vars) {
  if (!template || typeof template !== 'string' || !vars) return template;
  return template.replace(/\{(\w+)\}/g, (_m, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export const I18nProvider = ({ children }) => {
  const [lang, setLangState] = useState(readInitialLang);

  const setLang = (next) => {
    const normalized = SUPPORTED.includes(next) ? next : DEFAULT_LANG;
    setLangState(normalized);
    try { localStorage.setItem(LANG_KEY, normalized); } catch { /* private mode */ }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = normalized === 'kz' ? 'kk' : 'ru';
    }
  };

  /**
   * t('namespace.key', vars?, fallback?)
   * t('namespace.key')
   */
  const t = (key, varsOrFallback, fallbackArg) => {
    const vars = varsOrFallback && typeof varsOrFallback === 'object' ? varsOrFallback : null;
    const fallback = vars ? fallbackArg : varsOrFallback;
    const val = getByPath(messages[lang], key);
    if (val !== undefined) return interpolate(val, vars);
    // Key missing in the current language: the inline fallback is written in Kazakh across the
    // codebase, so for KZ it is the right text. Falling through to RU first showed ~300 strings
    // in Russian to Kazakh-language users.
    if (lang === 'kz' && fallback !== undefined) return interpolate(fallback, vars);
    // Fallback to RU then KZ then key
    const ruVal = getByPath(messages.ru, key);
    if (ruVal !== undefined) return interpolate(ruVal, vars);
    const kzVal = getByPath(messages.kz, key);
    if (kzVal !== undefined) return interpolate(kzVal, vars);
    return fallback !== undefined ? fallback : key;
  };

  // Keep <html lang> in sync so screen readers / CSS :lang work properly
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'kz' ? 'kk' : 'ru';
    }
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
};
