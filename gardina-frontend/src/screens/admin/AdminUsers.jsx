import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BottomNav from '../../components/navigation/BottomNav';
import Icon from '../../components/common/Icon';
import { useI18n } from '../../contexts/I18nContext';

const ROLE_VALUES = ['designer', 'manager', 'sales', 'admin'];
const ROLE_COLORS = {
  designer: 'bg-primary/10 text-primary',
  manager: 'bg-primary/15 text-primary-dark',
  sales: 'bg-primary/15 text-primary-dark',
  admin: 'bg-primary/10 text-primary-dark',
};

const EMPTY_FORM = { name: '', phone: '', password: '', role: 'designer' };
const EMPTY_INVITE = { email: '', role: 'designer' };

const AdminUsers = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [toast, setToast] = useState(null);
  const [limitError, setLimitError] = useState(null);

  // Modals
  const [modal, setModal] = useState(null); // 'create' | 'edit' | 'password' | 'delete' | 'invite'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' });
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const showToast = (text, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const openCreate = () => { setForm(EMPTY_FORM); setFormError(null); setModal('create'); };
  const openEdit = (u) => { setSelected(u); setForm({ name: u.name, phone: u.phone, role: u.role, isActive: u.is_active }); setFormError(null); setModal('edit'); };
  const openPassword = (u) => { setSelected(u); setPwForm({ newPassword: '', confirm: '' }); setFormError(null); setModal('password'); };
  const openDelete = (u) => { setSelected(u); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setSaving(false); setFormError(null); };

  const openInvite = () => { setInviteForm(EMPTY_INVITE); setFormError(null); setLimitError(null); setModal('invite'); };

  const handleCreate = async () => {
    setFormError(null);
    if (!form.name.trim() || !form.phone.trim() || !form.password) { setFormError(t('adminUsers.errors.allRequired')); return; }
    if (form.password.length < 6) { setFormError(t('adminUsers.errors.passwordTooShort')); return; }
    setSaving(true);
    try {
      await api.post('/users/admin/create', form);
      showToast(t('adminUsers.toast.userCreated'));
      closeModal();
      load();
    } catch (e) {
      if (e.response?.data?.code === 'PLAN_USER_LIMIT_REACHED') {
        setFormError(null);
        setLimitError(e.response.data.error);
        closeModal();
      } else {
        setFormError(e.response?.data?.error || t('adminUsers.errors.generic'));
      }
    }
    setSaving(false);
  };

  const handleInvite = async () => {
    setFormError(null);
    if (!inviteForm.email || !inviteForm.email.includes('@')) {
      setFormError(lang === 'kz' ? 'Жарамды email енгізіңіз' : 'Введите корректный email');
      return;
    }
    setSaving(true);
    try {
      await api.post('/users/admin/invite', inviteForm);
      showToast(lang === 'kz' ? 'Шақыру хаты жіберілді!' : 'Приглашение отправлено!');
      closeModal();
    } catch (e) {
      if (e.response?.data?.code === 'PLAN_USER_LIMIT_REACHED') {
        setFormError(null);
        setLimitError(e.response.data.error);
        closeModal();
      } else {
        setFormError(e.response?.data?.error || t('adminUsers.errors.generic'));
      }
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    setFormError(null);
    if (!form.name.trim()) { setFormError(t('adminUsers.errors.nameRequired')); return; }
    setSaving(true);
    try {
      await api.put(`/users/admin/${selected.id}`, form);
      showToast(t('adminUsers.toast.saved'));
      closeModal();
      load();
    } catch (e) {
      setFormError(e.response?.data?.error || t('adminUsers.errors.generic'));
    }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    setFormError(null);
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) { setFormError(t('adminUsers.errors.passwordTooShort')); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setFormError(t('adminUsers.errors.passwordsMismatch')); return; }
    setSaving(true);
    try {
      await api.post(`/users/admin/${selected.id}/reset-password`, { newPassword: pwForm.newPassword });
      showToast(t('adminUsers.toast.passwordChanged'));
      closeModal();
    } catch (e) {
      setFormError(e.response?.data?.error || t('adminUsers.errors.generic'));
    }
    setSaving(false);
  };

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/users/admin/${u.id}`, { isActive: !u.is_active });
      showToast(u.is_active ? t('adminUsers.toast.deactivated') : t('adminUsers.toast.activated'));
      load();
    } catch { showToast(t('adminUsers.errors.generic'), false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete(`/users/admin/${selected.id}`);
      showToast(t('adminUsers.toast.userDeactivated'));
      closeModal();
      load();
    } catch (e) {
      showToast(e.response?.data?.error || t('adminUsers.errors.generic'), false);
      closeModal();
    }
  };

  const counts = ROLE_VALUES.map(value => ({
    value,
    label: t(`adminUsers.roles.${value}`),
    color: ROLE_COLORS[value],
    count: users.filter(u => u.role === value).length,
  }));
  const roleConfig = (role) => ({
    label: t(`adminUsers.roles.${role}`, role),
    color: ROLE_COLORS[role] || 'bg-muted text-muted-foreground',
  });

  return (
    <div className="bg-background-light min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <Icon name="arrow_back" size={22} />
          </button>
          <h1 className="text-xl font-bold flex-1 min-w-0 truncate">{t('adminUsers.title')}</h1>
          <div className="flex gap-2 shrink-0">
            <button onClick={openInvite} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-2 rounded-xl text-sm font-bold hover:bg-primary/20 transition-all">
              <Icon name="mail" size={18} />
              <span className="hidden sm:inline">{lang === 'kz' ? 'Шақыру' : 'Пригласить'}</span>
            </button>
            <button onClick={openCreate} className="flex items-center gap-1.5 bg-primary text-white px-3 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-all">
              <Icon name="add" size={18} />
              <span className="hidden sm:inline">{t('adminUsers.create')}</span>
            </button>
          </div>
        </div>

        {/* Search + filter */}
        <div className="px-4 pb-3 space-y-2">
          <div className="relative">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('adminUsers.searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-4 px-4">
            <FilterChip active={!filterRole} onClick={() => setFilterRole('')} label={`${t('common.yes')[0] === 'Д' ? 'Все' : 'Барлығы'} (${users.length})`} />
            {counts.map(r => <FilterChip key={r.value} active={filterRole === r.value} onClick={() => setFilterRole(r.value)} label={`${r.label} (${r.count})`} />)}
          </div>
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.text}
        </div>
      )}

      {/* Plan limit error banner */}
      {limitError && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
          <Icon name="workspace_premium" size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-amber-800 font-medium mb-2">{limitError}</p>
            <button
              onClick={() => navigate('/admin/billing')}
              className="text-xs font-bold text-amber-700 underline underline-offset-2"
            >
              {lang === 'kz' ? 'Тарифті көру →' : 'Посмотреть тариф →'}
            </button>
          </div>
          <button onClick={() => setLimitError(null)} className="text-amber-400 hover:text-amber-600">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      <main className="p-4 max-w-7xl mx-auto">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Icon name="person_search" size={40} className="mx-auto mb-3 opacity-40" />
            <p>{t('adminUsers.noUsers')}</p>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden lg:block bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-bold text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3">{t('adminUsers.table.user')}</th>
                <th className="px-4 py-3">{t('adminUsers.table.contact')}</th>
                <th className="px-4 py-3">{t('adminUsers.table.role')}</th>
                <th className="px-4 py-3">{t('adminUsers.table.status')}</th>
                <th className="px-4 py-3">{t('adminUsers.table.created')}</th>
                <th className="px-4 py-3 text-right">{t('adminUsers.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => {
                const rc = roleConfig(u.role);
                return (
                  <tr key={u.id} className={`hover:bg-muted transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`size-9 rounded-full flex items-center justify-center flex-shrink-0 ${u.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                          <span className={`text-sm font-bold ${u.is_active ? 'text-primary' : 'text-muted-foreground'}`}>
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <p className="font-bold text-foreground">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{u.phone || u.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${rc.color}`}>{rc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_active
                        ? <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-semibold">{t('adminUsers.statuses.active')}</span>
                        : <span className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-600 font-semibold">{t('adminUsers.statuses.deactivated')}</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title={t('common.edit')}>
                          <Icon name="edit" size={16} />
                        </button>
                        <button onClick={() => openPassword(u)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" title={lang === 'kz' ? 'Құпия сөзді өзгерту' : 'Сменить пароль'}>
                          <Icon name="lock" size={16} />
                        </button>
                        <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded-lg ${u.is_active ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-green-50 text-green-500'}`}>
                          <Icon name={u.is_active ? 'block' : 'check_circle'} size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden grid grid-cols-1 gap-3">
        {filtered.map(u => {
          const rc = roleConfig(u.role);
          return (
            <div key={u.id} className={`bg-card rounded-2xl shadow-sm border p-4 transition-all ${!u.is_active ? 'opacity-50 border-border' : 'border-border'}`}>
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`size-12 rounded-full flex items-center justify-center flex-shrink-0 ${u.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                  <span className={`text-lg font-bold ${u.is_active ? 'text-primary' : 'text-muted-foreground'}`}>
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-foreground">{u.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${rc.color}`}>{rc.label}</span>
                    {!u.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">{t('adminUsers.statuses.deactivated')}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{u.phone || u.email || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('ru-RU') : ''}
                  </p>
                </div>

                {/* Actions menu */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => openEdit(u)} aria-label={t('common.edit')} className="size-10 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                    <Icon name="edit" size={18} />
                  </button>
                  <button onClick={() => openPassword(u)} aria-label={lang === 'kz' ? 'Құпия сөзді өзгерту' : 'Сменить пароль'} className="size-10 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                    <Icon name="lock" size={18} />
                  </button>
                  <button onClick={() => handleToggleActive(u)} aria-label={u.is_active ? (lang === 'kz' ? 'Өшіру' : 'Деактивировать') : (lang === 'kz' ? 'Қосу' : 'Активировать')} className={`size-10 flex items-center justify-center rounded-lg ${u.is_active ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-green-50 text-green-500'}`}>
                    <Icon name={u.is_active ? 'block' : 'check_circle'} size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </main>

      <BottomNav />

      {modal === 'create' && (
        <ModalBase title={t('adminUsers.modals.createTitle')} onClose={closeModal}>
          <UserForm form={form} setForm={setForm} showPassword error={formError} t={t} />
          <ModalFooter onClose={closeModal} onSave={handleCreate} saving={saving} saveLabel={t('adminUsers.modals.createLabel')} t={t} />
        </ModalBase>
      )}

      {modal === 'edit' && selected && (
        <ModalBase title={`${t('adminUsers.modals.editTitle')}: ${selected.name}`} onClose={closeModal}>
          <UserForm form={form} setForm={setForm} error={formError} t={t} />
          <div className="flex items-center justify-between py-3 border-t border-border">
            <div>
              <p className="font-medium text-sm">{t('adminUsers.statuses.active')}</p>
            </div>
            <button
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 size-5 bg-card rounded-full shadow transition-transform ${form.isActive !== false ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <ModalFooter onClose={closeModal} onSave={handleEdit} saving={saving} saveLabel={t('adminUsers.modals.saveLabel')} t={t} />
        </ModalBase>
      )}

      {modal === 'password' && selected && (
        <ModalBase title={`${t('adminUsers.modals.resetPasswordTitle')}: ${selected.name}`} onClose={closeModal}>
          {formError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mb-4">{formError}</p>}
          {[
            { label: t('adminUsers.fields.newPassword'), key: 'newPassword' },
            { label: t('adminUsers.fields.confirmPassword'), key: 'confirm' },
          ].map(f => (
            <div key={f.key} className="mb-3">
              <label className="text-sm font-semibold text-foreground block mb-1">{f.label}</label>
              <input type="password" value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full px-4 py-3 border border-border rounded-xl focus:border-primary outline-none" />
            </div>
          ))}
          <ModalFooter onClose={closeModal} onSave={handleResetPassword} saving={saving} saveLabel={t('adminUsers.modals.changeLabel')} t={t} />
        </ModalBase>
      )}

      {modal === 'delete' && selected && (
        <ModalBase title={t('adminUsers.modals.deactivateTitle')} onClose={closeModal}>
          <div className="text-center py-2">
            <div className="size-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="person_off" size={24} className="text-red-500" />
            </div>
            <p className="text-muted-foreground text-sm">
              <span className="font-bold">{selected.name}</span> — {t('adminUsers.modals.deactivateConfirm')}
            </p>
          </div>
          <ModalFooter onClose={closeModal} onSave={handleDelete} saving={saving} saveLabel={t('adminUsers.modals.deactivateLabel')} danger t={t} />
        </ModalBase>
      )}

      {modal === 'invite' && (
        <ModalBase title={lang === 'kz' ? 'Email арқылы шақыру' : 'Пригласить по email'} onClose={closeModal}>
          <p className="text-sm text-muted-foreground mb-4">
            {lang === 'kz'
              ? 'Қызметкер сілтеме арқылы тіркеліп, пароль қояды.'
              : 'Сотрудник зарегистрируется по ссылке и сам задаст пароль.'}
          </p>
          {formError && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mb-4">{formError}</p>}
          <div className="mb-3">
            <label className="text-sm font-semibold text-foreground block mb-1">Email</label>
            <input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="ivan@example.com"
              autoFocus
              className="w-full px-4 py-3 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="text-sm font-semibold text-foreground block mb-1">{t('adminUsers.fields.role')}</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_VALUES.map((value) => (
                <button
                  key={value}
                  onClick={() => setInviteForm((f) => ({ ...f, role: value }))}
                  className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${inviteForm.role === value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-border'}`}
                >
                  {t(`adminUsers.roles.${value}`)}
                </button>
              ))}
            </div>
          </div>
          <ModalFooter
            onClose={closeModal}
            onSave={handleInvite}
            saving={saving}
            saveLabel={lang === 'kz' ? 'Шақыру жіберу' : 'Отправить приглашение'}
            t={t}
          />
        </ModalBase>
      )}
    </div>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────────

const FilterChip = ({ active, onClick, label }) => (
  <button onClick={onClick} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted'}`}>
    {label}
  </button>
);

const ModalBase = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
    <div className="bg-card rounded-2xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <h3 className="text-lg font-bold mb-5">{title}</h3>
      {children}
    </div>
  </div>
);

const UserForm = ({ form, setForm, showPassword = false, error, t }) => {
  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));
  return (
    <>
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl mb-4">{error}</p>}
      {[
        { label: t('adminUsers.fields.fullName'), key: 'name', type: 'text', placeholder: t('adminUsers.fields.fullNamePlaceholder') },
        { label: t('adminUsers.fields.login'), key: 'phone', type: 'text', placeholder: t('adminUsers.fields.loginPlaceholder') },
        ...(showPassword ? [{ label: t('adminUsers.fields.password'), key: 'password', type: 'password', placeholder: t('adminUsers.fields.passwordPlaceholder') }] : []),
      ].map(field => (
        <div key={field.key} className="mb-3">
          <label className="text-sm font-semibold text-foreground block mb-1">{field.label}</label>
          <input
            type={field.type}
            value={form[field.key] || ''}
            onChange={e => f(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-4 py-3 border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
      ))}
      <div className="mb-4">
        <label className="text-sm font-semibold text-foreground block mb-1">{t('adminUsers.fields.role')}</label>
        <div className="grid grid-cols-3 gap-2">
          {ROLE_VALUES.map(value => (
            <button key={value} onClick={() => f('role', value)}
              className={`py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.role === value ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-border'}`}>
              {t(`adminUsers.roles.${value}`)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

const ModalFooter = ({ onClose, onSave, saving, saveLabel, danger = false, t }) => (
  <div className="flex gap-3 mt-2">
    <button onClick={onClose} className="flex-1 py-3 bg-muted text-foreground font-bold rounded-xl hover:bg-muted">{t ? t('common.cancel') : 'Cancel'}</button>
    <button onClick={onSave} disabled={saving} className={`flex-1 py-3 text-white font-bold rounded-xl disabled:opacity-50 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:brightness-110'}`}>
      {saving ? (t ? t('adminUsers.modals.saving') : 'Loading…') : saveLabel}
    </button>
  </div>
);

export default AdminUsers;
