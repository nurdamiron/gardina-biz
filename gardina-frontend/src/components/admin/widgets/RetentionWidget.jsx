import React from 'react';
import WidgetCard from './WidgetCard';
import Icon from '../../common/Icon';
import { useI18n } from '../../../contexts/I18nContext';

/**
 * Repeat-business share for the current period.
 * Backed by GET /analytics/client-retention → { currentMonth, previousMonth,
 * trend, trendValue, returningClients, newClients }, where currentMonth is a
 * whole percent.
 */
const RetentionWidget = ({ retention, loading }) => {
    const { t } = useI18n();

    const percent = Number(retention?.currentMonth) || 0;
    const isUp = retention?.trend === 'up';
    const returning = Number(retention?.returningClients) || 0;
    const fresh = Number(retention?.newClients) || 0;

    return (
        <WidgetCard
            title={t('adminDashboard.widgets.retention.title')}
            icon="handshake"
            loading={loading}
            isEmpty={!retention}
            emptyIcon="groups"
            emptyText={t('adminDashboard.widgets.retention.empty')}
        >
            <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-foreground leading-none tabular-nums">{percent}%</span>
                {retention?.trendValue && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold pb-1 ${isUp ? 'text-success' : 'text-danger'}`}>
                        <Icon name={isUp ? 'arrow_upward' : 'arrow_downward'} size={13} />
                        {retention.trendValue}
                    </span>
                )}
            </div>

            <div className="h-2 rounded-full bg-muted overflow-hidden mt-3">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, percent)}%` }} />
            </div>

            <div className="flex items-center justify-between mt-2.5 text-[11px]">
                <span className="text-muted-foreground">
                    {t('adminDashboard.widgets.retention.returning')}
                    <strong className="ml-1 text-foreground tabular-nums">{returning}</strong>
                </span>
                <span className="text-muted-foreground">
                    {t('adminDashboard.widgets.retention.new')}
                    <strong className="ml-1 text-foreground tabular-nums">{fresh}</strong>
                </span>
            </div>
        </WidgetCard>
    );
};

export default RetentionWidget;
