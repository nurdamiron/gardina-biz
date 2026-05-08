import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import BottomNav from '../components/navigation/BottomNav';
import Icon from '../components/common/Icon';

const ManagerClientsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
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
    <div className="bg-background-light min-h-screen pb-24">
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

      <main className="p-4 space-y-3">
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
          filteredClients.map(client => (
            <div
              key={client.id}
              onClick={() => navigate(`${basePath}/clients/${client.id}`)}
              className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-bold">{client.name}</p>
                  <p className="text-sm text-text-secondary">{client.phone}</p>
                  {client.address && (
                    <p className="text-xs text-gray-400 mt-1">{client.address}</p>
                  )}
                </div>
                <Icon name="chevron_right" className="text-gray-400" />
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ManagerClientsList;
