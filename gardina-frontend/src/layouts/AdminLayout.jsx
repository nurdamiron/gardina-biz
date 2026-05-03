import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/common/Icon';

/**
 * Admin Layout with sidebar
 * Only for admin role
 */
const AdminLayout = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { path: '/admin/dashboard', icon: 'dashboard', label: 'Дашборд' },
        { path: '/admin/catalog', icon: 'inventory_2', label: 'Каталог' },
        { path: '/admin/orders', icon: 'shopping_cart', label: 'Заказы' },
        { path: '/admin/users', icon: 'group', label: 'Пользователи' },
        { path: '/admin/clients', icon: 'people', label: 'Клиенты' },
        { path: '/admin/reports', icon: 'bar_chart', label: 'Отчёты' },
        { path: '/admin/settings', icon: 'settings', label: 'Настройки' },
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col`}>
                {/* Logo */}
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-primary rounded-lg flex items-center justify-center">
                            <Icon name="admin_panel_settings" className="text-white" />
                        </div>
                        {sidebarOpen && (
                            <div>
                                <h1 className="font-bold text-lg">Gardina Admin</h1>
                                <p className="text-xs text-slate-400">Панель управления</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 hover:bg-slate-700 rounded"
                    >
                        <Icon name={sidebarOpen ? 'chevron_left' : 'chevron_right'} className="text-slate-400" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4">
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-primary text-white'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`
                            }
                        >
                            <Icon name={item.icon} />
                            {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User */}
                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <Icon name="person" className="text-primary" />
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{user?.name}</p>
                                <p className="text-xs text-slate-400">Админ</p>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-slate-700 rounded-lg"
                            title="Шығу"
                        >
                            <Icon name="logout" className="text-red-400" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
