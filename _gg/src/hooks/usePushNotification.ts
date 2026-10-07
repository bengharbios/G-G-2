/* ═══════════════════════════════════════════════════════════════════════
   usePushNotification — Client-side Web Push subscription hook

   Features:
   - Registers Service Worker if not already registered
   - Subscribes to push with VAPID keys
   - Manages permission state (default, granted, denied)
   - Provides UI controls for enabling/disabling push
   - Auto-sends subscription to server for storage
   - Handles edge cases (iOS Safari limited support, multiple tabs)

   Usage:
   const push = usePushNotification({ userId });
   push.requestPermission();   // Request + subscribe
   push.unsubscribe();         // Remove subscription
   push.isSupported;           // Browser supports push?
   push.permissionStatus;      // 'default' | 'granted' | 'denied'
   ═══════════════════════════════════════════════════════════════════════ */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePushNotificationConfig {
  userId?: string;   // Required for subscribing — user must be logged in
}

interface UsePushNotificationReturn {
  /** Whether browser supports push notifications */
  isSupported: boolean;
  /** Current permission state */
  permissionStatus: NotificationPermission | 'unsupported';
  /** Whether currently subscribing */
  isLoading: boolean;
  /** Whether user has an active push subscription */
  isSubscribed: boolean;
  /** Request permission and subscribe */
  requestPermission: () => Promise<boolean>;
  /** Unsubscribe from push */
  unsubscribe: () => Promise<void>;
  /** VAPID public key (for reference) */
  vapidKey: string | null;
}

// Base64 URL-safe → Uint8Array (required for pushManager.subscribe)
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

export function usePushNotification({ userId }: UsePushNotificationConfig): UsePushNotificationReturn {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // ── Check if push is supported ──
  const isSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  // ── Fetch VAPID public key ──
  useEffect(() => {
    if (!isSupported) return;

    fetch('/api/push/vapid-key')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.publicKey) {
          setVapidKey(data.publicKey);
        }
      })
      .catch(() => {
        console.warn('[Push] Failed to fetch VAPID key');
      });
  }, [isSupported]);

  // ── Check current permission and subscription status ──
  useEffect(() => {
    if (!isSupported) return;

    // Check permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    // Register SW and check existing subscription
    async function checkSubscription() {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/sw.js');
        if (registration) {
          swRegistrationRef.current = registration;
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      } catch {
        // Service worker not registered yet — that's ok
      }
    }

    checkSubscription();
  }, [isSupported]);

  // ── Request permission and subscribe ──
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !userId || !vapidKey) {
      console.warn('[Push] Cannot subscribe: missing support, userId, or vapidKey');
      return false;
    }

    setIsLoading(true);

    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        setIsLoading(false);
        return false;
      }

      // 2. Register service worker (if not already)
      let registration = swRegistrationRef.current;
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        swRegistrationRef.current = registration;
        console.log('[Push] Service Worker registered');
      }

      // 3. Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // 4. Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
        console.log('[Push] ✅ Subscribed successfully');
        return true;
      } else {
        console.error('[Push] Failed to save subscription:', data.error);
        // Subscription was created but server failed — still subscribe locally
        setIsSubscribed(true);
        return true;
      }
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, userId, vapidKey]);

  // ── Unsubscribe ──
  const unsubscribe = useCallback(async () => {
    if (!swRegistrationRef.current) return;

    try {
      const subscription = await swRegistrationRef.current.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('[Push] Unsubscribed from push manager');
      }

      // Tell server to remove
      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription?.endpoint,
        }),
      });

      setIsSubscribed(false);
      console.log('[Push] ✅ Unsubscribed successfully');
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
    }
  }, []);

  return {
    isSupported,
    permissionStatus,
    isLoading,
    isSubscribed,
    requestPermission,
    unsubscribe,
    vapidKey,
  };
}
