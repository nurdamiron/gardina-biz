import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Icon from './Icon';

const PWAInstallPrompt = () => {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install prompt after 3 seconds
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now());
  };

  // Check if dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        setShowPrompt(false);
      }
    }
  }, []);

  // Never show on the login page — would overlap the submit button
  if (location.pathname === '/login') return null;
  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="pwa-install-prompt fixed bottom-24 left-4 right-4 z-50 animate-slideUp">
      <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-4 shadow-2xl border-2 border-white/20 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Icon name="download" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Қосымшаны орнату</h3>
            <p className="text-sm opacity-90 mb-3">
              Gardina қосымшасын телефоныңызға орнатыңыз және тез қол жеткізу алыңыз!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 bg-white text-primary font-bold py-2 px-4 rounded-xl hover:bg-white/90 transition-all"
              >
                Орнату
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <Icon name="close" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default PWAInstallPrompt;
