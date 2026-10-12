'use client';

/**
 * NetworkStatusProvider — مزوّد حالة الشبكة المركزي.
 *
 * المسؤوليات:
 *   1. تتبّع حالة الاتصال (online / offline) عبر:
 *        - أحداث `online` و `offline` في window
 *        - `navigator.onLine`
 *        - فحوص دورية (ping) كل 30 ثانية للتأكد من الوصول الفعلي للسيرفر
 *   2. تتبّع بطء الشبكة عبر:
 *        - `navigator.connection.effectiveType` (slow-2g / 2g / 3g / 4g)
 *        - رصد fetch البطيء (أي fetch يتجاوز 3 ثوانٍ يُعتبر بطيئاً)
 *   3. تتبّع التنقل بين الصفحات (route transitions) عبر monkey-patch
 *      على history.pushState + إستماع لأحداث popstate.
 *   4. إظهار AntLoaderOverlay عند:
 *        - بطء شبكة
 *        - بطء fetch
 *        - تنقل بين الصفحات
 *        - انقطاع مؤقت
 *   5. إظهار OfflineModal عند انقطاع كامل للإنترنت.
 *
 * يُوضع في root layout بجانب AppShell.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { usePathname } from 'next/navigation';
import AntLoaderOverlay, { type OverlayReason } from './AntLoaderOverlay';
import OfflineModal from './OfflineModal';

type NetworkState = 'online' | 'offline' | 'slow';

interface NetworkStatusContextValue {
  state: NetworkState;
  online: boolean;
  /** إظهار overlay يدويّاً (مثلاً أثناء تشغيل لعبة) */
  showOverlay: (reason?: OverlayReason, label?: string) => void;
  hideOverlay: () => void;
}

const NetworkStatusContext = createContext<NetworkStatusContextValue | null>(null);

export function useNetworkStatus(): NetworkStatusContextValue | null {
  return useContext(NetworkStatusContext);
}

// ─── Helper: ping السيرفر ─────────────────────────────────────────────────────

async function pingServer(timeoutMs = 6000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch('/api/auth/me?_t=' + Date.now(), {
      method: 'HEAD',
      signal: ctrl.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    // 200 أو 401/405 — المهم أن السيرفر ردّ
    return res.ok || res.status === 401 || res.status === 405;
  } catch {
    return false;
  }
}

// ─── Provider ───────────────────────────────────────────────────────────────────

export default function NetworkStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [state, setState] = useState<NetworkState>('online');
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayReason, setOverlayReason] = useState<OverlayReason>('navigation');
  const [overlayLabel, setOverlayLabel] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  // refs لتجنّب الحلقات اللامتناهية في useEffect
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slowFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualHideRef = useRef(false);

  // ── (1) أحداث online/offline ────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // تحقق فعلي من الاتصال قبل اعتبار الحالة online
      pingServer(5000).then((reachable) => {
        if (reachable) {
          setState('online');
          setModalOpen(false);
        } else {
          // online بروتوكولياً لكن السيرفر لا يردّ — أعتبره انقطاع مؤقت
          setState('slow');
        }
      });
    };

    const handleOffline = () => {
      setOnline(false);
      setState('offline');
      setModalOpen(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // فحص أولي للحالة
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── (2) ping دوري كل 30 ثانية للتأكد من الاتصال الفعلي ─────────────────────
  useEffect(() => {
    let cancelled = false;

    const doPing = async () => {
      if (!navigator.onLine) return; // لن نُكلّف المستخدم بمحاولة معروف فشلها
      const reachable = await pingServer(8000);
      if (cancelled) return;
      if (reachable) {
        setState((prev) => (prev === 'online' ? 'online' : 'slow'));
        // إن كنا قد فتحنا المودال لكن الآن وصلنا — أغلقه
        setModalOpen((m) => (m && reachable ? false : m));
      } else {
        // السيرفر لا يردّ — إن اعتبرناها offline أو slow حسب navigator.onLine
        if (!navigator.onLine) {
          setState('offline');
          setModalOpen(true);
        } else {
          // online بروتوكولياً لكن السيرفر لا يردّ — انقطاع مؤقت
          setState('slow');
          setOverlayVisible(true);
          setOverlayReason('intermittent');
        }
      }
    };

    pingTimerRef.current = setInterval(doPing, 30000);
    return () => {
      cancelled = true;
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    };
  }, []);

  // ── (3) رصد بطء الشبكة عبر navigator.connection ────────────────────────────
  useEffect(() => {
    const conn = (navigator as any).connection;
    if (!conn) return;

    const onChange = () => {
      const eff = conn.effectiveType; // 'slow-2g' | '2g' | '3g' | '4g'
      if (eff === 'slow-2g' || eff === '2g') {
        setState('slow');
        setOverlayVisible(true);
        setOverlayReason('slow-network');
      } else if (eff === '3g' && state === 'online') {
        // 3G مقبول لكن نُظهر overlay بشكل خفيف أثناء التحميل
      }
    };

    onChange();
    conn.addEventListener?.('change', onChange);
    return () => conn.removeEventListener?.('change', onChange);
  }, [state]);

  // ── (4) رصد التنقل بين الصفحات (route transition) ───────────────────────────
  // Next.js App Router: عند تغيّر pathname نُظهر overlay لمدة قصيرة
  useEffect(() => {
    if (!pathname) return;
    // أظهر overlay عند بداية التنقل
    setOverlayVisible(true);
    setOverlayReason('navigation');

    // بعد 800ms إن لم يُخفِه شيء، اتركه visible (قد يكون التحميل بطيئاً)
    if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = setTimeout(() => {
      // إن لم يُخفِ المستخدم يدويّاً، أخفِه عند انتهاء التنقل
      setOverlayVisible((v) => {
        if (!v) return v;
        // إن كنا في حالة slow أو offline، أعد الفحص
        if (state === 'slow' || state === 'offline') return v;
        return false;
      });
    }, 1500);

    return () => {
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    };
  }, [pathname, state]);

  // ── (5) monkey-patch على window.fetch لرصد fetches البطيئة ─────────────────
  useEffect(() => {
    const originalFetch = window.fetch;
    let activeSlowFetches = 0;
    let slowTimer: ReturnType<typeof setTimeout> | null = null;

    const checkHide = () => {
      if (activeSlowFetches <= 0) {
        activeSlowFetches = 0;
        if (slowTimer) {
          clearTimeout(slowTimer);
          slowTimer = null;
        }
        // إن لم نكن في حالة slow-network، أخفِ overlay
        setOverlayVisible((v) => {
          if (!v) return v;
          if (state === 'slow' || state === 'offline') return v;
          if (overlayReason === 'slow-network' || overlayReason === 'intermittent') return v;
          return false;
        });
      }
    };

    window.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : (input as URL)?.toString() || '';
      // تجاهل HEAD pings (حتى لا تسبب overlay عند كل ping)
      if ((init?.method || 'GET') === 'HEAD') {
        return originalFetch.call(window, input, init);
      }
      // تجاهل analytics و push (التي لا تهمّ المستخدم)
      if (url.includes('/api/push/') || url.includes('analytics')) {
        return originalFetch.call(window, input, init);
      }

      // أظهر overlay إن استغرق الـ fetch أكثر من 2 ثانية
      const start = Date.now();
      const slowThreshold = 2000;
      let timerFired = false;
      const slowTimeout = setTimeout(() => {
        timerFired = true;
        activeSlowFetches++;
        setOverlayVisible(true);
        setOverlayReason('slow-fetch');
      }, slowThreshold);

      return originalFetch.call(window, input, init).finally(() => {
        clearTimeout(slowTimeout);
        if (timerFired) {
          activeSlowFetches--;
          // تأخير صغير قبل الإخفاء حتى لا يومض
          if (!slowTimer) {
            slowTimer = setTimeout(checkHide, 400);
          }
        }
      });
    } as typeof window.fetch;

    return () => {
      window.fetch = originalFetch;
      if (slowTimer) clearTimeout(slowTimer);
    };
  }, [overlayReason, state]);

  // ── Public API ────────────────────────────────────────────────────────────────
  const showOverlay = useCallback((reason: OverlayReason = 'navigation', label?: string) => {
    manualHideRef.current = false;
    setOverlayReason(reason);
    if (label) setOverlayLabel(label);
    setOverlayVisible(true);
  }, []);

  const hideOverlay = useCallback(() => {
    manualHideRef.current = true;
    setOverlayVisible(false);
  }, []);

  const ctxValue = useMemo<NetworkStatusContextValue>(() => ({
    state,
    online,
    showOverlay,
    hideOverlay,
  }), [state, online, showOverlay, hideOverlay]);

  return (
    <NetworkStatusContext.Provider value={ctxValue}>
      {children}

      {/* ant عائمة فوق كل الصفحات */}
      <AntLoaderOverlay
        visible={overlayVisible && !modalOpen}
        reason={overlayReason}
        label={overlayLabel}
      />

      {/* نافذة الانقطاع الكامل */}
      <OfflineModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onReconnect={() => {
          setModalOpen(false);
          // إعادة تحميل الصفحة الحالية بعد 200ms
          setTimeout(() => window.location.reload(), 200);
        }}
      />
    </NetworkStatusContext.Provider>
  );
}
