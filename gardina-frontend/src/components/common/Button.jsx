import React from 'react';

/**
 * Button primitive — shadcn/ui styled.
 *
 * Variants (shadcn names + back-compat aliases for the ~71 existing call sites):
 *  - default / primary    brand-filled call to action
 *  - secondary            muted grey fill (low-emphasis action)
 *  - outline              bordered surface (neutral action — old "secondary")
 *  - ghost                text-only, muted hover (tertiary)
 *  - destructive          quiet destructive (text-destructive, soft hover) — old "danger"
 *  - destructiveSolid     solid red (confirmed, isolated destructive flows) — old "dangerSolid"
 *  - link                 inline text link
 *
 * Sizes: sm | md (default) | lg | icon. Supports `loading`, `disabled`, `fullWidth`, leading `icon`.
 */
const VARIANTS = {
  default:
    'bg-primary text-primary-content shadow-sm hover:bg-primary/90 active:scale-[0.98] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none',
  secondary:
    'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]',
  outline:
    'border border-input bg-surface-light text-text-main shadow-sm hover:bg-muted hover:text-text-main active:scale-[0.98]',
  ghost:
    'text-text-secondary hover:bg-muted hover:text-text-main active:scale-[0.98]',
  destructive:
    'text-destructive hover:bg-destructive/10 active:scale-[0.98]',
  destructiveSolid:
    'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none',
  link: 'text-primary underline-offset-4 hover:underline',

  // ── Back-compat aliases ──
  primary: null, // resolved below → default
  danger: null, // → destructive
  dangerSolid: null, // → destructiveSolid
};
VARIANTS.primary = VARIANTS.default;
VARIANTS.danger = VARIANTS.destructive;
VARIANTS.dangerSolid = VARIANTS.destructiveSolid;

const SIZES = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2',
  icon: 'size-10 gap-0',
};

const Button = React.forwardRef(function Button(
  { variant = 'default', size = 'md', fullWidth = false, loading = false, disabled = false, icon = null, type = 'button', className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center whitespace-nowrap font-medium rounded-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${SIZES[size] || SIZES.md} ${VARIANTS[variant] || VARIANTS.default} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {!loading && icon}
      {children}
    </button>
  );
});

export default Button;
