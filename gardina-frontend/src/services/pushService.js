import api from './api';

/**
 * Push Notification Service for Frontend
 */

/**
 * Detect iOS device
 */
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Check if running as installed PWA (standalone mode)
 */
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

/**
 * iOS push support: requires iOS 16.4+ AND installed PWA
 */
export function isIOSPushReady() {
  if (!isIOS()) return true; // non-iOS: always ready
  if (!isStandalone()) return false; // iOS browser: not ready, needs install
  // Check iOS version >= 16.4
  const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  if (!match) return false;
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  return major > 16 || (major === 16 && minor >= 4);
}

// Listen for SW messages (e.g. PUSH_SUBSCRIPTION_CHANGED → re-subscribe)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', async (event) => {
    if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
      console.log('[Push] Subscription changed, re-subscribing...');
      await subscribeToPush();
    }
  });
}

// Convert URL-safe base64 to Uint8Array (for VAPID key)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator &&
         'PushManager' in window &&
         'Notification' in window;
}

/**
 * Check current notification permission
 */
export function getPermissionStatus() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission; // 'default', 'granted', 'denied'
}

/**
 * Get VAPID public key from server
 */
export async function getVapidKey() {
  try {
    const response = await api.get('/notifications/push/vapid-key');
    return response.data?.data?.publicKey || null;
  } catch (error) {
    console.error('Failed to get VAPID key:', error);
    return null;
  }
}

/**
 * Request notification permission
 */
export async function requestPermission() {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported' };
  }

  try {
    const permission = await Notification.requestPermission();
    return {
      success: permission === 'granted',
      permission,
      error: permission === 'denied' ? 'Permission denied by user' : null
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush() {
  if (!isPushSupported()) {
    return { success: false, error: 'Push not supported' };
  }

  if (Notification.permission !== 'granted') {
    const { success, error } = await requestPermission();
    if (!success) {
      return { success: false, error: error || 'Permission not granted' };
    }
  }

  try {
    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get VAPID key
    const vapidKey = await getVapidKey();
    if (!vapidKey) {
      return { success: false, error: 'Push not configured on server' };
    }

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // Create new subscription if none exists
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });
    }

    // Send subscription to server
    const response = await api.post('/notifications/push/subscribe', {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: arrayBufferToBase64(subscription.getKey('auth'))
      }
    });

    if (response.data?.success) {
      localStorage.setItem('push_subscribed', 'true');
      return { success: true, subscription };
    }

    return { success: false, error: 'Failed to save subscription' };
  } catch (error) {
    console.error('Push subscription failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe locally
      await subscription.unsubscribe();

      // Remove from server
      await api.delete('/notifications/push/unsubscribe', {
        data: { endpoint: subscription.endpoint }
      });
    }

    localStorage.removeItem('push_subscribed');
    return { success: true };
  } catch (error) {
    console.error('Push unsubscribe failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get push subscription status
 */
export async function getPushStatus() {
  try {
    const response = await api.get('/notifications/push/status');
    return response.data?.data || { isSubscribed: false, deviceCount: 0 };
  } catch (error) {
    return { isSubscribed: false, deviceCount: 0 };
  }
}

/**
 * Check if currently subscribed
 */
export async function isSubscribed() {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    return false;
  }
}

/**
 * Send test push notification
 */
export async function sendTestPush() {
  try {
    const response = await api.post('/notifications/test-push');
    return response.data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Show local notification (for testing)
 */
export function showLocalNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body: options.body || '',
        icon: options.icon || '/pwa-192x192.png',
        badge: '/badge-72x72.png',
        ...options
      });
    });
  }
}

export default {
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getPushStatus,
  isSubscribed,
  sendTestPush,
  showLocalNotification
};
