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

const DISMISSED_KEY = 'push_prompt_dismissed_at';
const ENABLED_KEY = 'push_subscribed';

/**
 * One-time push notification permission prompt.
 * - Shows once, 4 seconds after login
 * - Respects "dismissed" state (7 days cooldown)
 * - iOS Safari: shows install guide instead
 * - Can be re-triggered from NotificationSettings
 */
const PushPermissionPrompt = ({ onComplete }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const iosDevice = isIOS();
  const standalone = isStandalone();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Already subscribed
      if (localStorage.getItem(ENABLED_KEY)) return;

      // Dismissed recently (7 days)
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return;

      // Not supported at all (and not iOS)
      if (!iosDevice && !isPushSupported()) return;

      // Already granted or denied (non-iOS)
      if (!iosDevice && getPermissionStatus() !== 'default') return;

      setVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
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

  // iOS Safari browser — show PWA install guide
  if (iosDevice && !standalone) {
    return (
      <Backdrop onClose={dismiss}>
        <div className="bg-gradient-to-r from-primary to-primary/80 -mx-6 -mt-6 px-6 py-5 rounded-t-2xl text-white text-center mb-5">
          <Icon name="install_mobile" size={32} className="mx-auto mb-2" />
          <h2 className="text-lg font-bold">Қолданбаны орнатыңыз</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4 text-center">
          iPhone-да хабарламалар алу үшін қолданбаны үй экранына қосыңыз
        </p>
        <div className="space-y-3 mb-5">
          <Step n="1">Safari → <b>«Бөлісу»</b> <Icon name="ios_share" size={16} className="inline text-primary" /></Step>
          <Step n="2"><b>«Үй экранына қосу»</b> тандаңыз</Step>
          <Step n="3">Қолданбаны іске қосыңыз → хабарламаларды қосыңыз</Step>
        </div>
        <button onClick={dismiss} className="w-full py-3 text-gray-400 text-sm hover:text-gray-600">Кейінірек</button>
      </Backdrop>
    );
  }

  // Standard permission request
  return (
    <Backdrop onClose={dismiss}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 -mx-6 -mt-6 px-6 py-6 rounded-t-2xl text-white text-center mb-5">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <Icon name="notifications_active" size={30} />
        </div>
        <h2 className="text-xl font-bold">Хабарламаларды қосу</h2>
        <p className="text-white/80 text-sm mt-1">Маңызды оқиғаларды жіберіп алмаңыз</p>
      </div>

      {/* Benefits */}
      <div className="space-y-2.5 mb-5">
        {[
          { icon: 'assignment', text: 'Жаңа тапсырма тағайындалғанда' },
          { icon: 'payments', text: 'Төлем түскенде' },
          { icon: 'sync', text: 'Тапсырыс статусы өзгергенде' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-sm text-gray-700">
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

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading
            ? <><div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Қосылуда...</>
            : <><Icon name="notifications" />Хабарламаларды қосу</>}
        </button>
        <button onClick={goToSettings} className="w-full py-2.5 text-primary text-sm font-medium hover:underline">
          Баптауларда өзгерту
        </button>
        <button onClick={dismiss} className="w-full py-2 text-gray-400 text-sm hover:text-gray-600">
          Кейінірек
        </button>
      </div>
    </Backdrop>
  );
};

const Backdrop = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden px-6 pt-6 pb-5" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const Step = ({ n, children }) => (
  <div className="flex items-start gap-3">
    <div className="size-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
      <span className="text-white text-xs font-bold">{n}</span>
    </div>
    <p className="text-sm text-gray-700">{children}</p>
  </div>
);

export default PushPermissionPrompt;
