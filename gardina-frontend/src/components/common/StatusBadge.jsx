import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { getStatusTone } from '../../utils/statusLabels';

/**
 * Single source of truth for status pills across the app.
 *
 * Replaces the ~7 divergent per-file status→color maps (DealDetail, DealsFunnel,
 * OrdersList, OrderDetailModal, AdminDashboard, …). Tone comes from the canonical
 * STATUS_TONE map; the label is localized via i18n (`orders.status.<status>`),
 * so a stage looks and reads the same everywhere.
 *
 * Props:
 *  - status: canonical status enum (drives tone + label)
 *  - label:  optional override (else localized from status)
 *  - tone:   optional override ('success'|'warning'|'danger'|'info'|'neutral')
 *  - size:   'sm' | 'md' (default 'md')
 *  - dot:    show a leading status dot (default false)
 */
const TONE_CLASSES = {
  success: 'bg-success-soft text-success dark:bg-success/15',
  warning: 'bg-warning-soft text-warning dark:bg-warning/15',
  danger: 'bg-danger-soft text-danger dark:bg-danger/15',
  info: 'bg-info-soft text-info dark:bg-info/15',
  neutral: 'bg-neutral-soft text-neutral dark:bg-neutral/15',
};

const DOT_CLASSES = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-neutral',
};

const StatusBadge = ({ status, label, tone, size = 'md', dot = false, className = '' }) => {
  const { t } = useI18n();
  const resolvedTone = tone || getStatusTone(status);
  const text = label ?? t(`orders.status.${status}`, status);
  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${sizeCls} ${TONE_CLASSES[resolvedTone] || TONE_CLASSES.neutral} ${className}`}
    >
      {dot && <span className={`size-1.5 rounded-full ${DOT_CLASSES[resolvedTone] || DOT_CLASSES.neutral}`} />}
      {text}
    </span>
  );
};

export default StatusBadge;
