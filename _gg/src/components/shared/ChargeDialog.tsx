'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Crown, Sparkles } from 'lucide-react';
import RoyalDialog from './RoyalDialog';

// ════════════════════════════════════════════════════════════════════════════
// ChargeDialog — نسخة طبق الأصل 100% من Yalla Ludo `fragment_shop.xml`
// ─ RelativeLayout container (360dip wide, full_height, bg=skin_bg.9.png)
// ─ Top bar (NO bg_rank title — fragment_shop doesn't have one):
//   • Top-left: RoyalEntranceView (rle_entranceView) — opens RoyalDialog
//   • Top-left (marginStart=50): RoyalCouponEnterView (iv_coupon) — coupon entry
//   • Center (rl_money_title): rl_gold + rl_diamonds balance chips
//   • Top-right: iv_close (skin_close.webp with padding 15/10/10/10)
// ─ Tabs row (344x45dip, marginTop=10):
//   • 3 FrameLayouts (gold / diamond / privilege) — each weight=1
//     - bg=shop_switch_left_check / shop_switch_middle_uncheck / shop_switch_right_uncheck
//     - inside: icon (16-19dip shop_switch_*_check/uncheck) + label (12sp bold)
// ─ Content (vp_goods): view_shop_diamonds / view_shop_golds / fragment_buy_vip
// ════════════════════════════════════════════════════════════════════════════

interface Package {
  id: string;
  type: 'diamond' | 'gold' | 'vip' | 'royal';
  amount: number;
  bonus: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  label: string;
  labelEn: string;
  icon: string;
  iconBg: string;
  badge?: 'hot' | 'popular' | 'best' | 'new' | 'limited';
  royalPoints: number;
  xpReward: number;
  days?: number;
  validityDays?: number;
}

interface FirstChargeReward {
  gold: number;
  diamonds: number;
  gifts: { icon: string; name: string; amount: string }[];
  text: string;
}

interface ChargeDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'diamond' | 'gold' | 'vip';
  gems: number | null;
  gold: number | null;
}

// ─── أصول Yalla Ludo الأصلية (المسارات مطابقة لـ /yalla-ui/shop/) ───
const A = {
  // خلفية الحاوية
  skinBg:           '/yalla-ui/shop/skin_bg.9.png',
  skinClose:         '/yalla-ui/shop/skin_close.webp',
  descriptionRule:   '/yalla-ui/shop/description_rule.webp',
  // أيقونات الأرصدة
  coin:              '/yalla-ui/shop/coin.webp',         // 29x29dip
  diamonds:          '/yalla-ui/shop/diamonds.webp',     // 29x29dip
  jia:               '/yalla-ui/shop/jia.webp',           // plus button
  // خلفية شريط الرقم
  bgAddCoin:         '#0c3c30',                            // solid color + 10dip radius (shape drawable)
  // خلفيات الألسنة (tab backgrounds)
  switchLeftCheck:    '/yalla-ui/shop/shop_switch_left_check.webp',
  switchMiddleUncheck:'/yalla-ui/shop/shop_switch_middle_uncheck.webp',
  switchRightUncheck: '/yalla-ui/shop/shop_switch_right_uncheck.webp',
  // أيقونات الألسنة الصغيرة (16-19dip)
  switchGoldCheck:     '/yalla-ui/shop/shop_switch_gold_check.webp',
  switchGoldUncheck:   '/yalla-ui/shop/shop_switch_gold_uncheck.webp',
  switchDiamondCheck:  '/yalla-ui/shop/shop_switch_diamond_check.webp',
  switchDiamondUncheck:'/yalla-ui/shop/shop_switch_diamond_uncheck.webp',
  switchPrivilegeCheck:  '/yalla-ui/shop/shop_switch_privilege_check.webp',
  switchPrivilegeUncheck:'/yalla-ui/shop/shop_switch_privilege_uncheck.webp',
  // الفواصل
  shopTopGreenLine: '/yalla-ui/shop/shop_top_green_line.9.png',     // 9dip height
  shopItemTailBg:   '/yalla-ui/shop/shop_item_tail_bg.9.png',       // 191x25dip detail button
  // عناصر حزم الجواهر/الذهب
  shopItemBg:        '/yalla-ui/shop/shop_item_bg.webp',            // 107x150dip card bg
  btnShop:           '/yalla-ui/shop/btn_shop.9.png',               // 90x32dip buy button
  btnShopFree:       '/yalla-ui/shop/btn_shop_free.9.png',         // free variant
  labelBest:         '/yalla-ui/shop/label_best.webp',             // 60x21dip badge
  labelPopular:      '/yalla-ui/shop/label_popular.webp',           // 60x21dip badge
  diamonds1:         '/yalla-ui/shop/diamonds1.webp',              // 88x88dip large image
  coin1:             '/yalla-ui/shop/coin1.webp',                  // 88x88dip large gold image
  // عناصر حزم VIP
  cartVipBuyItemBg:  '/yalla-ui/shop/cart_vip_buy_item_bg.webp',    // 157.5x195.45dip
  btnYes:            '/yalla-ui/shop/btn_yes.9.png',                // 110x40dip buy button (bn_yes)
  btnYesPress:       '/yalla-ui/shop/btn_yes_press.9.png',
  privilegeKnight:  '/yalla-ui/shop/privilege_detail_knight_ic.webp', // 59x72dip (iv_days)
  privilegeBaron:   '/yalla-ui/shop/privilege_detail_baron_ic.webp',
  // Royal entrance
  royalLevelValueIc: '/yalla-ui/royal/royal_level_value_ic.webp',
  royal5ThroneIc:    '/yalla-ui/royal/royal_5_throne_ic.webp',
  // أول شحن
  bgFirstcharge:     '/yalla-ui/shop/bg_firstcharge.png',           // 296x162
  fastPayFirstRewardTipIc: '/yalla-ui/shop/fast_pay_first_reward_tip_ic.webp',
};

// 3 ألسنة فقط (مطابقة لـ fragment_shop.xml) — لا رويال في الألسنة
const TABS = [
  { key: 'gold' as const,        label: 'ذهب',      iconCheck: A.switchGoldCheck,      iconUncheck: A.switchGoldUncheck,      bgCheck: A.switchLeftCheck,    bgUncheck: A.switchMiddleUncheck, iconW: 16, iconH: 17, marginTop: 2 },
  { key: 'diamond' as const,    label: 'ألماس',    iconCheck: A.switchDiamondCheck,   iconUncheck: A.switchDiamondUncheck,   bgCheck: A.switchMiddleUncheck, bgUncheck: A.switchMiddleUncheck, iconW: 16, iconH: 19, marginTop: 1 },
  { key: 'vip' as const,        label: 'اشتراكات', iconCheck: A.switchPrivilegeCheck,  iconUncheck: A.switchPrivilegeUncheck, bgCheck: A.switchRightUncheck,  bgUncheck: A.switchRightUncheck,  iconW: 18.5, iconH: 16, marginTop: 3 },
];

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function ChargeDialog({ open, onClose, initialTab = 'diamond', gems, gold }: ChargeDialogProps) {
  const [activeTab, setActiveTab] = useState<'gold' | 'diamond' | 'vip'>(initialTab);
  const [packages, setPackages] = useState<{
    diamonds: Package[];
    golds: Package[];
    vip: Package[];
    royal: Package[];
    firstChargeReward: FirstChargeReward;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [chargeCode, setChargeCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('telegram');
  const [chargeResult, setChargeResult] = useState<{ success: boolean; message: string; royalLevel?: number; royalPoints?: number } | null>(null);
  const [royalOpen, setRoyalOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetch('/api/gems/packages')
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setPackages({
              diamonds: data.diamonds,
              golds: data.golds,
              vip: data.vip,
              royal: data.royal,
              firstChargeReward: data.firstChargeReward,
            });
          }
        })
        .catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  const currentPackages = packages
    ? activeTab === 'diamond' ? packages.diamonds
      : activeTab === 'gold' ? packages.golds
      : packages.vip
    : [];

  const handleCharge = async () => {
    if (!selectedPkg || !chargeCode.trim()) return;
    setLoading(true);
    setChargeResult(null);
    try {
      const res = await fetch('/api/gems/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: chargeCode.trim(),
          gemsPackage: selectedPkg.id,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setChargeResult({
          success: true,
          message: data.message || 'تم الشحن بنجاح',
          royalLevel: data.royal?.level,
          royalPoints: data.royal?.points,
        });
        setSelectedPkg(null);
        setChargeCode('');
      } else {
        setChargeResult({ success: false, message: data.error || 'فشل الشحن' });
      }
    } catch {
      setChargeResult({ success: false, message: 'خطأ في الاتصال' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.88)', backdropFilter: 'blur(5px)' }}
          onClick={onClose}
        >
          {/* ══════ rl_container — RelativeLayout 360dip wide, full height, bg=skin_bg ══════ */}
          <motion.div
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 22 }}
            className="relative flex flex-col overflow-hidden"
            style={{
              width: 'min(96vw, 360px)',
              height: 'min(92vh, 640px)',
              background: '#0a2e1f',
              boxShadow: '0 20px 60px rgba(0,0,0,.6)',
              borderRadius: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* skin_bg.9.png — خلفية الحاوية الكاملة */}
            <img
              src={A.skinBg}
              alt=""
              className="absolute inset-0 w-full h-full object-fill"
              style={{ opacity: 0.95, zIndex: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />

            {/* ══════ الصف العلوي: rle_entranceView + iv_coupon + rl_money_title + iv_close ══════ */}
            {/* rle_entranceView — RoyalEntranceView (top-left, marginStart=5, marginTop=3) */}
            <button
              onClick={() => setRoyalOpen(true)}
              className="absolute z-20 flex items-center justify-center"
              style={{ top: 3, left: 5, width: 38, height: 40 }}
              aria-label="مستوى رويال"
              title="مستوى رويال"
            >
              <img
                src={A.royalLevelValueIc}
                alt="royal"
                className="w-[24px] h-[24px] object-contain"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }}
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
              />
            </button>

            {/* iv_coupon — RoyalCouponEnterView (top-left, marginStart=50, marginTop=3) — placeholder */}
            <div
              className="absolute z-20"
              style={{ top: 3, left: 50, width: 38, height: 40 }}
            />

            {/* rl_money_title — مركز علوي (gold + diamonds balances) */}
            <div className="relative z-10 flex items-center justify-center" style={{ paddingTop: 8 }}>
              {/* rl_gold */}
              <div className="relative flex items-center" style={{ marginRight: 10 }}>
                {/* coin ImageView 29x29dip alignParentStart */}
                <img src={A.coin} alt="" className="z-10" style={{ width: 29, height: 29, objectFit: 'contain' }} />
                {/* tv_gold_num: 75x20dip, bg=bg_add_coin (solid #0c3c30 + radius 10), paddingStart=17, paddingEnd=4, marginStart=10 */}
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 75,
                    height: 20,
                    background: A.bgAddCoin,
                    borderRadius: 10,
                    marginLeft: -10,
                    paddingLeft: 17,
                    paddingRight: 4,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: '20px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {gold ?? '0'}
                </div>
                {/* jia — زر الإضافة */}
                <img src={A.jia} alt="" style={{ width: 14, height: 14, marginLeft: -4, objectFit: 'contain' }} />
              </div>
              {/* rl_diamonds */}
              <div className="relative flex items-center" style={{ marginRight: 10 }}>
                <img src={A.diamonds} alt="" className="z-10" style={{ width: 29, height: 29, objectFit: 'contain' }} />
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 75,
                    height: 20,
                    background: A.bgAddCoin,
                    borderRadius: 10,
                    marginLeft: -10,
                    paddingLeft: 17,
                    paddingRight: 4,
                    color: '#fff',
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: '20px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {gems ?? '0'}
                </div>
                <img src={A.jia} alt="" style={{ width: 14, height: 14, marginLeft: -4, objectFit: 'contain' }} />
              </div>
            </div>

            {/* iv_close — top-right with padding 15/10/10/10 (paddingStart=15, paddingEnd=10) */}
            <button
              onClick={onClose}
              className="absolute z-30 flex items-center justify-center"
              style={{ top: 0, right: 0, padding: '10px 10px 10px 15px' }}
              aria-label="إغلاق"
            >
              <img src={A.skinClose} alt="إغلاق" style={{ width: 24, height: 24, objectFit: 'contain' }} />
            </button>

            {/* ══════ radio_group_switch — 344x45dip, marginTop=10, below=rl_money_title ══════ */}
            <div className="relative z-10 flex" style={{ marginTop: 10, marginHorizontal: 8, height: 45 }}>
              {TABS.map((tab, idx) => {
                const isActive = activeTab === tab.key;
                const isLeft = idx === 0;
                const isMiddle = idx === 1;
                const isRight = idx === TABS.length - 1;
                // background: نشط → shop_switch_left_check (أو middle/right للوسط واليمين — لكن السورس يستخدم فقط *_check للنشط)
                const bg = isActive
                  ? (isLeft ? A.switchLeftCheck : isMiddle ? A.switchMiddleUncheck : A.switchRightUncheck)
                  : (isLeft ? A.switchMiddleUncheck : isMiddle ? A.switchMiddleUncheck : A.switchRightUncheck);
                const icon = isActive ? tab.iconCheck : tab.iconUncheck;
                const textColor = isActive ? '#ffffff' : '#17654c';
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="relative flex-1 flex flex-col items-center justify-center"
                    style={{ paddingBottom: 3, overflow: 'visible' }}
                  >
                    {/* خلفية اللِّسان كصورة حقيقية */}
                    <img
                      src={bg}
                      alt=""
                      className="absolute inset-0 w-full h-full"
                      style={{ objectFit: 'fill', opacity: 1 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    />
                    {/* المحتوى: icon + label */}
                    <img
                      src={icon}
                      alt=""
                      style={{ width: tab.iconW, height: tab.iconH, objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
                    />
                    <span
                      style={{
                        marginTop: tab.marginTop,
                        color: textColor,
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ══════ vp_goods — content area (below=radio_group_switch, marginTop=7) ══════ */}
            <div className="relative z-10 flex-1 overflow-y-auto" style={{ marginTop: 7 }}>
              {/* view_line — shop_top_green_line.9.png (9dip height) */}
              <div className="relative" style={{ height: 9 }}>
                <img
                  src={A.shopTopGreenLine}
                  alt=""
                  className="w-full h-full"
                  style={{ objectFit: 'fill' }}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = 'none';
                    el.parentElement!.style.background = 'linear-gradient(90deg, transparent 0%, #2bc895 50%, transparent 100%)';
                  }}
                />
              </div>

              {/* RecyclerView — grid of package items (paddingStart=9, paddingEnd=9) */}
              <div className="px-2 pb-2 pt-2">
                {/* بانر أول شحن (اختياري — يظهر فوق الحزم) */}
                {packages?.firstChargeReward && (
                  <div className="relative mb-2 rounded-xl overflow-hidden">
                    <img
                      src={A.bgFirstcharge}
                      alt=""
                      className="absolute inset-0 w-full h-full"
                      style={{ objectFit: 'fill', opacity: 0.95 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="relative p-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <img src={A.fastPayFirstRewardTipIc} alt="" className="w-5 h-6 object-contain" />
                        <span className="text-xs font-bold text-amber-300" style={{ textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>مكافأة أول شحن</span>
                        <Sparkles className="w-3 h-3 text-amber-400" />
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {packages.firstChargeReward.gifts.map((gift, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.15)' }}
                            >
                              <span className="text-base">{gift.icon}</span>
                            </div>
                            <span className="text-[8px] text-amber-200 mt-0.5" style={{ textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>{gift.amount}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-amber-100/80 mt-1.5 text-center" style={{ textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>{packages.firstChargeReward.text}</p>
                    </div>
                  </div>
                )}

                {/* شبكة الحزم — 3 أعمدة للجواهر/الذهب، 2 أعمدة لـ VIP */}
                {activeTab === 'vip' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {currentPackages.map((pkg) => (
                      <VipPackageCard
                        key={pkg.id}
                        pkg={pkg}
                        isSelected={selectedPkg?.id === pkg.id}
                        onSelect={() => setSelectedPkg(pkg)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {currentPackages.map((pkg) => (
                      <DiamondPackageCard
                        key={pkg.id}
                        pkg={pkg}
                        isSelected={selectedPkg?.id === pkg.id}
                        onSelect={() => setSelectedPkg(pkg)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ctv_detail — shop_item_tail_bg.9.png (191x25dip, marginTop=8, marginBottom=8) */}
              <div className="flex justify-center" style={{ marginTop: 8, marginBottom: 8 }}>
                <button
                  className="relative flex items-center justify-center"
                  style={{ width: 191, height: 25, color: '#2bc895', fontSize: 13, fontWeight: 700 }}
                >
                  <img
                    src={A.shopItemTailBg}
                    alt=""
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'fill' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="relative">{activeTab === 'gold' ? 'تفاصيل الذهب' : 'تفاصيل الجواهر'}</span>
                </button>
              </div>
            </div>

            {/* ══════ نموذج الشحن (عند اختيار حزمة) ══════ */}
            {selectedPkg && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="relative z-30 px-3 pb-3 overflow-hidden"
                style={{ background: 'rgba(0,0,0,.4)', borderTop: '1px solid rgba(255,255,255,.1)' }}
              >
                <div className="p-3 rounded-xl space-y-2.5" style={{ background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.08)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">الحزمة المختارة:</span>
                    <span className="text-xs font-bold text-amber-300">
                      {selectedPkg.type === 'diamond' && '💎 '}
                      {selectedPkg.type === 'gold' && '🪙 '}
                      {selectedPkg.type === 'vip' && '👑 '}
                      {formatAmount(selectedPkg.amount)} — ${selectedPkg.price}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">كود الاشتراك</label>
                    <input
                      type="text"
                      value={chargeCode}
                      onChange={(e) => setChargeCode(e.target.value)}
                      placeholder="أدخل كود اشتراكك"
                      className="w-full px-3 py-2 rounded-lg text-sm text-white outline-none"
                      style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)' }}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">طريقة الدفع</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'telegram',     label: '📱 تيليجرام' },
                        { id: 'whatsapp',     label: '💬 واتساب' },
                        { id: 'bank_transfer',label: '🏦 تحويل بنكي' },
                        { id: 'other',        label: '🔗 أخرى' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setPaymentMethod(m.id)}
                          className="py-1.5 rounded-lg text-[10px] font-medium transition-all"
                          style={{
                            background: paymentMethod === m.id ? 'linear-gradient(135deg, #1a6b3a, #0e4a25)' : 'rgba(0,0,0,.3)',
                            border: paymentMethod === m.id ? '1px solid rgba(255,215,0,.4)' : '1px solid rgba(255,255,255,.08)',
                            color: paymentMethod === m.id ? '#ffd700' : '#94a3b8',
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-[9px] text-amber-500/70 text-center">
                    ستحصل على: +{selectedPkg.royalPoints} نقاط رويال · +{selectedPkg.xpReward} XP
                  </div>
                  {/* زر الشراء — btn_shop.9.png كخلفية حقيقية */}
                  <button
                    onClick={handleCharge}
                    disabled={loading || !chargeCode.trim()}
                    className="relative w-full rounded-lg text-sm font-bold text-black transition-all disabled:opacity-50 overflow-hidden"
                    style={{ height: 40 }}
                  >
                    <img
                      src={A.btnShop}
                      alt=""
                      className="absolute inset-0 w-full h-full"
                      style={{ objectFit: 'fill' }}
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = 'none';
                        el.parentElement!.style.background = 'linear-gradient(135deg, #94f534, #47790c)';
                      }}
                    />
                    <span className="relative flex items-center justify-center gap-1.5" style={{ color: '#47790c' }}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري المعالجة...
                        </>
                      ) : (
                        <>💳 شحن — ${selectedPkg.price}</>
                      )}
                    </span>
                  </button>
                  {chargeResult && (
                    <div className={`text-xs text-center p-2 rounded-lg ${chargeResult.success ? 'text-emerald-300 bg-emerald-950/30' : 'text-red-300 bg-red-950/30'}`}>
                      {chargeResult.success ? '✅ ' : '❌ '}{chargeResult.message}
                      {chargeResult.royalLevel !== undefined && (
                        <div className="mt-1 text-[10px] text-amber-300">
                          👑 مستوى رويال: {chargeResult.royalLevel} — نقاط: {chargeResult.royalPoints ?? 0}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* RoyalDialog — يفتح من rle_entranceView داخل ChargeDialog */}
      <RoyalDialog
        open={royalOpen}
        onClose={() => setRoyalOpen(false)}
        onChargeClick={() => {
          setRoyalOpen(false);
          // العودة إلى لسان الجواهر للشحن
          setActiveTab('diamond');
        }}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DiamondPackageCard — نسخة طبق الأصل 100% من item_diamonds.xml
// RelativeLayout 107x150dip:
//   - shop_item_bg ImageView (107x150dip fitXY centerInParent)
//   - ll1 (79x20dip marginTop=8 centerHorizontal): diamonds icon (14x16dip) + count text (12sp #fff782 shadow)
//   - FrameLayout below=ll1:
//     - iv_coin (88x88dip, src=diamonds1 or coin1, center_horizontal)
//     - svg_best FrameLayout (60x21dip alignEnd marginEnd=-3)
//   - ll_buy (90x32dip bg=btn_shop.9.png alignParentBottom centerHorizontal)
//     - tv_money StrokeTextView (14sp bold #47790c, stroke=#94f534 width=2)
// ════════════════════════════════════════════════════════════════════════════
function DiamondPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  const isGold = pkg.type === 'gold';
  const bigIcon = isGold ? A.coin1 : A.diamonds1;
  const smallIcon = isGold ? A.coin : A.diamonds;
  const accentColor = isGold ? '#fbbf24' : '#22d3ee';

  return (
    <div
      onClick={onSelect}
      className="relative cursor-pointer transition-all"
      style={{
        width: 107,
        height: 150,
        border: isSelected ? `1.5px solid ${accentColor}` : 'none',
        boxShadow: isSelected ? `0 0 12px ${accentColor}66` : 'none',
        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {/* shop_item_bg ImageView 107x150dip fitXY centerInParent */}
      <img
        src={A.shopItemBg}
        alt=""
        className="absolute inset-0"
        style={{ width: 107, height: 150, objectFit: 'fill' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* ll1 — RelativeLayout 79x20dip marginTop=8 centerHorizontal */}
      <div className="absolute flex items-center justify-center" style={{ top: 8, left: '50%', transform: 'translateX(-50%)', width: 79, height: 20 }}>
        {/* iv2 — ImageView 14x16dip src=diamonds */}
        <img src={smallIcon} alt="" style={{ width: 14, height: 16, objectFit: 'contain' }} />
        {/* tv_doin_number — CustomTextView 12sp #fff782 shadow #000 dy=3 radius=5, marginStart=2 */}
        <span
          style={{
            color: '#fff782',
            fontSize: 12,
            fontWeight: 700,
            marginLeft: 2,
            textShadow: '0 3px 5px #000',
          }}
        >
          {formatAmount(pkg.amount + pkg.bonus)}
        </span>
      </div>

      {/* FrameLayout below=ll1 — يحوي iv_coin + svg_best */}
      <div className="absolute flex items-start justify-center" style={{ top: 28, left: 0, right: 0, height: 88 }}>
        {/* iv_coin — ImageView 88x88dip src=diamonds1 */}
        <img
          src={bigIcon}
          alt={pkg.label}
          style={{ width: 88, height: 88, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
        />
        {/* tv_type / svg_best — FrameLayout 60x21dip marginTop=1 marginEnd=-3 alignEnd */}
        {pkg.badge === 'best' && (
          <img
            src={A.labelBest}
            alt="BEST"
            className="absolute"
            style={{ top: 2, right: -3, width: 60, height: 21, objectFit: 'contain' }}
          />
        )}
        {pkg.badge === 'popular' && (
          <img
            src={A.labelPopular}
            alt="POPULAR"
            className="absolute"
            style={{ top: 2, right: -3, width: 60, height: 21, objectFit: 'contain' }}
          />
        )}
        {/* شارة الخصم (مستوحاة من iv_coupon_extra) */}
        {pkg.discountPercent && pkg.discountPercent > 0 && (
          <div
            className="absolute"
            style={{
              top: 30,
              right: -3,
              padding: '1px 4px',
              background: '#ef4444',
              color: '#fff',
              fontSize: 8,
              fontWeight: 700,
              borderRadius: 4,
              boxShadow: '0 1px 2px rgba(0,0,0,.4)',
              transform: 'rotate(20deg)',
            }}
          >
            -{pkg.discountPercent}%
          </div>
        )}
      </div>

      {/* tv_tips — StrokeTextView 9sp #3c93ad marginBottom=45 */}
      {pkg.bonus > 0 && (
        <div className="absolute" style={{ bottom: 45, left: 0, right: 0, textAlign: 'center' }}>
          <span style={{ color: '#3c93ad', fontSize: 9, fontWeight: 700, textShadow: '0 1px 1px #000' }}>
            +{formatAmount(pkg.bonus)} مكافأة
          </span>
        </div>
      )}

      {/* ll_buy — LinearLayout 90x32dip bg=btn_shop.9.png alignParentBottom centerHorizontal */}
      <div
        className="absolute flex items-center justify-center"
        style={{ bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 90, height: 32, overflow: 'hidden' }}
      >
        <img
          src={A.btnShop}
          alt=""
          className="absolute inset-0"
          style={{ width: 90, height: 32, objectFit: 'fill' }}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = 'none';
            el.parentElement!.style.background = 'linear-gradient(180deg, #94f534, #47790c)';
            el.parentElement!.style.borderRadius = 6;
          }}
        />
        {/* tv_money — StrokeTextView 14sp bold #47790c stroke_color=#94f534 stroke_width=2 */}
        <span
          style={{
            position: 'relative',
            color: '#47790c',
            fontSize: 14,
            fontWeight: 700,
            textShadow: '1px 0 0 #94f534, -1px 0 0 #94f534, 0 1px 0 #94f534, 0 -1px 0 #94f534, 1px 1px 0 #94f534, -1px -1px 0 #94f534, 1px -1px 0 #94f534, -1px 1px 0 #94f534',
          }}
        >
          ${pkg.price}
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VipPackageCard — نسخة طبق الأصل 100% من item_vip_buy.xml
// LinearLayout 157.5x195.45dip bg=cart_vip_buy_item_bg:
//   - FrameLayout 59x72dip marginTop=39 centerHorizontal:
//     - iv_days ImageView (fill_parent) — tier icon
//     - ctv_days CustomTextView 16sp bold #17654c text="7days"
//   - btn_vip_buy LinearLayout 110x40dip marginTop=23 bg=bn_yes:
//     - diamonds ImageView 15x19dip
//     - tv_num StrokeTextView 15sp text="100" marginStart=6
// ════════════════════════════════════════════════════════════════════════════
function VipPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  const tierIcon = pkg.id === 'vip_royal' ? A.royal5ThroneIc : pkg.id === 'vip_liwa' ? A.privilegeBaron : A.privilegeKnight;
  const tierColor = pkg.id === 'vip_royal' ? '#fbbf24' : pkg.id === 'vip_liwa' ? '#a78bfa' : '#22d3ee';

  return (
    <div
      onClick={onSelect}
      className="relative cursor-pointer transition-all overflow-hidden"
      style={{
        width: 157,
        minHeight: 195,
        margin: '4px 2.5px',
        border: isSelected ? `1.5px solid ${tierColor}` : 'none',
        boxShadow: isSelected ? `0 0 16px ${tierColor}55` : 'none',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* cart_vip_buy_item_bg — خلفية كاملة */}
      <img
        src={A.cartVipBuyItemBg}
        alt=""
        className="absolute inset-0"
        style={{ width: '100%', height: '100%', objectFit: 'fill' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* شارة (label_best / label_popular) — أعلى يمين */}
      {pkg.badge === 'best' && (
        <img src={A.labelBest} alt="BEST" className="absolute" style={{ top: -1, right: -1, width: 50, height: 18, objectFit: 'contain', zIndex: 10 }} />
      )}
      {pkg.badge === 'popular' && (
        <img src={A.labelPopular} alt="POPULAR" className="absolute" style={{ top: -1, right: -1, width: 50, height: 18, objectFit: 'contain', zIndex: 10 }} />
      )}
      {pkg.badge === 'hot' && (
        <div className="absolute" style={{ top: -1, right: -1, padding: '2px 6px', background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 700, borderRadius: 10, zIndex: 10 }}>🔥</div>
      )}

      {/* FrameLayout 59x72dip marginTop=39 centerHorizontal — iv_days */}
      <div className="absolute" style={{ top: 39, left: '50%', transform: 'translateX(-50%)', width: 59, height: 72 }}>
        {/* iv_days — ImageView fill_parent */}
        <img
          src={tierIcon}
          alt={pkg.label}
          className="absolute inset-0"
          style={{ width: 59, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))' }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />
        {/* ctv_days — CustomTextView 16sp bold #17654c center marginTop=3 text="7days" */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: 3 }}>
          <span style={{ color: '#17654c', fontSize: 16, fontWeight: 700, textShadow: '0 1px 0 rgba(255,255,255,.3)' }}>
            {pkg.days}يوم
          </span>
        </div>
      </div>

      {/* خصم (اختياري) */}
      {pkg.discountPercent && pkg.discountPercent > 0 && (
        <div className="absolute" style={{ top: 4, left: 4, padding: '2px 6px', background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 700, borderRadius: 4, zIndex: 10 }}>
          -{pkg.discountPercent}%
        </div>
      )}

      {/* btn_vip_buy — LinearLayout 110x40dip marginTop=23 centerHorizontal bg=bn_yes */}
      <div
        className="absolute flex items-center justify-center"
        style={{ top: 134, left: '50%', transform: 'translateX(-50%)', width: 110, height: 40, overflow: 'hidden' }}
      >
        <img
          src={A.btnYes}
          alt=""
          className="absolute inset-0"
          style={{ width: 110, height: 40, objectFit: 'fill' }}
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            el.style.display = 'none';
            el.parentElement!.style.background = 'linear-gradient(180deg, #87eaa9 0%, #2bc895 100%)';
            el.parentElement!.style.borderRadius = 6;
          }}
        />
        {/* diamonds ImageView 15x19dip */}
        <img src={A.diamonds} alt="" style={{ width: 15, height: 19, objectFit: 'contain' }} />
        {/* tv_num StrokeTextView 15sp text="price" marginStart=6 — StrokeTextStyle_Yes */}
        <span
          style={{
            marginLeft: 6,
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            textShadow: '1px 0 0 #17654c, -1px 0 0 #17654c, 0 1px 0 #17654c, 0 -1px 0 #17654c, 1px 1px 0 #17654c, -1px -1px 0 #17654c, 1px -1px 0 #17654c, -1px 1px 0 #17654c',
          }}
        >
          {pkg.price.toFixed(2)}
        </span>
      </div>

      {/* نص اسم الباقة + رويال + XP */}
      <div className="absolute" style={{ top: 178, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ color: tierColor, fontSize: 11, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>
          {pkg.label} · +{pkg.royalPoints} رويال
        </div>
      </div>
    </div>
  );
}
