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
      className="fixed left-1/2 -translate-x-1/2 z-50 md:hidden"
      style={{ bottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
    >
      <div className="flex items-center gap-1 rounded-2xl bg-card/95 backdrop-blur border border-border p-1.5 shadow-lg">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active ? 'bg-primary text-primary-content' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon name={tab.icon} size={22} />
              <span
                className="overflow-hidden whitespace-nowrap transition-all duration-300"
                style={{ maxWidth: active ? '90px' : '0px', opacity: active ? 1 : 0 }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
