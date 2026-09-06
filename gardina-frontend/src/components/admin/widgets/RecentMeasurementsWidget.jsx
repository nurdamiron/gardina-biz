import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetCard from './WidgetCard';
import Icon from '../../common/Icon';
import { useI18n } from '../../../contexts/I18nContext';

/**
 * Latest measurements.
 *
 * Replaces the two near-identical copies the overview used to carry (one
 * `lg:hidden` showing 3 rows, one `hidden lg:flex` showing 7) — same markup,
 * one source.
 */
const STATUS_DOT = {
    completed: 'bg-success',
    in_progress: 'bg-warning',
    scheduled: 'bg-primary',
};

// 4 rows keeps this card level with Сегодня and Деньги на риске beside it;
// at 6 it towered over them and left a hole in the row.
const RecentMeasurementsWidget = ({ measurements = [], loading, limit = 4 }) => {
    const { t } = useI18n();
    const navigate = useNavigate();

    const items = measurements.slice(0, limit);

    return (
        <WidgetCard
            title={t('adminDashboard.widgets.recent.title')}
            icon="straighten"
            loading={loading}
            isEmpty={items.length === 0}
            emptyText={t('adminDashboard.widgets.recent.empty')}
            action={{ label: t('adminDashboard.widgets.recent.action'), onClick: () => navigate('/measurements') }}
        >
            <ul className="divide-y divide-border -mx-1">
                {items.map((m) => (
                    <li key={m.id}>
                        <button
                            type="button"
                            onClick={() => navigate(`/measurements/${m.id}`)}
                            className="w-full px-1 py-2 flex items-center gap-2.5 text-left hover:bg-muted rounded-lg transition-colors group"
                        >
                            <span className={`size-2 rounded-full shrink-0 ${STATUS_DOT[m.status] || 'bg-zinc-300'}`} />
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

export default RecentMeasurementsWidget;
