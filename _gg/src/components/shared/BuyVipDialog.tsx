'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Crown, ShieldCheck, Star, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// BuyVipDialog — مطابق 100% لـ Yalla Ludo `fragment_buy_vip.xml` + `item_vip_buy.xml`
// ─ FrameLayout جذري مع RecyclerView عرض 325dip وسط الشاشة
// ─ كل عنصر (item_vip_buy) هو LinearLayout بعرض 157.5dip وطول 195.44998dip
// ─ فوق كل عنصر: FrameLayout 59x72dip يحوي رمز الأيام (iv_days) + نص "7days"
// ─ تحت الرمز: زر شراء (btn_vip_buy) بخلفية bn_yes (btn_yes.9.png) يحوي رمز diamond + سعر
// ─ خلفية العنصر: cart_vip_buy_item_bg.webp — ممتلئة
// ════════════════════════════════════════════════════════════════════════════

interface VipPackage {
  id: string;
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
  days: number;
  validityDays?: number;
}

interface VipPackagesApiResponse {
  success: boolean;
  vip: VipPackage[];
}

interface BuyVipDialogProps {
  open: boolean;
  onClose: () => void;
  gems: number | null;
  onChargeClick?: () => void;
}

// ─── أصول Yalla Ludo الأصلية ───
const VIP_ASSET = {
  bgRank:           '/yalla-ui/shop/bg_rank.9.png',
  skinClose:        '/yalla-ui/shop/skin_close.webp',
  bgAddCoin:        { bg: '#0c3c30', borderRadius: '10px' },
  cartVipBuyItemBg: '/yalla-ui/shop/cart_vip_buy_item_bg.webp',
  privilegeKnight:  '/yalla-ui/shop/privilege_detail_knight_ic.webp',
  privilegeBaron:   '/yalla-ui/shop/privilege_detail_baron_ic.webp',
  royal5Throne:     '/yalla-ui/royal/royal_5_throne_ic.webp',
  btnYes:           '/yalla-ui/shop/btn_yes.9.png',
  btnYesPress:     '/yalla-ui/shop/btn_yes_press.9.png',
  diamonds:         '/yalla-ui/shop/diamonds.webp',
  jia:              '/yalla-ui/shop/jia.webp',
  vip:              '/yalla-ui/shop/vip.webp',
  vipSubEntrance:   '/yalla-ui/shop/vip_sub_entrance_ic.webp',
  bgShopTopBanner:  '/yalla-ui/shop/bg_shop_top_banner.webp',
  shopTopGreenLine: '/yalla-ui/shop/shop_top_green_line.9.png',
  labelBest:        '/yalla-ui/shop/label_best.webp',
  labelPopular:     '/yalla-ui/shop/label_popular.webp',
};

// ─── خريطة شارة → صورة Yalla Ludo الأصلية ───
function renderVipBadge(badge?: VipPackage['badge']): React.ReactNode {
  if (!badge) return null;
  if (badge === 'best') {
    return (
      <img
        src={VIP_ASSET.labelBest}
        alt="BEST"
        className="absolute -top-1 -right-1 w-[50px] h-[18px] object-contain z-10 pointer-events-none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }}
      />
    );
  }
  if (badge === 'popular') {
    return (
      <img
        src={VIP_ASSET.labelPopular}
        alt="POPULAR"
        className="absolute -top-1 -right-1 w-[50px] h-[18px] object-contain z-10 pointer-events-none"
        style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))' }}
      />
    );
  }
  const colors: Record<string, { bg: string; label: string }> = {
    hot:     { bg: '#ef4444', label: '🔥 HOT' },
    new:     { bg: '#10b981', label: '✨ جديد' },
    limited: { bg: '#a855f7', label: '⚡ محدود' },
  };
  const c = colors[badge];
  return (
    <div
      className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-white z-10"
      style={{ background: c.bg, boxShadow: '0 1px 2px rgba(0,0,0,.4)' }}
    >
      {c.label}
    </div>
  );
}

const VIP_TIERS = [
  { id: 'vip_faris',  icon: VIP_ASSET.privilegeKnight, name: 'فارس',  desc: 'مجموعة أولى من الامتيازات' },
  { id: 'vip_liwa',   icon: VIP_ASSET.privilegeBaron,  name: 'لواء',  desc: 'امتيازات أوسع + دخول غرف VIP' },
  { id: 'vip_royal',  icon: VIP_ASSET.royal5Throne,    name: 'رويال', desc: 'كل الامتيازات + عرش ملكي' },
];

export default function BuyVipDialog({ open, onClose, gems, onChargeClick }: BuyVipDialogProps) {
  const [packages, setPackages] = useState<VipPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<VipPackage | null>(null);
  const [chargeCode, setChargeCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('telegram');
  const [chargeResult, setChargeResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/gems/packages')
      .then(r => r.json())
      .then(d => { if (d.success) setPackages(d.vip || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  const handleBuy = async () => {
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
        setChargeResult({ success: true, message: data.message || 'تم الشراء بنجاح' });
        setSelectedPkg(null);
        setChargeCode('');
      } else {
        setChargeResult({ success: false, message: data.error || 'فشل الشراء' });
      }
    } catch {
      setChargeResult({ success: false, message: 'خطأ في الاتصال' });
    } finally {
      setLoading(false);
    }
  };

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
            background: 'linear-gradient(180deg, #0a1c2e 0%, #050d18 100%)',
            border: '1px solid rgba(135,234,169,.25)',
            boxShadow: '0 20px 60px rgba(0,0,0,.6), inset 0 1px 0 rgba(135,234,169,.15)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── شريط علوي: bg_rank.9.png حقيقية ─── */}
          <div className="relative">
            <img
              src={VIP_ASSET.bgRank}
              alt=""
              className="absolute inset-0 w-full h-[53px] object-fill"
              style={{ opacity: 0.95 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="relative flex items-center justify-between px-4 h-[53px]">
              <div className="flex items-center gap-2">
                <img src={VIP_ASSET.vip} alt="VIP" className="w-6 h-6" />
                <h2 className="text-[18px] font-bold" style={{ color: '#87eaa9', textShadow: '0 4px 2px rgba(0,0,0,.5)' }}>
                  اشتراكات VIP
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* bg_add_coin للجواهر — solid #0c3c30 */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-[10px]" style={{ background: '#0c3c30', border: '1px solid rgba(50,150,255,.2)' }}>
                  <img src={VIP_ASSET.diamonds} alt="" className="w-3.5 h-3.5 -mr-1" />
                  <span className="text-xs font-bold text-blue-300" style={{ textShadow: '0 1px 2px rgba(0,0,0,.5)' }}>{gems ?? '0'}</span>
                  <img src={VIP_ASSET.jia} alt="" className="w-3 h-3 ml-0.5 opacity-80" />
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition" aria-label="إغلاق">
                  <img src={VIP_ASSET.skinClose} alt="" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* ─── شريط فاصل (shop_top_green_line.9.png) ─── */}
          <div className="relative h-[9px] mx-3">
            <img
              src={VIP_ASSET.shopTopGreenLine}
              alt=""
              className="w-full h-full object-fill"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent 0%, #2bc895 50%, transparent 100%)', opacity: 0.6 }}
            />
          </div>

          {/* ─── البانر التعريفي (vip_sub_entrance_ic) ─── */}
          <div className="px-4 pt-3 pb-2">
            <div
              className="relative rounded-xl p-3 flex items-center gap-3 overflow-hidden"
            >
              {/* bg_shop_top_banner.webp — خلفية البانر */}
              <img
                src={VIP_ASSET.bgShopTopBanner}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.25 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Fallback */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(135,234,169,.12) 0%, rgba(0,0,0,0) 100%)',
                  border: '1px solid rgba(135,234,169,.2)',
                  borderRadius: '12px',
                }}
              />
              <img src={VIP_ASSET.vipSubEntrance} alt="VIP" className="relative w-12 h-12 object-contain flex-shrink-0" />
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[13px] font-bold text-emerald-300">امتيازات حصرية</span>
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5" style={{ textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>
                  غرف VIP خاصة، رمزيات، إطارات فاخرة ومؤثرات حصرية
                </p>
              </div>
            </div>
          </div>

          {/* ─── قائمة الحزم (RecyclerView 325dip) ─── */}
          <div className="px-3 pb-3 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {packages.length === 0 && loading && (
                <div className="col-span-2 flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                </div>
              )}
              {packages.map((pkg) => {
                const isSelected = selectedPkg?.id === pkg.id;
                const tier = VIP_TIERS.find(t => t.id === pkg.id);
                const priceTierColor = pkg.id === 'vip_royal' ? '#fbbf24' : pkg.id === 'vip_liwa' ? '#a78bfa' : '#22d3ee';
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className="relative rounded-xl cursor-pointer transition-all overflow-hidden"
                    style={{
                      width: '157px',
                      minHeight: '195px',
                      border: isSelected
                        ? `1.5px solid ${priceTierColor}`
                        : '1px solid rgba(255,255,255,.1)',
                      boxShadow: isSelected
                        ? `0 0 16px ${priceTierColor}55, inset 0 0 0 1px ${priceTierColor}33`
                        : 'none',
                    }}
                  >
                    {/* cart_vip_buy_item_bg.webp — خلفية حقيقية ممتلئة */}
                    <img
                      src={VIP_ASSET.cartVipBuyItemBg}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />

                    {/* شارة (label_best / label_popular) */}
                    {renderVipBadge(pkg.badge)}

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
                          src={tier?.icon || pkg.iconBg}
                          alt={pkg.label}
                          className="w-full h-full object-contain"
                          style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="text-[14px] font-bold"
                            style={{ color: '#17654c', marginTop: 3, textShadow: '0 1px 0 rgba(255,255,255,.3)' }}
                          >
                            {pkg.days}يوم
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* اسم الشريحة */}
                    <div className="relative text-center mb-1">
                      <div className="text-[12px] font-bold" style={{ color: priceTierColor, textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>{pkg.label}</div>
                      <div className="text-[9px] text-slate-400">{pkg.labelEn}</div>
                    </div>

                    {/* خصم مع سعر قديم */}
                    {pkg.discountPercent && pkg.discountPercent > 0 && (
                      <div className="relative flex items-center justify-center gap-1 mb-1.5">
                        <span className="text-[9px] line-through text-slate-500">${pkg.originalPrice?.toFixed(2)}</span>
                      </div>
                    )}

                    {/* رويال + XP */}
                    <div className="relative text-center text-[8px] text-amber-500/80 mb-2" style={{ textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>
                      +{pkg.royalPoints} رويال · +{pkg.xpReward} XP
                    </div>

                    {/* زر الشراء (btn_vip_buy — bn_yes.9.png 110x40dip) — خلفية حقيقية */}
                    <div className="relative flex justify-center mb-3">
                      <div
                        className="relative flex items-center justify-center gap-1.5 w-[110px] h-[36px] rounded-lg overflow-hidden"
                        style={{ boxShadow: '0 2px 6px rgba(0,0,0,.3)' }}
                      >
                        <img
                          src={VIP_ASSET.btnYes}
                          alt=""
                          className="absolute inset-0 w-full h-full object-fill"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = 'none';
                            el.parentElement!.style.background = 'linear-gradient(180deg, #87eaa9 0%, #2bc895 100%)';
                          }}
                        />
                        <img src={VIP_ASSET.diamonds} alt="" className="relative w-[15px] h-[19px] object-contain" />
                        <span
                          className="relative text-[13px] font-bold"
                          style={{ color: '#17654c', textShadow: '0 1px 0 rgba(255,255,255,.3)' }}
                        >
                          {pkg.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* مكافآت إضافية */}
            <div
              className="mt-3 p-2.5 rounded-lg flex items-center gap-3"
              style={{
                background: 'rgba(135,234,169,.06)',
                border: '1px solid rgba(135,234,169,.15)',
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-[10px] text-slate-300">
                كل اشتراك يكافئك <span className="font-bold text-amber-300">{selectedPkg?.royalPoints ?? '—'} نقطة رويال</span> + <span className="font-bold text-emerald-300">{selectedPkg?.xpReward ?? '—'} XP</span>
              </p>
            </div>
          </div>

          {/* ─── نموذج الشراء (عند اختيار حزمة) ─── */}
          {selectedPkg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="px-4 pb-3 overflow-hidden"
            >
              <div
                className="p-3 rounded-xl space-y-3"
                style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.08)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">الحزمة المختارة:</span>
                  <span className="text-xs font-bold text-emerald-300">
                    {selectedPkg.label} — ${selectedPkg.price.toFixed(2)} / {selectedPkg.days}يوم
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
                      { id: 'telegram', label: '📱 تيليجرام' },
                      { id: 'whatsapp', label: '💬 واتساب' },
                      { id: 'bank_transfer', label: '🏦 تحويل بنكي' },
                      { id: 'other', label: '🔗 أخرى' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className="py-1.5 rounded-lg text-[10px] font-medium transition-all"
                        style={{
                          background: paymentMethod === m.id ? 'linear-gradient(135deg, #2bc895, #1a6b3a)' : 'rgba(0,0,0,.3)',
                          border: paymentMethod === m.id ? '1px solid rgba(135,234,169,.4)' : '1px solid rgba(255,255,255,.08)',
                          color: paymentMethod === m.id ? '#87eaa9' : '#94a3b8',
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* زر الشراء — bn_yes.9.png حقيقية */}
                <button
                  onClick={handleBuy}
                  disabled={loading || !chargeCode.trim()}
                  className="relative w-full h-[40px] rounded-lg text-sm font-bold text-black transition-all disabled:opacity-50 overflow-hidden"
                >
                  <img
                    src={VIP_ASSET.btnYes}
                    alt=""
                    className="absolute inset-0 w-full h-full object-fill"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      el.parentElement!.style.background = 'linear-gradient(135deg, #fbbf24, #f59e0b)';
                    }}
                  />
                  <span className="relative flex items-center justify-center gap-1.5">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <Crown className="w-4 h-4" />
                        فعّل VIP — ${selectedPkg.price.toFixed(2)}
                      </>
                    )}
                  </span>
                </button>
                {chargeResult && (
                  <div className={`text-xs text-center p-2 rounded-lg ${chargeResult.success ? 'text-emerald-300 bg-emerald-950/30' : 'text-red-300 bg-red-950/30'}`}>
                    {chargeResult.success ? '✅ ' : '❌ '}{chargeResult.message}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* زر شحن جواهر إضافي */}
          {gems !== null && gems < 100 && (
            <div className="px-4 pb-3">
              <button
                onClick={() => { onClose(); onChargeClick?.(); }}
                className="w-full py-2 rounded-lg text-[11px] text-blue-300 transition hover:text-blue-200"
                style={{ background: 'rgba(50,150,255,.08)', border: '1px solid rgba(50,150,255,.2)' }}
              >
                💎 لا يوجد جواهر كافية؟ اضغط لشحن المزيد
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
