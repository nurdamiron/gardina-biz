import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import api from '../services/api';
import BottomNav from '../components/navigation/BottomNav';
import Icon from '../components/common/Icon';

// ─── Edit Profile Modal ────────────────────────────────────────────────────────
const EditProfileModal = ({ user, onClose, onSaved }) => {
  const { t } = useI18n();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('profile.edit.errorNameRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.put('/users/me', { name: name.trim(), phone: phone.trim() });
      onSaved(res.data.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || t('profile.edit.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-lg font-bold text-gray-900 mb-5">{t('profile.edit.title')}</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('profile.edit.name')}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder={t('profile.edit.namePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('profile.edit.phone')}</label>
          <input
            type="text"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            placeholder={t('profile.edit.phonePlaceholder')}
            inputMode="tel"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {t('common.save')}
        </button>
      </div>
    </ModalBackdrop>
  );
};

// ─── Change Password Modal ─────────────────────────────────────────────────────
const ChangePasswordModal = ({ onClose }) => {
  const { t } = useI18n();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setError(null);
    if (!current || !next || !confirm) {
      setError(t('profile.password.errorAllRequired'));
      return;
    }
    if (next.length < 6) {
      setError(t('profile.password.errorTooShort'));
      return;
    }
    if (next !== confirm) {
      setError(t('profile.password.errorMismatch'));
      return;
    }
    setLoading(true);
    try {
      await api.post('/users/me/change-password', {
        currentPassword: current,
        newPassword: next,
      });
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (e) {
      setError(e.response?.data?.error || t('profile.edit.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <h3 className="text-lg font-bold text-gray-900 mb-5">{t('profile.password.title')}</h3>

      {success ? (
        <div className="text-center py-4">
          <div className="size-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Icon name="check_circle" size={24} className="text-green-500" />
          </div>
          <p className="font-semibold text-gray-800">{t('profile.password.successTitle')}</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-4">
            <PasswordField
              label={t('profile.password.current')}
              value={current}
              onChange={setCurrent}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
              placeholder={t('profile.password.currentPlaceholder')}
            />
            <PasswordField
              label={t('profile.password.next')}
              value={next}
              onChange={setNext}
              show={showNext}
              onToggle={() => setShowNext(v => !v)}
              placeholder={t('profile.password.nextPlaceholder')}
            />
            <PasswordField
              label={t('profile.password.confirm')}
              value={confirm}
              onChange={setConfirm}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              placeholder={t('profile.password.confirmPlaceholder')}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {t('profile.password.submit')}
            </button>
          </div>
        </>
      )}
    </ModalBackdrop>
  );
};

// ─── Help Modal ────────────────────────────────────────────────────────────────
const HelpModal = ({ onClose }) => {
  const { t } = useI18n();
  return (
    <ModalBackdrop onClose={onClose}>
      <div className="flex items-center gap-3 mb-5">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon name="help" className="text-primary" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{t('profile.help.title')}</h3>
      </div>

      <div className="space-y-4 text-sm text-gray-600">
        <HelpItem icon="phone" title={t('profile.help.contact')} value={t('profile.help.contactValue')} />
        <HelpItem icon="mail" title={t('profile.help.email')} value={t('profile.help.emailValue')} />
        <HelpItem icon="schedule" title={t('profile.help.schedule')} value={t('profile.help.scheduleValue')} />
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">{t('profile.help.appVersion')}</p>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full mt-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
      >
        {t('common.close')}
      </button>
    </ModalBackdrop>
  );
};

// ─── Shared helpers ────────────────────────────────────────────────────────────
const ModalBackdrop = ({ children, onClose }) => (
  <div
    className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const PasswordField = ({ label, value, onChange, show, onToggle, placeholder }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <Icon name={show ? 'visibility_off' : 'visibility'} size={22} />
      </button>
    </div>
  </div>
);

const HelpItem = ({ icon, title, value }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
    <Icon name={icon} size={22} className="text-primary" />
    <div>
      <p className="text-xs text-gray-400">{title}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

// ─── Main Profile Screen ───────────────────────────────────────────────────────
const Profile = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, logout, setUser } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [modal, setModal] = useState(null); // 'edit' | 'password' | 'help'

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileSaved = (updatedUser) => {
    if (setUser) setUser(prev => ({ ...prev, ...updatedUser }));
  };

  const roleColors = {
    admin: 'bg-primary/10 text-primary-dark',
    manager: 'bg-primary/15 text-primary-dark',
    sales_manager: 'bg-primary/15 text-primary-dark',
    sales: 'bg-primary/15 text-primary-dark',
    designer: 'bg-primary/10 text-primary',
    production: 'bg-orange-100 text-orange-700',
    installer: 'bg-green-100 text-green-700',
  };

  const roleColor = roleColors[user?.role] || 'bg-gray-100 text-gray-700';
  const roleLabel = t(`profile.roles.${user?.role || 'employee'}`, t('profile.roles.employee'));

  const menuItems = [
    {
      icon: 'person',
      label: t('profile.menu.personal'),
      desc: t('profile.menu.personalDesc'),
      onClick: () => setModal('edit'),
    },
    {
      icon: 'notifications',
      label: t('profile.menu.notifications'),
      desc: t('profile.menu.notificationsDesc'),
      onClick: () => navigate('/notifications/settings'),
    },
    {
      icon: 'lock',
      label: t('profile.menu.password'),
      desc: t('profile.menu.passwordDesc'),
      onClick: () => setModal('password'),
    },
    {
      icon: 'help',
      label: t('profile.menu.help'),
      desc: t('profile.menu.helpDesc'),
      onClick: () => setModal('help'),
    },
  ];

  return (
    <div className="bg-background-light min-h-screen pb-24">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">{t('profile.title')}</h1>
      </header>

      <main className="p-4 space-y-4 max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="person" size={28} className="text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">{user?.name || t('profile.defaultUserName')}</h2>
              <p className="text-sm text-gray-500">{user?.phone || t('profile.unknownPhone')}</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
            <button
              onClick={() => setModal('edit')}
              className="size-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label={t('common.edit')}
            >
              <Icon name="edit" size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="badge" className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">{t('profile.loginLabel')}</p>
              <p className="font-semibold text-gray-900">{user?.phone || t('profile.unknownPhone')}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors
                ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Icon name={item.icon} size={22} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.label}</p>
                {item.desc && <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>}
              </div>
              <Icon name="chevron_right" className="text-gray-400" />
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-2 p-4 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition-colors"
        >
          <Icon name="logout" />
          {t('profile.logout.cta')}
        </button>
      </main>

      {/* Modals */}
      {modal === 'edit' && (
        <EditProfileModal user={user} onClose={() => setModal(null)} onSaved={handleProfileSaved} />
      )}
      {modal === 'password' && (
        <ChangePasswordModal onClose={() => setModal(null)} />
      )}
      {modal === 'help' && (
        <HelpModal onClose={() => setModal(null)} />
      )}

      {/* Logout Confirmation */}
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
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('profile.logout.confirmTitle')}</h3>
              <p className="text-gray-500 text-sm mb-6">{t('profile.logout.confirmText')}</p>
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
                  {t('profile.logout.cta')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Profile;
