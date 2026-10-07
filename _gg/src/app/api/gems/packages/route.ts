import { NextResponse } from 'next/server';

// ─── Gem Packages Configuration ────────────────────────────────────────

const gemPackages = [
  {
    id: 'small',
    gems: 100,
    bonus: 0,
    price: 0.99,
    label: 'حزمة صغيرة',
    labelEn: 'Small Pack',
    icon: '💎',
    color: 'from-slate-600 to-slate-700',
  },
  {
    id: 'medium',
    gems: 500,
    bonus: 50,
    price: 3.99,
    label: 'حزمة متوسطة',
    labelEn: 'Medium Pack',
    icon: '💎',
    color: 'from-amber-700 to-amber-800',
  },
  {
    id: 'large',
    gems: 2000,
    bonus: 300,
    price: 9.99,
    label: 'حزمة كبيرة',
    labelEn: 'Large Pack',
    icon: '💎',
    color: 'from-amber-600 to-orange-600',
  },
  {
    id: 'mega',
    gems: 5000,
    bonus: 1000,
    price: 19.99,
    label: 'حزمة ميغا',
    labelEn: 'Mega Pack',
    icon: '💎',
    color: 'from-amber-500 to-yellow-500',
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    packages: gemPackages,
  });
}
