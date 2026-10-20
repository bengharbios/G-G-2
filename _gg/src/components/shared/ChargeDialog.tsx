'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface Package {
  id: string;
  type: 'diamond' | 'gold' | 'vip';
  amount: number;
  bonus: number;
  price: number;
  label: string;
  labelEn: string;
  icon: string;
  iconBg: string;
  badge?: 'hot' | 'popular' | 'best';
  royalPoints: number;
  xpReward: number;
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

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const TAB_CONFIG = [
  { key: 'gold' as const, label: 'ذهب', labelEn: 'Golds', icon: '/yalla-ui/shop/coin.webp', selectBg: '/yalla-ui/shop/shop_switch_gold_check.webp', unselectBg: '/yalla-ui/shop/shop_switch_gold_uncheck.webp' },
  { key: 'diamond' as const, label: 'ألماس', labelEn: 'Diamonds', icon: '/yalla-ui/shop/diamonds.webp', selectBg: '/yalla-ui/shop/shop_switch_diamond_check.webp', unselectBg: '/yalla-ui/shop/shop_switch_diamond_uncheck.webp' },
  { key: 'vip' as const, label: 'اشتراكات', labelEn: 'Subscriptions', icon: '/yalla-ui/shop/btn_shop.png', selectBg: '/yalla-ui/shop/shop_switch_privilege_check.webp', unselectBg: '/yalla-ui/shop/shop_switch_privilege_uncheck.webp' },
];

const BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  hot: { bg: 'bg-red-500', text: 'text-white', label: '🔥 HOT' },
  popular: { bg: 'bg-blue-500', text: 'text-white', label: '⭐ Popular' },
  best: { bg: 'bg-amber-500', text: 'text-black', label: '👑 BEST' },
};

export default function ChargeDialog({ open, onClose, initialTab = 'diamond', gems, gold }: ChargeDialogProps) {
  const [activeTab, setActiveTab] = useState<'gold' | 'diamond' | 'vip'>(initialTab);
  const [packages, setPackages] = useState<{
    diamonds: Package[];
    golds: Package[];
    vip: Package[];
    firstChargeReward: FirstChargeReward;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);
  const [chargeCode, setChargeCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('telegram');
  const [chargeResult, setChargeResult] = useState<{ success: boolean; message: string } | null>(null);

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
        setChargeResult({ success: true, message: data.message });
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl"
          style={{
            background: 'linear-gradient(180deg, #0a2e1f 0%, #061a12 100%)',
            border: '1px solid rgba(255,215,0,.2)',
            boxShadow: '0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,215,0,.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ═══ Header: balances + close ═══ */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-3">
              {/* Gold */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(255,200,50,.15)', border: '1px solid rgba(255,200,50,.3)' }}>
                <img src="/yalla-ui/shop/coin.webp" alt="" className="w-4 h-4" />
                <span className="text-xs font-bold text-amber-300">{gold ?? '0'}</span>
              </div>
              {/* Diamonds */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'rgba(50,150,255,.15)', border: '1px solid rgba(50,150,255,.3)' }}>
                <img src="/yalla-ui/shop/diamonds.webp" alt="" className="w-4 h-4" />
                <span className="text-xs font-bold text-blue-300">{gems ?? '0'}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white/70" />
            </button>
          </div>

          {/* ═══ Tabs ═══ */}
          <div className="flex gap-1 px-4 pb-3">
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 flex flex-col items-center justify-center py-2 rounded-lg transition-all"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #1a6b3a, #0e4a25)' : 'rgba(0,0,0,.3)',
                    border: isActive ? '1px solid rgba(255,215,0,.4)' : '1px solid rgba(255,255,255,.08)',
                    boxShadow: isActive ? '0 2px 12px rgba(26,107,58,.3)' : 'none',
                  }}
                >
                  <img src={tab.icon} alt="" className="w-4 h-4 mb-0.5" />
                  <span className={`text-[11px] font-bold ${isActive ? 'text-amber-300' : 'text-slate-400'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ═══ First Charge Reward Banner ═══ */}
          {packages?.firstChargeReward && (
            <div className="mx-4 mb-3 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(255,180,0,.15), rgba(255,100,0,.1))', border: '1px solid rgba(255,180,0,.3)' }}>
              <div className="flex items-center gap-2 mb-2">
                <img src="/yalla-ui/shop/fast_pay_first_reward_tip_ic.webp" alt="" className="w-5 h-6" />
                <span className="text-xs font-bold text-amber-300">مكافأة أول شحن</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {packages.firstChargeReward.gifts.map((gift, i) => (
                  <div key={i} className="flex flex-col items-center" style={{ width: 'calc(16.66% - 4px)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)' }}>
                      <span className="text-base">{gift.icon}</span>
                    </div>
                    <span className="text-[8px] text-amber-400 mt-0.5">{gift.amount}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-amber-200/70 mt-2 text-center">{packages.firstChargeReward.text}</p>
            </div>
          )}

          {/* ═══ Package Grid ═══ */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            {currentPackages.map((pkg) => {
              const badge = pkg.badge ? BADGE_STYLES[pkg.badge] : null;
              const isSelected = selectedPkg?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className="relative rounded-xl p-2 cursor-pointer transition-all"
                  style={{
                    background: isSelected ? 'linear-gradient(135deg, rgba(255,215,0,.2), rgba(255,150,0,.1))' : 'rgba(0,0,0,.3)',
                    border: isSelected ? '1px solid rgba(255,215,0,.5)' : '1px solid rgba(255,255,255,.08)',
                    boxShadow: isSelected ? '0 0 12px rgba(255,215,0,.2)' : 'none',
                  }}
                >
                  {/* Badge */}
                  {badge && (
                    <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[7px] font-bold ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </div>
                  )}
                  {/* Icon */}
                  <div className="flex justify-center mb-1">
                    {pkg.iconBg ? (
                      <img src={pkg.iconBg} alt="" className="w-10 h-10 object-contain" />
                    ) : (
                      <span className="text-2xl">{pkg.icon}</span>
                    )}
                  </div>
                  {/* Amount */}
                  <div className="text-center text-xs font-bold text-white">
                    {formatAmount(pkg.amount)}
                  </div>
                  {/* Bonus */}
                  {pkg.bonus > 0 && (
                    <div className="text-center text-[8px] text-emerald-400">
                      +{formatAmount(pkg.bonus)} مكافأة
                    </div>
                  )}
                  {/* Royal + XP */}
                  <div className="text-center text-[7px] text-amber-500/70 mt-0.5">
                    +{pkg.royalPoints} رويال · +{pkg.xpReward} XP
                  </div>
                  {/* Price */}
                  <div className="text-center mt-1">
                    <span className="text-[10px] font-bold text-amber-300">${pkg.price}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ Charge Form (when package selected) ═══ */}
          {selectedPkg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="px-4 pb-4 overflow-hidden"
            >
              <div className="p-3 rounded-xl space-y-3" style={{ background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.08)' }}>
                {/* Selected package info */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">الحزمة المختارة:</span>
                  <span className="text-xs font-bold text-amber-300">
                    {formatAmount(selectedPkg.amount)} {selectedPkg.type === 'diamond' ? '💎' : selectedPkg.type === 'gold' ? '🪙' : '👑'} — ${selectedPkg.price}
                  </span>
                </div>
                {/* Subscription code input */}
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
                {/* Payment method */}
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
                {/* Rewards info */}
                <div className="text-[9px] text-amber-500/70 text-center">
                  ستحصل على: +{selectedPkg.royalPoints} نقاط رويال · +{selectedPkg.xpReward} XP
                </div>
                {/* Submit */}
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
                {/* Result */}
                {chargeResult && (
                  <div className={`text-xs text-center p-2 rounded-lg ${chargeResult.success ? 'text-emerald-300 bg-emerald-950/30' : 'text-red-300 bg-red-950/30'}`}>
                    {chargeResult.success ? '✅ ' : '❌ '}{chargeResult.message}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═══ Royal level info ═══ */}
          <div className="px-4 pb-4 text-center">
            <p className="text-[9px] text-amber-500/50">
              💎 كل شحن يزيد نقاط رويال + XP — كلما زاد الشحن، زاد مستواك
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
