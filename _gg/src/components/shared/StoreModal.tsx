'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Gem, ChevronRight, Zap, MessageCircle, Phone, CreditCard, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// ─── Store Items ─────────────────────────────────────────────────────────

interface StoreItem {
  key: string;
  icon: string;
  name: string;
  description: string;
  price: number;
  category: 'premium' | 'avatars' | 'effects' | 'tools';
}

const storeItems: StoreItem[] = [
  { key: 'emotions_pack', icon: '🎭', name: 'حزمة المشاعر المميزة', description: 'مجموعة من التعابير والمشاعر الفاخرة', price: 500, category: 'premium' },
  { key: 'golden_frame', icon: '✨', name: 'إطار ذهبي للصورة', description: 'إطار ذهبي متوهج حول صورتك الشخصية', price: 300, category: 'premium' },
  { key: 'animated_bg', icon: '🌟', name: 'خلفية متحركة', description: 'خلفية متحركة مميزة لملفك الشخصي', price: 200, category: 'premium' },
  { key: 'sound_effects', icon: '🔊', name: 'مؤثرات صوت مميزة', description: 'مؤثرات صوتية فاخرة أثناء اللعب', price: 400, category: 'effects' },
  { key: 'accuracy_boost', icon: '🎯', name: 'مؤشر دقة أعلى', description: 'مؤشر يوضح مستوى دقتك في اللعبة', price: 350, category: 'tools' },
  { key: 'luxury_entrance', icon: '💫', name: 'انيميشن دخول فاخر', description: 'تأثير دخول مبهر عند بدء اللعبة', price: 600, category: 'effects' },
  { key: 'champion_badge', icon: '🏆', name: 'شارة بطل', description: 'شارة البطل تظهر بجانب اسمك', price: 1000, category: 'avatars' },
  { key: 'extra_time', icon: '⚡', name: 'سرعة إضافية في المؤقت', description: '30 ثانية إضافية عند نفاد الوقت', price: 250, category: 'tools' },
  { key: 'night_mode', icon: '🎨', name: 'وضع ليلي خاص', description: 'ثيم ليلي مميز لكل الألعاب', price: 200, category: 'effects' },
  { key: 'crown_avatar', icon: '👑', name: 'صورة ملكية', description: 'صورة رمزية ملكية فاخرة', price: 450, category: 'avatars' },
  { key: 'sparkle_trail', icon: '💫', name: 'أثر لمعان', description: 'أثر لمعان خلف كل نقاطك', price: 300, category: 'effects' },
  { key: 'lucky_charm', icon: '🍀', name: 'تعويذة الحظ', description: 'تأثير حظ خاص على لعبتك', price: 350, category: 'tools' },
];

const categories = [
  { key: 'charging', label: 'شحن', icon: '⚡' },
  { key: 'all', label: 'الكل', icon: '🛍️' },
  { key: 'premium', label: 'عناصر مميزة', icon: '✨' },
  { key: 'avatars', label: 'أشكال لاعبين', icon: '🎭' },
  { key: 'effects', label: 'مؤثرات', icon: '🌟' },
  { key: 'tools', label: 'أدوات', icon: '🔧' },
];

// ─── Gem Package Types ─────────────────────────────────────────────────

interface GemPackage {
  id: string;
  gems: number;
  bonus: number;
  price: number;
  label: string;
  icon: string;
  color: string;
}

// ─── Component ──────────────────────────────────────────────────────────

interface StoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gemsBalance: number;
  subscriptionCode?: string;
  onPurchaseComplete?: (newBalance: number) => void;
}

function formatNumber(n: number): string {
  return n.toLocaleString('ar-SA');
}

export default function StoreModal({ open, onOpenChange, gemsBalance, subscriptionCode, onPurchaseComplete }: StoreModalProps) {
  const [activeCategory, setActiveCategory] = useState('charging');
  const [confirmItem, setConfirmItem] = useState<StoreItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [localBalance, setLocalBalance] = useState(gemsBalance);
  const [packages, setPackages] = useState<GemPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<GemPackage | null>(null);
  const [chargeSubmitting, setChargeSubmitting] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('whatsapp');
  const { toast } = useToast();

  // Sync balance from props
  const balance = localBalance !== gemsBalance ? localBalance : gemsBalance;

  // Fetch gem packages on mount
  useEffect(() => {
    async function fetchPackages() {
      try {
        const res = await fetch('/api/gems/packages');
        const data = await res.json();
        if (data.success) {
          setPackages(data.packages);
        }
      } catch {
        // fallback to static packages
        setPackages([]);
      } finally {
        setLoadingPackages(false);
      }
    }
    fetchPackages();
  }, []);

  const filteredItems = activeCategory === 'all'
    ? storeItems
    : activeCategory === 'charging'
      ? []
      : storeItems.filter((item) => item.category === activeCategory);

  const handlePurchase = async () => {
    if (!confirmItem || !subscriptionCode) return;
    setPurchasing(true);

    try {
      const res = await fetch('/api/gems/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: subscriptionCode,
          itemKey: confirmItem.key,
          price: confirmItem.price,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setLocalBalance(data.newBalance);
        onPurchaseComplete?.(data.newBalance);
        toast({
          title: 'تم الشراء بنجاح! 🎉',
          description: `${confirmItem.name} - رصيدك الآن: 💎 ${formatNumber(data.newBalance)}`,
        });
        setConfirmItem(null);
      } else {
        toast({
          title: 'فشل الشراء',
          description: data.error || 'حدث خطأ',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطأ في الاتصال',
        description: 'تحقق من اتصالك بالإنترنت',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleCharge = async () => {
    if (!selectedPackage || !subscriptionCode) return;
    setChargeSubmitting(true);
    setChargeSuccess(false);

    try {
      const res = await fetch('/api/gems/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: subscriptionCode,
          gemsPackage: selectedPackage.id,
          paymentMethod: selectedPaymentMethod,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setChargeSuccess(true);
        toast({
          title: 'تم إرسال طلب الشحن! 📋',
          description: 'سيتم مراجعة طلبك وإضافة الجواهر بعد تأكيد الدفع.',
        });
      } else {
        toast({
          title: 'فشل إرسال الطلب',
          description: data.error || 'حدث خطأ',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'خطأ في الاتصال',
        description: 'تحقق من اتصالك بالإنترنت',
        variant: 'destructive',
      });
    } finally {
      setChargeSubmitting(false);
    }
  };

  const getPaymentMethodInfo = () => {
    switch (selectedPaymentMethod) {
      case 'telegram':
        return { icon: <MessageCircle className="w-4 h-4" />, label: 'تيليجرام', desc: 'أرسل إيصال الدفع عبر تيليجرام' };
      case 'whatsapp':
        return { icon: <Phone className="w-4 h-4" />, label: 'واتساب', desc: 'أرسل إيصال الدفع عبر واتساب' };
      case 'bank_transfer':
        return { icon: <CreditCard className="w-4 h-4" />, label: 'تحويل بنكي', desc: 'أرسل إيصال التحويل البنكي' };
      default:
        return { icon: <Info className="w-4 h-4" />, label: 'أخرى', desc: 'تواصل مع الإدارة' };
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] bg-slate-900 border border-slate-700/50 rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col z-10"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-gradient-to-l from-amber-950/30 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">المتجر</h2>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Gem className="w-3 h-3 text-amber-400" />
                    <span className="font-bold text-amber-400">{formatNumber(balance)}</span>
                    <span className="text-slate-500">جوهرة</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Balance bar */}
            <div className="px-4 py-3 bg-gradient-to-l from-amber-500/10 to-orange-500/5 border-b border-slate-800/30">
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-2 bg-slate-800/80 border border-amber-500/30 rounded-full px-4 py-1.5">
                  <span className="text-amber-400 text-lg">💎</span>
                  <span className="font-black text-white tabular-nums">{formatNumber(balance)}</span>
                </div>
                <span className="text-xs text-slate-500">رصيدك الحالي</span>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 p-3 overflow-x-auto border-b border-slate-800/30 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat.key
                      ? cat.key === 'charging'
                        ? 'bg-gradient-to-l from-amber-500 to-orange-500 text-white border border-amber-400/40 shadow-lg shadow-amber-500/20'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-slate-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* ── Charging Section ── */}
              {activeCategory === 'charging' && (
                <div className="space-y-4">
                  {/* Section header */}
                  <div className="text-center space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <h3 className="text-lg font-black text-white">شحن الجواهر</h3>
                      <Zap className="w-5 h-5 text-amber-400" />
                    </div>
                    <p className="text-xs text-slate-500">اختر حزمة الجواهر المناسبة لك</p>
                  </div>

                  {/* Current balance card */}
                  <div className="relative overflow-hidden bg-gradient-to-l from-amber-950/50 via-slate-800/60 to-slate-800/40 border border-amber-500/20 rounded-xl p-4">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.08),transparent_60%)]" />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-xs text-amber-400/70 mb-1">رصيدك الحالي</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">💎</span>
                          <span className="text-2xl font-black text-white">{formatNumber(balance)}</span>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Gems Balance</p>
                        <p className="text-lg font-bold text-amber-400">{formatNumber(balance)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Packages grid */}
                  {loadingPackages ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 animate-pulse">
                          <div className="w-12 h-12 bg-slate-700/50 rounded-full mx-auto mb-3" />
                          <div className="h-4 bg-slate-700/50 rounded w-2/3 mx-auto mb-2" />
                          <div className="h-6 bg-slate-700/50 rounded w-1/2 mx-auto" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {packages.map((pkg, index) => (
                        <motion.div
                          key={pkg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`relative overflow-hidden cursor-pointer rounded-xl p-4 border transition-all group ${
                            selectedPackage?.id === pkg.id
                              ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/20'
                              : 'border-slate-700/40 hover:border-amber-500/40'
                          }`}
                          style={{
                            background: selectedPackage?.id === pkg.id
                              ? 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.08))'
                              : 'rgba(30,41,59,0.6)',
                          }}
                        >
                          {/* Bonus badge */}
                          {pkg.bonus > 0 && (
                            <div className="absolute top-2 left-2 z-10">
                              <Badge className="bg-gradient-to-l from-emerald-500 to-emerald-600 text-white text-[9px] font-black px-1.5 py-0 border-0 shadow-md">
                                +{formatNumber(pkg.bonus)} بونص
                              </Badge>
                            </div>
                          )}

                          {/* Best value badge for mega */}
                          {pkg.id === 'mega' && (
                            <div className="absolute top-2 right-2 z-10">
                              <Badge className="bg-gradient-to-l from-amber-400 to-yellow-400 text-slate-900 text-[9px] font-black px-1.5 py-0 border-0 shadow-md">
                                الأفضل
                              </Badge>
                            </div>
                          )}

                          {/* Gem icon */}
                          <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                            selectedPackage?.id === pkg.id
                              ? 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 shadow-inner'
                              : 'bg-slate-800/60 group-hover:bg-amber-500/10'
                          } transition-colors`}>
                            <span className="text-2xl">💎</span>
                          </div>

                          {/* Gems amount */}
                          <div className="text-center">
                            <p className={`text-xl font-black ${
                              selectedPackage?.id === pkg.id ? 'text-amber-300' : 'text-white'
                            } transition-colors`}>
                              {formatNumber(pkg.gems)}
                            </p>
                            {pkg.bonus > 0 && (
                              <p className="text-[10px] text-emerald-400 font-bold">
                                +{formatNumber(pkg.bonus)} مجاناً
                              </p>
                            )}
                            <p className="text-xs text-slate-500 mt-0.5">جوهرة</p>
                          </div>

                          {/* Price */}
                          <div className="mt-3 text-center">
                            <span className="text-sm font-black text-white">${pkg.price.toFixed(2)}</span>
                          </div>

                          {/* Selection indicator */}
                          {selectedPackage?.id === pkg.id && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute bottom-2 right-1/2 translate-x-1/2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Charge button */}
                  {selectedPackage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {/* Summary */}
                      <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">الحزمة المختارة</span>
                          <span className="font-bold text-white">💎 {formatNumber(selectedPackage.gems)} {selectedPackage.bonus > 0 ? `(+${formatNumber(selectedPackage.bonus)})` : ''}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-slate-400">المبلغ</span>
                          <span className="font-bold text-amber-400">${selectedPackage.price.toFixed(2)}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedPackage(selectedPackage);
                        }}
                        className="w-full h-12 text-sm font-black bg-gradient-to-l from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-500/25 transition-all"
                      >
                        <Zap className="w-4 h-4 ml-2" />
                        شحن الجواهر
                        <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
                      </Button>

                      <p className="text-center text-[11px] text-slate-600">
                        سيتم إنشاء طلب شحن ومراجعته من قبل الإدارة
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* ── Store Items Grid ── */}
              {activeCategory !== 'charging' && (
                <div className="grid grid-cols-2 gap-3">
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02 }}
                      className="relative bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 flex flex-col gap-2 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{item.icon}</span>
                        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[10px]">
                          💎 {formatNumber(item.price)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setConfirmItem(item)}
                        disabled={balance < item.price}
                        className={`w-full text-xs font-bold h-8 mt-auto ${
                          balance < item.price
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white'
                        }`}
                      >
                        {balance < item.price ? '💎 غير كافٍ' : (
                          <>
                            شراء
                            <ChevronRight className="w-3 h-3 mr-1" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Confirm Purchase Dialog ── */}
          <AnimatePresence>
            {confirmItem && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              >
                <div
                  className="absolute inset-0 bg-black/60"
                  onClick={() => setConfirmItem(null)}
                />
                <motion.div
                  className="relative bg-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-sm w-full z-10"
                  dir="rtl"
                >
                  <div className="text-center space-y-3">
                    <span className="text-5xl block">{confirmItem.icon}</span>
                    <h3 className="text-lg font-black text-white">{confirmItem.name}</h3>
                    <p className="text-sm text-slate-400">{confirmItem.description}</p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <span className="text-amber-400">💎</span>
                      <span className="text-2xl font-black text-amber-300">{formatNumber(confirmItem.price)}</span>
                      <span className="text-slate-500 text-sm">جوهرة</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      الرصيد بعد الشراء: 💎 {formatNumber(Math.max(0, balance - confirmItem.price))}
                    </p>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button
                      onClick={() => setConfirmItem(null)}
                      variant="outline"
                      className="flex-1 border-slate-700 text-slate-300"
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="flex-1 bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold"
                    >
                      {purchasing ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'تأكيد الشراء'
                      )}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Charge Payment Dialog ── */}
          <AnimatePresence>
            {selectedPackage && !chargeSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              >
                <div
                  className="absolute inset-0 bg-black/60"
                  onClick={() => setSelectedPackage(null)}
                />
                <motion.div
                  className="relative bg-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-sm w-full z-10"
                  dir="rtl"
                >
                  {chargeSuccess ? null : (
                    <>
                      {/* Header */}
                      <div className="text-center space-y-3 mb-5">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center">
                          <span className="text-3xl">💎</span>
                        </div>
                        <h3 className="text-lg font-black text-white">شحن الجواهر</h3>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xl font-black text-amber-300">{formatNumber(selectedPackage.gems)}</span>
                          {selectedPackage.bonus > 0 && (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-xs">
                              +{formatNumber(selectedPackage.bonus)} بونص
                            </Badge>
                          )}
                          <span className="text-slate-500 text-sm">جوهرة</span>
                        </div>
                        <p className="text-sm font-bold text-white">${selectedPackage.price.toFixed(2)}</p>
                      </div>

                      {/* Payment method selection */}
                      <div className="space-y-3 mb-5">
                        <p className="text-sm font-bold text-slate-300">اختر طريقة الدفع:</p>
                        {[
                          { id: 'whatsapp', label: 'واتساب', icon: <Phone className="w-4 h-4" />, color: 'emerald' },
                          { id: 'telegram', label: 'تيليجرام', icon: <MessageCircle className="w-4 h-4" />, color: 'sky' },
                          { id: 'bank_transfer', label: 'تحويل بنكي', icon: <CreditCard className="w-4 h-4" />, color: 'violet' },
                        ].map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPaymentMethod(method.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              selectedPaymentMethod === method.id
                                ? 'border-amber-500/50 bg-amber-500/10'
                                : 'border-slate-700/40 bg-slate-800/40 hover:border-slate-600/50'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              selectedPaymentMethod === method.id
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              {method.icon}
                            </div>
                            <span className={`text-sm font-bold ${
                              selectedPaymentMethod === method.id ? 'text-white' : 'text-slate-400'
                            }`}>
                              {method.label}
                            </span>
                            {selectedPaymentMethod === method.id && (
                              <div className="mr-auto w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Info notice */}
                      <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 mb-5">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            سيتم إنشاء طلب شحن معلق. تواصل مع الإدارة عبر <span className="text-amber-400 font-bold">{getPaymentMethodInfo().label}</span> لإرسال إيصال الدفع. سيتم إضافة الجواهر بعد التأكيد.
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setSelectedPackage(null)}
                          variant="outline"
                          className="flex-1 border-slate-700 text-slate-300"
                        >
                          إلغاء
                        </Button>
                        <Button
                          onClick={handleCharge}
                          disabled={chargeSubmitting}
                          className="flex-1 bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold"
                        >
                          {chargeSubmitting ? (
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Zap className="w-4 h-4 ml-1" />
                              إرسال طلب الشحن
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Charge Success Dialog ── */}
          <AnimatePresence>
            {chargeSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4"
              >
                <div
                  className="absolute inset-0 bg-black/60"
                  onClick={() => {
                    setChargeSuccess(false);
                    setSelectedPackage(null);
                  }}
                />
                <motion.div
                  className="relative bg-slate-900 border border-slate-700/50 rounded-2xl p-6 max-w-sm w-full z-10"
                  dir="rtl"
                >
                  <div className="text-center space-y-4">
                    {/* Success icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.1 }}
                      className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/40 flex items-center justify-center"
                    >
                      <span className="text-4xl">✅</span>
                    </motion.div>

                    <div>
                      <h3 className="text-lg font-black text-white">تم إرسال الطلب!</h3>
                      <p className="text-sm text-slate-400 mt-2">
                        طلب شحن <span className="text-amber-400 font-bold">💎 {formatNumber(selectedPackage?.gems ?? 0)}</span> جواهر
                        {selectedPackage && selectedPackage.bonus > 0 && (
                          <span className="text-emerald-400"> +{formatNumber(selectedPackage.bonus)} بونص</span>
                        )}
                      </p>
                    </div>

                    {/* Next steps */}
                    <div className="bg-slate-800/50 border border-slate-700/30 rounded-xl p-3 text-right space-y-2">
                      <p className="text-xs font-bold text-slate-300">الخطوات التالية:</p>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
                        <p className="text-[11px] text-slate-400">تواصل مع الإدارة عبر {getPaymentMethodInfo().label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">2</div>
                        <p className="text-[11px] text-slate-400">أرسل إيصال الدفع (${selectedPackage?.price.toFixed(2)})</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0">3</div>
                        <p className="text-[11px] text-slate-400">سيتم إضافة الجواهر بعد التأكيد ⏳</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        setChargeSuccess(false);
                        setSelectedPackage(null);
                      }}
                      className="w-full bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold"
                    >
                      حسناً، فهمت
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
