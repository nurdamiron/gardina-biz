import React from 'react';
import { useI18n } from '../../contexts/I18nContext';

const LanguageSwitcher = ({ compact = false, className = '' }) => {
  const { lang, setLang } = useI18n();

  return (
    <div className={`inline-flex items-center gap-1 rounded-xl bg-gray-100 border border-gray-200 p-1 ${className}`}>
      <button
        type="button"
        onClick={() => setLang('kz')}
        className={`rounded-lg font-bold transition-all ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${
          lang === 'kz' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        KZ
      </button>
      <button
        type="button"
        onClick={() => setLang('ru')}
        className={`rounded-lg font-bold transition-all ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${
          lang === 'ru' ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        RU
      </button>
    </div>
  );
};

export default LanguageSwitcher;
