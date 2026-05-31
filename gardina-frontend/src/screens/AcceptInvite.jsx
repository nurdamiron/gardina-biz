import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Icon from '../components/common/Icon';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { useI18n } from '../contexts/I18nContext';

const ROLE_LABELS = {
  ru: { designer: 'Дизайнер', manager: 'Менеджер', sales: 'Менеджер продаж', admin: 'Администратор' },
  kz: { designer: 'Дизайнер', manager: 'Менеджер', sales: 'Сатылым менеджері', admin: 'Әкімші' },
};

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { lang } = useI18n();

  const [invite, setInvite] = useState(null);
  const [loadStatus, setLoadStatus] = useState('loading'); // loading | ready | invalid
  const [loadError, setLoadError] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const t = {
    ru: {
      title: 'Принять приглашение',
      invitedBy: 'Вас пригласили в',
      role: 'Роль',
      yourName: 'Ваше имя',
      namePlaceholder: 'Введите имя',
      newPassword: 'Придумайте пароль',
      confirmPassword: 'Повторите пароль',
      submit: 'Создать аккаунт',
      success: 'Аккаунт создан! Входим…',
      errors: {
        nameRequired: 'Введите имя',
        passwordShort: 'Пароль — минимум 6 символов',
        passwordsMismatch: 'Пароли не совпадают',
        generic: 'Что-то пошло не так',
      },
    },
    kz: {
      title: 'Шақыруды қабылдау',
      invitedBy: 'Сізді шақырды',
      role: 'Рөл',
      yourName: 'Сіздің атыңыз',
      namePlaceholder: 'Атыңызды енгізіңіз',
      newPassword: 'Пароль ойлап табыңыз',
      confirmPassword: 'Парольді қайталаңыз',
      submit: 'Аккаунт жасау',
      success: 'Аккаунт жасалды! Кіруде…',
      errors: {
        nameRequired: 'Атыңызды енгізіңіз',
        passwordShort: 'Пароль — кемінде 6 таңба',
        passwordsMismatch: 'Парольдер сәйкес емес',
        generic: 'Бірдеңе дұрыс болмады',
      },
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  useEffect(() => {
    if (!token) { setLoadStatus('invalid'); setLoadError(lang === 'kz' ? 'Токен жоқ' : 'Токен не найден'); return; }
    api.get(`/auth/invite/${token}`)
      .then((r) => {
        setInvite(r.data.data);
        setName(r.data.data.name || '');
        setLoadStatus('ready');
      })
      .catch((e) => {
        setLoadStatus('invalid');
        setLoadError(e.response?.data?.error || (lang === 'kz' ? 'Шақыру жарамсыз' : 'Приглашение недействительно'));
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) { setFormError(t.errors.nameRequired); return; }
    if (password.length < 6) { setFormError(t.errors.passwordShort); return; }
    if (password !== confirm) { setFormError(t.errors.passwordsMismatch); return; }

    setSaving(true);
    try {
      const r = await api.post(`/auth/invite/${token}/accept`, { name: name.trim(), password });
      const data = r.data.data || {};
      const { user: userData } = data;
      const accessToken = data.tokens?.accessToken ?? data.accessToken;
      const refreshToken = data.tokens?.refreshToken ?? data.refreshToken;
      if (!accessToken) throw new Error('Серверден токен келмеді');
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      navigate('/', { replace: true });
    } catch (e) {
      setFormError(e.response?.data?.error || t.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="text-2xl font-black text-primary tracking-tight">Gardina</div>
          </div>
          <LanguageSwitcher />
        </div>

        {loadStatus === 'loading' && (
          <div className="flex justify-center py-16">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {loadStatus === 'invalid' && (
          <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
            <div className="size-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="link_off" size={36} className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              {lang === 'kz' ? 'Шақыру жарамсыз' : 'Ссылка недействительна'}
            </h1>
            <p className="text-text-secondary text-sm">{loadError}</p>
          </div>
        )}

        {loadStatus === 'ready' && invite && (
          <div className="bg-white rounded-3xl shadow-sm p-8">
            {/* Invitation info */}
            <div className="text-center mb-8">
              <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="group_add" size={32} className="text-primary" />
              </div>
              <h1 className="text-xl font-bold mb-1">{t.title}</h1>
              <p className="text-text-secondary text-sm">
                {t.invitedBy} <strong>{invite.orgName}</strong>
              </p>
              <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                {t.role}: {ROLE_LABELS[lang === 'kz' ? 'kz' : 'ru'][invite.role] || invite.role}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">{t.yourName}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="w-full px-4 py-3 bg-background-light rounded-2xl text-sm border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  value={invite.email}
                  readOnly
                  className="w-full px-4 py-3 bg-background-light rounded-2xl text-sm border border-border-light text-text-secondary cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">{t.newPassword}</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-12 bg-background-light rounded-2xl text-sm border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary p-1"
                  >
                    <Icon name={showPw ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">{t.confirmPassword}</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-background-light rounded-2xl text-sm border border-border-light focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-600">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold text-sm disabled:opacity-60 mt-2"
              >
                {saving
                  ? (lang === 'kz' ? 'Жасалуда…' : 'Создаём…')
                  : t.submit}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
