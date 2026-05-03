import React from 'react';
import Icon from '../common/Icon';

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
    // Найти максимальное значение для масштабирования
    const maxValue = Math.max(...data.map(item => item.value), 1);

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
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                {title && <div className="h-6 w-40 bg-gray-200 rounded mb-4 animate-pulse"></div>}
                <div className="flex items-end justify-between gap-2" style={{ height }}>
                    {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex-1 bg-gray-200 rounded-t animate-pulse"
                             style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                {title && <h3 className="font-bold text-gray-900 mb-4">{title}</h3>}
                <div className="flex items-center justify-center" style={{ height }}>
                    <p className="text-gray-400">Деректер жоқ</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            {title && (
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                                    <span className="font-medium text-gray-700">{item.label}</span>
                                    {showValues && (
                                        <span className="font-bold text-gray-900">
                                            {formatValue(item.value)}
                                        </span>
                                    )}
                                </div>
                                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
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
                                        <span className="text-xs font-bold text-gray-700 mb-1">
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
                    <div className="flex justify-between gap-2 pt-2 border-t border-gray-200">
                        {data.map((item, index) => (
                            <div key={index} className="flex-1 text-center">
                                <span className="text-xs text-gray-600 font-medium">
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