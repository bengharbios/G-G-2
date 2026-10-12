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
 *        - `navigator.connection.effectiveType` (slow-2g / 2g فقط — 3G و 4G لا يُظهروا overlay)
 *        - رصد fetch البطيء جداً (أكثر من 6 ثوانٍ)
 *   3. إظهار AntLoaderOverlay (النملة في وسط الشاشة) فقط عندما:
 *        - بطء شبكة فعلي (2G أو أبطأ)
 *        - fetch بطيء جداً (6 ثوانٍ فأكثر)
 *        - انقطاع مؤقت (online بروتوكولياً لكن السيرفر لا يردّ)
 *   4. إخفاء overlay فوراً عند أي نجاح (إكمال 50% من التحميل كافٍ)
 *   5. إظهار OfflineModal عند انقطاع كامل للإنترنت.
 *
 * ملاحظة: لا نُظهر overlay لمجرد تغيّر pathname — فقط عند بطء فعلي.
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
  const [modalOpen, setModalOpen] = useState(false);

  // refs لتجنّب الحلقات اللامتناهية في useEffect
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anyFetchSucceededRef = useRef(false);

  // ── (1) أحداث online/offline ────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // تحقق فعلي من الاتصال قبل اعتبار الحالة online
      pingServer(5000).then((reachable) => {
        if (reachable) {
          setState('online');
          setModalOpen(false);
          // لا نخفي overlay هنا — سيُخفى تلقائياً عند أول fetch ناجح
        } else {
          // online بروتوكولياً لكن السيرفر لا يردّ — أعتبره بطء شبكة
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
        // عاد الاتصال — أخفِ overlay والمودال
        setState((prev) => (prev === 'online' ? 'online' : 'slow'));
        setModalOpen((m) => (m ? false : m));
        setOverlayVisible((v) => {
          if (!v) return v;
          // إن كان بسبب intermittent، أعد الفحص
          if (overlayReason === 'intermittent') return false;
          return v;
        });
      } else {
        // السيرفر لا يردّ
        if (!navigator.onLine) {
          setState('offline');
          setModalOpen(true);
        } else {
          // online بروتوكولياً لكن السيرفر لا يردّ — انقطاع مؤقت
          setState('slow');
          // نُظهر overlay فقط إن لم يكن هناك fetch ناجح مؤخراً
          if (!anyFetchSucceededRef.current) {
            setOverlayVisible(true);
            setOverlayReason('intermittent');
          }
        }
      }
    };

    pingTimerRef.current = setInterval(doPing, 30000);
    return () => {
      cancelled = true;
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    };
  }, [overlayReason]);

  // ── (3) رصد بطء الشبكة عبر navigator.connection ────────────────────────────
  // فقط slow-2g و 2g يُظهروا overlay — 3G و 4G لا
  useEffect(() => {
    const conn = (navigator as any).connection;
    if (!conn) return;

    const onChange = () => {
      const eff = conn.effectiveType; // 'slow-2g' | '2g' | '3g' | '4g'
      if (eff === 'slow-2g' || eff === '2g') {
        setState('slow');
        setOverlayVisible(true);
        setOverlayReason('slow-network');
      }
      // 3g و 4g: لا نُظهر overlay لمجرد نوع الشبكة
    };

    onChange();
    conn.addEventListener?.('change', onChange);
    return () => conn.removeEventListener?.('change', onChange);
  }, []);

  // ── (4) رصد التنقل بين الصفحات (route transition) ───────────────────────────
  // عند تغيّر pathname نُحاول إخفاء overlay سريعاً إن كان هناك تقدّم.
  // لا نُظهر overlay لمجرد التنقل — فقط إن استغرق التحميل أكثر من 4 ثوانٍ
  // وكان لا يوجد fetch ناجح في هذه الأثناء.
  useEffect(() => {
    if (!pathname) return;

    // أعد تعيين المؤشر عند بداية التنقل
    anyFetchSucceededRef.current = false;

    // مؤقّال: إن لم يكتمل أي fetch خلال 4 ثوانٍ، أظهر overlay
    if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = setTimeout(() => {
      // فقط إن لم ينجح أي fetch منذ بداية التنقل
      if (!anyFetchSucceededRef.current && navigator.onLine) {
        setOverlayVisible(true);
        setOverlayReason('navigation');
      }
    }, 4000);

    return () => {
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    };
  }, [pathname]);

  // ── (5) monkey-patch على window.fetch لرصد fetches البطيئة جداً ─────────────
  // عتبة أعلى (6 ثوانٍ) حتى لا تُظهر overlay لأي fetch بسيط بطيء قليلاً.
  // إخفاء فوري عند أول fetch ناجح (يكفي 50% من التحميل).
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
        // إخفاء فوري عند أول نجاح — لا نحتظر اكتمال 100%
        setOverlayVisible((v) => {
          if (!v) return v;
          if (state === 'offline') return v;
          // أثناء slow-network (2G)، اترك الـ overlay حتى لا يومض
          if (overlayReason === 'slow-network') return v;
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

      // عتبة بطء عالية: 6 ثوانٍ (كانت 2)
      const start = Date.now();
      const slowThreshold = 6000;
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
          if (!slowTimer) {
            slowTimer = setTimeout(checkHide, 200);
          }
        } else {
          // لم يُطلق overlay — لكن سجّل أن fetch ناجح حدث
          // (يُستخدم لإخفاء overlay التنقل بعد 50% تحميل)
          anyFetchSucceededRef.current = true;
          // إن كان overlay ظاهراً بسبب navigation، أخفِه فوراً
          setOverlayVisible((v) => {
            if (!v) return v;
            if (overlayReason === 'navigation' || overlayReason === 'slow-fetch') {
              return false;
            }
            return v;
          });
        }
      });
    } as typeof window.fetch;

    return () => {
      window.fetch = originalFetch;
      if (slowTimer) clearTimeout(slowTimer);
    };
  }, [overlayReason, state]);

  // ── Public API ────────────────────────────────────────────────────────────────
  const showOverlay = useCallback((reason: OverlayReason = 'navigation', _label?: string) => {
    setOverlayReason(reason);
    setOverlayVisible(true);
  }, []);

  const hideOverlay = useCallback(() => {
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

      {/* النملة في وسط الشاشة — بدون خلفية، بدون نص */}
      <AntLoaderOverlay
        visible={overlayVisible && !modalOpen}
        reason={overlayReason}
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
