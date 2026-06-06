import React from 'react';
import { useI18n } from '../../contexts/I18nContext';

const LanguageSwitcher = ({ compact = false, className = '' }) => {
  const { lang, setLang } = useI18n();

  return (
    <div className={`inline-flex items-center gap-1 rounded-xl bg-muted border border-border p-1 ${className}`}>
      <button
        type="button"
        onClick={() => setLang('kz')}
        className={`rounded-lg font-bold transition-all ${compact ? 'px-3 py-2 text-xs' : 'px-3 py-2 text-sm'} ${
          lang === 'kz' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        KZ
      </button>
      <button
        type="button"
        onClick={() => setLang('ru')}
        className={`rounded-lg font-bold transition-all ${compact ? 'px-3 py-2 text-xs' : 'px-3 py-2 text-sm'} ${
          lang === 'ru' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        RU
      </button>
    </div>
  );
};

export default LanguageSwitcher;
