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
    <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={handleBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <Icon name="arrow_back" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {rightContent}
          {showNotifications && <NotificationCenter />}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
