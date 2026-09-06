import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetCard from './WidgetCard';
import { useI18n } from '../../../contexts/I18nContext';

/**
 * Compact sales funnel for the overview.
 *
 * Deliberately does NOT reuse <FunnelChart/> with the raw API payload:
 * GET /analytics/client-funnel ships Tailwind class names as data
 * (`bg-indigo-500`, `bg-purple-500`, …) and Tailwind v4 only emits classes it
 * finds in source, so those stages render with no fill at all. It also
 * hardcodes Kazakh stage labels, which then leak into the RU UI. Both are
 * solved here by keying off the stage order the endpoint guarantees.
 */
const STAGE_KEYS = ['leads', 'meetings', 'proposals', 'contracts', 'completed'];

const STAGE_COLORS = [
    'bg-primary',
    'bg-primary/85',
    'bg-primary/70',
    'bg-primary/55',
    'bg-accent',
];

const FunnelWidget = ({ funnel, loading }) => {
    const { t } = useI18n();
    const navigate = useNavigate();

    const stages = Array.isArray(funnel) ? funnel : [];
    const top = stages[0]?.value || 0;
    const last = stages[stages.length - 1]?.value || 0;
    const totalConversion = top > 0 ? Math.round((last / top) * 100) : 0;
    const hasVolume = stages.some((stage) => stage.value > 0);

    return (
        <WidgetCard
            title={t('adminDashboard.widgets.funnel.title')}
            icon="filter_alt"
            loading={loading}
            isEmpty={!hasVolume}
            emptyIcon="filter_alt"
            emptyText={t('adminDashboard.widgets.funnel.empty')}
            action={{ label: t('adminDashboard.widgets.funnel.action'), onClick: () => navigate('/deals/funnel') }}
            badge={
                hasVolume && (
                    <span className="text-sm font-black text-primary tabular-nums">{totalConversion}%</span>
                )
            }
        >
            <ul className="space-y-2">
                {stages.map((stage, idx) => {
                    const width = top > 0 ? Math.max(6, (stage.value / top) * 100) : 0;
                    const share = top > 0 ? Math.round((stage.value / top) * 100) : 0;
                    return (
                        <li key={STAGE_KEYS[idx] || idx}>
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                                <span className="text-xs font-semibold text-foreground truncate min-w-0">
                                    {t(`adminDashboard.widgets.funnel.stages.${STAGE_KEYS[idx] || idx}`, stage.label)}
                                </span>
                                <span className="text-xs font-bold text-foreground tabular-nums whitespace-nowrap">
                                    {stage.value}
                                    <span className="ml-1.5 font-medium text-muted-foreground">{share}%</span>
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${STAGE_COLORS[idx % STAGE_COLORS.length]}`}
                                    style={{ width: `${width}%` }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </WidgetCard>
    );
};

export default FunnelWidget;
