import { NextResponse } from 'next/server';

// ════════════════════════════════════════════════════════════════════════════
// حزم الشحن — مطابقة لتصميم يلا لودو الأصلي
// 6 حزم جواهر + 6 حزم ذهب + 3 اشتراكات VIP
// كل حزمة تشمل: الكمية + المكافأة + السعر + نوع الشارة (HOT/Popular/BEST)
// ════════════════════════════════════════════════════════════════════════════

interface ChargePackage {
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
  royalPoints: number;   // نقاط رويال المكتسبة
  xpReward: number;      // نقاط الخبرة المكتسبة
}

const diamondPackages: ChargePackage[] = [
  { id: 'dia_1', type: 'diamond', amount: 400, bonus: 0, price: 0.99, label: 'حزمة صغيرة', labelEn: 'Small', icon: '💎', iconBg: '/yalla-ui/shop/diamonds_ss.webp', badge: 'hot', royalPoints: 10, xpReward: 40 },
  { id: 'dia_2', type: 'diamond', amount: 1800, bonus: 0, price: 3.99, label: 'حزمة متوسطة', labelEn: 'Medium', icon: '💎', iconBg: '/yalla-ui/shop/diamonds_s.webp', royalPoints: 40, xpReward: 180 },
  { id: 'dia_3', type: 'diamond', amount: 5000, bonus: 0, price: 9.99, label: 'حزمة كبيرة', labelEn: 'Large', icon: '💎', iconBg: '/yalla-ui/shop/diamonds.webp', royalPoints: 100, xpReward: 500 },
  { id: 'dia_4', type: 'diamond', amount: 16000, bonus: 0, price: 29.99, label: 'حزمة شيكل', labelEn: 'X-Large', icon: '💎', iconBg: '/yalla-ui/shop/diamonds.webp', badge: 'popular', royalPoints: 300, xpReward: 1600 },
  { id: 'dia_5', type: 'diamond', amount: 53700, bonus: 0, price: 99.99, label: 'حزمة عملاقة', labelEn: 'Mega', icon: '💎', iconBg: '/yalla-ui/shop/diamonds.webp', royalPoints: 1000, xpReward: 5370 },
  { id: 'dia_6', type: 'diamond', amount: 161700, bonus: 0, price: 299.99, label: 'حزمة خرافية', labelEn: 'Giga', icon: '💎', iconBg: '/yalla-ui/shop/diamonds.webp', badge: 'best', royalPoints: 3000, xpReward: 16170 },
];

const goldPackages: ChargePackage[] = [
  { id: 'gold_1', type: 'gold', amount: 35000, bonus: 0, price: 0.99, label: 'ذهب صغير', labelEn: 'Small Gold', icon: '🪙', iconBg: '/yalla-ui/shop/gold_small.webp', royalPoints: 10, xpReward: 35 },
  { id: 'gold_2', type: 'gold', amount: 130000, bonus: 0, price: 2.99, label: 'ذهب متوسط', labelEn: 'Medium Gold', icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp', royalPoints: 30, xpReward: 130 },
  { id: 'gold_3', type: 'gold', amount: 620000, bonus: 0, price: 9.99, label: 'ذهب كبير', labelEn: 'Large Gold', icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp', badge: 'popular', royalPoints: 100, xpReward: 620 },
  { id: 'gold_4', type: 'gold', amount: 2700000, bonus: 0, price: 19.99, label: 'ذهب ضخم', labelEn: 'Huge Gold', icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp', royalPoints: 200, xpReward: 2700 },
  { id: 'gold_5', type: 'gold', amount: 7700000, bonus: 0, price: 39.99, label: 'ذهب عملاق', labelEn: 'Mega Gold', icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp', royalPoints: 400, xpReward: 7700 },
  { id: 'gold_6', type: 'gold', amount: 17000000, bonus: 0, price: 69.99, label: 'ذهب خرافي', labelEn: 'Giga Gold', icon: '🪙', iconBg: '/yalla-ui/shop/coin_big.webp', badge: 'best', royalPoints: 700, xpReward: 17000 },
];

const vipPackages: ChargePackage[] = [
  { id: 'vip_faris', type: 'vip', amount: 1, bonus: 0, price: 9.99, label: 'فارس', labelEn: 'Knight VIP', icon: '🛡️', iconBg: '/yalla-ui/shop/btn_shop.png', royalPoints: 100, xpReward: 500 },
  { id: 'vip_liwa', type: 'vip', amount: 1, bonus: 0, price: 29.99, label: 'لواء', labelEn: 'Brigadier VIP', icon: '👑', iconBg: '/yalla-ui/shop/btn_shop.png', badge: 'popular', royalPoints: 300, xpReward: 1500 },
  { id: 'vip_royal', type: 'vip', amount: 1, bonus: 0, price: 99.99, label: 'رويال', labelEn: 'Royal VIP', icon: '🏰', iconBg: '/yalla-ui/shop/bg_shop_royal.webp', badge: 'best', royalPoints: 1000, xpReward: 5000 },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    diamonds: diamondPackages,
    golds: goldPackages,
    vip: vipPackages,
    firstChargeReward: {
      gold: 15000,
      diamonds: 150,
      gifts: [
        { icon: '🎁', name: 'هدية', amount: '+1' },
        { icon: '💳', name: 'بطاقة', amount: '+1' },
        { icon: '🎩', name: 'زينة', amount: '+1' },
        { icon: '🖼️', name: 'إطار', amount: '+1' },
        { icon: '💎', name: 'جواهر', amount: '+150' },
        { icon: '🪙', name: 'ذهب', amount: '+15000' },
      ],
      text: 'اشحن أي مبلغ للحصول على المكافآت الإضافية!',
    },
  });
}
