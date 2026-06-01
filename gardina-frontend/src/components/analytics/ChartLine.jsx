import React from 'react';
import Icon from '../common/Icon';
import EmptyState from '../common/EmptyState';
import { useI18n } from '../../contexts/I18nContext';

/**
 * ChartLine - Компонент для отображения линейного графика
 * @param {Object} props
 * @param {Array} props.data - Массив данных [{label, value}]
 * @param {string} props.title - Заголовок графика
 * @param {number} props.height - Высота графика в пикселях
 * @param {string} props.color - Цвет линии
 * @param {boolean} props.showDots - Показывать точки на линии
 * @param {boolean} props.showGrid - Показывать сетку
 * @param {string} props.valueFormat - Формат значений (number/currency/percent)
 */
const ChartLine = ({
    data = [],
    title,
    height = 200,
    color = 'stroke-primary',
    showDots = true,
    showGrid = true,
    valueFormat = 'number',
    loading = false
}) => {
    const { t } = useI18n();
    if (loading) {
        return (
            <div className="bg-surface-light rounded-2xl p-5 shadow-card border border-border-light">
                {title && <div className="h-6 w-40 bg-background-light rounded mb-4 animate-pulse"></div>}
                <div style={{ height }} className="bg-background-light rounded animate-pulse"></div>
            </div>
        );
    }

    // Меньше 2 ненулевых точек — линия выродится в "спайк". Показываем пустое состояние.
    const nonZeroCount = data.filter(item => item.value > 0).length;
    if (data.length === 0 || nonZeroCount < 2) {
        return (
            <div className="bg-surface-light rounded-2xl p-5 shadow-card border border-border-light">
                {title && (
                    <h3 className="font-bold text-text-main mb-2 flex items-center gap-2">
                        <Icon name="show_chart" className="text-primary" />
                        {title}
                    </h3>
                )}
                <EmptyState size="sm" icon="show_chart" title={t('reports.notEnoughData', 'Недостаточно данных')} subtitle={t('reports.notEnoughDataHint', 'Появится после первых сделок')} />
            </div>
        );
    }

    // Рассчитать минимальное и максимальное значения
    const values = data.map(item => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Создать точки для SVG пути
    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((item.value - minValue) / range) * 100;
        return { x, y, ...item };
    });

    // Создать путь для линии
    const pathData = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

    // Создать область под линией для градиента
    const areaPath = `${pathData} L ${points[points.length - 1].x} 100 L 0 100 Z`;

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

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            {title && (
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon name="show_chart" className="text-primary" />
                    {title}
                </h3>
            )}

            <div className="relative" style={{ height }}>
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(45, 106, 79)" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="rgb(45, 106, 79)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {showGrid && (
                        <g className="stroke-gray-200" strokeWidth="0.2">
                            {[0, 25, 50, 75, 100].map(y => (
                                <line key={y} x1="0" y1={y} x2="100" y2={y} />
                            ))}
                            {data.map((_, index) => {
                                const x = (index / (data.length - 1)) * 100;
                                return <line key={index} x1={x} y1="0" x2={x} y2="100" />;
                            })}
                        </g>
                    )}

                    {/* Area under line */}
                    <path
                        d={areaPath}
                        fill="url(#gradient)"
                        className="opacity-50"
                    />

                    {/* Line */}
                    <path
                        d={pathData}
                        fill="none"
                        className={color}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Dots */}
                    {showDots && points.map((point, index) => (
                        <g key={index}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="1.5"
                                className="fill-white stroke-primary"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                            {/* Tooltip on hover */}
                            <title>{`${point.label}: ${formatValue(point.value)}`}</title>
                        </g>
                    ))}
                </svg>

                {/* Value labels */}
                <div className="absolute inset-0 pointer-events-none">
                    {points.map((point, index) => {
                        // Anchor edge labels inside the plot so the ₸ glyph isn't clipped.
                        const xAnchor = index === 0 ? 'translate-x-0' : index === points.length - 1 ? '-translate-x-full' : '-translate-x-1/2';
                        return (
                            <div
                                key={index}
                                className={`absolute whitespace-nowrap text-[10px] font-bold text-gray-700 transform ${xAnchor} -translate-y-full`}
                                style={{
                                    left: `${point.x}%`,
                                    top: `${point.y}%`
                                }}
                            >
                                {formatValue(point.value)}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                {data.map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 font-medium">
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChartLine;