'use client';

/**
 * NetworkStatusProvider — مزوّد حالة الشبكة المركزي.
 *
 * المسؤوليات:
 *   1. تتبّع حالة الاتصال (online / offline) عبر:
 *        - أحداث `online` و `offline` في window
 *        - `navigator.onLine`
 *        - فحوص دورية (ping) كل 60 ثانية (خفّضنا الوتيرة لتقليل الإزعاج)
 *   2. تتبّع بطء الشبكة عبر:
 *        - `navigator.connection.effectiveType` (slow-2g فقط — أبطأ مستوى)
 *        - `navigator.connection.rtt` (> 3000ms)
 *        - `navigator.connection.downlink` (< 25kbps)
 *   3. إظهار AntLoaderOverlay (النملة في وسط الشاشة) فقط في الحالات الحادّة:
 *        - بطء شبكة شديد جداً (slow-2g أو RTT > 3000ms أو downlink < 25kbps)
 *        - بطء fetch شديد جداً (15 ثانية فأكثر — لاحظنا سابقاً أن 6 ثوانٍ مزعجة)
 *        - انقطاع مؤقت مؤكد (3+ فشل ping متتالٍ)
 *   4. قمع overlay عند فتح أي نافذة منبثقة (modal/dialog) — حتى لا يحجب الإدخال
 *   5. إظهار OfflineModal عند انقطاع كامل للإنترنت.
 *
 * ملاحظة: لا نُظهر overlay لمجرد تغيّر pathname (مزعج)، ولا على fetches
 *        البطيئة العادية (إلا بعد 15 ثانية).
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

async function pingServer(timeoutMs = 8000): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch('/api/auth/me?_t=' + Date.now(), {
      method: 'HEAD',
      signal: ctrl.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);
    return res.ok || res.status === 401 || res.status === 405;
  } catch {
    return false;
  }
}

// ─── Helper: فحص هل توجد نافذة منبثقة مفتوحة ────────────────────────────────
// نستخدم DOM query بدلاً من context حتى لا نربط NetworkStatusProvider بحالة AppShell
function hasOpenModal(): boolean {
  if (typeof document === 'undefined') return false;
  // shadcn Dialog (data-state="open")
  if (document.querySelector('[data-state="open"]')) return true;
  // Role dialog or alertdialog
  if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return true;
  // custom modals (yp-overlay = YallaProfileDialog, ys-overlay = SettingsModal,
  // ye-overlay = EditWindow, yb-overlay = BasicInfoWindow)
  const custom = document.querySelector('.yp-overlay, .ys-overlay, .ye-overlay, .yb-overlay');
  if (custom) return true;
  // focus inside an input/textarea — المستخدم يكتب
  const active = document.activeElement as HTMLElement | null;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
    return true;
  }
  return false;
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

  // refs
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingFailCountRef = useRef(0); // عدد فشل ping المتتالي

  // ── (1) أحداث online/offline ────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      pingServer(5000).then((reachable) => {
        if (reachable) {
          setState('online');
          setModalOpen(false);
          setOverlayVisible(false);
          pingFailCountRef.current = 0;
        } else {
          setState('slow');
        }
      });
    };

    const handleOffline = () => {
      setOnline(false);
      setState('offline');
      setModalOpen(true);
      // overlay لا يظهر فوق المودال
      setOverlayVisible(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── (2) ping دوري كل 60 ثانية (خفّضنا الوتيرة من 30 إلى 60 لتقليل الإزعاج) ──
  useEffect(() => {
    let cancelled = false;

    const doPing = async () => {
      if (!navigator.onLine) return;
      const reachable = await pingServer(8000);
      if (cancelled) return;
      if (reachable) {
        pingFailCountRef.current = 0;
        // إن كنا في حالة slow بسبب ping failures سابقة، عُد إلى online
        setState((prev) => (prev === 'online' ? 'online' : 'online'));
        setModalOpen((m) => (m ? false : m));
        // لا نُخفي overlay هنا — سيُخفى تلقائياً
      } else {
        pingFailCountRef.current++;
        // فقط بعد 3 فشل متتالٍ (3 × 60s = 3 دقائق من الانقطاع المؤكد) نُظهر overlay
        if (pingFailCountRef.current >= 3) {
          if (!navigator.onLine) {
            setState('offline');
            setModalOpen(true);
          } else {
            setState('slow');
            // فقط إن لم تكن هناك نافذة منبثقة مفتوحة
            if (!hasOpenModal()) {
              setOverlayVisible(true);
              setOverlayReason('intermittent');
            }
          }
        }
      }
    };

    pingTimerRef.current = setInterval(doPing, 60000);
    return () => {
      cancelled = true;
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    };
  }, []);

  // ── (3) رصد بطء الشبكة عبر navigator.connection ────────────────────────────
  // فقط slow-2g (أبطأ مستوى) + RTT > 3000ms + downlink < 25kbps
  useEffect(() => {
    const conn = (navigator as any).connection;
    if (!conn) return;

    const onChange = () => {
      const eff = conn.effectiveType; // 'slow-2g' | '2g' | '3g' | '4g'
      const rtt = Number(conn.rtt ?? 0);
      const downlink = Number(conn.downlink ?? 0); // Mbps

      // بطء شديد جداً: فقط slow-2g أو RTT > 3000ms أو downlink < 0.025 Mbps (25 kbps)
      const isReallyBad = eff === 'slow-2g' || rtt > 3000 || (downlink > 0 && downlink < 0.025);

      if (isReallyBad) {
        setState('slow');
        // فقط إن لم تكن هناك نافذة منبثقة مفتوحة (لا نريد حجب الإدخال)
        if (!hasOpenModal() && !modalOpen) {
          setOverlayVisible(true);
          setOverlayReason('slow-network');
        }
      }
      // 2g, 3g, 4g, or no info: لا نُظهر overlay لمجرد نوع الشبكة
    };

    onChange();
    conn.addEventListener?.('change', onChange);
    return () => conn.removeEventListener?.('change', onChange);
  }, [modalOpen]);

  // ── (4) قمع overlay عند فتح أي نافذة منبثقة ────────────────────────────────
  // نفحص كل 500ms إن كانت هناك نافذة مفتوحة، فإن وُجدت نُخفي overlay
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (hasOpenModal()) {
        setOverlayVisible(false);
      }
    }, 500);
    return () => clearInterval(checkInterval);
  }, []);

  // ── (5) monkey-patch على window.fetch لرصد fetches البطيئة جداً ─────────────
  // عتبة أعلى بكثير (15 ثانية) — فقط fetches البطيئة فعلاً تُظهر overlay
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
        setOverlayVisible((v) => {
          if (!v) return v;
          if (state === 'offline') return v;
          if (overlayReason === 'slow-network') return v;
          return false;
        });
      }
    };

    window.fetch = function patchedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : (input as URL)?.toString() || '';
      // تجاهل HEAD pings
      if ((init?.method || 'GET') === 'HEAD') {
        return originalFetch.call(window, input, init);
      }
      // تجاهل analytics و push
      if (url.includes('/api/push/') || url.includes('analytics')) {
        return originalFetch.call(window, input, init);
      }

      const start = Date.now();
      const slowThreshold = 15000; // 15 ثانية (كانت 6)
      let timerFired = false;
      const slowTimeout = setTimeout(() => {
        // قبل الإظهار، تحقق من عدم وجود نافذة منبثقة مفتوحة
        if (hasOpenModal()) return;
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
            slowTimer = setTimeout(checkHide, 300);
          }
        }
      });
    } as typeof window.fetch;

    return () => {
      window.fetch = originalFetch;
      if (slowTimer) clearTimeout(slowTimer);
    };
  }, [overlayReason, state]);

  // ── (لا نُظهر overlay على تغيير pathname — هذا كان مزعجاً) ────────────────
  // أزلنا تأثير pathname السابق تماماً

  // ── Public API ────────────────────────────────────────────────────────────────
  const showOverlay = useCallback((reason: OverlayReason = 'navigation', _label?: string) => {
    if (hasOpenModal()) return; // لا تُظهر overlay فوق نافذة منبثقة
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
          setTimeout(() => window.location.reload(), 200);
        }}
      />
    </NetworkStatusContext.Provider>
  );
}
