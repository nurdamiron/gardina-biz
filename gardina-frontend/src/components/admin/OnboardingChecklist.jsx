import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Icon from '../common/Icon';
import { useI18n } from '../../contexts/I18nContext';

/**
 * Sticky onboarding banner. Computes progress server-side from DB state
 * (no extra flag table) and disappears once everything is done — i.e.
 * the user dismissed all the rough edges of first-run.
 *
 * The "X" close button just hides the banner client-side via localStorage
 * so a reload still shows it if there's progress to track. After 100%
 * completion the component returns null permanently.
 */

const DISMISS_KEY = 'gardina_onboarding_dismissed';

const OnboardingChecklist = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') {
      setHidden(true);
      return;
    }
    api
      .get('/onboarding/checklist')
      .then((r) => setData(r.data?.data))
      .catch(() => { /* fail silent — checklist is non-critical */ });
  }, []);

  if (hidden || !data) return null;
  if (data.progress === 100) return null;

  const labelOf = (item) => (lang === 'kz' ? item.label_kz : item.label_ru);

  return (
    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/15 rounded-2xl p-4 sm:p-5 mb-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
            {t('onboardingChecklist.heading')}
          </p>
          <p className="text-sm text-text-secondary">
            {t('onboardingChecklist.progress', { done: data.completed, total: data.total })}
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1');
            setHidden(true);
          }}
          className="text-text-secondary hover:text-text-main p-1 -mt-1 -mr-1"
          aria-label={t('common.close')}
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-card rounded-full overflow-hidden border border-primary/10 mb-4">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${data.progress}%` }}
        />
      </div>

      <ul className="space-y-2">
        {data.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span
              className={`size-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.done ? 'bg-primary text-white' : 'bg-card border border-border-light text-text-secondary'
              }`}
            >
              {item.done ? <Icon name="check" size={14} /> : <span className="size-1.5 rounded-full bg-text-secondary" />}
            </span>
            <span
              className={`flex-1 text-sm ${item.done ? 'line-through text-text-secondary' : 'text-text-main font-medium'}`}
            >
              {labelOf(item)}
            </span>
            {!item.done && item.link && (
              <button
                onClick={() => navigate(item.link)}
                className="text-xs font-bold text-primary hover:underline"
              >
                {t('onboardingChecklist.go')} →
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default OnboardingChecklist;
