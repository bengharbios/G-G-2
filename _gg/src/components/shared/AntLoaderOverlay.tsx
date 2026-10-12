'use client';

/**
 * AntLoaderOverlay — النملة الجارية وحدها في وسط الشاشة بالضبط.
 *
 * خصائص:
 *   - تظهر في وسط الشاشة بالضبط (fixed inset-0 flex items-center justify-center)
 *   - بدون خلفية، بدون حدود، بدون نص — فقط النملة
 *   - عائمة فوق كل الصفحات (z-[9998])
 *   - تظهر وتختفي بسرعة عبر CSS opacity/transform
 *
 * تستخدم في:
 *   - التنقل بين الصفحات (route transition) — تختفي بعد 50% من التحميل
 *   - بطء الشبكة (slow 2G فقط)
 *   - بطء fetch (أكثر من 6 ثوانٍ)
 *   - انقطاع مؤقت في الشبكة
 */

import GazelleLoader from './GazelleLoader';

export type OverlayReason = 'navigation' | 'slow-fetch' | 'slow-network' | 'intermittent';

interface AntLoaderOverlayProps {
  /** هل نُظهر العنصر الآن؟ */
  visible: boolean;
  /** سبب الإظهار — غير مُستخدم في الواجهة لكن يُحتفظ به للتوافق */
  reason?: OverlayReason;
  /** نص مخصّص — غير معروض (النملة وحدها) */
  label?: string;
}

export default function AntLoaderOverlay({
  visible,
  reason: _reason = 'navigation',
  label: _label,
}: AntLoaderOverlayProps) {
  // نُبقي العنصر مُركّباً دائماً ونتحكّم بالرؤية عبر CSS — هذا أسرع
  // ويلتزم بقواعد React (no set-state-in-effect).
  const visibilityClass = visible
    ? 'opacity-100 scale-100 pointer-events-auto'
    : 'opacity-0 scale-90 pointer-events-none';

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-[9998] flex items-center justify-center transition-all duration-200 ${visibilityClass}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      {/* النملة وحدها — بدون خلفية، بدون حدود، بدون نص */}
      <GazelleLoader size={120} label="" color="#F5B841" />
    </div>
  );
}
