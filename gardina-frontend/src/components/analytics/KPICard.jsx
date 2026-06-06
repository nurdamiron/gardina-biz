import React from 'react';
import Icon from '../common/Icon';
import { useI18n } from '../../contexts/I18nContext';
import { pluralUnit } from '../../utils/plural';

/**
 * KPICard - Карточка для отображения KPI с прогресс-баром
 * @param {Object} props
 * @param {string} props.title - Название KPI
 * @param {number} props.value - Текущее значение
 * @param {number} props.target - Целевое значение
 * @param {string} props.unit - Единица измерения
 * @param {string} props.period - Период (месяц, квартал, год)
 * @param {string} props.status - Статус выполнения (success/warning/danger)
 * @param {string} props.icon - Material icon
 */
const KPICard = ({
    title,
    value = 0,
    target = 100,
    unit = '',
    unitForms = null,
    period = 'месяц',
    status,
    icon = 'flag',
    loading = false
}) => {
    const { t, lang } = useI18n();
    // Рассчитать процент выполнения
    const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;

    // Если переданы формы склонения — склоняем единицу по числу (RU: 2 замера / 20 замеров).
    const valueUnit = unitForms ? pluralUnit(value, unitForms, lang) : unit;
    const targetUnit = unitForms ? pluralUnit(target, unitForms, lang) : unit;

    // Определить статус автоматически если не задан
    const getStatus = () => {
        if (status) return status;
        if (percentage >= 100) return 'success';
        if (percentage >= 70) return 'warning';
        return 'danger';
    };

    const currentStatus = getStatus();

    // Цвета для статусов
    const statusColors = {
        success: {
            bg: 'bg-green-500',
            text: 'text-green-600',
            light: 'bg-green-50',
            border: 'border-green-200'
        },
        warning: {
            bg: 'bg-yellow-500',
            text: 'text-yellow-600',
            light: 'bg-yellow-50',
            border: 'border-yellow-200'
        },
        danger: {
            bg: 'bg-red-500',
            text: 'text-red-600',
            light: 'bg-red-50',
            border: 'border-red-200'
        }
    };

    const colors = statusColors[currentStatus] || statusColors.warning;

    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border animate-pulse">
                <div className="flex items-start justify-between mb-4">
                    <div className="h-6 w-32 bg-muted rounded"></div>
                    <div className="size-10 bg-muted rounded-full"></div>
                </div>
                <div className="space-y-3">
                    <div className="h-8 w-24 bg-muted rounded"></div>
                    <div className="h-2 bg-muted rounded-full"></div>
                    <div className="h-4 w-40 bg-muted rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-card rounded-2xl p-5 shadow-sm border ${colors.border}`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-bold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{period}</p>
                </div>
                <div className={`size-10 rounded-full ${colors.light} ${colors.text} flex items-center justify-center`}>
                    <Icon name={icon} size={20} />
                </div>
            </div>

            {/* Value */}
            <div className="mb-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-foreground">
                        {value.toLocaleString()}
                    </span>
                    {valueUnit && <span className="text-sm font-medium text-muted-foreground">{valueUnit}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {t('dashboard.kpiCard.outOf', { target: target.toLocaleString(), unit: targetUnit })}
                </p>
            </div>

            {/* Progress bar */}
            <div className="mb-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colors.bg} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <span className={`text-2xl font-black ${colors.text}`}>
                    {percentage.toFixed(0)}%
                </span>
                <div className="flex items-center gap-1">
                    {currentStatus === 'success' && (
                        <>
                            <Icon name="check_circle" size={18} className="text-green-600" />
                            <span className="text-xs font-bold text-green-600">{t('dashboard.kpiCard.done')}</span>
                        </>
                    )}
                    {currentStatus === 'warning' && (
                        <>
                            <Icon name="warning" size={18} className="text-yellow-600" />
                            <span className="text-xs font-bold text-yellow-600">{t('dashboard.kpiCard.inProgress')}</span>
                        </>
                    )}
                    {currentStatus === 'danger' && (
                        <>
                            <Icon name="error" size={18} className="text-red-600" />
                            <span className="text-xs font-bold text-red-600">{t('dashboard.kpiCard.behind')}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KPICard;