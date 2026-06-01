import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

/**
 * Listens for the global `subscription:readonly` event (dispatched by the axios
 * interceptor on a 402 SUBSCRIPTION_READ_ONLY). Shows one clear toast and, for
 * admins, routes to the billing/plan screen so the trial can be renewed —
 * instead of every blocked write failing silently with a raw error.
 */
export default function SubscriptionReadOnlyWatcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useUI();
  const lastShownAt = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      // Throttle: a burst of blocked writes must not stack toasts/redirects.
      const now = Date.now();
      if (now - lastShownAt.current < 4000) return;
      lastShownAt.current = now;

      const msg = e.detail?.error || 'Подписка не активна — обновите тариф';
      showToast(msg, 'error');

      // Only admins can fix billing; send them to the plan screen (avoid a
      // redirect loop if they're already there).
      if (user?.role === 'admin' && location.pathname !== '/onboarding/plan') {
        navigate('/onboarding/plan');
      }
    };

    window.addEventListener('subscription:readonly', handler);
    return () => window.removeEventListener('subscription:readonly', handler);
  }, [user?.role, location.pathname, navigate, showToast]);

  return null;
}
