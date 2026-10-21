import { NextResponse } from 'next/server';

// ════════════════════════════════════════════════════════════════════════════
// حزم الشحن — Data-driven بنية كاملة (لماس + ذهب + اشتراكات VIP + رويال)
// الأرقام مطابقة 100% لـ Yalla Ludo:
//   الماس: 400 / 0.99 HOT, 1800 / 3.99, 5000 / 9.99,
//          16.0K / 29.99 Popular, 53.7K / 99.99, 161.7K / 299.99 BEST
//   الذهب: 35K, 130K, 620K, 2.7M, 7.7M, 17M (نفس الأسعار)
//   VIP:   فارس 7 أيام, لواء 30 يوم, رويال 90 يوم
//   Royal: 100, 500, 2000 نقطة رويال
//
// كل حزمة تشمل: id, type, amount, displayAmount, bonus, price, priceFormat,
//              label, iconBg (path to diamonds1-6.webp), badge (none/hot/best/popular),
//              order (1=right RTL), enabled, royalPoints, xpReward
//
// لوحة السوبر أدمن: البنية جاهزة لإضافة/تعديل/تعطيل الحزم والمكافآت
// ════════════════════════════════════════════════════════════════════════════

interface ChargePackage {
  id: string;
  type: 'diamond' | 'gold' | 'vip' | 'royal';
  amount: number;
  displayAmount: string;              // النص المعروض: "400", "16.0K", "53.7K", "161.7K"
  bonus: number;                       // 0 — لا توجد مكافآت ظاهرة في الأصل
  price: number;                       // 0.99, 3.99, 9.99, 29.99, 99.99, 299.99
  priceFormat: string;                 // "USD 0.99"
  label: string;                       // اسم الحزمة
  iconBg: string;                      // مسار الأيقونة الكبيرة 88x88dip
  badge: 'none' | 'hot' | 'best' | 'popular';
  order: number;                       // 1-6 (1=يمين في RTL, 6=يسار)
  enabled: boolean;                    // false لإخفاء الحزمة من العرض
  royalPoints: number;
  xpReward: number;
  days?: number;                        // للـ VIP فقط
}

// ─── 6 حزم الماس (مطابقة 100% لـ Yalla Ludo) ───
// الترتيب: 1=يمين (400), 2=وسط (1800), 3=يسار (5000), 4=يمين (16K), 5=وسط (53.7K), 6=يسار (161.7K)
// الأيقونات: diamonds1.webp للحزمة الأولى، diamonds2.webp للثانية، ... diamonds6.webp للسادسة
const diamondPackages: ChargePackage[] = [
  { id: 'dia_1', type: 'diamond', amount: 400,     displayAmount: '400',     bonus: 0, price: 0.99,   priceFormat: 'USD 0.99',   label: 'حزمة صغيرة',   iconBg: '/yalla-ui/full/diamonds1.webp', badge: 'hot',     order: 1, enabled: true, royalPoints: 10,   xpReward: 40 },
  { id: 'dia_2', type: 'diamond', amount: 1800,    displayAmount: '1800',    bonus: 0, price: 3.99,   priceFormat: 'USD 3.99',   label: 'حزمة متوسطة', iconBg: '/yalla-ui/full/diamonds2.webp', badge: 'none',    order: 2, enabled: true, royalPoints: 40,   xpReward: 180 },
  { id: 'dia_3', type: 'diamond', amount: 5000,    displayAmount: '5000',    bonus: 0, price: 9.99,   priceFormat: 'USD 9.99',   label: 'حزمة كبيرة',   iconBg: '/yalla-ui/full/diamonds3.webp', badge: 'none',    order: 3, enabled: true, royalPoints: 100,  xpReward: 500 },
  { id: 'dia_4', type: 'diamond', amount: 16000,   displayAmount: '16.0K',   bonus: 0, price: 29.99,  priceFormat: 'USD 29.99',  label: 'حزمة شيكل',    iconBg: '/yalla-ui/full/diamonds4.webp', badge: 'popular', order: 4, enabled: true, royalPoints: 300,  xpReward: 1600 },
  { id: 'dia_5', type: 'diamond', amount: 53700,   displayAmount: '53.7K',   bonus: 0, price: 99.99,  priceFormat: 'USD 99.99',  label: 'حزمة عملاقة', iconBg: '/yalla-ui/full/diamonds5.webp', badge: 'none',    order: 5, enabled: true, royalPoints: 1000, xpReward: 5370 },
  { id: 'dia_6', type: 'diamond', amount: 161700,  displayAmount: '161.7K',  bonus: 0, price: 299.99, priceFormat: 'USD 299.99', label: 'حزمة خرافية', iconBg: '/yalla-ui/full/diamonds6.webp', badge: 'best',    order: 6, enabled: true, royalPoints: 3000, xpReward: 16170 },
];

// ─── 6 حزم الذهب (نفس الأسعار، أرقام مختلفة) ───
const goldPackages: ChargePackage[] = [
  { id: 'gold_1', type: 'gold', amount: 35000,    displayAmount: '35K',     bonus: 0, price: 0.99,   priceFormat: 'USD 0.99',   label: 'ذهب صغير',     iconBg: '/yalla-ui/full/coin1.webp', badge: 'hot',     order: 1, enabled: true, royalPoints: 10,  xpReward: 35 },
  { id: 'gold_2', type: 'gold', amount: 130000,   displayAmount: '130K',   bonus: 0, price: 3.99,   priceFormat: 'USD 3.99',   label: 'ذهب متوسط',    iconBg: '/yalla-ui/full/coin2.webp', badge: 'none',    order: 2, enabled: true, royalPoints: 30,  xpReward: 130 },
  { id: 'gold_3', type: 'gold', amount: 620000,   displayAmount: '620K',   bonus: 0, price: 9.99,   priceFormat: 'USD 9.99',   label: 'ذهب كبير',     iconBg: '/yalla-ui/full/coin3.webp', badge: 'none',    order: 3, enabled: true, royalPoints: 100, xpReward: 620 },
  { id: 'gold_4', type: 'gold', amount: 2700000,  displayAmount: '2.7M',   bonus: 0, price: 29.99,  priceFormat: 'USD 29.99',  label: 'ذهب ضخم',      iconBg: '/yalla-ui/full/coin4.webp', badge: 'popular', order: 4, enabled: true, royalPoints: 200, xpReward: 2700 },
  { id: 'gold_5', type: 'gold', amount: 7700000,  displayAmount: '7.7M',   bonus: 0, price: 99.99,  priceFormat: 'USD 99.99',  label: 'ذهب عملاق',    iconBg: '/yalla-ui/full/coin5.webp', badge: 'none',    order: 5, enabled: true, royalPoints: 400, xpReward: 7700 },
  { id: 'gold_6', type: 'gold', amount: 17000000, displayAmount: '17M',    bonus: 0, price: 299.99, priceFormat: 'USD 299.99', label: 'ذهب خرافي',    iconBg: '/yalla-ui/full/coin6.webp', badge: 'best',    order: 6, enabled: true, royalPoints: 700, xpReward: 17000 },
];

// ─── 3 اشتراكات VIP ───
const vipPackages: ChargePackage[] = [
  { id: 'vip_faris',  type: 'vip', amount: 1, displayAmount: '7',   bonus: 0, price: 9.99,   priceFormat: 'USD 9.99',   label: 'فارس',  iconBg: '/yalla-ui/full/privilege_detail_knight_ic.webp', badge: 'none',    order: 1, enabled: true, royalPoints: 100,  xpReward: 500,  days: 7 },
  { id: 'vip_liwa',   type: 'vip', amount: 1, displayAmount: '30',  bonus: 0, price: 29.99,  priceFormat: 'USD 29.99',  label: 'لواء',  iconBg: '/yalla-ui/full/privilege_detail_baron_ic.webp',  badge: 'popular', order: 2, enabled: true, royalPoints: 300,  xpReward: 1500, days: 30 },
  { id: 'vip_royal',   type: 'vip', amount: 1, displayAmount: '90',  bonus: 0, price: 99.99,  priceFormat: 'USD 99.99',  label: 'رويال', iconBg: '/yalla-ui/royal/royal_5_throne_ic.webp',          badge: 'best',    order: 3, enabled: true, royalPoints: 1000, xpReward: 5000, days: 90 },
];

// ─── 3 حزم رويال (نقاط رويال مباشرة) ───
const royalPackages: ChargePackage[] = [
  { id: 'royal_pack_1', type: 'royal', amount: 100,  displayAmount: '100',  bonus: 0,  price: 0.99,  priceFormat: 'USD 0.99',  label: '100 نقطة رويال',    iconBg: '/yalla-ui/royal/royal_level_value_ic.webp', badge: 'none',    order: 1, enabled: true, royalPoints: 100,  xpReward: 50 },
  { id: 'royal_pack_2', type: 'royal', amount: 500,  displayAmount: '500',  bonus: 50, price: 4.99,  priceFormat: 'USD 4.99',  label: '500 نقطة رويال',    iconBg: '/yalla-ui/royal/royal_level_value_ic.webp', badge: 'popular', order: 2, enabled: true, royalPoints: 550,  xpReward: 250 },
  { id: 'royal_pack_3', type: 'royal', amount: 2000, displayAmount: '2000', bonus: 300,price: 19.99, priceFormat: 'USD 19.99', label: '2000 نقطة رويال',   iconBg: '/yalla-ui/royal/royal_level_value_ic.webp', badge: 'best',    order: 3, enabled: true, royalPoints: 2300, xpReward: 1000 },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    diamonds: diamondPackages,
    golds: goldPackages,
    vip: vipPackages,
    royal: royalPackages,
    // مكافأة أول شحن — مطابقة لـ item_shop_guild.xml (3×2 grid)
    firstChargeReward: {
      title: 'مكافأة عند المرة الأولى من الشراء',         // @string/G_1420_129
      tip: 'يمكنك أن تحصل على المكافآت بعد الشراء بأي كمية',  // @string/reward_tip
      // 6 عناصر — مطابقة لـ item_shop_guild.xml L33-58
      items: [
        { id: 'fc_gift',        icon: '/yalla-ui/full/recharge_room_gift.webp',        amount: '+1',    order: 1 },  // iv_gift (top-left)
        { id: 'fc_card',        icon: '/yalla-ui/full/charge_reward_profile_card.webp', amount: '+1',    order: 2 },  // iv_profile_card (top-center)
        { id: 'fc_decor',       icon: '/yalla-ui/full/charge_reward_head_decor.webp',   amount: '+1',    order: 3 },  // iv_head_decor (top-right)
        { id: 'fc_frame',       icon: '/yalla-ui/full/charge_reward_head_frame.webp',    amount: '+1',    order: 4 },  // iv_head_frame (bottom-left)
        { id: 'fc_diamonds',    icon: '/yalla-ui/full/diamonds.webp',                    amount: '+150',  order: 5 },  // iv_diamonds (bottom-center)
        { id: 'fc_coin',        icon: '/yalla-ui/full/coin.webp',                        amount: '+15000', order: 6 },  // iv_coin (bottom-right)
      ],
    },
    // الألسنة (Data-driven) — 3 ألسنة فقط (NOT 4)
    tabs: [
      { key: 'gold',     label: 'ذهب',      iconCheck: '/yalla-ui/shop/shop_switch_gold_check.webp',      iconUncheck: '/yalla-ui/shop/shop_switch_gold_uncheck.webp',      bgCheck: '/yalla-ui/shop/shop_switch_left_check.webp',    bgUncheck: '/yalla-ui/shop/shop_switch_middle_uncheck.webp', iconW: 16,   iconH: 17, marginTop: 2, order: 1, visible: true },
      { key: 'diamond',  label: 'ألماس',    iconCheck: '/yalla-ui/shop/shop_switch_diamond_check.webp',  iconUncheck: '/yalla-ui/shop/shop_switch_diamond_uncheck.webp',  bgCheck: '/yalla-ui/shop/shop_switch_middle_uncheck.webp', bgUncheck: '/yalla-ui/shop/shop_switch_middle_uncheck.webp', iconW: 16,   iconH: 19, marginTop: 1, order: 2, visible: true },
      { key: 'vip',      label: 'اشتراكات', iconCheck: '/yalla-ui/shop/shop_switch_privilege_check.webp', iconUncheck: '/yalla-ui/shop/shop_switch_privilege_uncheck.webp', bgCheck: '/yalla-ui/shop/shop_switch_right_uncheck.webp',  bgUncheck: '/yalla-ui/shop/shop_switch_right_uncheck.webp',  iconW: 18.5, iconH: 16, marginTop: 3, order: 3, visible: true },
    ],
  });
}
