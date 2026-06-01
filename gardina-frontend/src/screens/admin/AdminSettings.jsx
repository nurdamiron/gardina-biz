import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import BottomNav from '../../components/navigation/BottomNav';
import Icon from '../../components/common/Icon';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { useI18n } from '../../contexts/I18nContext';

// Shared modal backdrop
const ModalBackdrop = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const AdminSettings = () => {
  const navigate = useNavigate();
  const { logout, user, setUser } = useAuth();
  const { t } = useI18n();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [modal, setModal] = useState(null); // 'profile' | 'password' | 'company' | 'payment' | 'commission' | 'delivery'

  // Edit profile state
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Change password state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) return;
    setProfileSaving(true); setProfileError(null);
    try {
      const res = await api.put('/users/me', profileForm);
      setUser?.(prev => ({ ...prev, ...res.data.data }));
      setModal(null);
    } catch (e) {
      setProfileError(e.response?.data?.error || t('common.errorGeneric'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwError(null);
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) { setPwError(t('adminSettings.fillAllFields')); return; }
    if (pwForm.next.length < 6) { setPwError(t('adminSettings.minPassword')); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError(t('adminSettings.passwordsMismatch')); return; }
    setPwSaving(true);
    try {
      await api.post('/users/me/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwSuccess(true);
      setTimeout(() => { setModal(null); setPwSuccess(false); setPwForm({ current: '', next: '', confirm: '' }); }, 1500);
    } catch (e) {
      setPwError(e.response?.data?.error || t('common.errorGeneric'));
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Настройки профиля
  const profileItems = [
    { icon: 'person', label: t('adminSettings.personalData'), onClick: () => { setProfileForm({ name: user?.name || '', phone: user?.phone || '' }); setModal('profile'); } },
    { icon: 'lock', label: t('adminSettings.changePassword'), onClick: () => setModal('password') },
  ];

  // Настройки компании
  const companyItems = [
    { icon: 'store', label: t('adminSettings.companyInfo'), subtitle: t('adminSettings.companyInfoSub'), onClick: () => setModal('company') },
    { icon: 'payments', label: t('adminSettings.paymentDetails'), subtitle: t('adminSettings.paymentDetailsSub'), onClick: () => setModal('payment') },
    { icon: 'percent', label: t('adminSettings.commission'), subtitle: t('adminSettings.commissionSub'), onClick: () => setModal('commission') },
    { icon: 'local_shipping', label: t('adminSettings.delivery'), subtitle: t('adminSettings.deliverySub'), onClick: () => setModal('delivery') },
  ];

  // Управление системой
  const systemItems = [
    { icon: 'group', label: t('adminSettings.employees'), subtitle: t('adminSettings.employeesSub'), onClick: () => navigate('/admin/users') },
    { icon: 'notifications_active', label: t('adminSettings.notifications'), subtitle: t('adminSettings.notificationsSub'), onClick: () => navigate('/admin/notifications') },
    { icon: 'bar_chart', label: t('adminSettings.reports'), subtitle: t('adminSettings.reportsSub'), onClick: () => navigate('/admin/reports') },
    { icon: 'inventory_2', label: t('adminSettings.catalogSettings'), subtitle: t('adminSettings.catalogSettingsSub'), onClick: () => navigate('/admin/catalog') },
  ];

  const SettingsGroup = ({ title, items }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h3 className="font-bold text-gray-700 text-sm">{title}</h3>
      </div>
      {items.map((item, index) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className={`
            w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors
            ${index !== items.length - 1 ? 'border-b border-gray-100' : ''}
          `}
        >
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name={item.icon} size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{item.label}</p>
            {item.subtitle && (
              <p className="text-xs text-gray-500">{item.subtitle}</p>
            )}
          </div>
          <Icon name="chevron_right" className="text-gray-400" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-background-light min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">{t('adminSettings.title')}</h1>
      </header>

      <main className="p-4 space-y-4 max-w-3xl mx-auto">
        {/* Admin Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="admin_panel_settings" size={28} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{user?.name || t('adminLayout.admin')}</h2>
              <p className="text-sm text-gray-500">{user?.phone || '—'}</p>
              <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary-dark">
                {t('adminSettings.roleAdmin')}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <SettingsGroup title={t('adminSettings.profileGroup')} items={profileItems} />

        {/* Company Settings */}
        <SettingsGroup title={t('adminSettings.companyGroup')} items={companyItems} />

        {/* System Settings */}
        <SettingsGroup title={t('adminSettings.systemGroup')} items={systemItems} />

        {/* Interface Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-bold text-gray-700 text-sm">{t('adminSettings.interfaceGroup')}</h3>
          </div>
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="settings" size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{t('common.language')}</p>
                <p className="text-xs text-gray-500">KZ / RU</p>
              </div>
            </div>
            <LanguageSwitcher compact />
          </div>
        </div>

        {/* App Info */}
        <p className="text-center text-xs text-gray-400 py-2">{t('adminSettings.version')}</p>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors"
        >
          <Icon name="logout" />
          {t('common.logout')}
        </button>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="size-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Icon name="logout" size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('adminSettings.logoutConfirmTitle')}</h3>
              <p className="text-gray-500 text-sm mb-6">{t('adminSettings.logoutConfirmText')}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
                >
                  {t('common.logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      {/* Profile Edit Modal */}
      {modal === 'profile' && (
        <ModalBackdrop onClose={() => setModal(null)}>
          <h3 className="text-lg font-bold mb-5">{t('adminSettings.modalProfile')}</h3>
          {profileError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{profileError}</div>}
          <div className="space-y-4">
            {[{ label: t('adminSettings.fullName'), key: 'name' }, { label: t('adminSettings.loginPhone'), key: 'phone' }].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                <input type="text" value={profileForm[f.key]} onChange={e => setProfileForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">{t('common.cancel')}</button>
            <button onClick={handleSaveProfile} disabled={profileSaving} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50">
              {profileSaving ? t('adminSettings.saving') : t('common.save')}
            </button>
          </div>
        </ModalBackdrop>
      )}

      {/* Change Password Modal */}
      {modal === 'password' && (
        <ModalBackdrop onClose={() => setModal(null)}>
          <h3 className="text-lg font-bold mb-5">{t('adminSettings.modalPassword')}</h3>
          {pwSuccess ? (
            <div className="text-center py-4">
              <div className="size-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Icon name="check_circle" size={24} className="text-green-500" />
              </div>
              <p className="font-semibold">{t('adminSettings.modalPasswordSuccess')}</p>
            </div>
          ) : (
            <>
              {pwError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{pwError}</div>}
              <div className="space-y-4">
                {[{ label: t('adminSettings.currentPassword'), key: 'current' }, { label: t('adminSettings.newPassword'), key: 'next' }, { label: t('adminSettings.confirmNewPassword'), key: 'confirm' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{f.label}</label>
                    <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">{t('common.cancel')}</button>
                <button onClick={handleChangePassword} disabled={pwSaving} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50">
                  {pwSaving ? t('adminSettings.changing') : t('adminSettings.change')}
                </button>
              </div>
            </>
          )}
        </ModalBackdrop>
      )}

      {/* Company / Payment / Commission / Delivery — "coming soon" modals */}
      {['company','payment','commission','delivery'].includes(modal) && (
        <ModalBackdrop onClose={() => setModal(null)}>
          <div className="text-center py-4">
            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon name={modal === 'company' ? 'store' : modal === 'payment' ? 'payments' : modal === 'commission' ? 'percent' : 'local_shipping'} size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {modal === 'company' ? t('adminSettings.companyInfo') : modal === 'payment' ? t('adminSettings.paymentDetails') : modal === 'commission' ? t('adminSettings.commission') : t('adminSettings.delivery')}
            </h3>
            <p className="text-gray-500 text-sm mb-6">{t('common.comingSoon')}</p>
            <button onClick={() => setModal(null)} className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl">{t('common.close')}</button>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
};

export default AdminSettings;
