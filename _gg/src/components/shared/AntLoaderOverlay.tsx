'use client';

/**
 * AntLoaderOverlay — النملة الجارية وحدها في وسط الشاشة بالضبط.
 *
 * خصائص:
 *   - تظهر في وسط الشاشة بالضبط (fixed inset-0 flex items-center justify-center)
 *   - بدون خلفية، بدون حدود، بدون نص — فقط النملة
 *   - z-index منخفض (z-30) حتى لا تحجب النوافذ المنبثقة (modals) والإدخالات
 *   - تظهر وتختفي بسرعة عبر CSS opacity/transform
 *
 * تستخدم في:
 *   - بطء شبكة شديد جداً (slow-2g أو RTT > 3000ms)
 *   - بطء fetch شديد جداً (أكثر من 15 ثانية)
 *   - انقطاع مؤقت مؤكد (3+ ping failures متتالية)
 *
 * ملاحظة: لا تظهر على التنقل بين الصفحات ولا على fetches البطيئة العادية
 *        لأنها مزعجة للمستخدمين. فقط في الحالات الحادة.
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
  // z-30: أقل من النوافذ المنبثقة (z-50) حتى لا تحجب الإدخال
  const visibilityClass = visible
    ? 'opacity-100 scale-100 pointer-events-none'
    : 'opacity-0 scale-90 pointer-events-none';

  return (
    <div
      dir="rtl"
      className={`fixed inset-0 z-30 flex items-center justify-center transition-all duration-200 ${visibilityClass}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      {/* النملة وحدها — بدون خلفية، بدون حدود، بدون نص */}
      <GazelleLoader size={120} label="" color="#F5B841" />
    </div>
  );
}
