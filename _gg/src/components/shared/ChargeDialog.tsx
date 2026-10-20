'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Crown, Sparkles, Flame, Star } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════════
// ChargeDialog — إعادة بناء من الصفر، 100% مطابق لـ Yalla Ludo
// ─ view_shop_diamonds.xml + view_shop_golds.xml + item_diamonds.xml
// ─ 4 ألسنة: ذهب / جواهر / VIP / رويال
// ─ كل عنصر شامل: shop_item_bg.webp + شارة (HOT/Popular/BEST) + رمز + كمية + مكافأة + خصم + سعر
// ─ شارة "أول شحن" — fast_pay_first_reward
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

// ─── ألسنة متوافقة مع shop_switch_*.webp ───
const TAB_CONFIG: { key: 'gold' | 'diamond' | 'vip' | 'royal'; label: string; labelEn: string; icon: string; selectBg: string; unselectBg: string; accent: string }[] = [
  { key: 'gold',    label: 'ذهب',     labelEn: 'Golds',         icon: '/yalla-ui/shop/coin.webp',               selectBg: '/yalla-ui/shop/shop_switch_gold_check.webp',       unselectBg: '/yalla-ui/shop/shop_switch_gold_uncheck.webp',       accent: '#fbbf24' },
  { key: 'diamond', label: 'ألماس',   labelEn: 'Diamonds',       icon: '/yalla-ui/shop/diamonds.webp',            selectBg: '/yalla-ui/shop/shop_switch_diamond_check.webp',   unselectBg: '/yalla-ui/shop/shop_switch_diamond_uncheck.webp',   accent: '#22d3ee' },
  { key: 'vip',     label: 'اشتراكات', labelEn: 'Subscriptions', icon: '/yalla-ui/shop/btn_shop.png',             selectBg: '/yalla-ui/shop/shop_switch_privilege_check.webp', unselectBg: '/yalla-ui/shop/shop_switch_privilege_uncheck.webp', accent: '#a78bfa' },
  { key: 'royal',   label: 'رويال',   labelEn: 'Royal',          icon: '/yalla-ui/shop/bg_shop_royal.webp',       selectBg: '/yalla-ui/shop/bg_shop_royal.webp',                 unselectBg: '/yalla-ui/shop/bg_shop_royal.webp',                 accent: '#fbbf24' },
];

const BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  hot:      { bg: '#ef4444', text: 'text-white', label: '🔥 HOT' },
  popular:  { bg: '#3b82f6', text: 'text-white', label: '⭐ شائع' },
  best:     { bg: '#f59e0b', text: 'text-black', label: '👑 الأفضل' },
  new:      { bg: '#10b981', text: 'text-white', label: '✨ جديد' },
  limited:  { bg: '#a855f7', text: 'text-white', label: '⚡ محدود' },
};

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
          {/* ══════ الهيدر: الأرصدة + إغلاق ══════ */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(255,200,50,.15)', border: '1px solid rgba(255,200,50,.3)' }}>
                <img src="/yalla-ui/shop/coin.webp" alt="" className="w-4 h-4" />
                <span className="text-xs font-bold text-amber-300">{gold ?? '0'}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(50,150,255,.15)', border: '1px solid rgba(50,150,255,.3)' }}>
                <img src="/yalla-ui/shop/diamonds.webp" alt="" className="w-4 h-4" />
                <span className="text-xs font-bold text-blue-300">{gems ?? '0'}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* ══════ الألسنة (shop_switch_* Tabs) ══════ */}
          <div className="flex gap-1 px-3 pb-2">
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.key;
              const accentColor = tab.accent;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    // إذا اختار رويال، افتح RoyalDialog
                    if (tab.key === 'royal' && onRoyalClick) {
                      setTimeout(() => { onClose(); onRoyalClick(); }, 100);
                    }
                  }}
                  className="flex-1 flex flex-col items-center justify-center py-2 rounded-lg transition-all"
                  style={{
                    background: isActive ? `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)` : 'rgba(0,0,0,.3)',
                    border: isActive ? `1px solid ${accentColor}66` : '1px solid rgba(255,255,255,.08)',
                    boxShadow: isActive ? `0 2px 12px ${accentColor}33` : 'none',
                  }}
                >
                  <img src={tab.icon} alt="" className="w-4 h-4 mb-0.5 object-contain" />
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: isActive ? accentColor : '#94a3b8' }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ══════ شريط فاصل (shop_top_green_line) ══════ */}
          <div
            className="h-[9px] mx-3 rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, #2bc895 50%, transparent 100%)',
              boxShadow: '0 1px 2px rgba(43,200,149,.3)',
            }}
          />

          {/* ══════ لافتة أول شحن (fast_pay_first_reward) ══════ */}
          {packages?.firstChargeReward && (
            <div
              className="mx-3 my-2 p-2.5 rounded-xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,180,0,.15), rgba(255,100,0,.1))',
                border: '1px solid rgba(255,180,0,.3)',
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <img src="/yalla-ui/shop/fast_pay_first_reward_tip_ic.webp" alt="" className="w-5 h-6 object-contain" />
                <span className="text-xs font-bold text-amber-300">مكافأة أول شحن</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <div className="grid grid-cols-6 gap-1">
                {packages.firstChargeReward.gifts.map((gift, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)' }}
                    >
                      <span className="text-base">{gift.icon}</span>
                    </div>
                    <span className="text-[8px] text-amber-400 mt-0.5">{gift.amount}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-amber-200/70 mt-1.5 text-center">{packages.firstChargeReward.text}</p>
            </div>
          )}

          {/* ══════ شبكة الحزم (RecyclerView) ══════ */}
          {isVipTab ? (
            // عرض الألسنة VIP بصفّ 2
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
            // عرض الألسنة رويال بصفّ 2 — أوسع
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
            // عرض الألسنة العادية بصفّ 3 — مطابق لـ item_diamonds.xml
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

          {/* ══════ زر تفاصيل الدفع (shop_item_tail_bg) ══════ */}
          {!selectedPkg && (
            <div className="px-3 pb-3 flex justify-center">
              <button
                className="text-[11px] text-emerald-300 px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(135,234,169,.08)',
                  border: '1px solid rgba(135,234,169,.2)',
                  minWidth: '191px',
                }}
                onClick={() => setActiveTab(activeTab)}
              >
                اضغط على حزمة لمتابعة الشحن
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
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-black transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #ffd700, #ffaa00)', boxShadow: '0 4px 16px rgba(255,215,0,.3)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري المعالجة...
                    </span>
                  ) : (
                    `💳 شحن — $${selectedPkg.price}`
                  )}
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
// RegularPackageCard — مطابق لـ item_diamonds.xml (107x150dip)
// — خلفية shop_item_bg.webp
// — شريط علوي مع رمز diamonds + عدد (tv_doin_number)
// — رمز كبير 88x88dip في الوسط (iv_coin)
// — شارة "BEST" (iv_best) في الأعلى يمينًا
// — زر الشراء (btn_shop 90x32dip) في الأسفل
// ════════════════════════════════════════════════════════════════════════════
function RegularPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  const badge = pkg.badge ? BADGE_STYLES[pkg.badge] : null;
  const accentColor = pkg.type === 'gold' ? '#fbbf24' : '#22d3ee';
  return (
    <div
      onClick={onSelect}
      className="relative rounded-xl p-2 cursor-pointer transition-all overflow-hidden"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${accentColor}22, rgba(0,0,0,.3))`
          : 'rgba(0,0,0,.3)',
        border: isSelected ? `1px solid ${accentColor}88` : '1px solid rgba(255,255,255,.08)',
        boxShadow: isSelected ? `0 0 12px ${accentColor}33` : 'none',
      }}
    >
      {/* خلفية shop_item_bg.webp شبه شفافة */}
      <img
        src="/yalla-ui/full/shop_item_bg.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* شارة */}
      {badge && (
        <div
          className="absolute -top-1 right-1 px-1 py-0.5 rounded text-[7px] font-bold"
          style={{ background: badge.bg, color: badge.text === 'text-black' ? '#000' : '#fff' }}
        >
          {badge.label}
        </div>
      )}

      {/* شارة الخصم */}
      {pkg.discountPercent && pkg.discountPercent > 0 && (
        <div
          className="absolute top-1 left-1 px-1 py-0.5 rounded text-[7px] font-bold text-white"
          style={{ background: '#ef4444' }}
        >
          -{pkg.discountPercent}%
        </div>
      )}

      {/* شريط علوي: رمز + عدد */}
      <div className="relative flex items-center justify-center gap-1 mb-1">
        <img src="/yalla-ui/full/diamonds.webp" alt="" className="w-3 h-3" />
        <span className="text-[11px] font-bold" style={{ color: '#fff782', textShadow: '0 3px 5px #000' }}>
          {formatAmount(pkg.amount + pkg.bonus)}
        </span>
      </div>

      {/* الرمز الكبير في الوسط (iv_coin 88x88dip) */}
      <div className="relative flex justify-center mb-1">
        <img
          src={pkg.iconBg}
          alt=""
          className="w-[60px] h-[60px] object-contain"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />
      </div>

      {/* مكافأة */}
      {pkg.bonus > 0 && (
        <div className="relative text-center text-[8px] text-emerald-400">
          +{formatAmount(pkg.bonus)} مكافأة
        </div>
      )}

      {/* رويال + XP */}
      <div className="relative text-center text-[7px] text-amber-500/70 mt-0.5">
        +{pkg.royalPoints} رويال · +{pkg.xpReward} XP
      </div>

      {/* زر الشراء (btn_shop 90x32dip) */}
      <div
        className="relative flex justify-center mt-1"
      >
        <div
          className="flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-bold"
          style={{
            background: 'linear-gradient(135deg, #94f534, #47790c)',
            color: '#47790c',
            boxShadow: '0 2px 4px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.4)',
            textShadow: '0 1px 0 rgba(255,255,255,.3)',
            minWidth: '70px',
          }}
        >
          ${pkg.price}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VipPackageCard — مطابق لـ item_vip_buy.xml (157.5x195.45dip)
// — خلفية cart_vip_buy_item_bg.webp
// — رمز الأيام (59x72dip)
// — زر شراء (110x40dip) بخلفية bn_yes يحوي رمز diamond + سعر
// ════════════════════════════════════════════════════════════════════════════
function VipPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  const tierIcon = pkg.id === 'vip_royal' ? '/yalla-ui/royal/royal_5_throne_ic.webp'
    : pkg.id === 'vip_liwa' ? '/yalla-ui/full/privilege_detail_baron_ic.webp'
    : '/yalla-ui/full/privilege_detail_knight_ic.webp';
  const tierColor = pkg.id === 'vip_royal' ? '#fbbf24' : pkg.id === 'vip_liwa' ? '#a78bfa' : '#22d3ee';

  return (
    <div
      onClick={onSelect}
      className="relative rounded-xl p-3 cursor-pointer transition-all overflow-hidden"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${tierColor}22, rgba(0,0,0,.4))`
          : 'rgba(0,0,0,.4)',
        border: isSelected ? `1px solid ${tierColor}88` : '1px solid rgba(255,255,255,.08)',
        boxShadow: isSelected ? `0 0 12px ${tierColor}33` : 'none',
      }}
    >
      {/* خلفية cart_vip_buy_item_bg.webp */}
      <img
        src="/yalla-ui/full/cart_vip_buy_item_bg.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-25"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* شارة */}
      {pkg.badge && (
        <div
          className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-black"
          style={{ background: tierColor }}
        >
          {pkg.badge === 'popular' ? 'الأشهر' : pkg.badge === 'best' ? 'الأفضل' : 'HOT'}
        </div>
      )}

      {/* خصم */}
      {pkg.discountPercent && pkg.discountPercent > 0 && (
        <div
          className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
          style={{ background: '#ef4444' }}
        >
          -{pkg.discountPercent}%
        </div>
      )}

      {/* رمز الأيام (iv_days) */}
      <div className="relative flex justify-center mb-2 mt-1">
        <div className="relative w-[60px] h-[72px]">
          <img
            src={tierIcon}
            alt={pkg.label}
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-bold" style={{ color: '#17654c', marginTop: 3 }}>
              {pkg.days}يوم
            </span>
          </div>
        </div>
      </div>

      {/* اسم الشريحة */}
      <div className="relative text-center mb-1.5">
        <div className="text-[12px] font-bold" style={{ color: tierColor }}>{pkg.label}</div>
        <div className="text-[9px] text-slate-400">{pkg.labelEn}</div>
      </div>

      {/* رويال + XP */}
      <div className="relative text-center text-[8px] text-amber-500/70 mb-2">
        +{pkg.royalPoints} رويال · +{pkg.xpReward} XP
      </div>

      {/* زر الشراء (btn_vip_buy - bn_yes 110x40dip) */}
      <div className="relative flex justify-center">
        <div
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #87eaa9 0%, #2bc895 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.4)',
          }}
        >
          <img src="/yalla-ui/full/diamonds.webp" alt="" className="w-3 h-3.5" />
          <span className="text-[13px] font-bold" style={{ color: '#17654c' }}>
            ${pkg.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RoyalPackageCard — بطاقة حزمة نقاط رويال (مستوحاة من dialog_royal_upgrade.xml)
// ════════════════════════════════════════════════════════════════════════════
function RoyalPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  return (
    <div
      onClick={onSelect}
      className="relative rounded-xl p-3 cursor-pointer transition-all overflow-hidden"
      style={{
        background: isSelected
          ? 'linear-gradient(135deg, rgba(251,191,36,.25), rgba(0,0,0,.4))'
          : 'rgba(0,0,0,.4)',
        border: isSelected ? '1px solid rgba(251,191,36,.6)' : '1px solid rgba(255,255,255,.08)',
        boxShadow: isSelected ? '0 0 16px rgba(251,191,36,.3)' : 'none',
      }}
    >
      {/* خلفية royal_level_top_bg شفافة */}
      <img
        src="/yalla-ui/royal/royal_level_top_bg.webp"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-20"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* شارة */}
      {pkg.badge && (
        <div
          className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-black"
          style={{ background: '#fbbf24' }}
        >
          {pkg.badge === 'popular' ? 'الأشهر' : pkg.badge === 'best' ? 'الأفضل' : 'HOT'}
        </div>
      )}

      {/* خصم */}
      {pkg.discountPercent && pkg.discountPercent > 0 && (
        <div
          className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
          style={{ background: '#ef4444' }}
        >
          -{pkg.discountPercent}%
        </div>
      )}

      {/* رمز رويال */}
      <div className="relative flex justify-center mb-2 mt-1">
        <img
          src="/yalla-ui/royal/royal_level_value_ic.webp"
          alt={pkg.label}
          className="w-[50px] h-[50px] object-contain"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}
        />
      </div>

      {/* الكمية */}
      <div className="relative text-center mb-1">
        <div className="text-[14px] font-bold text-amber-300">
          {pkg.amount.toLocaleString()}
        </div>
        <div className="text-[9px] text-slate-400">نقطة رويال</div>
      </div>

      {/* مكافأة */}
      {pkg.bonus > 0 && (
        <div className="relative text-center text-[8px] text-emerald-400">
          +{pkg.bonus} مكافأة
        </div>
      )}

      {/* XP */}
      <div className="relative text-center text-[7px] text-amber-500/70 mb-2">
        +{pkg.xpReward} XP
      </div>

      {/* زر الشراء */}
      <div className="relative flex justify-center">
        <div
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.4)',
          }}
        >
          <Crown className="w-3.5 h-3.5 text-amber-900" />
          <span className="text-[13px] font-bold" style={{ color: '#1f1407' }}>
            ${pkg.price.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
