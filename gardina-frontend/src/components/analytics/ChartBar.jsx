import React from 'react';
import Icon from '../common/Icon';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../contexts/I18nContext';

/**
 * ChartBar - Компонент для отображения столбчатой диаграммы
 * @param {Object} props
 * @param {Array} props.data - Массив данных [{label, value, color}]
 * @param {string} props.title - Заголовок графика
 * @param {number} props.height - Высота графика в пикселях
 * @param {boolean} props.showValues - Показывать значения на столбцах
 * @param {boolean} props.horizontal - Горизонтальная ориентация
 * @param {string} props.valueFormat - Формат значений (number/currency/percent)
 */
const ChartBar = ({
    data = [],
    title,
    height = 200,
    showValues = true,
    horizontal = false,
    valueFormat = 'number',
    loading = false
}) => {
    const { t } = useI18n();
    // Найти максимальное значение для масштабирования
    const maxValue = Math.max(...data.map(item => item.value), 1);
    // Пустые ИЛИ все нулевые данные → честное пустое состояние, а не нулевые столбики
    const isEmpty = data.length === 0 || data.every(item => !(item.value > 0));

    const formatValue = (value) => {
        switch(valueFormat) {
            case 'currency':
                return `${value.toLocaleString()} ₸`;
            case 'percent':
                return `${value}%`;
            default:
                return value.toLocaleString();
        }
    };

    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
                {title && <div className="h-6 w-40 bg-muted rounded mb-4 animate-pulse"></div>}
                <div className="flex items-end justify-between gap-2" style={{ height }}>
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex-1 bg-muted rounded-t animate-pulse"
                             style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="bg-surface-light rounded-2xl p-5 shadow-card border border-border-light">
                {title && (
                    <h3 className="font-bold text-text-main mb-2 flex items-center gap-2">
                        <Icon name="bar_chart" className="text-primary" />
                        {title}
                    </h3>
                )}
                <EmptyState size="sm" icon="bar_chart" title={t('reports.noDataPeriod', 'Нет данных за период')} />
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
            {title && (
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                    <Icon name="bar_chart" className="text-primary" />
                    {title}
                </h3>
            )}

            {horizontal ? (
                // Горизонтальная диаграмма
                <div className="space-y-3">
                    {data.map((item, index) => {
                        const percentage = (item.value / maxValue) * 100;
                        return (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-foreground">{item.label}</span>
                                    {showValues && (
                                        <span className="font-bold text-foreground">
                                            {formatValue(item.value)}
                                        </span>
                                    )}
                                </div>
                                <div className="h-8 bg-muted rounded-lg overflow-hidden">
                                    <div
                                        className={`h-full ${item.color || 'bg-primary'} transition-all duration-500 rounded-lg`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Вертикальная диаграмма
                <>
                    <div className="flex items-end justify-between gap-2 mb-2" style={{ height }}>
                        {data.map((item, index) => {
                            const percentage = (item.value / maxValue) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center justify-end">
                                    {showValues && (
                                        <span className="text-xs font-bold text-foreground mb-1">
                                            {formatValue(item.value)}
                                        </span>
                                    )}
                                    <div
                                        className={`w-full ${item.color || 'bg-primary'} rounded-t-lg transition-all duration-500 hover:opacity-80`}
                                        style={{ height: `${percentage}%` }}
                                        title={`${item.label}: ${formatValue(item.value)}`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    {/* Labels */}
                    <div className="flex justify-between gap-2 pt-2 border-t border-border">
                        {data.map((item, index) => (
                            <div key={index} className="flex-1 text-center">
                                <span className="text-xs text-muted-foreground font-medium">
                                    {item.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ChartBar;