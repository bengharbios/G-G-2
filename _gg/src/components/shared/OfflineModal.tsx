'use client';

/**
 * OfflineModal — نافذة في وسط الشاشة عند انقطاع الإنترنت الكامل.
 *
 * تحتوي على:
 *   - أيقونة النملة الجارية في الوسط بالضبط (بدون خلفية)
 *   - رسالة "انقطع الاتصال بالإنترنت"
 *   - زرّان:
 *       1. إغلاق اللعبة (يقفل التطبيق على Android عبر @capacitor/app)
 *       2. إعادة الاتصال (يختبر الشبكة ويعيد التحميل)
 */

import { useState, useEffect } from 'react';
import { X, Wifi, RefreshCw } from 'lucide-react';
import GazelleLoader from './GazelleLoader';

interface OfflineModalProps {
  open: boolean;
  onClose: () => void;
  onReconnect?: () => void;
}

/**
 * إغلاق التطبيق على Android (Capacitor) — لا يفتح متصفح.
 * - إن كنا داخل Capacitor native (التطبيق)، نستدعي App.exitApp()
 * - إن كنا في متصفح عادي، نُحاول window.close() ثم نُحوّل لصفحة "الوداع"
 *   المحلية بدلاً من about:blank (التي تفتح Chrome)
 */
async function closeApp() {
  try {
    // Capacitor native bridge
    const Capacitor = (window as any).Capacitor;
    if (Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
      // استدعاء App plugin مباشرة عبر الـ bridge
      const App = Capacitor.Plugins?.App || (await import('@capacitor/app')).App;
      if (App && App.exitApp) {
        App.exitApp();
        return;
      }
    }
  } catch (e) {
    // تجاهل — نحاول طرق أخرى
  }

  // طريقة قديمة على Android WebView
  try {
    const nav = navigator as any;
    if (nav.app && nav.app.exitApp) {
      nav.app.exitApp();
      return;
    }
  } catch (e) { /* ignore */ }

  // متصفح عادي: window.close() يعمل فقط للنوافذ المفتوحة بـ script
  try {
    window.close();
  } catch (e) { /* ignore */ }

  // fallback أخير: صفحة وداع محلية (لا تفتح Chrome)
  // نُحاول أولاً إعادة التحميل بعد فترة قصيرة
  setTimeout(() => {
    try {
      // استخدم نفس الصفحة مع hash حتى لا يُحمّل شيئاً جديداً
      window.location.hash = 'closed';
      // أو صفحة فارغة محلياً (لا تفتح Chrome)
      // ملاحظة: about:blank قد يُفتح Chrome في بعض الـ WebViews
      // لذا نُفضل استخدام نفس الصفحة مع hash
      document.body.innerHTML = `
        <div dir="rtl" style="font-family:sans-serif;text-align:center;padding:3rem;background:#062318;color:#fff;height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column">
          <div style="font-size:2rem;margin-bottom:1rem">👋</div>
          <h1 style="font-size:1.25rem;font-weight:900;margin-bottom:0.5rem">تم إغلاق الجلسة</h1>
          <p style="color:rgba(255,255,255,0.6);font-size:0.875rem">يمكنك إغلاق التطبيق يدوياً الآن.</p>
          <button onclick="window.location.reload()" style="margin-top:2rem;padding:0.75rem 1.5rem;background:#15BC83;color:#fff;border:none;border-radius:0.75rem;font-weight:700;font-family:inherit;font-size:0.875rem">إعادة الفتح</button>
        </div>
      `;
    } catch (e) { /* ignore */ }
  }, 100);
}

export default function OfflineModal({ open, onClose, onReconnect }: OfflineModalProps) {
  const [testing, setTesting] = useState(false);
  const [stillOffline, setStillOffline] = useState(false);

  // إعادة تعيين الحالة كلما أُغلقت النافذة
  useEffect(() => {
    if (!open) {
      setTesting(false);
      setStillOffline(false);
    }
  }, [open]);

  if (!open) return null;

  // اختبار الاتصال: نحاول جلب endpoint خفيف
  const handleReconnect = async () => {
    setTesting(true);
    setStillOffline(false);
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch('/api/auth/me?_t=' + Date.now(), {
        method: 'HEAD',
        signal: ctrl.signal,
        cache: 'no-store',
      });
      clearTimeout(timer);
      if (res.ok || res.status === 405 || res.status === 401) {
        // وصلنا للسيرفر — نعيد التحميل
        if (onReconnect) onReconnect();
        else window.location.reload();
        return;
      }
      setStillOffline(true);
    } catch (err) {
      setStillOffline(true);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-modal-title"
      aria-describedby="offline-modal-desc"
    >
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#0a4a3a] to-[#062318] border border-[#15BC83]/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* زر إغلاق اختياري (يخفي المودال مؤقتاً) */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center justify-center px-6 py-8">
          {/* النملة الجارية في الوسط بالضبط — بدون خلفية */}
          <div className="mb-2">
            <GazelleLoader size={88} label="" color="#F5B841" />
          </div>

          {/* الرسالة */}
          <h2
            id="offline-modal-title"
            className="text-lg font-black text-white mt-2 text-center"
          >
            انقطع الاتصال بالإنترنت
          </h2>
          <p
            id="offline-modal-desc"
            className="text-xs text-white/70 mt-2 text-center leading-relaxed"
          >
            لا يمكننا الوصول إلى السيرفر. تأكد من اتصالك بالإنترنت ثم اضغط
            "إعادة الاتصال" للمحاولة مرة أخرى.
          </p>

          {/* رسالة "ما زال غير متصل" */}
          {stillOffline && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 w-full text-center">
              <p className="text-xs text-red-300 font-bold">
                لا يزال الاتصال مقطوعاً — حاول مرة أخرى
              </p>
            </div>
          )}

          {/* الأزرار */}
          <div className="flex gap-3 w-full mt-5">
            <button
              onClick={closeApp}
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-bold border border-white/10 transition-colors flex items-center justify-center gap-2"
              disabled={testing}
            >
              <X className="w-4 h-4" />
              إغلاق اللعبة
            </button>
            <button
              onClick={handleReconnect}
              disabled={testing}
              className="flex-1 px-4 py-3 rounded-xl bg-[#15BC83] hover:bg-[#13a374] text-white text-sm font-bold shadow-lg shadow-[#15BC83]/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  يختبر...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4" />
                  إعادة الاتصال
                </>
              )}
            </button>
          </div>

          {/* مؤشر حالة الشبكة */}
          <div className="flex items-center gap-2 mt-4 text-white/50 text-[10px]">
            <span
              className={`inline-block w-2 h-2 rounded-full ${testing ? 'bg-amber-400 animate-pulse' : 'bg-red-500'}`}
            />
            <span>
              {testing ? 'يختبر الاتصال...' : 'الشبكة غير متصلة'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
