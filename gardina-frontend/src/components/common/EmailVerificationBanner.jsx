import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Icon from './Icon';
import { useI18n } from '../../contexts/I18nContext';

const DISMISS_KEY = 'gardina_email_verify_dismissed';

/**
 * Sticky top banner shown to users who haven't verified their email.
 * Dismissed per-session via sessionStorage (re-shows next login as reminder).
 */
const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === '1');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const t = {
    ru: {
      msg: 'Подтвердите email, чтобы получать уведомления.',
      resend: 'Отправить письмо',
      sent: 'Письмо отправлено!',
      sending: 'Отправляем…',
    },
    kz: {
      msg: 'Хабарламалар алу үшін email-ді растаңыз.',
      resend: 'Хат жіберу',
      sent: 'Хат жіберілді!',
      sending: 'Жіберілуде…',
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  // Only show for users with an email that isn't verified
  if (!user?.email || user?.emailVerified || user?.email_verified) return null;
  if (dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3 text-sm">
      <Icon name="mark_email_unread" size={18} className="text-amber-600 flex-shrink-0" />
      <p className="flex-1 text-amber-800 text-xs">{t.msg}</p>
      {sent ? (
        <span className="text-xs font-bold text-green-600 flex items-center gap-1">
          <Icon name="check" size={14} />{t.sent}
        </span>
      ) : (
        <button
          onClick={handleResend}
          disabled={sending}
          className="text-xs font-bold text-amber-700 underline underline-offset-2 disabled:opacity-60 flex-shrink-0"
        >
          {sending ? t.sending : t.resend}
        </button>
      )}
      <button onClick={handleDismiss} className="text-amber-500 hover:text-amber-700 p-1 flex-shrink-0">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
};

export default EmailVerificationBanner;
