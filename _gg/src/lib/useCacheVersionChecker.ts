'use client';

import { useEffect, useRef } from 'react';

/**
 * useCacheVersionChecker
 * 
 * Hook للتحقق من إصدار الـcache عند كل تحميل للصفحة.
 * لو الإصدار تغيّر (الـadmin ضغط زر "مسح cache"):
 *   1. يمسح كل Cache API (caches.keys → caches.delete)
 *   2. يمسح service worker caches
 *   3. يعمل Hard Reload للصفحة
 * 
 * يعمل بشكل تلقائي على كل صفحة في التطبيق.
 * يستخدم في layout.tsx الجذر.
 */

const CACHE_VERSION_KEY = 'gg_cache_version';
const LAST_CHECK_KEY = 'gg_cache_last_check';

export function useCacheVersionChecker() {
  const isChecking = useRef(false);

  useEffect(() => {
    if (isChecking.current) return;
    isChecking.current = true;

    // تحقق مرة كل 60 ثانية كحد أقصى (لتقليل الطلبات)
    try {
      const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);
      const now = Date.now();
      if (now - lastCheck < 60_000) {
        // تحقق أقل من دقيقة مضت — تخطّى
        isChecking.current = false;
        return;
      }
      localStorage.setItem(LAST_CHECK_KEY, String(now));
    } catch { /* localStorage may be unavailable */ }

    let cancelled = false;

    const checkAndClear = async () => {
      try {
        const response = await fetch('/api/cache-version', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        if (!data?.version) return;

        const serverVersion = Number(data.version);
        const localVersion = Number(localStorage.getItem(CACHE_VERSION_KEY) || '1');

        if (serverVersion > localVersion) {
          // الإصدار تغيّر — مسح cache وإعادة تحميل
          await clearAllCaches();
          localStorage.setItem(CACHE_VERSION_KEY, String(serverVersion));
          // انتظر ثانية ثم أعد التحميل
          setTimeout(() => {
            // Hard reload — تجاوز cache المتصفح
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }, 1000);
        } else if (serverVersion !== localVersion) {
          // تحديث local version للقيمة الحالية
          localStorage.setItem(CACHE_VERSION_KEY, String(serverVersion));
        }
      } catch (error) {
        // فشل الطلب — لا شيء (سنعيد المحاولة في المرة القادمة)
        // console.debug('[cache-check] failed:', error);
      } finally {
        isChecking.current = false;
      }
    };

    // ابدأ الفحص بعد 2 ثانية (لا يعطل التحميل الأولي)
    const timer = setTimeout(checkAndClear, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
}

/**
 * يمسح كل cache المتصفح:
 *   - Cache Storage API (service worker caches)
 *   - لا يمكننا مسح HTTP cache مباشرة، لكن Hard Reload سيتجاوزه
 */
async function clearAllCaches(): Promise<void> {
  try {
    // مسح Cache Storage API
    if (typeof caches !== 'undefined' && caches.keys) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch { /* ignore */ }

  try {
    // إلغاء تسجيل service workers (يجبرها على إعادة التسجيل بالنسخة الجديدة)
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
  } catch { /* ignore */ }

  // امسح بعض localStorage keys غير الضرورية (احتفظ بالـauth)
  try {
    const keepKeys = new Set([
      'admin_token', 'auth_token', 'user_session', 'user_data',
      CACHE_VERSION_KEY, LAST_CHECK_KEY,
    ]);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keepKeys.has(key) && !key.startsWith('admin_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch { /* ignore */ }

  // امسح sessionStorage بالكامل
  try {
    sessionStorage.clear();
  } catch { /* ignore */ }
}
