import React from 'react';
import Icon from '../../common/Icon';

/**
 * Shared shell for every admin overview widget.
 *
 * Every widget needs the same four states (loading / empty / error / content)
 * and the same header treatment. Keeping that here means a widget file only
 * describes its own data, and the overview stays visually consistent.
 *
 * @param {string} title - Widget heading
 * @param {string} [icon] - Icon name rendered next to the title
 * @param {React.ReactNode} [badge] - Small node rendered right of the title
 * @param {{label: string, onClick: Function}} [action] - Footer link
 * @param {boolean} [loading] - Show the skeleton instead of children
 * @param {boolean} [isEmpty] - Show the empty state instead of children
 * @param {string} [emptyText] - Copy for the empty state
 * @param {string} [emptyIcon] - Icon for the empty state
 * @param {string} [className] - Extra classes on the outer card
 */
const WidgetCard = ({
    title,
    icon,
    badge,
    action,
    loading = false,
    isEmpty = false,
    emptyText,
    emptyIcon = 'inbox',
    className = '',
    children,
}) => (
    <section className={`bg-card rounded-2xl border border-border shadow-card flex flex-col overflow-hidden ${className}`}>
        <header className="px-4 pt-4 pb-3 flex items-center gap-2">
            {icon && (
                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name={icon} size={16} className="text-primary" />
                </div>
            )}
            <h3 className="text-sm font-bold text-foreground leading-none flex-1 min-w-0 truncate">{title}</h3>
            {badge}
        </header>

        <div className="flex-1 px-4 pb-4 min-w-0">
            {loading ? (
                <div className="space-y-2 pt-1" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="h-9 rounded-lg bg-muted animate-pulse" />
                    ))}
                </div>
            ) : isEmpty ? (
                <div className="py-6 text-center">
                    <Icon name={emptyIcon} size={26} className="mx-auto mb-2 text-muted-foreground opacity-30" />
                    <p className="text-xs text-muted-foreground">{emptyText}</p>
                </div>
            ) : (
                children
            )}
        </div>

        {action && !loading && (
            <div className="border-t border-border px-4 py-2.5">
                <button
                    type="button"
                    onClick={action.onClick}
                    className="w-full text-xs font-semibold text-primary hover:text-primary-dark transition-colors text-center"
                >
                    {action.label} →
                </button>
            </div>
        )}
    </section>
);

export default WidgetCard;
