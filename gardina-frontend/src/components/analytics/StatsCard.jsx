import React from 'react';
import Icon from '../common/Icon';

/**
 * StatsCard - Универсальная карточка для отображения статистики
 * @param {Object} props
 * @param {string} props.title - Заголовок метрики
 * @param {string|number} props.value - Основное значение
 * @param {string} props.subtitle - Подзаголовок или описание
 * @param {string} props.icon - Material icon название
 * @param {string} props.trend - Тренд (up/down/neutral)
 * @param {string|number} props.trendValue - Значение тренда
 * @param {string} props.color - Цвет фона карточки
 * @param {string} props.iconBg - Цвет фона иконки
 * @param {function} props.onClick - Обработчик клика
 */
const StatsCard = ({
    title,
    value,
    subtitle,
    icon = 'trending_up',
    trend,
    trendValue,
    color = 'bg-white',
    iconBg = 'bg-primary',
    onClick,
    loading = false
}) => {
    const getTrendIcon = () => {
        switch(trend) {
            case 'up': return 'trending_up';
            case 'down': return 'trending_down';
            default: return 'trending_flat';
        }
    };

    const getTrendColor = () => {
        switch(trend) {
            case 'up': return 'text-green-600';
            case 'down': return 'text-red-600';
            default: return 'text-gray-500';
        }
    };

    if (loading) {
        return (
            <div className={`${color} rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse`}>
                <div className="flex items-start justify-between mb-3">
                    <div className="size-12 rounded-full bg-gray-200"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
                <div className="h-8 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
        );
    }

    return (
        <div
            className={`${color} rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className={`size-12 rounded-full ${iconBg} text-white flex items-center justify-center`}>
                    <Icon name={icon} size={24} />
                </div>

                {/* Trend indicator */}
                {trend && trendValue && (
                    <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                        <Icon name={getTrendIcon()} size={18} />
                        <span className="text-sm font-bold">{trendValue}</span>
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="mb-2">
                <p className="text-3xl font-black text-gray-900">{value}</p>
            </div>

            {/* Title and subtitle */}
            <div>
                <p className="text-sm font-bold text-gray-700">{title}</p>
                {subtitle && (
                    <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                )}
            </div>
        </div>
    );
};

export default StatsCard;