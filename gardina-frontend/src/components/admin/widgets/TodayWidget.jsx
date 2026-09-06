import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetCard from './WidgetCard';
import Icon from '../../common/Icon';
import { useI18n } from '../../../contexts/I18nContext';
import { formatTime24 } from '../../../utils/dateUtils';

/**
 * "Today" — what actually needs a person today.
 *
 * Derived entirely from data the dashboard already holds (measurements + the
 * leads list fetched for the tab badge), so it costs no extra request.
 */
const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

const TodayWidget = ({ measurements = [], leads = [], loading }) => {
    const { t } = useI18n();
    const navigate = useNavigate();

    const todayMeasurements = useMemo(() => {
        const now = new Date();
        return measurements
            .filter((m) => {
                if (!m.scheduledAt) return false;
                const at = new Date(m.scheduledAt);
                return !Number.isNaN(at.getTime()) && isSameDay(at, now);
            })
            .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    }, [measurements]);

    const newLeads = useMemo(
        () => (Array.isArray(leads) ? leads.filter((l) => l.status === 'new') : []),
        [leads]
    );

    const nothingToday = todayMeasurements.length === 0 && newLeads.length === 0;

    return (
        <WidgetCard
            title={t('adminDashboard.widgets.today.title')}
            icon="today"
            loading={loading}
            isEmpty={nothingToday}
            emptyIcon="event_available"
            emptyText={t('adminDashboard.widgets.today.empty')}
            action={{ label: t('adminDashboard.widgets.today.action'), onClick: () => navigate('/measurements') }}
        >
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-xl bg-primary/5 border border-primary/15 px-3 py-2">
                    <p className="text-xl font-black text-primary leading-none tabular-nums">{todayMeasurements.length}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-1">
                        {t('adminDashboard.widgets.today.measurements')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/admin/dashboard?tab=leads')}
                    className="rounded-xl bg-accent-soft border border-primary/15 px-3 py-2 text-left hover:border-primary/40 transition-colors"
                >
                    <p className="text-xl font-black text-primary-dark leading-none tabular-nums">{newLeads.length}</p>
                    <p className="text-[11px] font-semibold text-muted-foreground mt-1">
                        {t('adminDashboard.widgets.today.newLeads')}
                    </p>
                </button>
            </div>

            <ul className="divide-y divide-border -mx-1">
                {todayMeasurements.slice(0, 4).map((m) => (
                    <li key={m.id}>
                        <button
                            type="button"
                            onClick={() => navigate(`/measurements/${m.id}`)}
                            className="w-full px-1 py-2 flex items-center gap-2.5 text-left hover:bg-muted rounded-lg transition-colors group"
                        >
                            <span className="shrink-0 text-[11px] font-bold text-primary tabular-nums w-9">
                                {formatTime24(m.scheduledAt)}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {m.clientName || '—'}
                                </span>
                                <span className="block text-[11px] text-muted-foreground truncate">{m.address || '—'}</span>
                            </span>
                            <Icon name="chevron_right" size={14} className="text-muted-foreground shrink-0" />
                        </button>
                    </li>
                ))}
            </ul>
        </WidgetCard>
    );
};

export default TodayWidget;
