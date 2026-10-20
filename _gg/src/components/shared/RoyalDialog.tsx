'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Crown, Gift, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// RoyalDialog — طبق أصل Yalla Ludo `fragment_royal_level2.xml`
// ─ شريط علوي (bg_rank) مع زر القواعد + العنوان + زر الإغلاق
// ─ خلفية علوية royal_level_top_bg.webp
// ─ عداد دائري (RoyalProgressView) — نصف قطر 92dip — يعرض مستوى رويال الحالي
// ─ في المنتصف: رمز SVGA للملك + نص "ROYAL N" بتدرج لوني
// ─ تحت العداد: شريط تقدّم + "X نقطة للترقية" + "Y للبقاء"
// ─ تاريخ الصلاحية (royal_effective_time_bg) إن وُجد
// ─ أزرار "تبديل الإعداد" + "عرض القسيمة"
// ─ في الأسفل: قائمة الامتيازات (RoyalPrivilegeDetailView)
// ════════════════════════════════════════════════════════════════════════════

interface RoyalStateApiResponse {
  success: boolean;
  level: number;
  points: number;
  needForUpgrade: number;
  needForKeep: number;
  validityDate: string;
  totalCharged: number;
  nextLevel: { level: number; name: string; minPoints: number; keepPoints: number; color: string; icon: string } | null;
  currentLevel: { level: number; name: string; minPoints: number; keepPoints: number; color: string; icon: string };
}

const ROYAL_PRIVILEGES = [
  { level: 1, icon: '🎨', title: 'صورة ملكية',  desc: 'إطار ملكي مميز لصورة ملفك الشخصي' },
  { level: 2, icon: '🖼️', title: 'غلاف ملكي',   desc: 'خلفية ملكية لصفحتك الشخصية' },
  { level: 3, icon: '✨', title: 'زينة فاخرة',    desc: 'إكسسوار رويال متحرك لقاعة الألعاب' },
  { level: 4, icon: '🎤', title: 'موجة صوتية',    desc: 'مؤثر صوتي ملكي حصري عند الدخول للغرفة' },
  { level: 5, icon: '👑', title: 'عروش الملك',    desc: 'دخول برسم ملكي + سيارة هدية + بثوث خاصة' },
];

interface RoyalDialogProps {
  open: boolean;
  onClose: () => void;
  onChargeClick?: () => void;
}

export default function RoyalDialog({ open, onClose, onChargeClick }: RoyalDialogProps) {
  const [state, setState] = useState<RoyalStateApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/royal/state')
      .then(r => r.json())
      .then(d => { if (d.success) setState(d as RoyalStateApiResponse); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  // ألوان وموارد من Yalla Ludo (royal_level_value_ic + royal_progress_point_ic)
  const RING_RADIUS = 92;
  const ringColor = state?.currentLevel.color || '#87eaa9';
  const nextColor = state?.nextLevel?.color || ringColor;
  const ringPct = (() => {
    if (!state) return 0;
    if (state.level >= 5) return 100;
    if (!state.nextLevel) return 100;
    const span = Math.max(1, state.nextLevel.minPoints);
    return Math.min(100, Math.round((state.points / span) * 100));
  })();

  // حساب مسار الدائرة (SVG)
  const circumference = 2 * Math.PI * RING_RADIUS;
  const dashOffset = circumference * (1 - ringPct / 100);

  const validityText = (() => {
    if (!state?.validityDate) return '';
    try {
      const d = new Date(state.validityDate);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch { return ''; }
  })();

  const levelIcon = state?.currentLevel.icon || '/yalla-ui/royal/royal_level_0.webp';
  const nextLevelIcon = state?.nextLevel?.icon || levelIcon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,.88)', backdropFilter: 'blur(5px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 24 }}
          transition={{ type: 'spring', damping: 22 }}
          className="relative rounded-3xl overflow-hidden flex flex-col"
          style={{
            width: 'min(96vw, 420px)',
            maxHeight: '92vh',
            background: 'linear-gradient(180deg, #0a2e1f 0%, #051a12 100%)',
            border: '1px solid rgba(255,215,0,.25)',
            boxShadow: '0 20px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,215,0,.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── القسم العلوي: شريط bg_rank + خلفية royal_level_top_bg ─── */}
          <div className="relative">
            {/* خلفية علوية ملونة (royal_level_top_bg) */}
            <div
              className="absolute inset-0 h-[212px]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,179,0,.12) 0%, rgba(135,234,169,.06) 60%, transparent 100%)',
              }}
            />
            {/* صورة خلفية royal_level_top_bg.webp */}
            <img
              src="/yalla-ui/royal/royal_level_top_bg.webp"
              alt=""
              className="absolute inset-0 w-full h-[212px] object-cover opacity-30"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />

            {/* شريط العنوان — bg_rank + iv_rules + tv_title + iv_close */}
            <div
              className="relative flex items-center justify-between h-[53px] px-3"
              style={{
                background: 'linear-gradient(180deg, rgba(135,234,169,.25) 0%, rgba(0,0,0,.4) 100%)',
                borderBottom: '1px solid rgba(135,234,169,.2)',
              }}
            >
              <button
                className="w-[38px] h-[38px] flex items-center justify-center rounded-lg hover:bg-white/10 transition"
                aria-label="القواعد"
                title="قواعد مستوى رويال"
              >
                <img src="/yalla-ui/full/description_rule.webp" alt="" className="w-6 h-6 opacity-90" />
              </button>
              <h2
                className="text-[21px] font-bold"
                style={{
                  color: '#87ebaa',
                  textShadow: '0 5px 1px rgba(0,0,0,.5)',
                  includeFontPadding: false,
                }}
              >
                مستوى رويال
              </h2>
              <button
                onClick={onClose}
                className="w-[38px] h-[38px] flex items-center justify-center rounded-lg hover:bg-white/10 transition"
                aria-label="إغلاق"
              >
                <img src="/yalla-ui/full/skin_close.webp" alt="" className="w-6 h-6" />
              </button>
            </div>

            {/* ─── العداد الدائري (RoyalProgressView) ─── */}
            <div className="relative flex items-center justify-center h-[212px]">
              <svg
                width="200"
                height="200"
                viewBox="0 0 200 200"
                className="absolute"
              >
                {/* حلقة خلفية شفافة */}
                <circle
                  cx="100"
                  cy="100"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,.08)"
                  strokeWidth="6"
                />
                {/* الحلقة الملوّنة — تعكس التقدم نحو المستوى التالي */}
                <circle
                  cx="100"
                  cy="100"
                  r={RING_RADIUS}
                  fill="none"
                  stroke={nextColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset .8s ease' }}
                />
                {/* نقطة الحلقة (royal_progress_point_ic) — تتحرك مع التقدم */}
                {ringPct > 0 && ringPct < 100 && (() => {
                  const angle = (ringPct / 100) * 2 * Math.PI - Math.PI / 2;
                  const px = 100 + RING_RADIUS * Math.cos(angle);
                  const py = 100 + RING_RADIUS * Math.sin(angle);
                  return (
                    <circle
                      cx={px}
                      cy={py}
                      r="9"
                      fill={nextColor}
                      stroke="rgba(255,255,255,.7)"
                      strokeWidth="2"
                    />
                  );
                })()}
                {/* علامات المستويات حول الدائرة */}
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const angle = ((lvl - 1) / 5) * 2 * Math.PI - Math.PI / 2;
                  const px = 100 + (RING_RADIUS + 14) * Math.cos(angle);
                  const py = 100 + (RING_RADIUS + 14) * Math.sin(angle);
                  const isCurrent = state?.level === lvl;
                  const isReached = (state?.level ?? 0) >= lvl;
                  return (
                    <circle
                      key={lvl}
                      cx={px}
                      cy={py}
                      r={isCurrent ? 7 : 5}
                      fill={isReached ? '#fbbf24' : 'rgba(255,255,255,.15)'}
                      stroke="rgba(0,0,0,.4)"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>

              {/* في مركز الدائرة: رمز المستوى الحالي + "ROYAL N" */}
              <div className="relative flex flex-col items-center" style={{ zIndex: 2 }}>
                <img
                  src={levelIcon}
                  alt={state?.currentLevel.name || 'ROYAL'}
                  className="w-[85px] h-[85px] object-contain"
                  style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div
                  className="text-[19px] font-bold mt-1"
                  style={{
                    background: 'linear-gradient(180deg, #ffff75 0%, #ffc000 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: '#ffb310',
                    textShadow: '0 4px 2px rgba(0,0,0,.5)',
                  }}
                >
                  {state?.currentLevel.level === 0 ? 'بدون رويال' : `ROYAL ${state?.currentLevel.level}`}
                </div>
              </div>
            </div>

            {/* ─── شريط الترقية — ll_upgrade_need_value ─── */}
            <div className="px-4 pb-2 -mt-2">
              <div className="flex flex-col items-center gap-1">
                {state && state.level < 5 && state.nextLevel ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-white">للترقية تحتاج:</span>
                      <span className="text-[15px] font-bold" style={{ color: '#ffed5d' }}>
                        {state.needForUpgrade.toLocaleString()}
                      </span>
                      <img src="/yalla-ui/royal/royal_level_value_ic.webp" alt="" className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] font-bold text-white">للحفاظ تحتاج:</span>
                      <span className="text-[15px] font-bold" style={{ color: '#ffed5d' }}>
                        {state.needForKeep.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : state && state.level >= 5 ? (
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-4 h-4" style={{ color: '#fbbf24' }} />
                    <span className="text-[13px] font-bold" style={{ color: '#fbbf24' }}>
                      وصلت أعلى مستوى رويال (5) — امتيازات كاملة مفعّلة
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[12px]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>جاري التحميل...</span>
                  </div>
                )}
              </div>
            </div>

            {/* ─── تاريخ الصلاحية (royal_effective_time_bg) ─── */}
            {validityText && (
              <div className="flex justify-center pb-2">
                <div
                  className="px-3 py-1 rounded-full flex items-center gap-1.5"
                  style={{
                    background: 'rgba(135,234,169,.12)',
                    border: '1px solid rgba(135,234,169,.3)',
                    minWidth: '180px',
                  }}
                >
                  <span className="text-[10px] font-bold" style={{ color: '#87eaa9' }}>تاريخ الصلاحية:</span>
                  <span className="text-[10px] font-bold text-white" dir="ltr">{validityText}</span>
                </div>
              </div>
            )}
          </div>

          {/* ─── زر "نقاطي الملكية >>" (rl_growth_record) ─── */}
          <div className="flex justify-end px-4 pb-2">
            <div className="flex flex-col items-end" style={{ minWidth: 100 }}>
              <div className="flex items-center gap-1" style={{ color: '#87eaa9' }}>
                <span className="text-[8px] font-bold">نقاطي الملكية</span>
                <span className="text-[8px] font-bold">&gt;&gt;</span>
              </div>
              <div className="text-[12px] font-bold text-white -mt-0.5">
                {state?.points.toLocaleString() ?? '0'}
              </div>
              <div className="w-full h-px" style={{ background: '#87eaa9' }} />
            </div>
          </div>

          {/* ─── قائمة الامتيازات (RoyalPrivilegeDetailView) ─── */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            <div className="rounded-xl p-3 space-y-2"
              style={{
                background: 'rgba(0,0,0,.35)',
                border: '1px solid rgba(135,234,169,.15)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold" style={{ color: '#87eaa9' }}>امتيازات المستوى الحالي</span>
                <span className="text-[10px] text-slate-400">
                  إجمالي الشحن: ${state?.totalCharged.toFixed(2) ?? '0.00'}
                </span>
              </div>
              {ROYAL_PRIVILEGES.map((p) => {
                const unlocked = state ? state.level >= p.level : false;
                return (
                  <div
                    key={p.level}
                    className="flex items-center gap-3 p-2 rounded-lg transition"
                    style={{
                      background: unlocked ? 'linear-gradient(90deg, rgba(251,191,36,.12), rgba(0,0,0,0))' : 'rgba(255,255,255,.03)',
                      opacity: unlocked ? 1 : 0.45,
                      border: unlocked ? '1px solid rgba(251,191,36,.25)' : '1px solid transparent',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                      style={{
                        background: unlocked ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(0,0,0,.4)',
                        border: '1px solid ' + (unlocked ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.05)'),
                      }}
                    >
                      {p.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[12px] font-bold ${unlocked ? 'text-amber-300' : 'text-slate-400'}`}>
                          {p.title}
                        </span>
                        {unlocked && <Sparkles className="w-3 h-3 text-amber-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{p.desc}</p>
                    </div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${unlocked ? 'bg-emerald-600/30 text-emerald-300' : 'bg-slate-700/40 text-slate-400'}`}>
                      {unlocked ? 'مفعّل' : `LV ${p.level}`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ─── زر ترقية (يفتح ChargeDialog على لسان رويال) ─── */}
            <button
              onClick={() => onChargeClick?.()}
              className="w-full mt-3 py-2.5 rounded-xl text-[13px] font-bold transition-all hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#1f1407',
                boxShadow: '0 4px 16px rgba(251,191,36,.3)',
              }}
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <Crown className="w-4 h-4" />
                اشحن نقاط رويال الآن
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
