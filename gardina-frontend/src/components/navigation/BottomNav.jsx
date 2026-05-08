import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../common/Icon';
import { useI18n } from '../../contexts/I18nContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useI18n();

  const designerTabs = [
    { id: 'home', icon: 'home', label: t('nav.home'), path: '/designer/dashboard' },
    { id: 'measurements', icon: 'straighten', label: t('nav.measurements'), path: '/designer/measurements' },
    { id: 'profile', icon: 'person', label: t('common.profile'), path: '/designer/profile' },
  ];

  const managerTabs = [
    { id: 'home', icon: 'home', label: t('nav.home'), path: '/manager/dashboard' },
    { id: 'orders', icon: 'handshake', label: t('nav.orders'), path: '/manager/orders' },
    { id: 'funnel', icon: 'filter_alt', label: t('nav.funnel'), path: '/manager/funnel' },
    { id: 'clients', icon: 'group', label: t('nav.clients'), path: '/manager/clients' },
    { id: 'profile', icon: 'person', label: t('common.profile'), path: '/manager/profile' },
  ];

  const salesTabs = [
    { id: 'clients', icon: 'group', label: t('nav.leads'), path: '/sales/clients' },
    { id: 'order', icon: 'add_circle', label: t('nav.orders'), path: '/sales/order/new' },
    { id: 'funnel', icon: 'filter_alt', label: t('nav.funnel'), path: '/sales/funnel' },
    { id: 'profile', icon: 'person', label: t('common.profile'), path: '/sales/profile' },
  ];

  const adminTabs = [
    { id: 'home', icon: 'dashboard', label: t('nav.home'), path: '/admin/dashboard' },
    { id: 'catalog', icon: 'inventory_2', label: t('nav.catalog'), path: '/admin/catalog' },
    { id: 'orders', icon: 'shopping_cart', label: t('nav.orders'), path: '/admin/orders' },
    { id: 'clients', icon: 'group', label: t('nav.clients'), path: '/admin/clients' },
    { id: 'settings', icon: 'settings', label: t('nav.settings'), path: '/admin/settings' },
  ];

  let tabs = designerTabs;
  const isAdmin = user?.role === 'admin';
  if (isAdmin) tabs = adminTabs;
  else if (user?.role === 'manager') tabs = managerTabs;
  else if (user?.role === 'sales') tabs = salesTabs;

  const isActive = (path) => {
    if (path === '/designer/dashboard' || path === '/manager/dashboard' || path === '/admin/dashboard') {
      return location.pathname === '/' || 
             location.pathname === '/designer/dashboard' || 
             location.pathname === '/manager/dashboard' ||
             location.pathname === '/admin/dashboard';
    }
    if (path.includes('/profile')) {
      return location.pathname.includes('/profile');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav 
      className="fixed left-1/2 -translate-x-1/2 z-50"
      style={{ 
        bottom: 'max(24px, env(safe-area-inset-bottom, 24px))'
      }}
    >
      <div 
        className="flex items-center justify-between rounded-full bg-gray-900"
        style={{
          boxShadow: '0 10px 50px rgba(0,0,0,0.35)',
          padding: isAdmin ? '10px 16px' : '10px 16px',
          gap: isAdmin ? '8px' : '8px',
        }}
      >
          {tabs.map((tab) => {
            const active = isActive(tab.path);

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
              className="relative flex items-center justify-center gap-2 rounded-full active:scale-95"
              style={{
                padding: isAdmin 
                  ? (active ? '14px 16px' : '14px') 
                  : (active ? '12px 20px' : '12px'),
                backgroundColor: active ? '#1b5e45' : 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              >
              <Icon
                name={tab.icon}
                size={isAdmin ? 26 : 24}
                style={{
                  color: active ? '#ffffff' : '#9ca3af',
                  transition: 'color 0.3s ease',
                }}
              />

              {/* Текст только для не-админов */}
              {!isAdmin && (
                <span 
                  className="text-white text-sm font-bold whitespace-nowrap overflow-hidden"
                  style={{
                    maxWidth: active ? '80px' : '0px',
                    opacity: active ? 1 : 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {tab.label}
                </span>
                )}
              </button>
            );
          })}
      </div>
    </nav>
  );
};

export default BottomNav;
