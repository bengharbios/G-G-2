'use client';

/**
 * GazelleLoader — أيقونة غزال يجري بحركة CSS خالصة.
 *
 * الاستخدام:
 *   <GazelleLoader />                          // حجم افتراضي 96px
 *   <GazelleLoader size={140} label="يحمّل..." />  // حجم مخصّص ونص
 *   <GazelleLoader fullScreen />                // شاشة كاملة (للتحميل الأولي)
 *
 * التصميم: غزال مرسوم بـ SVG مع أرجل تتحرك (تبديل بين وضعية جري)
 * وحركة ارتداد خفيفة للجسد، فوق أرضية فيها غبار يتحرك للخلف.
 */

interface GazelleLoaderProps {
  size?: number;
  label?: string;
  fullScreen?: boolean;
  /** لون الجسم — افتراضي ذهبي يلا لودو */
  color?: string;
}

export default function GazelleLoader({
  size = 96,
  label = 'جارٍ التحميل...',
  fullScreen = false,
  color = '#F5B841',
}: GazelleLoaderProps) {
  const containerClass = fullScreen
    ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a4a3a] to-[#062318] text-white'
    : 'flex flex-col items-center justify-center gap-3 py-10';

  return (
    <div dir="rtl" className={containerClass}>
      <style jsx>{`
        @keyframes gazelle-body-bob {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          25%      { transform: translateY(-3px) rotate(0deg); }
          50%      { transform: translateY(0) rotate(1deg); }
          75%      { transform: translateY(-2px) rotate(0deg); }
        }
        @keyframes gazelle-leg-front {
          0%, 100% { transform: rotate(20deg); }
          50%      { transform: rotate(-25deg); }
        }
        @keyframes gazelle-leg-back {
          0%, 100% { transform: rotate(-25deg); }
          50%      { transform: rotate(20deg); }
        }
        @keyframes gazelle-tail {
          0%, 100% { transform: rotate(-5deg); }
          50%      { transform: rotate(8deg); }
        }
        @keyframes gazelle-dust {
          0%   { transform: translateX(0) scaleX(1); opacity: 0.7; }
          100% { transform: translateX(-40px) scaleX(0.5); opacity: 0; }
        }
        @keyframes gazelle-label {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes gazelle-ground {
          0%   { background-position: 0 0; }
          100% { background-position: -40px 0; }
        }
        .gz-body  { animation: gazelle-body-bob 0.5s ease-in-out infinite; transform-origin: 30% 70%; }
        .gz-leg-f { animation: gazelle-leg-front 0.25s ease-in-out infinite alternate; transform-origin: top center; }
        .gz-leg-b { animation: gazelle-leg-back 0.25s ease-in-out infinite alternate;  transform-origin: top center; }
        .gz-tail  { animation: gazelle-tail 0.4s ease-in-out infinite; transform-origin: left center; }
        .gz-dust  { animation: gazelle-dust 0.8s ease-out infinite; }
        .gz-dust.d2 { animation-delay: 0.2s; }
        .gz-dust.d3 { animation-delay: 0.4s; }
        .gz-label { animation: gazelle-label 1.4s ease-in-out infinite; }
        .gz-ground {
          background-image: linear-gradient(90deg, rgba(245,184,65,0.4) 0 8px, transparent 8px 40px);
          background-size: 40px 4px;
          background-repeat: repeat-x;
          animation: gazelle-ground 0.4s linear infinite;
        }
      `}</style>

      <div className="relative" style={{ width: size, height: size }}>
        {/* الغبار خلف الغزال */}
        <div className="absolute bottom-2 right-0 flex gap-1">
          <span className="gz-dust d3 inline-block w-2 h-2 rounded-full" style={{ background: 'rgba(245,184,65,0.5)' }} />
          <span className="gz-dust d2 inline-block w-2 h-2 rounded-full" style={{ background: 'rgba(245,184,65,0.5)' }} />
          <span className="gz-dust    inline-block w-2 h-2 rounded-full" style={{ background: 'rgba(245,184,65,0.5)' }} />
        </div>

        {/* الغزال */}
        <svg
          viewBox="0 0 120 120"
          width={size}
          height={size}
          className="gz-body relative z-10"
          aria-label="غزال يجري"
        >
          {/* القرنان */}
          <g stroke={color} strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 78 22 Q 84 8 92 6" />
            <path d="M 84 22 Q 92 10 100 10" />
          </g>

          {/* الرأس */}
          <ellipse cx="80" cy="30" rx="14" ry="11" fill={color} />
          {/* الأذن */}
          <ellipse cx="74" cy="22" rx="3" ry="5" fill={color} transform="rotate(-20 74 22)" />
          {/* العين */}
          <circle cx="86" cy="28" r="1.8" fill="#062318" />
          {/* الأنف */}
          <circle cx="92" cy="34" r="2" fill="#062318" opacity="0.6" />

          {/* الرقبة */}
          <path d="M 70 36 Q 60 40 56 50" stroke={color} strokeWidth="10" strokeLinecap="round" fill="none" />

          {/* الجسم */}
          <ellipse cx="48" cy="58" rx="26" ry="14" fill={color} />

          {/* الذيل */}
          <g className="gz-tail" style={{ transformOrigin: '24px 56px' }}>
            <path d="M 24 56 Q 14 52 12 60" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>

          {/* الأرجل الأمامية */}
          <g className="gz-leg-f" style={{ transformOrigin: '60px 60px' }}>
            <path d="M 60 60 L 64 90" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 64 90 L 70 92" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>
          <g className="gz-leg-b" style={{ transformOrigin: '52px 60px' }}>
            <path d="M 52 60 L 48 90" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M 48 90 L 42 92" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
          </g>

          {/* الرجل الخلفية البعيدة */}
          <g className="gz-leg-b" style={{ transformOrigin: '40px 62px', opacity: 0.6 }}>
            <path d="M 40 62 L 36 88" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 36 88 L 30 90" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
          {/* الرجل الأمامية البعيدة */}
          <g className="gz-leg-f" style={{ transformOrigin: '68px 62px', opacity: 0.6 }}>
            <path d="M 68 62 L 72 88" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 72 88 L 78 90" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        </svg>

        {/* الأرضية المتحركة */}
        <div
          className="gz-ground absolute bottom-0 left-0 right-0"
          style={{ height: 4, borderRadius: 2 }}
        />
      </div>

      {label && (
        <p className="gz-label text-sm font-bold mt-2" style={{ color: '#fff' }}>
          {label}
        </p>
      )}
    </div>
  );
}
