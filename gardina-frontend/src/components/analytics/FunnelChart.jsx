import React from 'react';
import Icon from '../common/Icon';
import { useI18n } from '../../contexts/I18nContext';
import { pluralize, NOUNS } from '../../utils/plural';

/**
 * FunnelChart - Компонент воронки продаж
 * @param {Object} props
 * @param {Array} props.data - Массив данных [{label, value, color}]
 * @param {string} props.title - Заголовок воронки
 * @param {boolean} props.showPercentage - Показывать проценты
 * @param {boolean} props.showValues - Показывать значения
 * @param {string} props.orientation - Ориентация (vertical/horizontal)
 * @param {string} props.valueFormat - Формат значений
 */
const FunnelChart = ({
    data = [],
    title,
    showPercentage = true,
    showValues = true,
    orientation = 'vertical',
    valueFormat = 'number',
    loading = false
}) => {
    const { t, lang } = useI18n();
    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                {title && <div className="h-6 w-40 bg-muted rounded mb-4 animate-pulse"></div>}
                <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="h-12 bg-muted rounded animate-pulse"
                             style={{ width: `${100 - i * 15}%` }}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                {title && <h3 className="font-bold text-foreground mb-4">{title}</h3>}
                <div className="flex items-center justify-center h-48">
                    <p className="text-muted-foreground">{t('dashboard.funnelChart.noData')}</p>
                </div>
            </div>
        );
    }

    const maxValue = Math.max(...data.map(item => item.value), 1);
    const totalValue = data[0]?.value || maxValue;

    const formatValue = (value) => {
        switch(valueFormat) {
            case 'currency':
                return `${value.toLocaleString()} ₸`;
            case 'deals':
                return pluralize(value, NOUNS.deal, lang);
            default:
                return value.toLocaleString();
        }
    };

    if (orientation === 'horizontal') {
        // Горизонтальная воронка
        return (
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                {title && (
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <Icon name="filter_alt" className="text-primary" />
                        {title}
                    </h3>
                )}

                <div className="space-y-3">
                    {data.map((item, index) => {
                        const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                        const widthPercentage = (item.value / maxValue) * 100;

                        return (
                            <div key={index} className="relative">
                                {/* Label and value */}
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        {showValues && (
                                            <span className="text-sm font-bold text-foreground">
                                                {formatValue(item.value)}
                                            </span>
                                        )}
                                        {showPercentage && (
                                            <span className="text-xs text-muted-foreground">
                                                ({percentage.toFixed(0)}%)
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Bar */}
                                <div className="h-10 bg-muted rounded-lg overflow-hidden">
                                    <div
                                        className={`h-full ${item.color || 'bg-primary'} transition-all duration-500`}
                                        style={{ width: `${widthPercentage}%` }}
                                    />
                                </div>

                                {/* Conversion rate */}
                                {index > 0 && (
                                    <div className="text-right mt-1">
                                        <span className="text-xs text-muted-foreground">
                                            {t('dashboard.funnelChart.conversion')}: {data[index-1].value > 0 ? ((item.value / data[index-1].value) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Вертикальная воронка (классическая)
    return (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            {title && (
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="filter_alt" className="text-primary" />
                    {title}
                </h3>
            )}

            <div className="space-y-2">
                {data.map((item, index) => {
                    const percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
                    const widthPercentage = 100 - (index * (80 / data.length));

                    return (
                        <div key={index} className="relative">
                            <div
                                className={`${item.color || 'bg-primary'} rounded-lg p-4 transition-all duration-500 hover:opacity-90 mx-auto`}
                                style={{
                                    width: `${widthPercentage}%`,
                                    opacity: 1 - (index * 0.1)
                                }}
                            >
                                <div className="flex items-center justify-between text-white">
                                    <span className="font-bold">{item.label}</span>
                                    <div className="flex items-center gap-3">
                                        {showValues && (
                                            <span className="font-black text-lg">
                                                {formatValue(item.value)}
                                            </span>
                                        )}
                                        {showPercentage && (
                                            <span className="text-sm opacity-90">
                                                {percentage.toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Conversion arrow */}
                            {index < data.length - 1 && (
                                <div className="flex justify-center my-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon name="arrow_downward" size={16} />
                                        <span className="text-xs font-medium">
                                            {((data[index + 1].value / item.value) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('dashboard.funnelChart.totalConversion')}</span>
                    <span className="text-lg font-black text-primary">
                        {totalValue > 0 ? ((data[data.length - 1].value / totalValue) * 100).toFixed(1) : 0}%
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FunnelChart;