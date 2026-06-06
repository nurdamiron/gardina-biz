import React from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import Icon from './Icon';

/**
 * Page Header Component with back button and notification center
 */
const PageHeader = ({
  title,
  subtitle,
  showBack = false,
  showNotifications = true,
  rightContent,
  onBack
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="Назад"
              className="size-9 -ml-1 inline-flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon name="arrow_back" size={20} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-lg font-semibold tracking-tight text-foreground truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {rightContent}
          {showNotifications && <NotificationCenter />}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
