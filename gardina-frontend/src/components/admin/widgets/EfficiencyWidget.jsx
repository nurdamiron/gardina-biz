import React from 'react';
import WidgetCard from './WidgetCard';
import Icon from '../../common/Icon';
import { useI18n } from '../../../contexts/I18nContext';
import { formatMoneyShort, money } from '../../../utils/money';

/**
 * Operational health in four numbers.
 * Backed by GET /analytics/team-efficiency → { averageMeasurementTime,
 * conversionRate, averageCheck, customerSatisfaction }.
 *
 * Note: the endpoint substitutes defaults (2.5h, rating 4.5) when a period has
 * no rows, so a fresh organisation sees those rather than zeros.
 */
const EfficiencyWidget = ({ efficiency, loading }) => {
    const { t, lang } = useI18n();

    const metrics = efficiency
        ? [
            {
                icon: 'schedule',
                label: t('adminDashboard.widgets.efficiency.avgTime'),
                value: `${efficiency.averageMeasurementTime}${t('adminDashboard.widgets.efficiency.hoursShort')}`,
            },
            {
                icon: 'percent',
                label: t('adminDashboard.widgets.efficiency.conversion'),
                value: `${efficiency.conversionRate}%`,
            },
            {
                icon: 'payments',
                label: t('adminDashboard.widgets.efficiency.avgCheck'),
                value: formatMoneyShort(money(efficiency.averageCheck), lang),
            },
            {
                icon: 'star',
                label: t('adminDashboard.widgets.efficiency.satisfaction'),
                value: efficiency.customerSatisfaction,
            },
        ]
        : [];

    return (
        <WidgetCard
            title={t('adminDashboard.widgets.efficiency.title')}
            icon="monitoring"
            loading={loading}
            isEmpty={!efficiency}
            emptyIcon="analytics"
            emptyText={t('adminDashboard.widgets.efficiency.empty')}
        >
            <dl className="grid grid-cols-2 gap-2">
                {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-xl border border-border px-3 py-2.5">
                        <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground leading-tight">
                            <Icon name={metric.icon} size={13} className="text-primary shrink-0" />
                            <span className="truncate">{metric.label}</span>
                        </dt>
                        <dd className="text-lg font-black text-foreground leading-none mt-1.5 tabular-nums">
                            {metric.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </WidgetCard>
    );
};

export default EfficiencyWidget;
