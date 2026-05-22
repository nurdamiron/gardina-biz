import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToPush,
  unsubscribeFromPush,
  getPushStatus,
  sendTestPush,
  isIOS,
  isStandalone,
  isIOSPushReady,
} from '../services/pushService';
import BottomNav from '../components/navigation/BottomNav';
import Icon from '../components/common/Icon';
import { useI18n } from '../contexts/I18nContext';

/**
 * Notification Settings Page
 * Allows users to configure their notification preferences
 */
const NotificationSettings = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushSupported] = useState(isPushSupported());
  const iosDevice = isIOS();
  const standaloneMode = isStandalone();
  const iosPushReady = isIOSPushReady();
  const [pushPermission, setPushPermission] = useState(getPermissionStatus());
  const [pushStatus, setPushStatus] = useState({ isSubscribed: false, deviceCount: 0 });
  const [preferences, setPreferences] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load preferences
      const prefsResponse = await api.get('/notifications/preferences');
      if (prefsResponse.data?.success) {
        setPreferences(prefsResponse.data.data);
      }

      // Load push status
      const status = await getPushStatus();
      setPushStatus(status);
      setPushPermission(getPermissionStatus());
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
    setIsLoading(false);
  };

  const handleToggle = async (category, channel) => {
    const fieldName = `${category}_${channel}`;
    const snakeCaseField = fieldName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    const newValue = !preferences[category][channel];

    // Optimistic update
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: newValue
      }
    }));

    try {
      await api.put('/notifications/preferences', {
        [snakeCaseField]: newValue
      });
    } catch (error) {
      // Revert on error
      setPreferences(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          [channel]: !newValue
        }
      }));
      showMessage(t('notificationSettings.saveError'), 'error');
    }
  };

  const handleQuietHoursToggle = async () => {
    const newValue = !preferences.quietHours.enabled;

    setPreferences(prev => ({
      ...prev,
      quietHours: { ...prev.quietHours, enabled: newValue }
    }));

    try {
      await api.put('/notifications/preferences', {
        quiet_hours_enabled: newValue
      });
    } catch (error) {
      setPreferences(prev => ({
        ...prev,
        quietHours: { ...prev.quietHours, enabled: !newValue }
      }));
    }
  };

  const handleQuietHoursTime = async (field, value) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: { ...prev.quietHours, [field]: value }
    }));

    try {
      await api.put('/notifications/preferences', {
        [`quiet_hours_${field}`]: value
      });
    } catch (error) {
      showMessage(t('notificationSettings.saveError'), 'error');
    }
  };

  const handleEnablePush = async () => {
    setIsSaving(true);
    const result = await subscribeToPush();
    setIsSaving(false);

    if (result.success) {
      setPushStatus({ isSubscribed: true, deviceCount: pushStatus.deviceCount + 1 });
      setPushPermission('granted');
      showMessage(t('notificationSettings.pushEnabled'), 'success');
    } else {
      showMessage(result.error || t('notificationSettings.cannotEnable'), 'error');
    }
  };

  const handleDisablePush = async () => {
    setIsSaving(true);
    const result = await unsubscribeFromPush();
    setIsSaving(false);

    if (result.success) {
      setPushStatus({ isSubscribed: false, deviceCount: Math.max(0, pushStatus.deviceCount - 1) });
      showMessage(t('notificationSettings.pushDisabled'), 'success');
    }
  };

  const handleTestPush = async () => {
    const result = await sendTestPush();
    if (result.success && result.data?.sent > 0) {
      showMessage(t('notificationSettings.testSent'), 'success');
    } else if (result.success && result.data?.sent === 0) {
      showMessage(t('notificationSettings.pushNeedEnable'), 'error');
    } else {
      showMessage(result.error || 'Хабарлама жіберілмеді', 'error');
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const categories = [
    {
      key: 'dealStatus',
      title: t('notificationSettings.categories.dealStatus.0'),
      description: t('notificationSettings.categories.dealStatus.1'),
      icon: 'sync'
    },
    {
      key: 'payment',
      title: t('notificationSettings.categories.payment.0'),
      description: t('notificationSettings.categories.payment.1'),
      icon: 'payments'
    },
    {
      key: 'taskAssigned',
      title: t('notificationSettings.categories.taskAssigned.0'),
      description: t('notificationSettings.categories.taskAssigned.1'),
      icon: 'task'
    },
    {
      key: 'measurementReminder',
      title: t('notificationSettings.categories.measurementReminder.0'),
      description: t('notificationSettings.categories.measurementReminder.1'),
      icon: 'alarm'
    },
    {
      key: 'proposalViewed',
      title: t('notificationSettings.categories.proposalViewed.0'),
      description: t('notificationSettings.categories.proposalViewed.1'),
      icon: 'visibility'
    },
    {
      key: 'stockLow',
      title: t('notificationSettings.categories.stockLow.0'),
      description: t('notificationSettings.categories.stockLow.1'),
      icon: 'inventory'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <Icon name="arrow_back" />
          </button>
          <h1 className="text-xl font-bold">{t('notificationSettings.title')}</h1>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg ${
          message.type === 'success' ? 'bg-green-600' :
          message.type === 'error' ? 'bg-red-600' : 'bg-primary'
        } text-white font-medium animate-in fade-in slide-in-from-top-2`}>
          {message.text}
        </div>
      )}

      <div className="p-4 space-y-6 max-w-3xl mx-auto">
        {/* Push Notifications Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Icon name="notifications_active" className="text-primary" />
              {t('notificationSettings.pushTitle')}
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* iOS Safari — needs PWA install */}
            {iosDevice && !standaloneMode ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Icon name="install_mobile" className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800 mb-1">{t('notificationSettings.iosInstallTitle')}</p>
                    <p className="text-sm text-amber-700 mb-2">{t('notificationSettings.iosInstallDesc')}</p>
                  </div>
                </div>
              </div>
            ) : !pushSupported ? (
              <div className="flex items-center gap-3 text-gray-500">
                <Icon name="info" />
                <span className="text-sm">{t('notificationSettings.unsupported')}</span>
              </div>
            ) : pushPermission === 'denied' ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Icon name="block" className="text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-red-700 font-semibold mb-1">{t('notificationSettings.blockedTitle')}</p>
                    <p className="text-sm text-red-600">{t('notificationSettings.blockedDesc')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Big Toggle */}
                <div className={`rounded-2xl p-4 border-2 transition-all ${pushStatus.isSubscribed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`size-12 rounded-full flex items-center justify-center ${pushStatus.isSubscribed ? 'bg-green-100' : 'bg-gray-200'}`}>
                        <Icon name={pushStatus.isSubscribed ? 'notifications_active' : 'notifications_off'} size={24}
                          className={pushStatus.isSubscribed ? 'text-green-600' : 'text-gray-500'} />
                      </div>
                      <div>
                        <p className={`font-bold ${pushStatus.isSubscribed ? 'text-green-800' : 'text-gray-700'}`}>
                          {pushStatus.isSubscribed ? t('notificationSettings.enabled') : t('notificationSettings.disabled')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {pushStatus.isSubscribed
                            ? `${pushStatus.deviceCount} құрылғыда белсенді`
                            : t('notificationSettings.pushOffDesc')}
                        </p>
                      </div>
                    </div>
                    {/* iOS-style switch */}
                    <button
                      onClick={pushStatus.isSubscribed ? handleDisablePush : handleEnablePush}
                      disabled={isSaving}
                      className={`relative w-14 h-7 rounded-full transition-colors duration-300 flex-shrink-0 ${pushStatus.isSubscribed ? 'bg-green-500' : 'bg-gray-300'} disabled:opacity-50`}
                    >
                      <span className={`absolute top-0.5 left-0.5 size-6 bg-white rounded-full shadow transition-transform duration-300 ${pushStatus.isSubscribed ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                {!pushStatus.isSubscribed ? (
                  <button
                    onClick={handleEnablePush}
                    disabled={isSaving}
                    className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving
                      ? <><div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('notificationSettings.enablingPush')}</>
                      : <><Icon name="notifications" />{t('notificationSettings.enablePush')}</>}
                  </button>
                ) : (
                  <button
                    onClick={handleTestPush}
                    className="w-full py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="play_arrow" />
                    {t('notificationSettings.testPush')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Notification Categories */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-lg">{t('notificationSettings.typesTitle')}</h2>
          </div>

          <div className="divide-y divide-gray-50">
            {categories.map(category => (
              <div key={category.key} className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Icon name={category.icon} className="text-primary" />
                  <div>
                    <p className="font-medium">{category.title}</p>
                    <p className="text-sm text-gray-500">{category.description}</p>
                  </div>
                </div>

                {preferences && preferences[category.key] && (
                  <div className="flex gap-2 ml-9">
                    <ChannelToggle
                      label={t('notificationSettings.inApp')}
                      icon="smartphone"
                      enabled={preferences[category.key].inapp}
                      onChange={() => handleToggle(category.key, 'inapp')}
                    />
                    <ChannelToggle
                      label={t('notificationSettings.push')}
                      icon="notifications"
                      enabled={preferences[category.key].push}
                      onChange={() => handleToggle(category.key, 'push')}
                      disabled={!pushStatus.isSubscribed}
                    />
                    <ChannelToggle
                      label={t('notificationSettings.sms')}
                      icon="sms"
                      enabled={preferences[category.key].sms}
                      onChange={() => handleToggle(category.key, 'sms')}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Icon name="do_not_disturb_on" className="text-primary" />
              {t('notificationSettings.quietHoursTitle')}
            </h2>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-medium">{t('notificationSettings.quietMode')}</p>
                <p className="text-sm text-gray-500">{t('notificationSettings.quietModeDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences?.quietHours?.enabled || false}
                  onChange={handleQuietHoursToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {preferences?.quietHours?.enabled && (
              <div className="flex items-center gap-4 mt-4">
                <div>
                  <label className="text-sm text-gray-500">{t('notificationSettings.startsAt')}</label>
                  <input
                    type="time"
                    value={preferences.quietHours.start || '22:00'}
                    onChange={(e) => handleQuietHoursTime('start', e.target.value)}
                    className="block mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="text-gray-400 mt-6">-</div>
                <div>
                  <label className="text-sm text-gray-500">{t('notificationSettings.endsAt')}</label>
                  <input
                    type="time"
                    value={preferences.quietHours.end || '08:00'}
                    onChange={(e) => handleQuietHoursTime('end', e.target.value)}
                    className="block mt-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

// Channel Toggle Button Component
const ChannelToggle = ({ label, icon, enabled, onChange, disabled = false }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
      disabled
        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
        : enabled
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
    }`}
  >
    <Icon name={icon} size={20} />
    {label}
  </button>
);

export default NotificationSettings;
