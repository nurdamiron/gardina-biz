import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetCard from './WidgetCard';
import { useI18n } from '../../../contexts/I18nContext';

/**
 * Where this month's clients came from.
 * Backed by GET /analytics/clients-by-source → [{ source, count, percentage }],
 * already ordered by count and capped at 10 server-side.
 */
const BAR_COLORS = [
    'bg-primary',
    'bg-primary-light',
    'bg-accent',
    'bg-amber-400',
    'bg-zinc-300',
];

const ClientSourcesWidget = ({ sources, loading }) => {
    const { t } = useI18n();
    const navigate = useNavigate();

    const items = (Array.isArray(sources) ? sources : []).slice(0, 5);
    const total = items.reduce((sum, s) => sum + (Number(s.count) || 0), 0);

    return (
        <WidgetCard
            title={t('adminDashboard.widgets.sources.title')}
            icon="share"
            loading={loading}
            isEmpty={items.length === 0}
            emptyIcon="group_add"
            emptyText={t('adminDashboard.widgets.sources.empty')}
            action={{ label: t('adminDashboard.widgets.sources.action'), onClick: () => navigate('/admin/clients') }}
            badge={
                total > 0 && (
                    <span className="text-sm font-black text-foreground tabular-nums">{total}</span>
                )
            }
        >
            {/* Single stacked bar reads the mix faster than five separate rows. */}
            <div className="flex h-2 rounded-full overflow-hidden bg-muted mb-3">
                {items.map((source, idx) => (
                    <div
                        key={source.source}
                        className={BAR_COLORS[idx % BAR_COLORS.length]}
                        style={{ width: `${source.percentage || 0}%` }}
                    />
                ))}
            </div>

            <ul className="space-y-1.5">
                {items.map((source, idx) => (
                    <li key={source.source} className="flex items-center gap-2">
                        <span className={`size-2 rounded-sm shrink-0 ${BAR_COLORS[idx % BAR_COLORS.length]}`} />
                        <span className="text-xs text-foreground truncate flex-1 min-w-0">{source.source}</span>
                        <span className="text-xs font-bold text-muted-foreground tabular-nums whitespace-nowrap">
                            {source.percentage}%
                        </span>
                    </li>
                ))}
            </ul>
        </WidgetCard>
    );
};

export default ClientSourcesWidget;
