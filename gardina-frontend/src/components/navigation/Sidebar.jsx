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
    { icon: 'group',       label: { ru: 'Лиды',     kz: 'Лидтер' },      path: '/sales/clients' },
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
  const { lang, t } = useI18n();

  const role = user?.role;
  const tabs = NAV_BY_ROLE[role] || [];

  const isActive = (path) => {
    if (path.endsWith('/dashboard')) return location.pathname === path || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="hidden md:flex flex-col w-60 min-h-screen bg-card border-r border-border fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-border">
        <span className="size-8 rounded-md bg-primary text-primary-content flex items-center justify-center font-bold shrink-0">G</span>
        <div className="min-w-0">
          <span className="block text-sm font-semibold text-foreground leading-tight tracking-tight">Gardina</span>
          {user?.organizationName && (
            <p className="text-xs text-muted-foreground truncate leading-tight">{user.organizationName}</p>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {lang === 'kz' ? 'Мәзір' : 'Меню'}
        </p>
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`group w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon name={tab.icon} size={18} className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} />
              <span>{tab.label[lang === 'kz' ? 'kz' : 'ru']}</span>
              {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
            </button>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md mb-1">
          <div className="size-9 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-foreground">{(user?.name || '?').slice(0, 1).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{t(`profile.roles.${user?.role}`, user?.role)}</p>
          </div>
        </div>
        <button
          onClick={() => logout().then(() => navigate('/login'))}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="logout" size={18} />
          <span>{lang === 'kz' ? 'Шығу' : 'Выйти'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
