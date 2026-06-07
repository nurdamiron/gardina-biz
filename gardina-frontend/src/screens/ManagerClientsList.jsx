import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsAPI, onboardingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import BottomNav from '../components/navigation/BottomNav';
import Icon from '../components/common/Icon';
import Card from '../components/common/Card';
import { Stagger, StaggerItem } from '../components/common/Motion';
import Avatar from '../components/common/Avatar';
import { formatDate } from '../utils/dateUtils';

// Lead source → pill style (где пришёл клиент видно сразу).
const SOURCE_STYLES = {
  instagram: { label: 'Instagram',     cls: 'bg-pink-50 text-pink-600' },
  whatsapp:  { label: 'WhatsApp',       cls: 'bg-green-50 text-green-700' },
  referral:  { label: 'Рекомендация',   cls: 'bg-amber-50 text-amber-700' },
  website:   { label: 'Сайт',           cls: 'bg-blue-50 text-blue-700' },
  phone:     { label: 'Звонок',         cls: 'bg-muted text-muted-foreground' },
};

const ManagerClientsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const basePath = user?.role === 'sales' ? '/sales' : user?.role === 'admin' ? '/admin' : '/manager';
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientsAPI.getAll();
      setClients(response.data.data || []);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // Registration seeds a couple of "(демо)" clients/products so the app isn't
  // empty on first login. Let the admin wipe them in one click.
  const hasDemoData = clients.some(c => c.is_sample);
  const handlePurgeDemo = async () => {
    setPurging(true);
    try {
      await onboardingAPI.purgeSampleData();
      await loadClients();
    } catch (e) {
      // keep the banner; nothing destructive happened
    } finally {
      setPurging(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const isSales = user?.role === 'sales';
  const title = isSales ? t('clients.list.leadsTitle') : t('clients.list.title');

  return (
    <div className="bg-background min-h-screen pb-32">
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          <button
            onClick={() => navigate(`${basePath}/client/new`)}
            className="inline-flex items-center gap-1.5 h-10 px-4 bg-primary text-primary-content rounded-md font-medium text-sm shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Icon name="add_circle" size={18} />
            {t('clients.list.add')}
          </button>
        </div>
        <div className="mt-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon name="search" size={18} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('clients.list.searchPlaceholder')}
            className="w-full h-10 pl-9 pr-4 text-sm bg-transparent border border-input rounded-md transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 outline-none"
          />
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        {/* Demo-data banner — only the admin can purge the seeded sample clients/products */}
        {!loading && hasDemoData && user?.role === 'admin' && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Icon name="info" size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {t('clients.demo.title', 'Бұл демо-деректер')}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {t('clients.demo.hint', 'Тіркелу кезінде үлгі ретінде қосылған. Нақты жұмысты бастар алдында өшіріңіз.')}
              </p>
            </div>
            <button
              onClick={handlePurgeDemo}
              disabled={purging}
              className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 bg-amber-600 text-white rounded-lg font-semibold text-xs hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              <Icon name="delete" size={15} />
              {purging ? t('clients.demo.clearing', 'Тазалануда...') : t('clients.demo.clear', 'Демо-деректерді өшіру')}
            </button>
          </div>
        )}
        {loading ? (
          <div className="text-center py-8">
            <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <Icon name="person_off" size={44} className="text-muted-foreground/40 mx-auto" />
            <p className="text-foreground font-medium mt-4">{t('clients.list.empty')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('clients.list.emptyHint')}</p>
          </div>
        ) : (
          <Stagger className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClients.map(client => {
              const src = SOURCE_STYLES[client.source];
              return (
              <StaggerItem key={client.id}>
              <Card
                className="h-full"
                onClick={() => navigate(`${basePath}/clients/${client.id}`)}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={client.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-text-main truncate">{client.name}</p>
                      {client.is_sample && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">{t('clients.demo.badge', 'демо')}</span>
                      )}
                      {src && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${src.cls}`}>{src.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary mt-1">
                      <Icon name="call" size={14} className="text-text-secondary/70" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                    {client.address && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Icon name="location_on" size={13} />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>
                  <Icon name="chevron_right" className="text-muted-foreground shrink-0 mt-1" />
                </div>

                {(client.notes || client.created_at) && (
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-border-light">
                    {client.notes ? (
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary/80 min-w-0">
                        <Icon name="note" size={13} className="shrink-0" />
                        <span className="truncate">{client.notes}</span>
                      </div>
                    ) : <span />}
                    {client.created_at && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                        <Icon name="calendar_today" size={12} />
                        <span>{formatDate(client.created_at, lang)}</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
              </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ManagerClientsList;
