/* ═══════════════════════════════════════════════════════════════════════
   ServiceWorkerRegistrar — Registers the Service Worker on mount

   The SW only handles push notifications. It does NOT intercept fetch
   requests (no caching). The inline script in layout.tsx handles
   clearing stale SWs and caches on first load after deployment.

   v3.8 — Simplified: no fetch caching, updateViaCache: 'none'
   ═══════════════════════════════════════════════════════════════════════ */

'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always fetch fresh sw.js from server
      })
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
      });
  }, []);

  return null;
}
