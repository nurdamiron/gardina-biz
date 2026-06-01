import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import BottomNav from '../components/navigation/BottomNav';
import Icon from '../components/common/Icon';
import { useI18n } from '../contexts/I18nContext';

/**
 * Full Notifications List Page
 */
const NotificationsList = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const params = filter === 'unread' ? '?isRead=false' : '';
      const response = await api.get(`/notifications${params}&limit=100`);
      if (response.data?.success) {
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
    setIsLoading(false);
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getIcon = (type) => {
    const icons = {
      urgent: 'priority_high',
      warning: 'warning',
      info: 'info',
      success: 'check_circle',
    };
    return icons[type] || 'notifications';
  };

  const getIconColor = (type) => {
    const colors = {
      urgent: 'bg-red-100 text-red-600',
      warning: 'bg-orange-100 text-orange-600',
      info: 'bg-primary/15 text-primary',
      success: 'bg-green-100 text-green-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const formatRelative = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return t('notifications.time.now');
    if (diffMins < 60) return t('notifications.time.minutesAgo', { minutes: diffMins });
    if (diffHours < 24) return t('notifications.time.hoursAgo', { hours: diffHours });
    if (diffDays === 1) return t('notifications.time.yesterday');
    if (diffDays < 7) return t('notifications.time.daysAgo', { days: diffDays });

    return date.toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey;
    if (date.toDateString() === today.toDateString()) {
      groupKey = t('notifications.time.today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = t('notifications.time.yesterday');
    } else {
      groupKey = date.toLocaleDateString(lang === 'kz' ? 'kk-KZ' : 'ru-RU', {
        day: 'numeric',
        month: 'long',
      });
    }

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(notification);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-background-light pb-32">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2" aria-label={t('common.back')}>
              <Icon name="arrow_back" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{t('notifications.title')}</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">{unreadCount} {t('notifications.unread')}</p>
              )}
            </div>
          </div>

          <button onClick={() => navigate('/notifications/settings')} className="p-2" aria-label={t('common.settings')}>
            <Icon name="settings" />
          </button>
        </div>

        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('notifications.filters.all')}
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === 'unread' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('notifications.filters.unread')}
            {unreadCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="ml-auto text-sm text-primary hover:text-primary/80">
              {t('notifications.markAllRead')}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-gray-400">
          <Icon name="notifications_off" size={48} />
          <p className="text-lg font-medium">{t('notifications.empty')}</p>
          <p className="text-sm mt-1">
            {filter === 'unread' ? t('notifications.emptyAllRead') : t('notifications.emptyHintNew')}
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-6 max-w-3xl mx-auto">
          {Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{date}</h3>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {items.map((notification, index) => (
                  <div
                    key={notification.id}
                    onClick={() => handleClick(notification)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      index > 0 ? 'border-t border-gray-50' : ''
                    } ${!notification.is_read ? 'bg-primary/10/30' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
                        <Icon name={getIcon(notification.type)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{formatRelative(notification.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default NotificationsList;
