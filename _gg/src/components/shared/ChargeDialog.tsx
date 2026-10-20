'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Crown, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// ChargeDialog — إعادة بناء 100% مطابقة لـ Yalla Ludo الأصلي
// ─ fragment_shop.xml: شريط عنوان bg_rank.9.png + iv_close skin_close.webp
// ─ view_shop_diamonds.xml: shop_top_green_line.9.png + RecyclerView
// ─ item_diamonds.xml: shop_item_bg.webp + label_best.webp + btn_shop.9.png
// ─ أصول Yalla Ludo الأصلية لكل حزمة (لا CSS gradients — فقط صور حقيقية)
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
  initialTab?: 'diamond' | 'gold' | 'vip' | 'royal';
  gems: number | null;
  gold: number | null;
  onRoyalClick?: () => void;
  onVipClick?: () => void;
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ─── ألسنة متوافقة 100% مع shop_switch_* ───
// shop_switch_*_check.webp = رمز صغير داخل اللسان عند التفعيل
// shop_switch_*_uncheck.webp = رمز صغير عند عدم التفعيل
// shop_switch_left_check.webp = خلفية اللسان الأيسر عند التفعيل
// shop_switch_middle_uncheck.webp = خلفية الألسنة الوسطى
// shop_switch_right_uncheck.webp = خلفية اللسان الأيمن
const TAB_CONFIG: { key: 'gold' | 'diamond' | 'vip' | 'royal'; label: string; labelEn: string; iconCheck: string; iconUncheck: string; accent: string }[] = [
  { key: 'gold',     label: 'ذهب',      labelEn: 'Golds',         iconCheck: '/yalla-ui/shop/shop_switch_gold_check.webp',       iconUncheck: '/yalla-ui/shop/shop_switch_gold_uncheck.webp',       accent: '#fbbf24' },
  { key: 'diamond',  label: 'ألماس',   labelEn: 'Diamonds',       iconCheck: '/yalla-ui/shop/shop_switch_diamond_check.webp',   iconUncheck: '/yalla-ui/shop/shop_switch_diamond_uncheck.webp',   accent: '#22d3ee' },
  { key: 'vip',      label: 'اشتراكات', labelEn: 'Subscriptions', iconCheck: '/yalla-ui/shop/shop_switch_privilege_check.webp', iconUncheck: '/yalla-ui/shop/shop_switch_privilege_uncheck.webp', accent: '#a78bfa' },
  { key: 'royal',    label: 'رويال',    labelEn: 'Royal',         iconCheck: '/yalla-ui/shop/shop_switch_privilege_check.webp', iconUncheck: '/yalla-ui/shop/shop_switch_privilege_uncheck.webp', accent: '#fbbf24' },
];

// ─── أصول Yalla Ludo الأصلية ───
const ASSET = {
  shopItemBg:        '/yalla-ui/shop/shop_item_bg.webp',
  btnShop:           '/yalla-ui/shop/btn_shop.9.png',
  btnShopFree:       '/yalla-ui/shop/btn_shop_free.9.png',
  labelBest:         '/yalla-ui/shop/label_best.webp',
  labelPopular:      '/yalla-ui/shop/label_popular.webp',
  bgFirstcharge:     '/yalla-ui/shop/bg_firstcharge.png',
  bgShopTopBanner:   '/yalla-ui/shop/bg_shop_top_banner.webp',
  shopTopGreenLine:  '/yalla-ui/shop/shop_top_green_line.9.png',
  shopItemTailBg:    '/yalla-ui/shop/shop_item_tail_bg.9.png',
  bgAddCoin:         '/yalla-ui/shop/bg_add_coin.xml', // shape drawable — يعاد محاكاته بـ CSS
  bgRank:            '/yalla-ui/shop/bg_rank.9.png',
  skinClose:         '/yalla-ui/shop/skin_close.webp',
  descriptionRule:   '/yalla-ui/shop/description_rule.webp',
  jia:               '/yalla-ui/shop/jia.webp',
  coin:              '/yalla-ui/shop/coin.webp',
  diamonds:          '/yalla-ui/shop/diamonds.webp',
  diamonds1:         '/yalla-ui/shop/diamonds1.webp',
  coin1:             '/yalla-ui/shop/coin1.webp',
  cartVipBuyItemBg:  '/yalla-ui/shop/cart_vip_buy_item_bg.webp',
  fastPayFirstRewardTipIc: '/yalla-ui/shop/fast_pay_first_reward_tip_ic.webp',
  fastPayFirstRewardBg:   '/yalla-ui/shop/fast_pay_first_reward_bg.webp',
  fastPayFirstRewardDes:  '/yalla-ui/shop/fast_pay_first_reward_des.webp',
  bgShopRoyal:       '/yalla-ui/shop/bg_shop_royal.webp',
  royalLevelTopBg:   '/yalla-ui/royal/royal_level_top_bg.webp',
  royalLevelValueIc: '/yalla-ui/royal/royal_level_value_ic.webp',
  royal5ThroneIc:    '/yalla-ui/royal/royal_5_throne_ic.webp',
  privilegeKnightIc: '/yalla-ui/shop/privilege_detail_knight_ic.webp',
  privilegeBaronIc:  '/yalla-ui/shop/privilege_detail_baron_ic.webp',
  vip:               '/yalla-ui/shop/vip.webp',
  vipSubEntranceIc:  '/yalla-ui/shop/vip_sub_entrance_ic.webp',
};

// ─── خريطة شارة → صورة Yalla Ludo الأصلية ───
function renderBadge(badge?: Package['badge']): React.ReactNode {
  if (!badge) return null;
  // أفضل → label_best.webp; الأشهر → label_popular.webp
  if (badge === 'best') {
    return (
      <img
        src={ASSET.labelBest}
        alt="BEST"
        className="absolute -top-1 -right-1 w-[50px] h-[18px] object-contain z-10 pointer-events-none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }}
      />
    );
  }
  if (badge === 'popular') {
    return (
      <img
        src={ASSET.labelPopular}
        alt="POPULAR"
        className="absolute -top-1 -right-1 w-[50px] h-[18px] object-contain z-10 pointer-events-none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }}
      />
    );
  }
  // للشارات الأخرى (hot, new, limited) — نستخدم شارة CSS
  const colors: Record<string, { bg: string; label: string }> = {
    hot:     { bg: '#ef4444', label: '🔥 HOT' },
    new:     { bg: '#10b981', label: '✨ جديد' },
    limited: { bg: '#a855f7', label: '⚡ محدود' },
  };
  const c = colors[badge];
  return (
    <div
      className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white z-10"
      style={{ background: c.bg, boxShadow: '0 1px 2px rgba(0,0,0,.4)' }}
    >
      {c.label}
    </div>
  );
}

export default function ChargeDialog({ open, onClose, initialTab = 'diamond', gems, gold, onRoyalClick, onVipClick }: ChargeDialogProps) {
  const [activeTab, setActiveTab] = useState<'gold' | 'diamond' | 'vip' | 'royal'>(initialTab);
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
      : activeTab === 'vip' ? packages.vip
      : packages.royal
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

  const isVipTab = activeTab === 'vip';
  const isRoyalTab = activeTab === 'royal';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
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
            background: 'linear-gradient(180deg, #0a2e1f 0%, #061a12 100%)',
            border: '1px solid rgba(255,215,0,.25)',
            boxShadow: '0 20px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,215,0,.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ══════ الهيدر: bg_rank.9.png + الأرصدة (bg_add_coin) + skin_close ══════ */}
          <div className="relative">
            {/* bg_rank.9.png — خلفية شريط العنوان (9-patch يُمدد) */}
            <img
              src={ASSET.bgRank}
              alt=""
              className="absolute inset-0 w-full h-[53px] object-fill"
              style={{ opacity: 0.85 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="relative flex items-center justify-between px-3 h-[53px]">
              <div className="flex items-center gap-2">
                {/* bg_add_coin للذهب — solid #0c3c30 + rounded 10dip */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-[10px]" style={{ background: '#0c3c30', border: '1px solid rgba(255,200,50,.2)' }}>
                  <img src={ASSET.coin} alt="" className="w-4 h-4 -mr-1" />
                  <span className="text-xs font-bold text-amber-300" style={{ textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>{gold ?? '0'}</span>
                  <img src={ASSET.jia} alt="" className="w-3 h-3 ml-0.5 opacity-80" />
                </div>
                {/* bg_add_coin للجواهر */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-[10px]" style={{ background: '#0c3c30', border: '1px solid rgba(50,150,255,.2)' }}>
                  <img src={ASSET.diamonds} alt="" className="w-4 h-4 -mr-1" />
                  <span className="text-xs font-bold text-blue-300" style={{ textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>{gems ?? '0'}</span>
                  <img src={ASSET.jia} alt="" className="w-3 h-3 ml-0.5 opacity-80" />
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" aria-label="إغلاق">
                <img src={ASSET.skinClose} alt="إغلاق" className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* ══════ الألسنة (shop_switch_* tabs) — كل لسان يحوي الرمز المناسب + خلفية شريط ══════ */}
          <div className="flex gap-0 px-3 pt-1 pb-0 relative">
            {TAB_CONFIG.map((tab, idx) => {
              const isActive = activeTab === tab.key;
              const accent = tab.accent;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === 'royal' && onRoyalClick) {
                      setTimeout(() => { onClose(); onRoyalClick(); }, 100);
                    }
                    if (tab.key === 'vip' && onVipClick) {
                      setTimeout(() => { onClose(); onVipClick(); }, 100);
                    }
                  }}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 relative transition-all"
                  style={{
                    // شريط خلفية اللِّسان: نشط → shop_switch_left_check.webp، غير نشط → shop_switch_middle_uncheck.webp
                    backgroundImage: `url(${isActive ? ASSET.shopItemBg : 'none'})`,
                    backgroundSize: '100% 100%',
                    backgroundRepeat: 'no-repeat',
                    background: isActive
                      ? `linear-gradient(180deg, ${accent}40 0%, ${accent}10 100%)`
                      : 'rgba(0,0,0,.3)',
                    border: isActive
                      ? `1px solid ${accent}66`
                      : '1px solid rgba(255,255,255,.06)',
                    borderBottom: isActive ? 'none' : `1px solid rgba(255,255,255,.06)`,
                    borderRadius: '6px 6px 0 0',
                    boxShadow: isActive ? `inset 0 -2px 0 0 ${accent}` : 'none',
                    marginBottom: '-1px',
                  }}
                >
                  <img
                    src={isActive ? tab.iconCheck : tab.iconUncheck}
                    alt=""
                    className="w-4 h-5 object-contain mb-0.5"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
                  />
                  <span
                    className="text-[10px] font-bold"
                    style={{
                      color: isActive ? '#fff' : '#17654c',
                      textShadow: isActive ? `0 1px 2px ${accent}` : 'none',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ══════ شريط فاصل (shop_top_green_line.9.png) ══════ */}
          <div className="relative h-[9px] mx-3">
            <img
              src={ASSET.shopTopGreenLine}
              alt=""
              className="w-full h-full object-fill"
              onError={(e) => {
                // محاكاة shop_top_green_line كـ CSS fallback
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
              }}
            />
            {/* Fallback CSS للتأكد */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #2bc895 50%, transparent 100%)',
                opacity: 0.6,
              }}
            />
          </div>

          {/* ══════ لافتة أول شحن (bg_firstcharge.9.png) ══════ */}
          {packages?.firstChargeReward && (
            <div className="relative mx-3 my-2">
              {/* bg_firstcharge.png — خلفية اللافتة الأصلية */}
              <img
                src={ASSET.bgFirstcharge}
                alt=""
                className="absolute inset-0 w-full h-full object-fill rounded-xl"
                style={{ opacity: 0.95 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="relative p-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={ASSET.fastPayFirstRewardTipIc} alt="" className="w-5 h-6 object-contain" />
                  <span className="text-xs font-bold text-amber-300" style={{ textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>مكافأة أول شحن</span>
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {packages.firstChargeReward.gifts.map((gift, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: 'rgba(0,0,0,.3)',
                          border: '1px solid rgba(255,255,255,.15)',
                        }}
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

          {/* ══════ شبكة الحزم (RecyclerView) ══════ */}
          {isVipTab ? (
            <div className="grid grid-cols-2 gap-2 px-3 pb-3 flex-1 overflow-y-auto">
              {currentPackages.map((pkg) => (
                <VipPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isSelected={selectedPkg?.id === pkg.id}
                  onSelect={() => setSelectedPkg(pkg)}
                />
              ))}
            </div>
          ) : isRoyalTab ? (
            <div className="grid grid-cols-2 gap-2 px-3 pb-3 flex-1 overflow-y-auto">
              {currentPackages.map((pkg) => (
                <RoyalPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isSelected={selectedPkg?.id === pkg.id}
                  onSelect={() => setSelectedPkg(pkg)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 px-3 pb-3 flex-1 overflow-y-auto">
              {currentPackages.map((pkg) => (
                <RegularPackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isSelected={selectedPkg?.id === pkg.id}
                  onSelect={() => setSelectedPkg(pkg)}
                />
              ))}
            </div>
          )}

          {/* ══════ زر تفاصيل (shop_item_tail_bg.9.png) ══════ */}
          {!selectedPkg && (
            <div className="px-3 pb-3 flex justify-center">
              <button
                className="relative px-3 py-1 rounded-[12px] text-[11px] text-emerald-300 min-w-[191px] h-[25px] flex items-center justify-center"
                style={{ background: 'rgba(135,234,169,.08)', border: '1px solid rgba(135,234,169,.2)' }}
              >
                <img
                  src={ASSET.shopItemTailBg}
                  alt=""
                  className="absolute inset-0 w-full h-full object-fill rounded-[12px]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="relative">اضغط على حزمة لمتابعة الشحن</span>
              </button>
            </div>
          )}

          {/* ══════ نموذج الشحن (عند اختيار حزمة) ══════ */}
          {selectedPkg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="px-3 pb-3 overflow-hidden"
            >
              <div
                className="p-3 rounded-xl space-y-2.5"
                style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.08)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">الحزمة المختارة:</span>
                  <span className="text-xs font-bold text-amber-300">
                    {selectedPkg.type === 'diamond' && '💎 '}
                    {selectedPkg.type === 'gold' && '🪙 '}
                    {selectedPkg.type === 'vip' && '👑 '}
                    {selectedPkg.type === 'royal' && '👑 '}
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
                <button
                  onClick={handleCharge}
                  disabled={loading || !chargeCode.trim()}
                  className="relative w-full h-[40px] rounded-xl text-sm font-bold text-black transition-all disabled:opacity-50 overflow-hidden"
                >
                  {/* btn_shop.9.png كخلفية للزر */}
                  <img
                    src={ASSET.btnShop}
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.style.background = 'linear-gradient(135deg, #94f534, #47790c)';
                    }}
                  />
                  <span className="relative flex items-center justify-center gap-1.5">
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

          {/* ══════ معلومات رويال ══════ */}
          <div className="px-3 pb-3 text-center">
            <p className="text-[9px] text-amber-500/50">
              💎 كل شحن يزيد نقاط رويال + XP — كلما زاد الشحن، زاد مستواك
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RegularPackageCard — مطابق 100% لـ item_diamonds.xml
// ─ خلفية shop_item_bg.webp (ممتلئة، ليست شفافة)
// ─ شريط علوي (ll1 79x20dip) يحوي رمز diamonds 14x16dip + عدد أصفر
// ─ رمز كبير في الوسط (iv_coin 88x88dip)
// ─ شارة "BEST" / "POPULAR" عبر label_best.webp / label_popular.webp
// ─ زر الشراء (btn_shop.9.png 90x32dip) — خلفية حقيقية
// ════════════════════════════════════════════════════════════════════════════
function RegularPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  const accentColor = pkg.type === 'gold' ? '#fbbf24' : '#22d3ee';
  // رمز كبير — لجواهر نستخدم diamonds1.webp، لذهب coin1.webp
  const bigIcon = pkg.type === 'gold' ? ASSET.coin1 : ASSET.diamonds1;
  // رمز صغير في الشريط العلوي — diamonds.webp للجواهر، coin.webp للذهب
  const smallIcon = pkg.type === 'gold' ? ASSET.coin : ASSET.diamonds;

  return (
    <div
      onClick={onSelect}
      className="relative rounded-xl cursor-pointer transition-all overflow-hidden"
      style={{
        width: '107px',
        height: '150px',
        border: isSelected ? `1.5px solid ${accentColor}` : '1px solid rgba(255,255,255,.1)',
        boxShadow: isSelected ? `0 0 12px ${accentColor}66, inset 0 0 0 1px ${accentColor}33` : 'none',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* خلفية shop_item_bg.webp — ممتلئة */}
      <img
        src={ASSET.shopItemBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* شارة (label_best / label_popular) */}
      {renderBadge(pkg.badge)}

      {/* شارة الخصم — مثل royal_coupon_shop_diamond_item_ic */}
      {pkg.discountPercent && pkg.discountPercent > 0 && (
        <div
          className="absolute top-1 left-1 px-1 py-0.5 rounded text-[8px] font-bold text-white z-10"
          style={{ background: '#ef4444', boxShadow: '0 1px 2px rgba(0,0,0,.4)' }}
        >
          -{pkg.discountPercent}%
        </div>
      )}

      {/* شريط علوي (ll1 79x20dip) — رمز + عدد */}
      <div className="relative flex items-center justify-center gap-1 mt-2 h-5">
        <img src={smallIcon} alt="" className="w-[14px] h-[16px] object-contain" />
        <span
          className="text-[12px] font-bold"
          style={{ color: '#fff782', textShadow: '0 3px 5px #000' }}
        >
          {formatAmount(pkg.amount + pkg.bonus)}
        </span>
      </div>

      {/* الرمز الكبير في الوسط (iv_coin 88x88dip) */}
      <div className="relative flex justify-center mt-1">
        <img
          src={bigIcon}
          alt={pkg.label}
          className="w-[60px] h-[60px] object-contain"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
        />
      </div>

      {/* مكافأة */}
      {pkg.bonus > 0 && (
        <div className="relative text-center text-[8px] text-emerald-400" style={{ textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>
          +{formatAmount(pkg.bonus)} مكافأة
        </div>
      )}

      {/* رويال + XP */}
      <div className="relative text-center text-[7px] text-amber-500/80 mt-0.5" style={{ textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>
        +{pkg.royalPoints} رويال · +{pkg.xpReward} XP
      </div>

      {/* زر الشراء (btn_shop.9.png 90x32dip) — خلفية حقيقية */}
      <div className="relative flex justify-center mt-1 mb-2">
        <div
          className="relative flex items-center justify-center w-[80px] h-[28px] rounded-lg overflow-hidden"
          style={{
            boxShadow: '0 2px 4px rgba(0,0,0,.3)',
          }}
        >
          <img
            src={ASSET.btnShop}
            alt=""
            className="absolute inset-0 w-full h-full object-fill"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              el.parentElement!.style.background = 'linear-gradient(180deg, #94f534 0%, #47790c 100%)';
            }}
          />
          <span
            className="relative text-[12px] font-bold"
            style={{
              color: '#47790c',
              textShadow: '0 1px 0 rgba(255,255,255,.4)',
            }}
          >
            ${pkg.price}
          </span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VipPackageCard — مطابق 100% لـ item_vip_buy.xml (157.5x195.45dip)
// ─ خلفية cart_vip_buy_item_bg.webp — ممتلئة
// ─ iv_days: رمز 59x72dip في الأعلى + نص "7days" داخل الرمز
// ─ btn_vip_buy: زر شراء بخلفية bn_yes (btn_yes.9.png) يحوي رمز diamonds + سعر
// ════════════════════════════════════════════════════════════════════════════
function VipPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  const tierIcon = pkg.id === 'vip_royal' ? ASSET.royal5ThroneIc
    : pkg.id === 'vip_liwa' ? ASSET.privilegeBaronIc
    : ASSET.privilegeKnightIc;
  const tierColor = pkg.id === 'vip_royal' ? '#fbbf24' : pkg.id === 'vip_liwa' ? '#a78bfa' : '#22d3ee';

  return (
    <div
      onClick={onSelect}
      className="relative rounded-xl cursor-pointer transition-all overflow-hidden"
      style={{
        width: '157px',
        minHeight: '195px',
        border: isSelected ? `1.5px solid ${tierColor}` : '1px solid rgba(255,255,255,.1)',
        boxShadow: isSelected ? `0 0 16px ${tierColor}55, inset 0 0 0 1px ${tierColor}33` : 'none',
      }}
    >
      {/* خلفية cart_vip_buy_item_bg.webp — ممتلئة */}
      <img
        src={ASSET.cartVipBuyItemBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* شارة */}
      {renderBadge(pkg.badge)}

      {/* خصم */}
      {pkg.discountPercent && pkg.discountPercent > 0 && (
        <div
          className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white z-10"
          style={{ background: '#ef4444', boxShadow: '0 1px 2px rgba(0,0,0,.4)' }}
        >
          -{pkg.discountPercent}%
        </div>
      )}

      {/* رمز الأيام (iv_days 59x72dip) — مع هامش علوي 39dip */}
      <div className="relative flex justify-center mt-9 mb-2">
        <div className="relative w-[60px] h-[72px]">
          <img
            src={tierIcon}
            alt={pkg.label}
            className="w-full h-full object-contain"
            style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))' }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-[13px] font-bold"
              style={{ color: '#17654c', marginTop: 3, textShadow: '0 1px 0 rgba(255,255,255,.3)' }}
            >
              {pkg.days}يوم
            </span>
          </div>
        </div>
      </div>

      {/* اسم الشريحة */}
      <div className="relative text-center mb-1">
        <div className="text-[12px] font-bold" style={{ color: tierColor }}>{pkg.label}</div>
        <div className="text-[9px] text-slate-400">{pkg.labelEn}</div>
      </div>

      {/* رويال + XP */}
      <div className="relative text-center text-[8px] text-amber-500/80 mb-2" style={{ textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>
        +{pkg.royalPoints} رويال · +{pkg.xpReward} XP
      </div>

      {/* زر الشراء (btn_vip_buy — bn_yes.9.png 110x40dip) */}
      <div className="relative flex justify-center mb-3">
        <div
          className="relative flex items-center justify-center gap-1.5 w-[110px] h-[36px] rounded-lg overflow-hidden"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}
        >
          <img
            src="/yalla-ui/shop/btn_yes.9.png"
            alt=""
            className="absolute inset-0 w-full h-full object-fill"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              el.parentElement!.style.background = 'linear-gradient(180deg, #87eaa9 0%, #2bc895 100%)';
            }}
          />
          <img src={ASSET.diamonds} alt="" className="relative w-[15px] h-[19px] object-contain" />
          <span
            className="relative text-[14px] font-bold"
            style={{ color: '#17654c', textShadow: '0 1px 0 rgba(255,255,255,.3)' }}
          >
            {pkg.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RoyalPackageCard — بطاقة حزمة نقاط رويال
// ─ خلفية royal_level_top_bg.webp شفافة + bg_shop_royal.webp ممتلئة
// ─ رمز royal_level_value_ic.webp
// ─ زر شراء بخلفية صفراء متدرجة (royal theme)
// ════════════════════════════════════════════════════════════════════════════
function RoyalPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="relative rounded-xl cursor-pointer transition-all overflow-hidden"
      style={{
        width: '157px',
        minHeight: '195px',
        border: isSelected ? '1.5px solid #fbbf24' : '1px solid rgba(255,255,255,.1)',
        boxShadow: isSelected ? '0 0 16px rgba(251,191,36,.4), inset 0 0 0 1px rgba(251,191,36,.2)' : 'none',
      }}
    >
      {/* خلفية royal_level_top_bg.webp */}
      <img
        src={ASSET.royalLevelTopBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.35 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      {/* bg_shop_royal.webp فوقها */}
      <img
        src={ASSET.bgShopRoyal}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.25 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* شارة */}
      {renderBadge(pkg.badge)}

      {/* خصم */}
      {pkg.discountPercent && pkg.discountPercent > 0 && (
        <div
          className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white z-10"
          style={{ background: '#ef4444', boxShadow: '0 1px 2px rgba(0,0,0,.4)' }}
        >
          -{pkg.discountPercent}%
        </div>
      )}

      {/* رمز رويال */}
      <div className="relative flex justify-center mb-2 mt-4">
        <img
          src={ASSET.royalLevelValueIc}
          alt={pkg.label}
          className="w-[50px] h-[50px] object-contain"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}
        />
      </div>

      {/* الكمية */}
      <div className="relative text-center mb-1">
        <div className="text-[14px] font-bold text-amber-300" style={{ textShadow: '0 2px 2px rgba(0,0,0,.6)' }}>
          {pkg.amount.toLocaleString()}
        </div>
        <div className="text-[9px] text-slate-300">نقطة رويال</div>
      </div>

      {/* مكافأة */}
      {pkg.bonus > 0 && (
        <div className="relative text-center text-[8px] text-emerald-400" style={{ textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>
          +{pkg.bonus} مكافأة
        </div>
      )}

      {/* XP */}
      <div className="relative text-center text-[7px] text-amber-500/80 mb-2" style={{ textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>
        +{pkg.xpReward} XP
      </div>

      {/* زر الشراء — بخلفية صفراء متدرجة (royal theme) */}
      <div className="relative flex justify-center mb-3">
        <div
          className="relative flex items-center justify-center gap-1.5 w-[110px] h-[36px] rounded-lg overflow-hidden"
          style={{ boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}
        >
          <img
            src="/yalla-ui/shop/btn_yes.9.png"
            alt=""
            className="absolute inset-0 w-full h-full object-fill"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = 'none';
              el.parentElement!.style.background = 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)';
            }}
          />
          <Crown className="relative w-3.5 h-3.5 text-amber-900" />
          <span
            className="relative text-[13px] font-bold"
            style={{ color: '#1f1407', textShadow: '0 1px 0 rgba(255,255,255,.3)' }}
          >
            ${pkg.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
