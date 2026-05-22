import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../common/Icon';
import { useI18n } from '../../contexts/I18nContext';

const NAV_BY_ROLE = {
  designer: [
    { icon: 'home',       label: { ru: 'Главная',   kz: 'Басты бет' },    path: '/designer/dashboard' },
    { icon: 'straighten', label: { ru: 'Замеры',    kz: 'Өлшемдер' },     path: '/designer/measurements' },
    { icon: 'person',     label: { ru: 'Профиль',   kz: 'Профиль' },      path: '/designer/profile' },
  ],
  manager: [
    { icon: 'home',        label: { ru: 'Главная',  kz: 'Басты бет' },    path: '/manager/dashboard' },
    { icon: 'handshake',   label: { ru: 'Сделки',   kz: 'Мәмілелер' },   path: '/manager/orders' },
    { icon: 'filter_alt',  label: { ru: 'Воронка',  kz: 'Воронка' },     path: '/manager/funnel' },
    { icon: 'group',       label: { ru: 'Клиенты',  kz: 'Клиенттер' },   path: '/manager/clients' },
    { icon: 'person',      label: { ru: 'Профиль',  kz: 'Профиль' },     path: '/manager/profile' },
  ],
  sales: [
    { icon: 'group',       label: { ru: 'Клиенты',  kz: 'Клиенттер' },   path: '/sales/clients' },
    { icon: 'add_circle',  label: { ru: 'Замер',    kz: 'Замер' },       path: '/sales/order/new' },
    { icon: 'filter_alt',  label: { ru: 'Воронка',  kz: 'Воронка' },     path: '/sales/funnel' },
    { icon: 'person',      label: { ru: 'Профиль',  kz: 'Профиль' },     path: '/sales/profile' },
  ],
  admin: [
    { icon: 'dashboard',      label: { ru: 'Дашборд',   kz: 'Дашборд' },    path: '/admin/dashboard' },
    { icon: 'group',          label: { ru: 'Клиенты',   kz: 'Клиенттер' }, path: '/admin/clients' },
    { icon: 'shopping_cart',  label: { ru: 'Сделки',    kz: 'Мәмілелер' }, path: '/admin/orders' },
    { icon: 'inventory_2',    label: { ru: 'Каталог',   kz: 'Каталог' },    path: '/admin/catalog' },
    { icon: 'bar_chart',      label: { ru: 'Отчёты',    kz: 'Есептер' },    path: '/admin/reports' },
    { icon: 'group_add',      label: { ru: 'Команда',   kz: 'Команда' },    path: '/admin/users' },
    { icon: 'workspace_premium', label: { ru: 'Тариф',  kz: 'Тариф' },    path: '/admin/billing' },
    { icon: 'settings',       label: { ru: 'Настройки', kz: 'Баптаулар' }, path: '/admin/settings' },
  ],
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { lang } = useI18n();

  const role = user?.role;
  const tabs = NAV_BY_ROLE[role] || [];

  const isActive = (path) => {
    if (path.endsWith('/dashboard')) return location.pathname === path || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-border-light fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border-light">
        <span className="text-xl font-black text-primary tracking-tight">Gardina</span>
        {user?.organizationName && (
          <p className="text-xs text-text-secondary mt-0.5 truncate">{user.organizationName}</p>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-background-light hover:text-text-main'
              }`}
            >
              <Icon name={tab.icon} size={18} />
              <span>{tab.label[lang === 'kz' ? 'kz' : 'ru']}</span>
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-border-light">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-background-light mb-2">
          <div className="size-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="person" size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-text-main truncate">{user?.name}</p>
            <p className="text-[10px] text-text-secondary capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => logout().then(() => navigate('/login'))}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <Icon name="logout" size={18} />
          <span>{lang === 'kz' ? 'Шығу' : 'Выйти'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
