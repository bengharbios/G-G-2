'use client';

/**
 * AntLoaderOverlay — نافذة عائمة فوق الصفحات تُظهر النملة الجارية.
 *
 * تستخدم ANTES:
 *   - أثناء التنقل بين الصفحات (route transition)
 *   - أثناء بطء الشبكة (slow 2G/3G)
 *   - أثناء بطء fetch (أي fetch يتجاوز حدّاً زمنياً)
 *   - عند فقدان الاتصال مؤقتاً (intermittent disconnection)
 *
 * التخطيط: عنصر ثابت (fixed) أسفل الشاشة مع هامش، يطفو فوق المحتوى
 * الحالي — لا يُخفي ما يراه المستخدم.
 *
 * ملاحظة: نستخدم CSS opacity/transform للإظهار والإخفاء بدلاً من mounting
 * لإلتزام قواعد React الجديدة (set-state-in-effect).
 */

import GazelleLoader from './GazelleLoader';

export type OverlayReason = 'navigation' | 'slow-fetch' | 'slow-network' | 'intermittent';

interface AntLoaderOverlayProps {
  /** هل نُظهر العنصر الآن؟ */
  visible: boolean;
  /** سبب الإظهار — يتحكم في النص المعروض */
  reason?: OverlayReason;
  /** نص مخصّص — يلغي النص التلقائي */
  label?: string;
}

const REASON_LABELS: Record<OverlayReason, string> = {
  navigation: 'جارٍ التنقّل...',
  'slow-fetch': 'الاتصال بطيء، نُحاول...',
  'slow-network': 'سرعة الإنترنت بطيئة...',
  intermittent: 'انقطاع مؤقت في الشبكة...',
};

export default function AntLoaderOverlay({
  visible,
  reason = 'navigation',
  label,
}: AntLoaderOverlayProps) {
  // نُبقي العنصر مُركّباً دائماً ونتحكّم بالرؤية عبر CSS — هذا أسرع
  // ويلتزم بقواعد React (no set-state-in-effect).
  const visibilityClass = visible
    ? 'opacity-100 translate-y-0 pointer-events-auto'
    : 'opacity-0 translate-y-4 pointer-events-none';

  return (
    <div
      dir="rtl"
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[9998] transition-all duration-200 ${visibilityClass}`}
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
    >
      {/* الخلفية الشفافة المُموّهة */}
      <div className="flex flex-col items-center justify-center gap-1 px-6 py-3 rounded-3xl backdrop-blur-md bg-[#0a4a3a]/85 border border-[#15BC83]/30 shadow-2xl shadow-black/40">
        {/* النملة بحجم صغير */}
        <GazelleLoader size={56} label="" color="#F5B841" />
        {/* النص */}
        <p className="text-xs font-bold text-white" style={{ marginTop: 4 }}>
          {label || REASON_LABELS[reason]}
        </p>
      </div>
    </div>
  );
}
