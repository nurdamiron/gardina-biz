import React from 'react';

/**
 * Shared button primitive. Replaces ~71 hand-written `bg-primary text-white …`
 * instances that drifted in padding/radius/shadow/disabled treatment.
 *
 * Variants:
 *  - primary    brand-filled call to action
 *  - secondary  white surface, bordered (neutral action)
 *  - ghost      text-only, hover tint (tertiary)
 *  - danger     quiet destructive (text-danger, soft hover) — does NOT compete with primary
 *  - dangerSolid solid red (use only for confirmed, isolated destructive flows)
 *
 * Sizes: sm | md | lg. Supports `loading`, `disabled`, `fullWidth`, leading `icon`.
 * Standardize on rounded-xl; reserve rounded-full for pills/FAB/segmented controls.
 */
const VARIANTS = {
  primary:
    'bg-primary text-primary-content shadow-card hover:brightness-110 active:scale-[0.98] disabled:bg-neutral-soft disabled:text-text-secondary disabled:shadow-none',
  secondary:
    'bg-surface-light text-text-main border border-border-light hover:border-primary/40 hover:bg-background-light active:scale-[0.98] disabled:text-text-secondary',
  ghost:
    'text-text-secondary hover:bg-background-light hover:text-text-main active:scale-[0.98] disabled:text-text-secondary',
  danger:
    'text-danger hover:bg-danger-soft active:scale-[0.98] disabled:text-text-secondary',
  dangerSolid:
    'bg-danger text-white shadow-card hover:brightness-110 active:scale-[0.98] disabled:bg-neutral-soft disabled:text-text-secondary disabled:shadow-none',
};

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const Button = React.forwardRef(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled = false, icon = null, type = 'button', className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all disabled:cursor-not-allowed disabled:active:scale-100 ${SIZES[size]} ${VARIANTS[variant] || VARIANTS.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {!loading && icon}
      {children}
    </button>
  );
});

export default Button;
