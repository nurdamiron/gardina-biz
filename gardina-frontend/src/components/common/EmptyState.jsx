import React from 'react';
import Icon from './Icon';
import Button from './Button';

/**
 * Shared empty / no-data / not-found state. Replaces bare centered gray strings
 * ("Замеров пока нет", "Тапсырыс табылмады") and the fake-data look of charts
 * that draw zero-value bars. Use anywhere a list, chart, tab or record is empty.
 *
 * Props:
 *  - icon: Hugeicons name (default 'inbox')
 *  - title: required headline
 *  - subtitle: optional supporting line
 *  - actionLabel + onAction: optional primary CTA
 *  - size: 'sm' (inline, for chart/card bodies) | 'md' (default, for page columns)
 */
const EmptyState = ({ icon = 'inbox', title, subtitle, actionLabel, onAction, actionIcon = 'add', size = 'md', className = '' }) => {
  const sm = size === 'sm';
  return (
    <div className={`flex flex-col items-center justify-center text-center ${sm ? 'py-8 px-4' : 'py-14 px-6'} ${className}`}>
      <div className={`${sm ? 'size-10' : 'size-14'} rounded-full bg-background-light dark:bg-surface-dark flex items-center justify-center mb-3`}>
        <Icon name={icon} size={sm ? 20 : 26} className="text-text-secondary/70" />
      </div>
      <p className={`${sm ? 'text-sm' : 'text-base'} font-semibold text-text-main`}>{title}</p>
      {subtitle && <p className="text-sm text-text-secondary mt-1 max-w-xs">{subtitle}</p>}
      {actionLabel && onAction && (
        <Button size="sm" className="mt-4" icon={<Icon name={actionIcon} size={16} />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
