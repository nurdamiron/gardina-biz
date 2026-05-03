import React, { createContext, useContext, useState } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Icon from '../components/common/Icon';

const UIContext = createContext();

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};

export const UIProvider = ({ children }) => {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Иә',
    cancelText: 'Жоқ',
    type: 'warning'
  });

  const [toast, setToast] = useState({
    isOpen: false,
    message: '',
    type: 'info'
  });

  // Show confirm dialog
  const confirm = ({ title, message, confirmText, cancelText, type }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title: title || 'Растау',
        message,
        confirmText: confirmText || 'Иә',
        cancelText: cancelText || 'Жоқ',
        type: type || 'warning',
        onConfirm: () => {
          resolve(true);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
        onCancel: () => {
          resolve(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      });
    });
  };

  // Show toast notification
  const showToast = (message, type = 'info') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => {
      setToast({ isOpen: false, message: '', type: 'info' });
    }, 3000);
  };

  return (
    <UIContext.Provider value={{ confirm, showToast }}>
      {children}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => confirmDialog.onCancel?.()}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
      />

      {/* Toast Notification */}
      {toast.isOpen && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${
            toast.type === 'success' ? 'bg-green-600 text-white' :
            toast.type === 'error' ? 'bg-red-600 text-white' :
            toast.type === 'warning' ? 'bg-orange-600 text-white' :
            'bg-primary text-white'
          }`}>
            <Icon name={toast.type === 'success' ? 'check_circle' :
               toast.type === 'error' ? 'error' :
               toast.type === 'warning' ? 'warning' :
               'info'} size={24} />
            <span className="font-bold">{toast.message}</span>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};
