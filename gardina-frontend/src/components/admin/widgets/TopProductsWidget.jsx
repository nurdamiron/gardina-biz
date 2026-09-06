import React from 'react';
import { useNavigate } from 'react-router-dom';
import WidgetCard from './WidgetCard';
import { useI18n } from '../../../contexts/I18nContext';
import { formatMoneyShort, money } from '../../../utils/money';

/**
 * Best-selling products by revenue.
 * Backed by GET /analytics/top-products → [{ id, name, type, totalSold,
 * totalRevenue, timesOrdered, rank }], already limited server-side.
 */
const TopProductsWidget = ({ products, loading }) => {
    const { t, lang } = useI18n();
    const navigate = useNavigate();

    const items = Array.isArray(products) ? products : [];
    const maxRevenue = Math.max(...items.map((p) => money(p.totalRevenue)), 1);

    return (
        <WidgetCard
            title={t('adminDashboard.widgets.topProducts.title')}
            icon="inventory_2"
            loading={loading}
            isEmpty={items.length === 0}
            emptyIcon="inventory"
            emptyText={t('adminDashboard.widgets.topProducts.empty')}
            action={{ label: t('adminDashboard.widgets.topProducts.action'), onClick: () => navigate('/admin/catalog') }}
        >
            <ul className="space-y-2.5">
                {items.map((product) => {
                    const revenue = money(product.totalRevenue);
                    return (
                        <li key={product.id}>
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                                <span className="text-xs font-semibold text-foreground truncate min-w-0">
                                    {product.name}
                                </span>
                                <span className="text-xs font-bold text-foreground tabular-nums whitespace-nowrap">
                                    {formatMoneyShort(revenue, lang)}
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${Math.max(4, (revenue / maxRevenue) * 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                                {t('adminDashboard.widgets.topProducts.orders', { count: product.timesOrdered })}
                            </p>
                        </li>
                    );
                })}
            </ul>
        </WidgetCard>
    );
};

export default TopProductsWidget;
