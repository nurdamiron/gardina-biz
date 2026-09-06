import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetCard from './WidgetCard';
import Icon from '../../common/Icon';
import { useI18n } from '../../../contexts/I18nContext';
import { formatMoney, formatMoneyShort, money } from '../../../utils/money';

/**
 * Money at risk — deals still on `pending`/`partial` payment, oldest first.
 *
 * Backed by GET /analytics/payment-risks, which returns
 * { orderId, clientName, amount, daysOverdue, riskLevel } and buckets the risk
 * at >14 days (high) and >7 days (medium).
 */
const RISK_STYLES = {
    high: 'bg-danger-soft text-danger',
    medium: 'bg-warning-soft text-warning',
    low: 'bg-muted text-muted-foreground',
};

const PaymentRisksWidget = ({ risks, loading }) => {
    const { t, lang } = useI18n();
    const navigate = useNavigate();

    const items = useMemo(() => (Array.isArray(risks) ? risks : []), [risks]);
    const totalAtRisk = useMemo(
        () => items.reduce((sum, r) => sum + money(r.amount), 0),
        [items]
    );
    const highCount = useMemo(
        () => items.filter((r) => r.riskLevel === 'high').length,
        [items]
    );

    return (
        <WidgetCard
            title={t('adminDashboard.widgets.paymentRisks.title')}
            icon="account_balance_wallet"
            loading={loading}
            isEmpty={items.length === 0}
            emptyIcon="check_circle"
            emptyText={t('adminDashboard.widgets.paymentRisks.empty')}
            action={items.length ? { label: t('adminDashboard.widgets.paymentRisks.action'), onClick: () => navigate('/admin/orders') } : undefined}
            badge={
                items.length > 0 && (
                    <span className="text-sm font-black text-danger whitespace-nowrap">
                        {formatMoneyShort(totalAtRisk, lang)}
                    </span>
                )
            }
        >
            {highCount > 0 && (
                <p className="text-[11px] text-danger font-semibold mb-2 flex items-center gap-1">
                    <Icon name="warning" size={13} />
                    {t('adminDashboard.widgets.paymentRisks.overdue', { count: highCount })}
                </p>
            )}

            <ul className="divide-y divide-border -mx-1">
                {items.slice(0, 5).map((risk) => (
                    <li key={risk.orderId}>
                        <button
                            type="button"
                            onClick={() => navigate(`/admin/orders?order=${risk.orderId}`)}
                            className="w-full px-1 py-2 flex items-center gap-2.5 text-left hover:bg-muted rounded-lg transition-colors group"
                        >
                            <span className={`shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums ${RISK_STYLES[risk.riskLevel] || RISK_STYLES.low}`}>
                                {risk.daysOverdue}{t('adminDashboard.widgets.paymentRisks.daysShort')}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {risk.clientName || '—'}
                                </span>
                            </span>
                            <span className="text-xs font-bold text-foreground tabular-nums whitespace-nowrap">
                                {formatMoney(risk.amount)}
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </WidgetCard>
    );
};

export default PaymentRisksWidget;
