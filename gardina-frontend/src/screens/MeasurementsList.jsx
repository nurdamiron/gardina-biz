import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import BottomNav from '../components/navigation/BottomNav';
import { SkeletonCard } from '../components/common/Skeleton';
import { formatTime24 } from '../utils/dateUtils';
import Icon from '../components/common/Icon';

const MeasurementsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { measurements: allMeasurements, loadData, refreshData } = useApp();
  const [activeTab, setActiveTab] = useState('planned');
  const [loading, setLoading] = useState(false);

  const loadMeasurements = useCallback(async (force = false) => {
    try {
      setLoading(true);
      if (force) {
        await refreshData();
      } else {
        await loadData();
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  }, [loadData, refreshData, user.id]);

  useEffect(() => {
    loadMeasurements(true);
  }, [loadMeasurements]);

  // Обновление при возвращении в окно (чтобы статус был актуальный)
  useEffect(() => {
    const onFocus = () => loadMeasurements(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadMeasurements]);

  // Filter measurements based on active tab
  const measurements = allMeasurements.filter((m) => {
    if (activeTab === 'planned') return m.status !== 'completed';
    if (activeTab === 'completed') return m.status === 'completed';
    return true;
  });

  const basePath = user?.role === 'manager' ? '/manager/measurements' : '/designer/measurements';

  const handleViewDetails = (id) => {
    navigate(`${basePath}/${id}`);
  };

  const handleStart = (id, e) => {
    e.stopPropagation();
    navigate(`${basePath}/${id}`);
  };

  const groupByDate = (items) => {
    const now = new Date();
    const today = now.toDateString();
    const tomorrow = new Date(Date.now() + 86400000).toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const todayItems = items.filter(m => new Date(m.scheduledAt).toDateString() === today);
    const tomorrowItems = items.filter(m => new Date(m.scheduledAt).toDateString() === tomorrow);
    const yesterdayItems = items.filter(m => new Date(m.scheduledAt).toDateString() === yesterday);
    const futureItems = items.filter(m => {
      const date = new Date(m.scheduledAt);
      return date > now && date.toDateString() !== today && date.toDateString() !== tomorrow;
    });

    return {
      today: todayItems,
      tomorrow: tomorrowItems,
      yesterday: yesterdayItems,
      future: futureItems,
    };
  };

  const grouped = groupByDate(measurements);

  const getDateLabel = (dateString) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const tomorrow = new Date(Date.now() + 86400000).toDateString();

    const months = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
    const weekdays = ['Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі'];

    const fullDate = `${date.getDate()} ${months[date.getMonth()]}`;

    if (date.toDateString() === today) {
      return { label: 'Бүгін', subLabel: fullDate, color: 'text-green-600' };
    }
    if (date.toDateString() === tomorrow) {
      return { label: 'Ертең', subLabel: fullDate, color: 'text-primary' };
    }

    const daysDiff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7 && daysDiff > 0) {
      return {
        label: weekdays[date.getDay()],
        subLabel: fullDate,
        color: 'text-primary'
      };
    }

    return {
      label: fullDate,
      subLabel: weekdays[date.getDay()],
      color: 'text-gray-700'
    };
  };

  const MeasurementCard = ({ measurement }) => {
    const isPriorityHigh = measurement.priority === 'high';
    const dateInfo = getDateLabel(measurement.scheduledAt);

    return (
      <div
        onClick={() => handleViewDetails(measurement.id)}
        className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100/50 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer active:scale-[0.99]"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">#{measurement.id.slice(0, 6)}</span>
              {isPriorityHigh && (
                <div className="flex items-center gap-1 bg-red-500 px-1.5 py-0.5 rounded text-[10px] font-bold text-white animate-pulse">
                  <Icon name="local_fire_department" size={12} />
                  ШҰҒЫЛ
                </div>
              )}
            </div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary transition-colors">
              {measurement.clientName || 'Клиент'}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
              measurement.status === 'completed'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : measurement.status === 'in_progress'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-primary/10 text-primary-dark border border-primary/25'
            }`}>
              {measurement.status === 'scheduled'
                ? 'Жоспарланған'
                : measurement.status === 'in_progress'
                  ? 'Орындалуда'
                  : measurement.status === 'completed'
                    ? 'Аяқталды'
                    : measurement.status}
            </span>
          </div>
        </div>

        {/* Scheduled Date & Time */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-2.5 rounded-lg border border-primary/15 flex-1">
            <Icon name="event" size={18} className="text-primary" />
            <div className="flex flex-col">
              <span className={`font-bold text-sm ${dateInfo.color}`}>{dateInfo.label}</span>
              {dateInfo.subLabel && (
                <span className="text-[10px] text-gray-500">{dateInfo.subLabel}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-2.5 rounded-lg border border-primary/20">
            <Icon name="schedule" size={18} className="text-primary" />
            <span className="font-bold text-primary text-sm">{formatTime24(measurement.scheduledAt)}</span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 bg-gray-50/50 p-2 rounded-lg">
          <Icon name="location_on" size={18} />
          <span className="line-clamp-1 font-medium">{measurement.address}</span>
        </div>

        {/* Room Type & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Бөлме</p>
            <p className="text-sm font-semibold text-gray-700 line-clamp-1">
              {measurement.roomType || '---'}
            </p>
          </div>
          {measurement.status === 'scheduled' && (
            <button
              onClick={(e) => handleStart(measurement.id, e)}
              className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center gap-1"
            >
              <Icon name="play_arrow" size={18} />
              Бастау
            </button>
          )}
          {measurement.status === 'completed' && (
            <div className="flex items-center gap-1 text-green-600">
              <Icon name="check_circle" />
              <span className="text-sm font-bold">Аяқталды</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-background-light min-h-screen flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Өлшемдер</h1>
          <button onClick={loadMeasurements} className="size-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors">
            <Icon name="refresh" className="text-gray-600" />
          </button>
        </div>

        <div className="mt-3">
          <div className="flex p-1 bg-gray-200 rounded-lg">
            <button
              onClick={() => setActiveTab('planned')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-semibold ${activeTab === 'planned' ? 'bg-white shadow-sm' : 'text-gray-500'
                }`}
            >
              Жоспарланған
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium ${activeTab === 'completed' ? 'bg-white shadow-sm' : 'text-gray-500'
                }`}
            >
              Аяқталған
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : measurements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Icon name="event_busy" className="text-gray-300 text-8xl" />
            <h3 className="text-xl font-bold mt-4">Өлшем жоқ</h3>
            <p className="text-text-secondary mt-2 text-center px-4">
              Жаңа тапсырмалар менеджерден келеді
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {measurements.map(m => (
              <MeasurementCard key={m.id} measurement={m} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MeasurementsList;
