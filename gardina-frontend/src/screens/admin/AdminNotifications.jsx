import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import BottomNav from '../../components/navigation/BottomNav';
import Icon from '../../components/common/Icon';
import { useI18n } from '../../contexts/I18nContext';

const ROLE_VALUES = ['', 'admin', 'manager', 'designer'];

const TYPE_STYLES = {
  info:    { color: 'bg-primary/15 text-primary-dark',  icon: 'info' },
  success: { color: 'bg-green-100 text-green-700',      icon: 'check_circle' },
  warning: { color: 'bg-amber-100 text-amber-700',      icon: 'warning' },
  error:   { color: 'bg-red-100 text-red-700',          icon: 'error' },
};

const AdminNotifications = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState('send'); // 'send' | 'history' | 'stats'
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Send form
  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'info',
    targetRole: '',
    targetUserId: '',
    sendPush: true,
    actionUrl: '',
  });
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);

  const showToast = (text, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/admin/stats');
      setStats(res.data.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/admin/all?limit=50&offset=0');
      setHistory(res.data.data || []);
      setHistoryTotal(res.data.total || 0);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  useEffect(() => {
    if (tab === 'history') loadHistory();
    if (tab === 'stats') loadStats();
  }, [tab]);

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      showToast('Тақырып және мәтін міндетті', false);
      return;
    }
    setSending(true);
    try {
      const payload = { ...form };
      if (!payload.targetUserId) delete payload.targetUserId;
      if (!payload.targetRole) delete payload.targetRole;
      if (!payload.actionUrl) delete payload.actionUrl;

      const res = await api.post('/notifications/admin/broadcast', payload);
      const { sent, pushSent } = res.data.data;
      showToast(`✓ ${sent} пайдаланушыға жіберілді${pushSent ? `, push: ${pushSent}` : ''}`);
      setForm({ title: '', body: '', type: 'info', targetRole: '', targetUserId: '', sendPush: true, actionUrl: '' });
      loadStats();
    } catch (e) {
      showToast(e.response?.data?.error || 'Қате орын алды', false);
    }
    setSending(false);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/admin/${id}`);
      setHistory(h => h.filter(n => n.id !== id));
      showToast('Хабарлама өшірілді');
    } catch {
      showToast('Өшіру мүмкін болмады', false);
    }
  };

  const fmt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) +
      ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-background-light min-h-screen pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <Icon name="arrow_back" size={22} />
          </button>
          <h1 className="text-xl font-bold flex-1">{t('adminNotifications.title')}</h1>
          {stats && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
              {stats.activePushSubscriptions} push
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex px-4 pb-3 gap-2">
          {[
            { key: 'send', label: t('adminNotifications.tabs.send'), icon: 'notifications_active' },
            { key: 'history', label: t('adminNotifications.tabs.history'), icon: 'view_agenda' },
            { key: 'stats', label: t('adminNotifications.tabs.stats'), icon: 'bar_chart' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                tab === t.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${toast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.text}
        </div>
      )}

      <main className="p-4 max-w-5xl mx-auto space-y-4">

        {/* ── SEND TAB ─────────────────────────────────────── */}
        {tab === 'send' && (
          <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-5 lg:items-start space-y-4 lg:space-y-0">

            {/* LEFT: compose form */}
            <div className="space-y-4">
              {/* Recipient */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Icon name="group" className="text-primary" size={20} />
                  {t('adminNotifications.sections.recipients')}
                </h2>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">{t('adminNotifications.sections.recipients')}</label>
                  <select
                    value={form.targetRole}
                    onChange={e => setForm(f => ({ ...f, targetRole: e.target.value, targetUserId: '' }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                  >
                    {ROLE_VALUES.map(value => (
                      <option key={value || 'all'} value={value}>
                        {t(`adminNotifications.recipientFilters.${value || 'all'}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">—</label>
                  <select
                    value={form.targetUserId}
                    onChange={e => setForm(f => ({ ...f, targetUserId: e.target.value, targetRole: '' }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                  >
                    <option value="">—</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Icon name="edit" className="text-primary" size={20} />
                  {t('adminNotifications.sections.message')}
                </h2>

                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(TYPE_STYLES).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setForm(f => ({ ...f, type: key }))}
                      className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all ${
                        form.type === key ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <Icon name={cfg.icon} size={18} className={form.type === key ? 'text-primary' : 'text-gray-400'} />
                      <span className="text-xs font-medium">{t(`adminNotifications.types.${key}`)}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">{t('adminNotifications.fields.title')} *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder={t('adminNotifications.fields.titlePlaceholder')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">{t('adminNotifications.fields.body')} *</label>
                  <textarea
                    value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    placeholder={t('adminNotifications.fields.bodyPlaceholder')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">{t('adminNotifications.fields.actionUrl')}</label>
                  <input
                    type="text"
                    value={form.actionUrl}
                    onChange={e => setForm(f => ({ ...f, actionUrl: e.target.value }))}
                    placeholder="/manager/orders"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Icon name="notifications" size={20} className="text-gray-500" />
                    <p className="font-medium text-sm">{t('adminNotifications.fields.sendPush')}</p>
                  </div>
                  <button
                    onClick={() => setForm(f => ({ ...f, sendPush: !f.sendPush }))}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.sendPush ? 'bg-primary' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 size-5 bg-white rounded-full shadow transition-transform duration-300 ${form.sendPush ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Mobile-only preview */}
              {(form.title || form.body) && (
                <div className={`lg:hidden rounded-2xl p-4 border-2 ${TYPE_STYLES[form.type]?.color?.split(' ')[0] || 'bg-gray-50'} border-gray-100`}>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">{t('adminNotifications.sections.preview')}</p>
                  <div className="flex items-start gap-3">
                    <Icon name={TYPE_STYLES[form.type]?.icon || 'notifications'} size={20} className={TYPE_STYLES[form.type]?.color?.split(' ')[1] || ''} />
                    <div>
                      <p className="font-bold text-gray-900">{form.title || '—'}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{form.body || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSend}
                disabled={sending || !form.title.trim() || !form.body.trim()}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending
                  ? <><div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('adminNotifications.sending')}</>
                  : <><Icon name="notifications_active" />{t('adminNotifications.send')}</>}
              </button>
            </div>

            {/* RIGHT: preview + stats (desktop only) */}
            <div className="hidden lg:flex flex-col gap-4 sticky top-20">
              {/* Live preview */}
              <div className={`rounded-2xl p-4 border-2 ${TYPE_STYLES[form.type]?.color?.split(' ')[0] || 'bg-gray-50'} border-gray-100`}>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-3">{t('adminNotifications.sections.preview')}</p>
                <div className="flex items-start gap-3">
                  <div className={`size-9 rounded-full ${TYPE_STYLES[form.type]?.color?.split(' ')[0] || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                    <Icon name={TYPE_STYLES[form.type]?.icon || 'notifications'} size={18} className={TYPE_STYLES[form.type]?.color?.split(' ')[1] || 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{form.title || <span className="text-gray-300">Тақырып...</span>}</p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-3">{form.body || <span className="text-gray-300">Мәтін...</span>}</p>
                    {form.actionUrl && (
                      <p className="text-xs text-primary mt-1 font-medium">{form.actionUrl}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-2 text-xs text-gray-400">
                  <Icon name={form.sendPush ? 'notifications_active' : 'notifications_off'} size={14} />
                  <span>{form.sendPush ? 'Push + in-app' : 'Тек in-app'}</span>
                  {(form.targetRole || form.targetUserId) && (
                    <span className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {form.targetUserId ? '1 адам' : form.targetRole}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats mini */}
              {stats && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Статистика</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Барлық хабарлама', value: stats.total, icon: 'notifications', color: 'text-primary' },
                      { label: 'Оқылмаған', value: stats.unread, icon: 'mark_unread_chat_alt', color: 'text-amber-500' },
                      { label: 'Push белсенді', value: stats.activePushSubscriptions, icon: 'install_mobile', color: 'text-green-600' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name={s.icon} size={16} className={s.color} />
                          <span className="text-sm text-gray-600">{s.label}</span>
                        </div>
                        <span className="font-bold text-gray-900">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────── */}
        {tab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{t('common.total')}: <span className="font-bold text-gray-800">{historyTotal}</span></p>
              <button onClick={loadHistory} className="p-2 rounded-full hover:bg-gray-100">
                <Icon name="refresh" size={18} className="text-gray-500" />
              </button>
            </div>

            {loading && <div className="flex justify-center py-8"><div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}

            {!loading && history.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Icon name="notifications_off" size={40} className="mx-auto mb-3 opacity-40" />
                <p>{t('notifications.empty')}</p>
              </div>
            )}

            {history.map(n => {
              const cfg = TYPE_STYLES[n.type] || TYPE_STYLES.info;
              return (
                <div key={n.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className={`size-9 rounded-full ${cfg.color.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                      <Icon name={cfg.icon} size={18} className={cfg.color.split(' ')[1]} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-gray-900 text-sm truncate">{n.title}</p>
                        {!n.is_read && <span className="size-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{n.message || n.body}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Icon name="person" size={12} />
                        <span>{n.user_name || n.user_id}</span>
                        <span>({n.user_role})</span>
                        <span className="ml-auto">{fmt(n.created_at)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Icon name="delete" size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── STATS TAB ─────────────────────────────────────── */}
        {tab === 'stats' && (
          <div className="space-y-4">
            {loading && <div className="flex justify-center py-8"><div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}

            {stats && (
              <>
                {/* Overview cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Барлық хабарлама', value: stats.total, icon: 'notifications', color: 'bg-primary/10 text-primary' },
                    { label: 'Оқылмаған', value: stats.unread, icon: 'notifications_active', color: 'bg-amber-50 text-amber-600' },
                    { label: 'Push белсенді', value: stats.activePushSubscriptions, icon: 'install_mobile', color: 'bg-green-50 text-green-600' },
                    { label: 'Оқылды', value: stats.total - stats.unread, icon: 'check_circle', color: 'bg-primary/5 text-primary' },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                      <div className={`size-10 rounded-full ${s.color.split(' ')[0]} flex items-center justify-center mb-3`}>
                        <Icon name={s.icon} size={20} className={s.color.split(' ')[1]} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* By type */}
                {stats.byType?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Icon name="bar_chart" size={18} className="text-primary" />
                      {t('adminNotifications.sections.byType')}
                    </h3>
                    <div className="space-y-2">
                      {stats.byType.map(t => {
                        const cfg = TYPE_STYLES[t.type] || TYPE_STYLES.info;
                        const pct = Math.round((t.count / stats.total) * 100);
                        return (
                          <div key={t.type}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <div className="flex items-center gap-2">
                                <Icon name={cfg.icon} size={14} className={cfg.color.split(' ')[1]} />
                                <span className="font-medium">{cfg.label}</span>
                              </div>
                              <span className="text-gray-500">{t.count}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Recent activity */}
                {stats.recentActivity?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Icon name="timeline" size={18} className="text-primary" />
                      {t('adminNotifications.sections.recent7d')}
                    </h3>
                    <div className="space-y-2">
                      {stats.recentActivity.map(a => (
                        <div key={a.date} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{new Date(a.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${Math.min(a.count * 4, 80)}px` }} />
                            <span className="font-bold text-gray-800 w-6 text-right">{a.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default AdminNotifications;
