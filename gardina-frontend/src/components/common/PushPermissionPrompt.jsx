import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToPush,
  isPushSupported,
  getPermissionStatus,
  isIOS,
  isStandalone,
} from '../../services/pushService';
import Icon from './Icon';
import { useI18n } from '../../contexts/I18nContext';

const DISMISSED_KEY = 'push_prompt_dismissed_at';
const ENABLED_KEY = 'push_subscribed';

const PushPermissionPrompt = ({ onComplete }) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const iosDevice = isIOS();
  const standalone = isStandalone();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStorage.getItem(ENABLED_KEY)) return;
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return;
      if (!iosDevice && !isPushSupported()) return;
      if (!iosDevice && getPermissionStatus() !== 'default') return;
      setVisible(true);
    }, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setVisible(false);
    onComplete?.(false);
  };

  const handleEnable = async () => {
    setLoading(true);
    setError(null);
    const result = await subscribeToPush();
    setLoading(false);
    if (result.success) {
      setVisible(false);
      onComplete?.(true);
    } else {
      setError(result.error);
    }
  };

  const goToSettings = () => {
    dismiss();
    navigate('/notifications/settings');
  };

  if (!visible) return null;

  if (iosDevice && !standalone) {
    return (
      <Backdrop onClose={dismiss}>
        <div className="bg-gradient-to-r from-primary to-primary/80 -mx-6 -mt-6 px-6 py-5 rounded-t-2xl text-white text-center mb-5">
          <Icon name="install_mobile" size={32} className="mx-auto mb-2" />
          <h2 className="text-lg font-bold">{t('prompts.pwa.iosTitle')}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 text-center">{t('prompts.pwa.iosBody')}</p>
        <div className="space-y-3 mb-5">
          <Step n="1">
            {t('prompts.pwa.iosStep1')}<b>{t('prompts.pwa.iosStep1Bold')}</b> <Icon name="ios_share" size={16} className="inline text-primary" />
          </Step>
          <Step n="2">
            <b>{t('prompts.pwa.iosStep2Bold')}</b>{t('prompts.pwa.iosStep2')}
          </Step>
          <Step n="3">{t('prompts.pwa.iosStep3')}</Step>
        </div>
        <button onClick={dismiss} className="w-full py-3 text-muted-foreground text-sm hover:text-muted-foreground">{t('prompts.push.later')}</button>
      </Backdrop>
    );
  }

  return (
    <Backdrop onClose={dismiss}>
      <div className="bg-gradient-to-r from-primary to-primary/80 -mx-6 -mt-6 px-6 py-6 rounded-t-2xl text-white text-center mb-5">
        <div className="w-16 h-16 bg-card/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Icon name="notifications_active" size={30} />
        </div>
        <h2 className="text-xl font-bold">{t('prompts.push.title')}</h2>
        <p className="text-white/80 text-sm mt-1">{t('prompts.push.subtitle')}</p>
      </div>

      <div className="space-y-2.5 mb-5">
        {[
          { icon: 'assignment', text: t('prompts.pushBenefits.taskAssigned') },
          { icon: 'payments', text: t('prompts.pushBenefits.paymentReceived') },
          { icon: 'sync', text: t('prompts.pushBenefits.statusChanged') },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-sm text-foreground">
            <div className="size-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Icon name={icon} size={16} className="text-green-600" />
            </div>
            {text}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-2">
        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading
            ? <><div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('prompts.pushSubscribing')}</>
            : <><Icon name="notifications" />{t('prompts.push.enable')}</>}
        </button>
        <button onClick={goToSettings} className="w-full py-2.5 text-primary text-sm font-medium hover:underline">
          {t('prompts.pushOpenSettings')}
        </button>
        <button onClick={dismiss} className="w-full py-2 text-muted-foreground text-sm hover:text-muted-foreground">
          {t('prompts.push.later')}
        </button>
      </div>
    </Backdrop>
  );
};

const Backdrop = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={onClose}>
    <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden px-6 pt-6 pb-5" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const Step = ({ n, children }) => (
  <div className="flex items-start gap-3">
    <div className="size-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-white text-xs font-bold">{n}</span>
    </div>
    <p className="text-sm text-foreground">{children}</p>
  </div>
);

export default PushPermissionPrompt;
