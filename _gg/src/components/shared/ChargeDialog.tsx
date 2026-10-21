'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Crown, Sparkles, X } from 'lucide-react';
import RoyalDialog from './RoyalDialog';

// ════════════════════════════════════════════════════════════════════════════
// ChargeDialog — نسخة طبق الأصل 100% من Yalla Ludo
// المصدر: fragment_shop.xml + view_shop_diamonds.xml + item_diamonds.xml + item_shop_guild.xml
// مطابق لـ GEM_SHOP_SPEC.md
//
// البنية:
// 1. full-screen container (skin_bg.9.png + vignette) — لا إطار خارجي
// 2. Top bar: X (يسار) + رصيد ماس + رصيد ذهب (centered) + صورة لاعب (يمين) + R0 badge
// 3. 3 tabs: gold / diamond / vip (shop_switch_*_check/uncheck.webp)
// 4. shop_top_green_line.9.png divider
// 5. First-charge reward area (item_shop_guild.xml):
//    - title (yellow #fff771, 17sp)
//    - shelves.webp background (316×84dip, 3D beveled)
//    - chest_firstcharge.webp (يسار)
//    - bg_firstcharge.png bubble (يمين) مع 3×2 grid داخلها
//    - reward_tip (white 10sp)
// 6. Packages grid 3×2 (item_diamonds.xml) — 6 بطاقات بأيقونات diamonds1-6.webp
// 7. shop_item_tail_bg.9.png زر "تفاصيل الماس >>"
// 8. shelves 3 مرات كـ CSS background بين الصفوف
// ════════════════════════════════════════════════════════════════════════════

interface Package {
  id: string;
  type: 'diamond' | 'gold' | 'vip' | 'royal';
  amount: number;
  displayAmount: string;
  bonus: number;
  price: number;
  priceFormat: string;
  label: string;
  iconBg: string;
  badge: 'none' | 'hot' | 'best' | 'popular';
  order: number;
  enabled: boolean;
  royalPoints: number;
  xpReward: number;
  days?: number;
}

interface FirstChargeRewardItem {
  id: string;
  icon: string;
  amount: string;
  order: number;
}

interface FirstChargeReward {
  title: string;
  tip: string;
  items: FirstChargeRewardItem[];
}

interface Tab {
  key: 'gold' | 'diamond' | 'vip';
  label: string;
  iconCheck: string;
  iconUncheck: string;
  bgCheck: string;
  bgUncheck: string;
  iconW: number;
  iconH: number;
  marginTop: number;
  order: number;
  visible: boolean;
}

interface ChargeDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: 'diamond' | 'gold' | 'vip';
  gems: number | null;
  gold: number | null;
  royalLevel?: number;
}

// ─── أصول Yalla Ludo الأصلية (المسارات مطابقة لـ GEM_SHOP_SPEC.md) ───
const A = {
  // الخلفيات
  skinBg:            '/yalla-ui/full/skin_bg.9.png',           // #197458 dark green
  shopTopGreenLine:  '/yalla-ui/shop/shop_top_green_line.9.png',
  shelves:           '/yalla-ui/full/shelves.webp',            // #3eceaa bright teal-green
  // الأزرار
  skinClose:         '/yalla-ui/full/skin_close.webp',
  // أيقونات الأرصدة
  coin:              '/yalla-ui/full/coin.webp',               // 29×29dip
  diamonds:          '/yalla-ui/full/diamonds.webp',            // 29×29dip
  jia:               '/yalla-ui/full/jia.webp',
  // كبسولة الرصيد (bg_add_coin shape)
  bgAddCoin:         '#0c3c30',                                  // solid dark green + radius 10dip
  // ألسنة (tab backgrounds)
  switchLeftCheck:    '/yalla-ui/shop/shop_switch_left_check.webp',
  switchMiddleUncheck:'/yalla-ui/shop/shop_switch_middle_uncheck.webp',
  switchRightUncheck: '/yalla-ui/shop/shop_switch_right_uncheck.webp',
  switchGoldCheck:     '/yalla-ui/shop/shop_switch_gold_check.webp',
  switchGoldUncheck:   '/yalla-ui/shop/shop_switch_gold_uncheck.webp',
  switchDiamondCheck:  '/yalla-ui/shop/shop_switch_diamond_check.webp',
  switchDiamondUncheck:'/yalla-ui/shop/shop_switch_diamond_uncheck.webp',
  switchPrivilegeCheck:  '/yalla-ui/shop/shop_switch_privilege_check.webp',
  switchPrivilegeUncheck:'/yalla-ui/shop/shop_switch_privilege_uncheck.webp',
  // بطاقة الماس
  shopItemBg:        '/yalla-ui/full/shop_item_bg.webp',       // #5acce0 light cyan
  btnShop:           '/yalla-ui/shop/btn_shop.9.png',          // #6ecd0a bright green
  labelBest:         '/yalla-ui/full/label_best.webp',          // #de374d red ribbon
  labelPopular:      '/yalla-ui/full/label_popular.webp',        // #e96adf pink-magenta
  // أيقونات الماس الكبيرة 88×88dip (مختلفة لكل حزمة!)
  diamonds1: '/yalla-ui/full/diamonds1.webp',
  diamonds2: '/yalla-ui/full/diamonds2.webp',
  diamonds3: '/yalla-ui/full/diamonds3.webp',
  diamonds4: '/yalla-ui/full/diamonds4.webp',
  diamonds5: '/yalla-ui/full/diamonds5.webp',
  diamonds6: '/yalla-ui/full/diamonds6.webp',
  // أيقونات الذهب الكبيرة
  coin1: '/yalla-ui/full/coin1.webp',
  coin2: '/yalla-ui/full/coin2.webp',
  coin3: '/yalla-ui/full/coin3.webp',
  coin4: '/yalla-ui/full/coin4.webp',
  coin5: '/yalla-ui/full/coin5.webp',
  coin6: '/yalla-ui/full/coin6.webp',
  // مكافأة أول شحن
  chestFirstcharge:        '/yalla-ui/full/chest_firstcharge.webp',
  bgFirstcharge:           '/yalla-ui/full/bg_firstcharge.png',
  rechargeRoomGift:        '/yalla-ui/full/recharge_room_gift.webp',
  chargeRewardProfileCard: '/yalla-ui/full/charge_reward_profile_card.webp',
  chargeRewardHeadDecor:   '/yalla-ui/full/charge_reward_head_decor.webp',
  chargeRewardHeadFrame:   '/yalla-ui/full/charge_reward_head_frame.webp',
  fastPayFirstRewardTipIc: '/yalla-ui/full/fast_pay_first_reward_tip_ic.webp',
  // VIP
  privilegeKnight:         '/yalla-ui/full/privilege_detail_knight_ic.webp',
  privilegeBaron:          '/yalla-ui/full/privilege_detail_baron_ic.webp',
  royal5Throne:            '/yalla-ui/royal/royal_5_throne_ic.webp',
  btnYes:                  '/yalla-ui/shop/btn_yes.9.png',
  cartVipBuyItemBg:        '/yalla-ui/shop/cart_vip_buy_item_bg.webp',
  // Royal
  royalLevelValueIc:       '/yalla-ui/royal/royal_level_value_ic.webp',
  royalLevel0:             '/yalla-ui/royal/royal_level_0.webp',
  royalLevel1:             '/yalla-ui/royal/royal_level_1.webp',
  royalLevel2:             '/yalla-ui/royal/royal_level_2.webp',
  royalLevel3:             '/yalla-ui/royal/royal_level_3.webp',
  royalLevel4:             '/yalla-ui/royal/royal_level_4.webp',
  royalLevel5:             '/yalla-ui/royal/royal_level_5.webp',
  // زر تفاصيل الماس
  shopItemTailBg:    '/yalla-ui/shop/shop_item_tail_bg.9.png',
  // صوت
  defaultAvatar:     '/yalla-ui/avatar_default.png',
};

const ROYAL_LEVEL_ICONS = [A.royalLevel0, A.royalLevel1, A.royalLevel2, A.royalLevel3, A.royalLevel4, A.royalLevel5];

// خريطة pkg.id → أيقونة كبيرة (مطابقة لترتيب item_diamonds.xml)
const DIAMOND_ICONS: Record<string, string> = {
  dia_1: A.diamonds1, dia_2: A.diamonds2, dia_3: A.diamonds3,
  dia_4: A.diamonds4, dia_5: A.diamonds5, dia_6: A.diamonds6,
  gold_1: A.coin1, gold_2: A.coin2, gold_3: A.coin3,
  gold_4: A.coin4, gold_5: A.coin5, gold_6: A.coin6,
};

// ════════════════════════════════════════════════════════════════════════════
// الشارات (HOT/BEST/Popular) — أعلى يسار البطاقة
// (item_diamonds.xml: layout_gravity="end" في RTL = LEFT، مطابق لصورة A)
// الشارات لا تغطي كبسولة الرقم (الكبسولة في الوسط، الشارات في الزاوية العلوية اليسرى)
// ════════════════════════════════════════════════════════════════════════════
function renderBadge(badge: Package['badge']): React.ReactNode {
  if (badge === 'none') return null;
  if (badge === 'best') {
    return (
      <img
        src={A.labelBest}
        alt="BEST"
        className="absolute"
        style={{
          top: 2,
          left: -3,            // أعلى يسار + يبرز خارج الحافة اليسرى (marginEnd=-3 في RTL)
          width: 60,             // 60×21dip
          height: 21,
          objectFit: 'contain',
          zIndex: 10,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))',
        }}
      />
    );
  }
  if (badge === 'popular') {
    return (
      <img
        src={A.labelPopular}
        alt="POPULAR"
        className="absolute"
        style={{
          top: 2,
          left: -3,
          width: 60,
          height: 21,
          objectFit: 'contain',
          zIndex: 10,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))',
        }}
      />
    );
  }
  if (badge === 'hot') {
    // HOT: شارة دائرية برتقالية-حمراء بشعلة — أعلى يسار البطاقة
    // بديل موثّق (svg_hot SVGA غير متوفر) — استخدم دائرة برتقالية-حمراء + flame icon
    return (
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: -2,
          left: -8,            // أعلى يسار + يبرز خارج الحافة اليسرى (marginEnd=-8 في RTL)
          width: 35,             // 35×35dip
          height: 35,
          zIndex: 10,
        }}
      >
        {/* دائرة برتقالية-حمراء */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, #ff6b35 0%, #de374d 70%, #b02030 100%)',
            boxShadow: '0 2px 6px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.3)',
          }}
        />
        {/* شعلة */}
        <img
          src="/yalla-ui/full/room_icon_member_small_flame.webp"
          alt="HOT"
          className="relative"
          style={{ width: 18, height: 22, objectFit: 'contain' }}
        />
      </div>
    );
  }
  return null;
}

export default function ChargeDialog({ open, onClose, initialTab = 'diamond', gems, gold, royalLevel = 0 }: ChargeDialogProps) {
  const [activeTab, setActiveTab] = useState<'gold' | 'diamond' | 'vip'>(initialTab);
  const [packages, setPackages] = useState<{
    diamonds: Package[];
    golds: Package[];
    vip: Package[];
    royal: Package[];
    firstChargeReward: FirstChargeReward;
    tabs: Tab[];
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
              tabs: data.tabs,
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

  const tabs = packages?.tabs || [];
  const fcr = packages?.firstChargeReward;
  const isVipTab = activeTab === 'vip';

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
          {/* ══════ الحاوية الكاملة (rl_container) — 360dip wide, full_height, bg=skin_bg ══════ */}
          <motion.div
            initial={{ scale: 0.92, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 22 }}
            className="relative overflow-hidden flex flex-col"
            style={{
              width: 'min(100vw, 360px)',
              height: 'min(100vh, 800px)',
              background: 'linear-gradient(180deg, #3DB57A 0%, #2A8A5C 100%)',  // خلفية متدرجة حسب المواصفات
              boxShadow: '0 0 40px rgba(0,0,0,.4)',
              borderRadius: '0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* skin_bg.9.png — طبقة خلفية حقيقية */}
            <img
              src={A.skinBg}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'fill', opacity: 0.85, mixBlendMode: 'multiply' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Vignette — تعتيم الأطراف */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,.25) 100%)',
              }}
            />

            {/* ══════ الشريط العلوي (top bar) ══════ */}
            <div className="relative z-20 flex items-center px-3 pt-3 pb-2" style={{ minHeight: 56 }}>
              {/* زر الإغلاق X — أقصى اليسار (مطابق لـ image 2) */}
              <button
                onClick={onClose}
                className="flex items-center justify-center"
                style={{ width: 32, height: 32, borderRadius: '50%' }}
                aria-label="إغلاق"
              >
                <img src={A.skinClose} alt="إغلاق" style={{ width: 24, height: 24, objectFit: 'contain' }} />
              </button>

              {/* كبسولة الماس + كبسولة الذهب — مركز
                  داخل كل كبسولة: النص على اليسار + الأيقونة على اليمين (تتجاوز حافة الكبسولة قليلاً)
                  الترتيب البصري من اليسار لليمين: كبسولة الماس | كبسولة الذهب
              */}
              <div className="flex-1 flex items-center justify-center gap-2">
                {/* كبسولة الماس (rl_diamonds) — يسار */}
                <div className="relative flex items-center" style={{ marginRight: 8 }}>
                  {/* النص على اليسار (paddingEnd=4 = left padding) */}
                  <div
                    className="flex items-center justify-end"
                    style={{
                      width: 75,
                      height: 20,
                      background: A.bgAddCoin,
                      borderRadius: 10,
                      paddingRight: 4,    // paddingEnd=4 (left padding)
                      paddingLeft: 17,    // paddingStart=17 (right padding — يترك مساحة للأيقونة على اليمين)
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: '20px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textShadow: '0 1px 2px rgba(0,0,0,.6)',
                    }}
                  >
                    {gems ?? '0'}
                  </div>
                  {/* أيقونة الماس على اليمين (تتجاوز حافة الكبسولة) — 29×29dip، أكبر من ارتفاع الكبسولة 20dip */}
                  <img
                    src={A.diamonds}
                    alt=""
                    className="absolute"
                    style={{
                      right: -2,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 29,
                      height: 29,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.4))',
                    }}
                  />
                </div>

                {/* كبسولة الذهب (rl_gold) — يمين */}
                <div className="relative flex items-center">
                  <div
                    className="flex items-center justify-end"
                    style={{
                      width: 75,
                      height: 20,
                      background: A.bgAddCoin,
                      borderRadius: 10,
                      paddingRight: 4,
                      paddingLeft: 17,
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: '20px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textShadow: '0 1px 2px rgba(0,0,0,.6)',
                    }}
                  >
                    {gold ?? '0'}
                  </div>
                  <img
                    src={A.coin}
                    alt=""
                    className="absolute"
                    style={{
                      right: -2,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 29,
                      height: 29,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.4))',
                    }}
                  />
                </div>
              </div>

              {/* ══════ أيقونة الرويال — أقصى اليمين (مطابق لصورة A والسورس rle_entranceView) ══════ */}
              <button
                onClick={() => setRoyalOpen(true)}
                className="relative flex flex-col items-center justify-center"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label="مستوى رويال"
                title={`مستوى رويال ${royalLevel}`}
              >
                {/* دائرة بإطار أخضر — بداخلها أيقونة الرويال */}
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(180deg, #2DA887 0%, #1F7A5F 100%)',
                    border: '2px solid #5DD7A6',
                    boxShadow: '0 2px 6px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.2)',
                  }}
                >
                  {/* أيقونة الرويال من السورس */}
                  <img
                    src={royalLevel >= 0 && royalLevel <= 5 ? ROYAL_LEVEL_ICONS[royalLevel] : A.royalLevelValueIc}
                    alt={`R${royalLevel}`}
                    style={{
                      width: 28,
                      height: 28,
                      objectFit: 'contain',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.4))',
                    }}
                  />
                </div>
                {/* لافتة صغيرة تحتها بنص "R" + مستوى الرويال */}
                <div
                  className="absolute"
                  style={{
                    bottom: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fbbf24',
                    color: '#1f1407',
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 8,
                    minWidth: 22,
                    textAlign: 'center',
                    lineHeight: '12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,.4)',
                  }}
                >
                  R{royalLevel}
                </div>
              </button>
            </div>

            {/* ══════ الألسنة (radio_group_switch) — 3 ألسنة فقط ══════
                الترتيب البصري من اليسار لليمين (مطابق لطلب المستخدم):
                  [Subscriptions (vip) | Diamond | Gold]

                ملاحظة مهمة: الصفحة كلها dir="rtl" (layout.tsx L30)
                لذا flex container يرتّب الأبناء من اليمين لليسار:
                  - idx=0 (first in DOM) → يظهر في اليمين بصرياً
                  - idx=2 (last in DOM)  → يظهر في اليسار بصرياً

                الـ API يرجع الترتيب [gold, diamond, vip]
                بدون .reverse()، DOM order = [gold, diamond, vip]
                في RTL flex: gold → يمين، diamond → وسط، vip → يسار
                بصرياً: [Subscriptions (vip) يسار] [Diamond وسط] [Gold يمين] ✓

                شكل خلفيات التبويبات (مهم):
                - shop_switch_left_check.webp:    حافة يسرى مستديرة ← للموقع الأيسر بصرياً
                - shop_switch_middle_uncheck.webp: حافتان مربعتان ← للوسط
                - shop_switch_right_uncheck.webp:  حافة يمنى مستديرة ← للموقع الأيمن بصرياً

                بما أن RTL يقلب الترتيب البصري، نقلب إسناد الخلفيات أيضاً:
                  - idx=0 (DOM first = visually RIGHT) → switchRightUncheck (rounded right)
                  - idx=1 (DOM middle = visually MIDDLE) → switchMiddleUncheck (square)
                  - idx=2 (DOM last  = visually LEFT)  → switchLeftCheck (rounded left)

                الحالة النشطة تُظهرها:
                  - الأيقونة (iconCheck للنشط / iconUncheck لغير النشط)
                  - النص (أبيض للنشط / #17654c لغير النشط)
                  - filter: brightness(1.15) للنشط / brightness(0.9) لغير النشط
            */}
            <div className="relative z-10 flex px-2" style={{ height: 45 }}>
              {tabs.map((tab, idx) => {
                const isActive = activeTab === tab.key;
                // idx 0 = gold = visually RIGHT, idx 1 = diamond = visually MIDDLE, idx 2 = vip = visually LEFT
                const isVisuallyLeft = idx === tabs.length - 1;   // vip (last in DOM) → visually LEFT in RTL
                const isVisuallyMiddle = idx === 1;
                // flip bg assignment for RTL
                const bg = isVisuallyLeft ? A.switchLeftCheck : isVisuallyMiddle ? A.switchMiddleUncheck : A.switchRightUncheck;
                const icon = isActive ? tab.iconCheck : tab.iconUncheck;
                const textColor = isActive ? '#ffffff' : '#17654c';
                const brightnessFilter = isActive ? 'brightness(1.15)' : 'brightness(0.9)';
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="relative flex-1 flex flex-col items-center justify-center"
                    style={{ paddingBottom: 3, overflow: 'visible' }}
                  >
                    {/* خلفية التبويب (absolute — خلف المحتوى) */}
                    <img
                      src={bg}
                      alt=""
                      className="absolute inset-0 w-full h-full"
                      style={{ objectFit: 'fill', filter: brightnessFilter }}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    />
                    {/* أيقونة التبويب (relative + z-10 لتظهر فوق الخلفية) */}
                    <img
                      src={icon}
                      alt={tab.label}
                      className="relative z-10"
                      style={{ width: tab.iconW, height: tab.iconH, objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
                    />
                    {/* نص التبويب (relative + z-10 لتظهر فوق الخلفية) */}
                    <span
                      className="relative z-10"
                      style={{
                        marginTop: tab.marginTop,
                        color: textColor,
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: 1,
                        whiteSpace: 'nowrap',
                        textShadow: isActive ? '0 1px 2px rgba(0,0,0,.4)' : 'none',
                      }}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ══════ shop_top_green_line.9.png (الخط الفاصل) ══════ */}
            <div className="relative z-10" style={{ height: 9 }}>
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

            {/* ══════ منطقة المحتوى (vp_goods) — قابلة للتمرير ══════ */}
            <div className="relative z-10 flex-1 overflow-y-auto">
              {/* ══════ منطقة مكافأة أول شحن (item_shop_guild.xml) ══════ */}
              {fcr && activeTab !== 'vip' && (
                <div className="relative px-2 pt-4 pb-2">
                  {/* العنوان: "مكافأة عند المرة الأولى من الشراء" (yellow #fff771 17sp) */}
                  <div className="text-center" style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        color: '#fff771',
                        fontSize: 17,
                        fontWeight: 700,
                        textShadow: '0 6px 1px rgba(0,0,0,.5)',
                      }}
                    >
                      {fcr.title}
                    </span>
                  </div>

                  {/* الـ shelves + chest + bubble */}
                  <div className="relative" style={{ height: 95 }}>
                    {/* shelves.webp كخلفية (316×84dip) */}
                    <img
                      src={A.shelves}
                      alt=""
                      className="absolute"
                      style={{
                        top: 11,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '100%',
                        maxWidth: 316,
                        height: 84,
                        objectFit: 'fill',
                        opacity: 0.95,
                      }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />

                    {/* محتوى الـ shelves: chest يسار + bubble يمين */}
                    <div
                      className="absolute flex items-end justify-center"
                      style={{ top: 11, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 316, height: 84, gap: 0 }}
                    >
                      {/* صندوق الكنز (chest_firstcharge 72×54dip) — يسار (alignBottom) */}
                      <img
                        src={A.chestFirstcharge}
                        alt="chest"
                        style={{
                          width: 72,
                          height: 54,
                          objectFit: 'contain',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.4))',
                          flexShrink: 0,
                        }}
                      />

                      {/* الفقاعة البيضاء (bg_firstcharge 150×85dip) — يمين مع 3×2 grid داخلها */}
                      <div
                        className="relative"
                        style={{
                          width: 150,
                          height: 85,
                          backgroundImage: `url(${A.bgFirstcharge})`,
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat',
                          flexShrink: 0,
                        }}
                      >
                        {/* 3×2 grid داخل الفقاعة */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0" style={{ padding: '6px 4px' }}>
                          {fcr.items.map((item) => (
                            <div key={item.id} className="relative flex flex-col items-center justify-center">
                              <img
                                src={item.icon}
                                alt={item.id}
                                style={{
                                  width: item.id === 'fc_gift' ? 36 : item.id === 'fc_card' || item.id === 'fc_decor' ? 26 : item.id === 'fc_frame' ? 23 : 20,
                                  height: item.id === 'fc_gift' ? 36 : item.id === 'fc_card' || item.id === 'fc_decor' ? 26 : item.id === 'fc_frame' ? 24 : 20,
                                  objectFit: 'contain',
                                }}
                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                              />
                              <span
                                style={{
                                  color: '#467155',
                                  fontSize: 9,
                                  fontWeight: 700,
                                  textShadow: '0 1px 1px rgba(255,255,255,.5)',
                                  marginTop: -2,
                                }}
                              >
                                {item.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* نص التنبيه تحت الرف: "يمكنك أن تحصل على المكافآت بعد الشراء بأي كمية" (white 10sp) */}
                  <div className="text-center" style={{ marginTop: -2 }}>
                    <span
                      style={{
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        textShadow: '0 1px 1px rgba(0,0,0,.6)',
                      }}
                    >
                      {fcr.tip}
                    </span>
                  </div>
                </div>
              )}

              {/* ══════ الرف 1 (shelves كخلفية) ══════ */}
              {activeTab !== 'vip' && (
                <ShelfRow />
              )}

              {/* ══════ شبكة البطاقات (RecyclerView) — 3 أعمدة، RTL ══════
                  ترتيب بصري من اليمين لليسار تصاعدياً (مطابق لصورة A):
                  Row 1: 400 (يمين) | 1800 (وسط) | 5000 (يسار)
                  Row 2: 16.0K (يمين) | 53.7K (وسط) | 161.7K (يسار)
              */}
              {isVipTab ? (
                <div className="grid grid-cols-2 gap-2 px-3 py-3" style={{ direction: 'rtl' }}>
                  {currentPackages.filter(p => p.enabled).map((pkg) => (
                    <VipPackageCard
                      key={pkg.id}
                      pkg={pkg}
                      isSelected={selectedPkg?.id === pkg.id}
                      onSelect={() => setSelectedPkg(pkg)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 px-3 py-3" style={{ direction: 'rtl' }}>
                  {currentPackages.filter(p => p.enabled).map((pkg) => (
                    <DiamondPackageCard
                      key={pkg.id}
                      pkg={pkg}
                      isSelected={selectedPkg?.id === pkg.id}
                      onSelect={() => setSelectedPkg(pkg)}
                    />
                  ))}
                </div>
              )}

              {/* ══════ الرف 2 + الرف 3 ══════ */}
              {activeTab !== 'vip' && (
                <>
                  <ShelfRow />
                  <ShelfRow />
                </>
              )}

              {/* ══════ زر "تفاصيل الماس >>" (shop_item_tail_bg.9.png) ══════
                  هذا الزر في السورس ينقل إلى صفحة تفاصيل المعاملات (go_diamonds_detail)
                  لم تُبنَ صفحة التفاصيل بعد — الزر ساكن مؤقتاً
              */}
              <div className="flex justify-center" style={{ marginTop: 8, marginBottom: 12 }}>
                <button
                  className="relative flex items-center justify-center"
                  style={{
                    width: 191,
                    height: 25,
                    color: '#2bc895',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <img
                    src={A.shopItemTailBg}
                    alt=""
                    className="absolute inset-0 w-full h-full"
                    style={{ objectFit: 'fill' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span className="relative">
                    {activeTab === 'gold' ? 'تفاصيل الذهب >>' : 'تفاصيل الماس >>'}
                  </span>
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
                      {selectedPkg.displayAmount} — {selectedPkg.priceFormat}
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
                  {/* زر الشراء — btn_shop.9.png */}
                  <button
                    onClick={handleCharge}
                    disabled={loading || !chargeCode.trim()}
                    className="relative w-full rounded-lg text-sm font-bold transition-all disabled:opacity-50 overflow-hidden"
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
                        el.parentElement!.style.background = 'linear-gradient(180deg, #6ecd0a 0%, #4fa82a 100%)';
                      }}
                    />
                    <span className="relative flex items-center justify-center gap-1.5" style={{ color: '#47790c', textShadow: '1px 0 0 #94f534, -1px 0 0 #94f534, 0 1px 0 #94f534, 0 -1px 0 #94f534, 1px 1px 0 #94f534, -1px -1px 0 #94f534, 1px -1px 0 #94f534, -1px 1px 0 #94f534' }}>
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري المعالجة...
                        </>
                      ) : (
                        <>{selectedPkg.priceFormat}</>
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

      {/* RoyalDialog — يفتح من أيقونة الرويال في أعلى يمين النافذة (rle_entranceView) */}
      <RoyalDialog
        open={royalOpen}
        onClose={() => setRoyalOpen(false)}
        onChargeClick={() => {
          setRoyalOpen(false);
        }}
      />
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ShelfRow — صف الرف (shelves.webp كخلفية كاملة العرض)
// مطابق لـ item_shop_guild.xml L26 (iv_shelves 316×84dip)
// ════════════════════════════════════════════════════════════════════════════
function ShelfRow() {
  return (
    <div className="relative" style={{ height: 12, marginTop: 4, marginBottom: 4 }}>
      {/* شريط الرف: حافة فاتحة علوية + جسم + ظل سفلي (3D bevel) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #5DD7A6 0%, #3ECEAA 30%, #2DA887 60%, #1F7A5F 100%)',
          boxShadow: '0 2px 4px rgba(0,0,0,.3), inset 0 1px 0 rgba(255,255,255,.4), inset 0 -1px 0 rgba(0,0,0,.3)',
        }}
      />
      {/* shelves.webp كطبقة تفصيل */}
      <img
        src={A.shelves}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'fill', opacity: 0.4 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DiamondPackageCard — نسخة طبق الأصل 100% من item_diamonds.xml (107×150dip)
// البنية:
//   - shop_item_bg.webp 107×150dip fitXY centerInParent (خلفية كاملة)
//   - ll1 (79×20dip, marginTop=8, centerHorizontal): diamonds.webp 14×16dip + رقم 12sp #fff782
//   - FrameLayout below=ll1:
//     - iv_coin 88×88dip (diamonds1-6.webp — مختلفة لكل حزمة!)
//     - svg_best (label_best.webp 60×21dip marginTop=2 marginEnd=-3) أعلى يمين
//     - svg_hot (35×35dip marginTop=-2 marginEnd=-8) أعلى يمين — للشارة HOT
//   - ll_buy (90×32dip bg=btn_shop.9.png alignParentBottom centerHorizontal):
//     - tv_money 14sp bold #47790c stroke_color=#94f534 stroke_width=2dip text="USD X.XX"
//   - tv_tips 9sp #3c93ad marginBottom=45
// ════════════════════════════════════════════════════════════════════════════
function DiamondPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  const isGold = pkg.type === 'gold';
  const smallIcon = isGold ? A.coin : A.diamonds;
  const bigIcon = DIAMOND_ICONS[pkg.id] || A.diamonds1;
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
      {/* shop_item_bg.webp 107×150dip fitXY centerInParent */}
      <img
        src={A.shopItemBg}
        alt=""
        className="absolute inset-0"
        style={{ width: 107, height: 150, objectFit: 'fill' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* ll1 — 79×20dip marginTop=8 centerHorizontal: small icon + count text */}
      <div
        className="absolute flex items-center justify-center"
        style={{ top: 8, left: '50%', transform: 'translateX(-50%)', width: 79, height: 20 }}
      >
        <img src={smallIcon} alt="" style={{ width: 14, height: 16, objectFit: 'contain' }} />
        <span
          style={{
            color: '#fff782',
            fontSize: 12,
            fontWeight: 700,
            marginLeft: 2,
            textShadow: '0 3px 5px #000',
          }}
        >
          {pkg.displayAmount}
        </span>
      </div>

      {/* FrameLayout below=ll1: iv_coin (88×88dip) + svg_best + svg_hot */}
      <div
        className="absolute flex items-start justify-center"
        style={{ top: 28, left: 0, right: 0, height: 88 }}
      >
        <img
          src={bigIcon}
          alt={pkg.label}
          style={{ width: 88, height: 88, objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.5))' }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.4'; }}
        />
      </div>

      {/* شارة (HOT/BEST/Popular) — أعلى يمين (layout_gravity=end) */}
      {renderBadge(pkg.badge)}

      {/* ll_buy — 90×32dip bg=btn_shop.9.png alignParentBottom centerHorizontal */}
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
            el.parentElement!.style.background = 'linear-gradient(180deg, #6ecd0a, #4fa82a)';
            el.parentElement!.style.borderRadius = 6;
          }}
        />
        {/* tv_money 14sp bold #47790c stroke_color=#94f534 stroke_width=2dip */}
        <span
          style={{
            position: 'relative',
            color: '#47790c',
            fontSize: 14,
            fontWeight: 700,
            textShadow: '1px 0 0 #94f534, -1px 0 0 #94f534, 0 1px 0 #94f534, 0 -1px 0 #94f534, 1px 1px 0 #94f534, -1px -1px 0 #94f534, 1px -1px 0 #94f534, -1px 1px 0 #94f534',
          }}
        >
          {pkg.priceFormat}
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VipPackageCard — نسخة طبق الأصل من item_vip_buy.xml (157.5×195.45dip)
// ════════════════════════════════════════════════════════════════════════════
function VipPackageCard({ pkg, isSelected, onSelect }: { pkg: Package; isSelected: boolean; onSelect: () => void }) {
  const tierIcon = pkg.id === 'vip_royal' ? A.royal5Throne : pkg.id === 'vip_liwa' ? A.privilegeBaron : A.privilegeKnight;
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
      {/* cart_vip_buy_item_bg.webp كخلفية كاملة */}
      <img
        src={A.cartVipBuyItemBg}
        alt=""
        className="absolute inset-0"
        style={{ width: '100%', height: '100%', objectFit: 'fill' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* شارة (badge) */}
      {pkg.badge !== 'none' && renderBadge(pkg.badge)}

      {/* iv_days — FrameLayout 59×72dip marginTop=39 centerHorizontal */}
      <div
        className="absolute"
        style={{ top: 39, left: '50%', transform: 'translateX(-50%)', width: 59, height: 72 }}
      >
        <img
          src={tierIcon}
          alt={pkg.label}
          className="absolute inset-0"
          style={{ width: 59, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))' }}
          onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ marginTop: 3 }}>
          <span style={{ color: '#17654c', fontSize: 16, fontWeight: 700, textShadow: '0 1px 0 rgba(255,255,255,.3)' }}>
            {pkg.days}يوم
          </span>
        </div>
      </div>

      {/* btn_vip_buy — LinearLayout 110×40dip marginTop=23 bg=bn_yes (btn_yes.9.png) */}
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
        {/* diamonds 15×19dip + price 15sp StrokeTextStyle_Yes */}
        <img src={A.diamonds} alt="" style={{ width: 15, height: 19, objectFit: 'contain' }} />
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

      {/* اسم الباقة + رويال + XP */}
      <div className="absolute" style={{ top: 178, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ color: tierColor, fontSize: 11, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.6)' }}>
          {pkg.label} · +{pkg.royalPoints} رويال
        </div>
      </div>
    </div>
  );
}
