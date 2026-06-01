import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import BottomNav from '../components/navigation/BottomNav';
import Icon from '../components/common/Icon';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import { formatDate } from '../utils/dateUtils';

// Lead source → pill style (где пришёл клиент видно сразу).
const SOURCE_STYLES = {
  instagram: { label: 'Instagram',     cls: 'bg-pink-50 text-pink-600' },
  whatsapp:  { label: 'WhatsApp',       cls: 'bg-green-50 text-green-700' },
  referral:  { label: 'Рекомендация',   cls: 'bg-amber-50 text-amber-700' },
  website:   { label: 'Сайт',           cls: 'bg-blue-50 text-blue-700' },
  phone:     { label: 'Звонок',         cls: 'bg-gray-100 text-gray-600' },
};

const ManagerClientsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const basePath = user?.role === 'sales' ? '/sales' : user?.role === 'admin' ? '/admin' : '/manager';
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const isSales = user?.role === 'sales';
  const title = isSales ? t('clients.list.leadsTitle') : t('clients.list.title');

  return (
    <div className="bg-background-light min-h-screen pb-32">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <button
            onClick={() => navigate(`${basePath}/client/new`)}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <Icon name="add_circle" size={20} />
            {t('clients.list.add')}
          </button>
        </div>
        <div className="mt-3">
          <div className="relative">
            <Icon name="search" size={20} className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('clients.list.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Icon name="person_off" size={48} className="text-gray-300" />
            <p className="text-text-secondary mt-4">{t('clients.list.empty')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('clients.list.emptyHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClients.map(client => {
              const src = SOURCE_STYLES[client.source];
              return (
              <Card
                key={client.id}
                onClick={() => navigate(`${basePath}/clients/${client.id}`)}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={client.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-text-main truncate">{client.name}</p>
                      {src && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${src.cls}`}>{src.label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary mt-1">
                      <Icon name="call" size={14} className="text-text-secondary/70" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                    {client.address && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                        <Icon name="location_on" size={13} />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>
                  <Icon name="chevron_right" className="text-gray-300 shrink-0 mt-1" />
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
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                        <Icon name="calendar_today" size={12} />
                        <span>{formatDate(client.created_at, lang)}</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ManagerClientsList;
