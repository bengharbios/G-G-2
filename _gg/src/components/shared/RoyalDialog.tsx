'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Crown, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// RoyalDialog — نسخة طبق الأصل 100% من Yalla Ludo `fragment_royal_level2.xml`
// ─ RelativeLayout container 360dip wide, full_height, bg=bg_hall
// ─ View bg=skin_bg.9.png (marginTop=53) — يملأ ما تحت شريط العنوان
// ─ RoyalPrivilegeDetailView (marginTop=236) — قائمة الامتيازات السفلية
// ─ View bg=royal_level_top_bg.webp (360x212.5dip, marginTop=44) — الخلفية العلوية
// ─ rl_title (bg_rank.9.png, 53dip):
//   • iv_rules (description_rule.webp, padding 10/8/10/10, alignParentStart)
//   • tv_title (21sp #87ebaa center, marginBottom=10, text="مستوى رويال", shadow)
//   • iv_close (skin_close.webp, padding 10/10/10/10, alignParentEnd)
// ─ RoyalProgressView (progressRadius=92dip, below=rl_title, centerHorizontal) — العداد الدائري
// ─ svga_royal_level (85x85dip, marginTop=99, centerHorizontal) — رمز المستوى الملوّن
// ─ ctv_middle_royal_level (19sp bold #ffb310, marginTop=166, gradient) — نص "ROYAL N"
// ─ FrameLayout (marginTop=193, 37dip) — يحوي ll_upgrade_need_value + ll_keep_info
// ─ fl_time_validity (royal_effective_time_bg, marginTop=238, minWidth=180, 22dip)
// ─ rl_growth_record (100dip, below=rl_title, alignParentEnd) — نقاطي الملكية >>
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

// ─── أصول Yalla Ludo الأصلية (المسارات مطابقة لـ /yalla-ui/) ───
const A = {
  bgHall:                 '/yalla-ui/full/bg_hall.webp',
  skinBg:                 '/yalla-ui/full/skin_bg.9.png',
  bgRank:                 '/yalla-ui/full/bg_rank.9.png',
  skinClose:              '/yalla-ui/full/skin_close.webp',
  descriptionRule:        '/yalla-ui/full/description_rule.webp',
  royalLevelTopBg:        '/yalla-ui/royal/royal_level_top_bg.webp',
  royalLevelValueIc:      '/yalla-ui/royal/royal_level_value_ic.webp',
  royalProgressPointIc:   '/yalla-ui/royal/royal_progress_point_ic.webp',
  royalEffectiveTimeBg:  '/yalla-ui/royal/royal_effective_time_bg.9.png',
  royalSuperPrivilegesDialogBg:  '/yalla-ui/royal/royal_super_privileges_dialog_bg.webp',
  royalSuperPrivilegesItemBg:    '/yalla-ui/royal/royal_super_privileges_item_bg.webp',
  royalSuperPrivilegeDialogTitleBg: '/yalla-ui/royal/royal_super_privilege_dialog_title_bg.webp',
  royal5ThroneIc:         '/yalla-ui/royal/royal_5_throne_ic.webp',
  royalLevel0:            '/yalla-ui/royal/royal_level_0.webp',
  royalLevel1:            '/yalla-ui/royal/royal_level_1.webp',
  royalLevel2:            '/yalla-ui/royal/royal_level_2.webp',
  royalLevel3:            '/yalla-ui/royal/royal_level_3.webp',
  royalLevel4:            '/yalla-ui/royal/royal_level_4.webp',
  royalLevel5:            '/yalla-ui/royal/royal_level_5.webp',
  circleContentOpenIc:    '/yalla-ui/royal/circle_content_open_ic.webp',
  royalCircleCouponIc:    '/yalla-ui/royal/royal_circle_coupon_ic.webp',
  reddot:                 '/yalla-ui/royal/reddot.webp',
  royalVisualIc:          '/yalla-ui/royal/royal_visual_ic.9.png',
  royalVisualSelectedIc:  '/yalla-ui/royal/royal_visual_selected_ic.webp',
};

const ROYAL_LEVEL_ICONS = [A.royalLevel0, A.royalLevel1, A.royalLevel2, A.royalLevel3, A.royalLevel4, A.royalLevel5];

export default function RoyalDialog({ open, onClose, onChargeClick }: RoyalDialogProps) {
  const [state, setState] = useState<RoyalStateApiResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/royal/state')
      .then(r => r.json())
      .then(d => { if (!cancelled && d.success) setState(d as RoyalStateApiResponse); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  // ─── العداد الدائري (RoyalProgressView) ───
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

  const circumference = 2 * Math.PI * RING_RADIUS;
  const dashOffset = circumference * (1 - ringPct / 100);

  // ─── تاريخ الصلاحية ───
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

  const levelIcon = state?.currentLevel.icon || ROYAL_LEVEL_ICONS[0];

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
        {/* ══════ rl_main — RelativeLayout 360dip wide, full_height, bg=bg_hall ══════ */}
        <motion.div
          initial={{ scale: 0.92, y: 24 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 24 }}
          transition={{ type: 'spring', damping: 22 }}
          className="relative overflow-hidden"
          style={{
            width: 'min(96vw, 360px)',
            height: 'min(92vh, 640px)',
            background: '#0a2e1f',
            boxShadow: '0 20px 60px rgba(0,0,0,.6)',
            borderRadius: '12px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* View bg=skin_bg.9.png — marginTop=53dip — الخلفية تحت شريط العنوان */}
          <img
            src={A.skinBg}
            alt=""
            className="absolute"
            style={{ top: 53, left: 0, right: 0, bottom: 0, width: '100%', height: 'calc(100% - 53px)', objectFit: 'fill', opacity: 0.95 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />

          {/* RoyalPrivilegeDetailView (rpv_privilege) — marginTop=236, margins 4/4/4/4 bottom */}
          <div
            className="absolute"
            style={{ top: 236, left: 4, right: 4, bottom: 4, overflowY: 'auto' }}
          >
            <RoyalPrivilegeList state={state} onChargeClick={onChargeClick} />
          </div>

          {/* View bg=royal_level_top_bg.webp — 360x212.5dip, marginTop=44, centerHorizontal */}
          <img
            src={A.royalLevelTopBg}
            alt=""
            className="absolute"
            style={{ top: 44, left: '50%', transform: 'translateX(-50%)', width: 360, height: 212.5, objectFit: 'fill', opacity: 0.85 }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
          />

          {/* ══════ rl_title — RelativeLayout bg=bg_rank.9.png, 53dip height ══════ */}
          <div className="absolute" style={{ top: 0, left: 0, right: 0, height: 53 }}>
            {/* bg_rank.9.png كخلفية حقيقية */}
            <img
              src={A.bgRank}
              alt=""
              className="absolute inset-0"
              style={{ width: '100%', height: '100%', objectFit: 'fill', opacity: 0.95 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {/* iv_rules — padding 10/8/10/10, src=description_rule.webp, alignParentStart */}
            <button
              className="absolute flex items-center justify-center"
              style={{ top: 0, left: 0, paddingTop: 10, paddingBottom: 8, paddingStart: 10, paddingEnd: 10, paddingLeft: 10, paddingRight: 10, height: '100%' }}
              aria-label="القواعد"
              title="قواعد مستوى رويال"
            >
              <img src={A.descriptionRule} alt="" style={{ width: 24, height: 24, objectFit: 'contain', opacity: 0.9 }} />
            </button>
            {/* tv_title — 21sp #87ebaa center, marginBottom=10, text="مستوى رويال", shadow */}
            <div
              className="absolute flex items-center justify-center"
              style={{ left: 0, right: 0, bottom: 10, top: 0, pointerEvents: 'none' }}
            >
              <span
                style={{
                  color: '#87ebaa',
                  fontSize: 21,
                  fontWeight: 700,
                  textShadow: '0 5px 1px rgba(0,0,0,.5)',
                  includeFontPadding: false,
                }}
              >
                مستوى رويال
              </span>
            </div>
            {/* iv_close — padding 10/10/10/10, src=skin_close.webp, alignParentEnd */}
            <button
              onClick={onClose}
              className="absolute flex items-center justify-center"
              style={{ top: 0, right: 0, paddingTop: 10, paddingBottom: 10, paddingLeft: 10, paddingRight: 10, height: '100%' }}
              aria-label="إغلاق"
            >
              <img src={A.skinClose} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            </button>
          </div>

          {/* ═════ـ RoyalProgressView (rpv_progress) — progressRadius=92dip, below=rl_title (so starts at top=53), centerHorizontal ══════ */}
          <div
            className="absolute"
            style={{ top: 53, left: '50%', transform: 'translateX(-50%)', width: 200, height: 200 }}
          >
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              className="absolute inset-0"
            >
              {/* علامات المستويات الخمس حول الدائرة (مثل النقاط الذهبية) */}
              {[1, 2, 3, 4, 5].map((lvl) => {
                const angle = ((lvl - 0.5) / 5) * 2 * Math.PI - Math.PI / 2;
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
              {/* حلقة خلفية */}
              <circle cx="100" cy="100" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6" />
              {/* الحلقة الملوّنة — تقدم نحو المستوى التالي */}
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
                  <image
                    href={A.royalProgressPointIc}
                    x={px - 9}
                    y={py - 9}
                    width="18"
                    height="18"
                  />
                );
              })()}
            </svg>
          </div>

          {/* ══════ svga_royal_level — 85x85dip, marginTop=99 (absolute), centerHorizontal ══════ */}
          <div
            className="absolute flex items-center justify-center"
            style={{ top: 99, left: '50%', transform: 'translateX(-50%)', width: 85, height: 85, pointerEvents: 'none' }}
          >
            <img
              src={levelIcon}
              alt={state?.currentLevel.name || 'ROYAL'}
              style={{ width: 85, height: 85, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.5))' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* ══════ ctv_middle_royal_level — 19sp bold #ffb310, marginTop=166, centerHorizontal, gradient ══════ */}
          <div
            className="absolute flex items-center justify-center"
            style={{ top: 166, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }}
          >
            <span
              style={{
                fontSize: 19,
                fontWeight: 700,
                // gradient start_color=#ffffff75 end_color=#ffc000 + textColor=#ffb310
                background: 'linear-gradient(180deg, #ffffff75 0%, #ffc000 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: '#ffb310',
                textShadow: '0 4px 2px rgba(0,0,0,.5)',
                whiteSpace: 'nowrap',
              }}
            >
              {state?.currentLevel.level === 0 ? 'بدون رويال' : `ROYAL ${state?.currentLevel.level}`}
            </span>
          </div>

          {/* ══════ FrameLayout marginTop=193, 37dip height — ll_upgrade_need_value + ll_keep_info ══════ */}
          <div
            className="absolute flex flex-col items-center justify-center"
            style={{ top: 193, left: 0, right: 0, height: 37 }}
          >
            {state && state.level < 5 && state.nextLevel ? (
              <>
                {/* ll_upgrade_need_value LinearLayout horizontal centerVertical centerHorizontal */}
                <div className="flex items-center justify-center" style={{ gap: 4 }}>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>للترقية تحتاج:</span>
                  <span style={{ color: '#ffed5d', fontSize: 15, fontWeight: 700, marginLeft: 4 }}>{state.needForUpgrade.toLocaleString()}</span>
                  {/* ImageView 16x16dip src=royal_level_value_ic, marginStart=5 */}
                  <img src={A.royalLevelValueIc} alt="" style={{ width: 16, height: 16, objectFit: 'contain', marginLeft: 5 }} />
                </div>
                {/* ll_keep_info LinearLayout horizontal centerVertical, below=ll_upgrade_need_value, centerHorizontal */}
                <div className="flex items-center justify-center" style={{ gap: 4, marginTop: 2 }}>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>للحفاظ تحتاج:</span>
                  <span style={{ color: '#ffed5d', fontSize: 15, fontWeight: 700, marginLeft: 4 }}>{state.needForKeep.toLocaleString()}</span>
                </div>
              </>
            ) : state && state.level >= 5 ? (
              <div className="flex items-center justify-center" style={{ gap: 6 }}>
                <Crown size={16} color="#fbbf24" />
                <span style={{ color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
                  وصلت أعلى مستوى رويال (5) — امتيازات كاملة مفعّلة
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center" style={{ gap: 6, color: '#94a3b8', fontSize: 12 }}>
                <Loader2 size={14} className="animate-spin" />
                <span>جاري التحميل...</span>
              </div>
            )}
          </div>

          {/* ══════ fl_time_validity — royal_effective_time_bg, marginTop=238, minWidth=180, 22dip height, centerHorizontal ══════ */}
          {validityText && (
            <div
              className="absolute flex items-center justify-center"
              style={{ top: 238, left: '50%', transform: 'translateX(-50%)', minWidth: 180, height: 22, padding: '0 10px' }}
            >
              <img
                src={A.royalEffectiveTimeBg}
                alt=""
                className="absolute inset-0"
                style={{ width: '100%', height: '100%', objectFit: 'fill' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="relative flex items-center" style={{ gap: 5 }}>
                <span style={{ color: '#87eaa9', fontSize: 10, fontWeight: 700 }}>تاريخ الصلاحية:</span>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }} dir="ltr">{validityText}</span>
              </div>
            </div>
          )}

          {/* ══════ rl_growth_record — 100dip wide, below=rl_title, alignParentEnd — "نقاطي الملكية >>" ══════ */}
          <div
            className="absolute"
            style={{ top: 53, right: 0, width: 100 }}
          >
            {/* ll_growth LinearLayout horizontal, marginTop=3, marginStart=10, marginEnd=11, alignParentEnd */}
            <div className="flex items-center justify-end" style={{ marginTop: 3, marginLeft: 10, marginRight: 11, gap: 2 }}>
              <span style={{ color: '#87eaa9', fontSize: 8, fontWeight: 700, whiteSpace: 'nowrap' }}>نقاطي الملكية</span>
              <span style={{ color: '#87eaa9', fontSize: 8, fontWeight: 700, whiteSpace: 'nowrap' }}>&gt;&gt;</span>
            </div>
            {/* النقاط الحالية */}
            <div className="text-right" style={{ marginTop: 2, marginRight: 11 }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                {state?.points.toLocaleString() ?? '0'}
              </span>
            </div>
            {/* View bg=#87eaa9, wrap x 1dip, marginBottom=15, below=ll_growth */}
            <div style={{ height: 1, background: '#87eaa9', marginTop: 2, marginBottom: 15, marginLeft: 10, marginRight: 11 }} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RoyalPrivilegeList — قائمة الامتيازات (يحلّ محل RoyalPrivilegeDetailView المخصص)
// حاوية بحاوية royal_super_privileges_dialog_bg.webp + كل عنصر بخلفية royal_super_privileges_item_bg.webp
// ════════════════════════════════════════════════════════════════════════════
function RoyalPrivilegeList({ state, onChargeClick }: { state: RoyalStateApiResponse | null; onChargeClick?: () => void }) {
  return (
    <div className="relative h-full">
      {/* الحاوية الرئيسية بخلفية royal_super_privileges_dialog_bg.webp */}
      <div className="relative rounded-xl p-3 overflow-hidden" style={{ minHeight: '100%' }}>
        <img
          src={A.royalSuperPrivilegesDialogBg}
          alt=""
          className="absolute inset-0"
          style={{ width: '100%', height: '100%', objectFit: 'fill', opacity: 0.85 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Fallback */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,.35)', border: '1px solid rgba(135,234,169,.15)', borderRadius: 12 }}
        />

        <div className="relative flex items-center justify-between mb-2">
          <span style={{ color: '#87eaa9', fontSize: 12, fontWeight: 700 }}>امتيازات المستوى الحالي</span>
          <span style={{ color: '#94a3b8', fontSize: 10 }}>
            إجمالي الشحن: ${state?.totalCharged.toFixed(2) ?? '0.00'}
          </span>
        </div>

        {ROYAL_PRIVILEGES.map((p) => {
          const unlocked = state ? state.level >= p.level : false;
          return (
            <div
              key={p.level}
              className="relative flex items-center gap-3 p-2 rounded-lg overflow-hidden mb-2"
              style={{ opacity: unlocked ? 1 : 0.5 }}
            >
              {/* royal_super_privileges_item_bg.webp — خلفية كل عنصر */}
              <img
                src={A.royalSuperPrivilegesItemBg}
                alt=""
                className="absolute inset-0"
                style={{ width: '100%', height: '100%', objectFit: 'fill', opacity: unlocked ? 0.95 : 0.4 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {!unlocked && (
                <div
                  className="absolute inset-0"
                  style={{ background: 'rgba(255,255,255,.03)', borderRadius: 8 }}
                />
              )}
              <div
                className="relative flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: unlocked ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(0,0,0,.4)',
                  border: '1px solid ' + (unlocked ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.05)'),
                  fontSize: 18,
                }}
              >
                {p.icon}
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: unlocked ? '#fbbf24' : '#94a3b8', fontSize: 12, fontWeight: 700 }}>
                    {p.title}
                  </span>
                  {unlocked && <Sparkles size={12} color="#fbbf24" />}
                </div>
                <p style={{ color: '#94a3b8', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</p>
              </div>
              <div
                className="relative"
                style={{
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  background: unlocked ? 'rgba(16,185,129,.2)' : 'rgba(51,65,85,.4)',
                  color: unlocked ? '#6ee7b7' : '#94a3b8',
                }}
              >
                {unlocked ? 'مفعّل' : `LV ${p.level}`}
              </div>
            </div>
          );
        })}

        {/* زر ترقية */}
        <button
          onClick={() => onChargeClick?.()}
          className="relative w-full mt-3 rounded-xl text-sm font-bold transition-all overflow-hidden hover:brightness-110"
          style={{ height: 40, color: '#1f1407', boxShadow: '0 4px 16px rgba(251,191,36,.3)' }}
        >
          <img
            src={A.royalSuperPrivilegesItemBg}
            alt=""
            className="absolute inset-0"
            style={{ width: '100%', height: '100%', objectFit: 'fill' }}
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              el.parentElement!.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
            }}
          />
          <span className="relative flex items-center justify-center gap-2">
            <Crown size={16} color="#1f1407" />
            اشحن نقاط رويال الآن
          </span>
        </button>
      </div>
    </div>
  );
}
