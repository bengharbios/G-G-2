'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Crown, ShieldCheck, Star, Sparkles } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// BuyVipDialog — طبق أصل Yalla Ludo `fragment_buy_vip.xml` + `item_vip_buy.xml`
// ─ FrameLayout جذري مع RecyclerView عرض 325dip وسط الشاشة
// ─ كل عنصر (item_vip_buy) هو LinearLayout بعرض 157.5dip وطول 195.44998dip
// ─ فوق كل عنصر: FrameLayout 59x72dip يحوي رمز الأيام (iv_days) + نص "7days"
// ─ تحت الرمز: زر شراء (btn_vip_buy) بخلفية bn_yes يحوي رمز diamond + نص "100"
// ─ خلفية العنصر: cart_vip_buy_item_bg.webp
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

const VIP_TIERS = [
  { id: 'vip_faris',  icon: '/yalla-ui/full/privilege_detail_knight_ic.webp', name: 'فارس',  desc: 'مجموعة أولى من الامتيازات' },
  { id: 'vip_liwa',   icon: '/yalla-ui/full/privilege_detail_baron_ic.webp',  name: 'لواء',  desc: 'امتيازات أوسع + دخول غرف VIP' },
  { id: 'vip_royal',  icon: '/yalla-ui/royal/royal_5_throne_ic.webp',          name: 'رويال', desc: 'كل الامتيازات + عرش ملكي' },
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
          {/* ─── شريط علوي ─── */}
          <div
            className="flex items-center justify-between px-4 h-[53px]"
            style={{
              background: 'linear-gradient(180deg, rgba(135,234,169,.2) 0%, rgba(0,0,0,.4) 100%)',
              borderBottom: '1px solid rgba(135,234,169,.2)',
            }}
          >
            <div className="flex items-center gap-2">
              <img src="/yalla-ui/full/vip.webp" alt="VIP" className="w-6 h-6" />
              <h2 className="text-[18px] font-bold" style={{ color: '#87eaa9', textShadow: '0 4px 2px rgba(0,0,0,.5)' }}>
                اشتراكات VIP
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(50,150,255,.15)', border: '1px solid rgba(50,150,255,.3)' }}>
                <img src="/yalla-ui/shop/diamonds.webp" alt="" className="w-3.5 h-3.5" />
                <span className="text-xs font-bold text-blue-300">{gems ?? '0'}</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>
          </div>

          {/* ─── البانر التعريفي (cart_vip_buy_item_bg) ─── */}
          <div className="px-4 pt-3 pb-2">
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(135,234,169,.12) 0%, rgba(0,0,0,0) 100%)',
                border: '1px solid rgba(135,234,169,.2)',
              }}
            >
              <img src="/yalla-ui/full/vip_sub_entrance_ic.webp" alt="VIP" className="w-12 h-12 object-contain" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[13px] font-bold text-emerald-300">امتيازات حصرية</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
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
                const discount = pkg.discountPercent ?? 0;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg)}
                    className="relative rounded-xl p-3 cursor-pointer transition-all"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${priceTierColor}22, rgba(0,0,0,.3))`
                        : 'rgba(0,0,0,.35)',
                      border: isSelected
                        ? `1px solid ${priceTierColor}aa`
                        : '1px solid rgba(255,255,255,.08)',
                      boxShadow: isSelected ? `0 0 16px ${priceTierColor}33` : 'none',
                    }}
                  >
                    {/* شارة (badge) */}
                    {pkg.badge && (
                      <div
                        className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-black"
                        style={{ background: priceTierColor }}
                      >
                        {pkg.badge === 'popular' ? 'الأشهر' : pkg.badge === 'best' ? 'الأفضل' : pkg.badge === 'hot' ? '🔥 HOT' : pkg.badge === 'new' ? 'جديد' : 'محدود'}
                      </div>
                    )}

                    {/* رمز الأيام (iv_days 59x72dip) */}
                    <div className="flex justify-center mb-2">
                      <div className="relative w-[60px] h-[72px]">
                        <img
                          src={tier?.icon || pkg.iconBg}
                          alt={pkg.label}
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="text-[14px] font-bold"
                            style={{ color: '#17654c', marginTop: 3 }}
                          >
                            {pkg.days}يوم
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* اسم الشريحة */}
                    <div className="text-center mb-1">
                      <div className="text-[12px] font-bold" style={{ color: priceTierColor }}>{pkg.label}</div>
                      <div className="text-[9px] text-slate-400">{pkg.labelEn}</div>
                    </div>

                    {/* خصم */}
                    {discount > 0 && (
                      <div className="flex items-center justify-center gap-1 mb-1.5">
                        <span className="text-[9px] line-through text-slate-500">${pkg.originalPrice?.toFixed(2)}</span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-black"
                          style={{ background: '#f87171' }}
                        >
                          -{discount}%
                        </span>
                      </div>
                    )}

                    {/* زر الشراء (btn_vip_buy - bn_yes) */}
                    <div
                      className="flex items-center justify-center gap-1.5 py-2 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, #87eaa9 0%, #2bc895 100%)',
                        boxShadow: '0 2px 6px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.3)',
                      }}
                    >
                      <img src="/yalla-ui/full/diamonds.webp" alt="" className="w-3 h-3.5" />
                      <span className="text-[13px] font-bold" style={{ color: '#17654c' }}>
                        ${pkg.price.toFixed(2)}
                      </span>
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
                <button
                  onClick={handleBuy}
                  disabled={loading || !chargeCode.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', boxShadow: '0 4px 16px rgba(251,191,36,.3)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري المعالجة...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Crown className="w-4 h-4" />
                      فعّل VIP — ${selectedPkg.price.toFixed(2)}
                    </span>
                  )}
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
