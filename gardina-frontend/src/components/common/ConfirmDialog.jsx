import React from 'react';
import Icon from './Icon';

/**
 * Custom Confirm Dialog Component
 * Replaces window.confirm with beautiful modal
 */
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Иә', cancelText = 'Жоқ', type = 'warning' }) => {
  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      bg: 'from-orange-500 to-orange-600',
      icon: 'warning',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      confirmBtn: 'bg-orange-500 hover:bg-orange-600'
    },
    danger: {
      bg: 'from-red-500 to-red-600',
      icon: 'error',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBtn: 'bg-red-500 hover:bg-red-600'
    },
    info: {
      bg: 'from-primary to-primary-dark',
      icon: 'info',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
      confirmBtn: 'bg-primary hover:brightness-110'
    }
  };

  const style = typeStyles[type] || typeStyles.warning;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${style.bg} px-6 py-4 rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <div className={`size-12 rounded-full ${style.iconBg} flex items-center justify-center`}>
              <Icon name={style.icon} size={24} className={style.iconColor} />
            </div>
            <h3 className="text-xl font-bold text-white">{title || 'Растау'}</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-6 py-3 ${style.confirmBtn} text-white font-bold rounded-xl transition-all shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
