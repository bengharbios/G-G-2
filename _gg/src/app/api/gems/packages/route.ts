import { NextResponse } from 'next/server';

// ════════════════════════════════════════════════════════════════════════════
// حزم الشحن — مطابقة لتصميم يلا لودو الأصلي 100%
// Tabs: ذهب + جواهر + VIP + رويال
// كل حزمة تشمل: الكمية + المكافأة + السعر الأصلي + السعر بعد الخصم + شارة
// ════════════════════════════════════════════════════════════════════════════

interface ChargePackage {
  id: string;
  type: 'diamond' | 'gold' | 'vip' | 'royal';
  amount: number;
  bonus: number;
  price: number;
  originalPrice?: number;          // السعر قبل الخصم
  discountPercent?: number;         // نسبة الخصم (0..100)
  label: string;
  labelEn: string;
  icon: string;
  iconBg: string;
  badge?: 'hot' | 'popular' | 'best' | 'new' | 'limited';
  royalPoints: number;             // نقاط رويال المكتسبة
  xpReward: number;                // نقاط الخبرة المكتسبة
  days?: number;                   // للـ VIP — عدد الأيام
  validityDays?: number;           // صلاحية الحزمة (للعرض)
}

// ─── 6 حزم جواهر ─── (مطابقة لـ item_diamonds.xml)
const diamondPackages: ChargePackage[] = [
  { id: 'dia_1', type: 'diamond', amount: 400,    bonus: 0,    price: 0.99,   originalPrice: 1.29,  discountPercent: 23, label: 'حزمة صغيرة',   labelEn: 'Small',    icon: '💎', iconBg: '/yalla-ui/shop/diamonds_ss.webp',                          badge: 'hot',      royalPoints: 10,   xpReward: 40,    validityDays: 30 },
  { id: 'dia_2', type: 'diamond', amount: 1800,   bonus: 100,  price: 3.99,   originalPrice: 4.99,  discountPercent: 20, label: 'حزمة متوسطة', labelEn: 'Medium',  icon: '💎', iconBg: '/yalla-ui/shop/diamonds_s.webp',                            royalPoints: 40,   xpReward: 180,   validityDays: 30 },
  { id: 'dia_3', type: 'diamond', amount: 5000,   bonus: 400,  price: 9.99,   originalPrice: 12.99, discountPercent: 23, label: 'حزمة كبيرة',   labelEn: 'Large',   icon: '💎', iconBg: '/yalla-ui/shop/diamonds.webp',                              royalPoints: 100,  xpReward: 500,   validityDays: 30 },
  { id: 'dia_4', type: 'diamond', amount: 16000,  bonus: 1500, price: 29.99,  originalPrice: 39.99, discountPercent: 25, label: 'حزمة شيكل',    labelEn: 'X-Large', icon: '💎', iconBg: '/yalla-ui/shop/diamonds.webp',                              badge: 'popular',  royalPoints: 300,  xpReward: 1600,  validityDays: 30 },
  { id: 'dia_5', type: 'diamond', amount: 53700,  bonus: 6700, price: 99.99,  originalPrice: 129.99,discountPercent: 23, label: 'حزمة عملاقة', labelEn: 'Mega',    icon: '💎', iconBg: '/yalla-ui/shop/diamonds.webp',                              royalPoints: 1000, xpReward: 5370,  validityDays: 30 },
  { id: 'dia_6', type: 'diamond', amount: 161700, bonus: 22000,price: 299.99, originalPrice: 399.99,discountPercent: 25, label: 'حزمة خرافية', labelEn: 'Giga',    icon: '💎', iconBg: '/yalla-ui/shop/diamonds.webp',                              badge: 'best',     royalPoints: 3000, xpReward: 16170, validityDays: 30 },
];

// ─── 6 حزم ذهب ─── (مطابقة لـ view_shop_golds.xml + item_diamonds.xml معبدلاً diamonds→coins)
const goldPackages: ChargePackage[] = [
  { id: 'gold_1', type: 'gold', amount: 35000,    bonus: 0,     price: 0.99,  originalPrice: 1.29,  discountPercent: 23, label: 'ذهب صغير',    labelEn: 'Small Gold',  icon: '🪙', iconBg: '/yalla-ui/shop/gold_small.webp', badge: 'hot',      royalPoints: 10,  xpReward: 35,    validityDays: 30 },
  { id: 'gold_2', type: 'gold', amount: 130000,   bonus: 7000,  price: 2.99,  originalPrice: 3.99,  discountPercent: 25, label: 'ذهب متوسط',   labelEn: 'Medium Gold', icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp',   royalPoints: 30,  xpReward: 130,   validityDays: 30 },
  { id: 'gold_3', type: 'gold', amount: 620000,   bonus: 40000, price: 9.99,  originalPrice: 12.99, discountPercent: 23, label: 'ذهب كبير',    labelEn: 'Large Gold',  icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp',   badge: 'popular', royalPoints: 100, xpReward: 620,   validityDays: 30 },
  { id: 'gold_4', type: 'gold', amount: 2700000,  bonus: 200000,price: 19.99, originalPrice: 24.99, discountPercent: 20, label: 'ذهب ضخم',     labelEn: 'Huge Gold',    icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp',   royalPoints: 200, xpReward: 2700,  validityDays: 30 },
  { id: 'gold_5', type: 'gold', amount: 7700000,  bonus: 700000,price: 39.99, originalPrice: 49.99, discountPercent: 20, label: 'ذهب عملاق',   labelEn: 'Mega Gold',    icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp',   royalPoints: 400, xpReward: 7700,  validityDays: 30 },
  { id: 'gold_6', type: 'gold', amount: 17000000, bonus: 2000000,price: 69.99,originalPrice: 89.99, discountPercent: 22, label: 'ذهب خرافي',   labelEn: 'Giga Gold',    icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp',   badge: 'best',    royalPoints: 700, xpReward: 17000, validityDays: 30 },
];

// ─── 3 اشتراكات VIP ─── (مطابقة لـ item_vip_buy.xml)
const vipPackages: ChargePackage[] = [
  { id: 'vip_faris',  type: 'vip', amount: 1, bonus: 0, price: 9.99,  originalPrice: 14.99,  discountPercent: 33, label: 'فارس',  labelEn: 'Knight VIP', icon: '🛡️', iconBg: '/yalla-ui/shop/btn_shop.png',         royalPoints: 100,  xpReward: 500,  days: 7,   validityDays: 7  },
  { id: 'vip_liwa',   type: 'vip', amount: 1, bonus: 0, price: 29.99, originalPrice: 44.99,  discountPercent: 33, label: 'لواء',  labelEn: 'Brigadier VIP', icon: '👑', iconBg: '/yalla-ui/shop/btn_shop.png',         badge: 'popular', royalPoints: 300,  xpReward: 1500, days: 30,  validityDays: 30 },
  { id: 'vip_royal',   type: 'vip', amount: 1, bonus: 0, price: 99.99, originalPrice: 149.99, discountPercent: 33, label: 'رويال', labelEn: 'Royal VIP', icon: '🏰', iconBg: '/yalla-ui/shop/bg_shop_royal.webp', badge: 'best',     royalPoints: 1000, xpReward: 5000, days: 90,  validityDays: 90 },
];

// ─── 3 حزم رويال ترقية ─── (مطابقة لـ dialog_royal_upgrade.xml)
const royalPackages: ChargePackage[] = [
  { id: 'royal_pack_1', type: 'royal', amount: 100,   bonus: 0,  price: 0.99,  originalPrice: 1.49,  discountPercent: 34, label: '100 نقطة رويال',    labelEn: '100 Royal Points', icon: '👑', iconBg: '/yalla-ui/shop/bg_shop_royal.webp', royalPoints: 100,   xpReward: 50,    validityDays: 30 },
  { id: 'royal_pack_2', type: 'royal', amount: 500,   bonus: 50, price: 4.99,  originalPrice: 6.99,  discountPercent: 29, label: '500 نقطة رويال',    labelEn: '500 Royal Points', icon: '👑', iconBg: '/yalla-ui/shop/bg_shop_royal.webp', badge: 'popular', royalPoints: 550,  xpReward: 250,   validityDays: 30 },
  { id: 'royal_pack_3', type: 'royal', amount: 2000,  bonus: 300,price: 19.99, originalPrice: 26.99, discountPercent: 26, label: '2000 نقطة رويال',   labelEn: '2000 Royal Points',icon: '👑', iconBg: '/yalla-ui/shop/bg_shop_royal.webp', badge: 'best',    royalPoints: 2300, xpReward: 1000,  validityDays: 30 },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    diamonds: diamondPackages,
    golds: goldPackages,
    vip: vipPackages,
    royal: royalPackages,
    firstChargeReward: {
      gold: 15000,
      diamonds: 150,
      gifts: [
        { icon: '🎁', name: 'هدية',  amount: '+1' },
        { icon: '💳', name: 'بطاقة', amount: '+1' },
        { icon: '🎩', name: 'زينة',  amount: '+1' },
        { icon: '🖼️', name: 'إطار',  amount: '+1' },
        { icon: '💎', name: 'جواهر', amount: '+150' },
        { icon: '🪙', name: 'ذهب',   amount: '+15000' },
      ],
      text: 'اشحن أي مبلغ للحصول على المكافآت الإضافية!',
    },
  });
}
