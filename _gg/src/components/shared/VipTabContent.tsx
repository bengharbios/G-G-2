'use client';

import { useState } from 'react';

// ════════════════════════════════════════════════════════════════════════════
// VipTabContent — تبويب الاشتراكات (VIP Subscriptions)
// مطابق لـ item_shop_privileges.xml + dialog_vip_sub.xml + item_privileges.xml
// مستويان فقط: الفارس (Knight) و اللواء (Baron)
// ════════════════════════════════════════════════════════════════════════════

interface VipLevel {
  id: 'knight' | 'baron';
  name: string;
  badgeIcon: string;
  smallIcon: string;
  tabBgActive: string;
  tabBgInactive: string;
  price: string;
  dailyGold: string;
  dailyDiamond: string;
  dailyBox: string;
  themeColor: string;
}

interface VipPrivilege {
  id: string;
  icon: string;       // asset path from source
  iconSize: number;    // custom size per icon
  title: string;
  description: string;
}

const VIP_A = {
  knightActive:    '/yalla-ui/full/shop_privileges_left_check.webp',
  knightInactive:  '/yalla-ui/full/shop_privileges_left_normal.webp',
  baronActive:     '/yalla-ui/full/shop_privileges_right_check.webp',
  baronInactive:   '/yalla-ui/full/shop_privileges_right_normal.webp',
  knightIcon:      '/yalla-ui/full/shop_privileges_knight_ic.webp',
  baronIcon:       '/yalla-ui/full/shop_privileges_baron_ic.webp',
  knightBadge:     '/yalla-ui/full/privilege_detail_knight_ic.webp',
  baronBadge:      '/yalla-ui/full/privilege_detail_baron_ic.webp',
  badgeAreaBg:     '/yalla-ui/full/bg_medal_detail_title.webp',
  privilegesPanel: '/yalla-ui/full/shop_privileges_detail_bg.9.png',
  questionIcon:    '/yalla-ui/full/question_icon.webp',
  arrowLeft:       '/yalla-ui/full/medal_detail_arrow.webp',
  dailyItemBg:     '/yalla-ui/full/vip_sub_daily_item_bg.webp',
  goldIcon:        '/yalla-ui/full/signin_item_gold_ic.webp',
  diamondIcon:     '/yalla-ui/full/signin_item_diamond_ic.webp',
  boxIcon:         '/yalla-ui/full/box_mail.webp',
  btnYes:          '/yalla-ui/shop/btn_yes.9.png',
};

// [2] أيقونات الامتيازات من أصول السورس
const VIP_PRIVILEGES: VipPrivilege[] = [
  // Row 1 (right→left in RTL):
  { id: 'p1', icon: '/yalla-ui/full/medal_add.webp',              iconSize: 48, title: 'شارة VIP',          description: 'شارة وعرض حصري' },
  { id: 'p2', icon: '/yalla-ui/full/vip_sub_entrance_ic.webp',     iconSize: 56, title: 'غرفة VIP',          description: 'الحق في إنشاء غرفة VIP' },
  // Row 2:
  { id: 'p3', icon: '/yalla-ui/full/box_mail.webp',                iconSize: 44, title: 'المكافآت اليومية',  description: 'اشترك للحصول على المزايا اليومية' },
  { id: 'p4', icon: '/yalla-ui/full/icon_room_top_follow.webp',    iconSize: 44, title: 'تثبيت في الأعلى',   description: 'عرض الأولوية في قائمة الأصدقاء' },
  // Row 3:
  { id: 'p5', icon: '/yalla-ui/royal/royal_5_throne_ic.webp',       iconSize: 52, title: 'تثبيت في الغرفة',    description: 'تثبيت أعلى قائمة المستخدمين المتصلين في الغرفة' },
  { id: 'p6', icon: '/yalla-ui/full/charge_reward_head_frame.webp', iconSize: 48, title: 'إطار صورة الملف الشخصي', description: 'استخدم إطار الملف الشخصي الحصري لتزيين صورة ملفك الشخصي' },
];

const VIP_LEVELS: VipLevel[] = [
  {
    id: 'knight', name: 'فارس',
    badgeIcon: VIP_A.knightBadge, smallIcon: VIP_A.knightIcon,
    tabBgActive: VIP_A.knightActive, tabBgInactive: VIP_A.knightInactive,
    price: '$11.99', dailyGold: '5727', dailyDiamond: '20', dailyBox: '1',
    themeColor: '#4c849f',
  },
  {
    id: 'baron', name: 'لواء',
    badgeIcon: VIP_A.baronBadge, smallIcon: VIP_A.baronIcon,
    tabBgActive: VIP_A.baronActive, tabBgInactive: VIP_A.baronInactive,
    price: '$39.99', dailyGold: '28000', dailyDiamond: '60', dailyBox: '1',
    themeColor: '#a5838b',
  },
];

interface VipTabContentProps {
  onSubscribe?: (level: VipLevel) => void;
}

export default function VipTabContent({ onSubscribe }: VipTabContentProps) {
  const [activeLevel, setActiveLevel] = useState<'knight' | 'baron'>('knight');
  const currentLevel = VIP_LEVELS.find(l => l.id === activeLevel)!;

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ direction: 'ltr' }}>
      {/* ══════ [4] كبسولة تبديل المستوى + زر "؟" ══════ */}
      <div className="relative flex items-center justify-center" style={{ height: 40, marginTop: 4 }}>
        <button
          className="absolute"
          style={{ left: 8, top: '50%', transform: 'translateY(-50%)', width: 21, height: 20, zIndex: 10 }}
          aria-label="مساعدة"
        >
          <img src={VIP_A.questionIcon} alt="؟" style={{ width: 21, height: 20, objectFit: 'contain' }} />
        </button>

        <div className="flex" style={{ height: 40, width: '80%', maxWidth: 280 }}>
          {/* لسان الفارس (يسار) */}
          <button
            onClick={() => setActiveLevel('knight')}
            className="relative flex-1 flex items-center justify-center"
            style={{ overflow: 'visible' }}
          >
            <img
              src={activeLevel === 'knight' ? VIP_A.knightActive : VIP_A.knightInactive}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'fill', filter: activeLevel === 'knight' ? 'brightness(1.15)' : 'brightness(0.85)' }}
            />
            <div className="relative flex items-center" style={{ gap: 6 }}>
              <img src={VIP_A.knightIcon} alt="" style={{ width: 20, height: 22, objectFit: 'contain' }} />
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: activeLevel === 'knight' ? '#fff' : '#428371',
                textShadow: activeLevel === 'knight' ? '0 1px 2px rgba(0,0,0,.3)' : 'none',
              }}>فارس</span>
            </div>
          </button>
          {/* لسان اللواء (يمين) — [4] واضح بأيقونته ونصه كاملاً */}
          <button
            onClick={() => setActiveLevel('baron')}
            className="relative flex-1 flex items-center justify-center"
            style={{ overflow: 'visible' }}
          >
            <img
              src={activeLevel === 'baron' ? VIP_A.baronActive : VIP_A.baronInactive}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'fill', filter: activeLevel === 'baron' ? 'brightness(1.15)' : 'brightness(0.85)' }}
            />
            <div className="relative flex items-center" style={{ gap: 6 }}>
              <img src={VIP_A.baronIcon} alt="" style={{ width: 22, height: 20, objectFit: 'contain' }} />
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: activeLevel === 'baron' ? '#fff' : '#428371',
                textShadow: activeLevel === 'baron' ? '0 1px 2px rgba(0,0,0,.3)' : 'none',
              }}>لواء</span>
            </div>
          </button>
        </div>
      </div>

      {/* ══════ [3] نص الحالة — RTL صحيح مع كلمة VIP اللاتينية ══════ */}
      <div className="text-center" dir="rtl" style={{ marginTop: 4, marginBottom: 2 }}>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,.4)' }}>
          أنت لست VIP {currentLevel.name} حتى الآن
        </span>
      </div>

      {/* ══════ [5] منطقة الشارة — منصة دائرية + إضاءة مسرح أقوى + شارة أكبر ══════ */}
      <div className="relative flex items-center justify-center" style={{ height: 150 }}>
        {/* خلفية bg_medal_detail_title */}
        <img
          src={VIP_A.badgeAreaBg}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', opacity: 0.6 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* [5] إضاءة مسرح خضراء أقوى (spotlight) */}
        <div
          className="absolute"
          style={{
            width: '70%', height: '90%',
            background: `radial-gradient(ellipse at center, ${currentLevel.themeColor}50 0%, #2bc89530 40%, transparent 70%)`,
            filter: 'blur(6px)',
          }}
        />
        {/* [5] منصة دائرية تحت الشارة */}
        <div
          className="absolute"
          style={{
            bottom: 8,
            width: 110, height: 22,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,.35) 0%, transparent 70%)',
            filter: 'blur(3px)',
          }}
        />
        {/* [4] سهم تنقل يسار */}
        <button
          onClick={() => setActiveLevel('knight')}
          className="absolute"
          style={{ left: 12, top: '50%', transform: 'translateY(-50%) scaleX(-1)', width: 24, height: 24, opacity: activeLevel === 'baron' ? 0.8 : 0.3 }}
        >
          <img src={VIP_A.arrowLeft} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
        </button>
        {/* [4] سهم تنقل يمين */}
        <button
          onClick={() => setActiveLevel('baron')}
          className="absolute"
          style={{ right: 12, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, opacity: activeLevel === 'knight' ? 0.8 : 0.3 }}
        >
          <img src={VIP_A.arrowLeft} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
        </button>
        {/* [5] شارة المستوى الكبيرة — مكبّرة */}
        <img
          src={currentLevel.badgeIcon}
          alt={currentLevel.name}
          className="relative"
          style={{ width: 120, height: 106, objectFit: 'contain', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.5))' }}
        />
      </div>

      {/* ══════ [2] لوحة الامتيازات (قابلة للتمرير) — أيقونات أكبر من السورس ══════ */}
      <div className="relative flex-1 overflow-y-auto" style={{ marginTop: 2 }}>
        {/* كبسولة "امتيازات حصرية" */}
        <div className="flex justify-center" style={{ marginBottom: 4 }}>
          <div
            className="flex items-center justify-center"
            style={{
              background: '#0c3c30',
              borderRadius: 12,
              padding: '3px 16px',
              boxShadow: 'inset 0 1px 0 rgba(0,0,0,.4), inset 0 -1px 0 rgba(255,255,255,.08)',
            }}
          >
            <span style={{ color: '#87eaa9', fontSize: 12, fontWeight: 700 }}>امتيازات حصرية</span>
          </div>
        </div>

        {/* لوحة الامتيازات بخلفية shop_privileges_detail_bg */}
        <div className="relative rounded-t-xl mx-2" style={{ overflow: 'hidden' }}>
          <img
            src={VIP_A.privilegesPanel}
            alt=""
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'cover', opacity: 0.85 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* شبكة عمودين — [2] أيقونات أكبر (≈ ضعف) من أصول السورس */}
          <div className="relative grid grid-cols-2 gap-1 p-2">
            {VIP_PRIVILEGES.map((p) => (
              <div key={p.id} className="flex flex-col items-center text-center p-1">
                {/* [2] أيقونة كبيرة من أصل السورس */}
                <div className="flex items-center justify-center" style={{ height: p.iconSize + 8 }}>
                  <img
                    src={p.icon}
                    alt={p.title}
                    style={{ width: p.iconSize, height: p.iconSize, objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.3))' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                  />
                </div>
                {/* [3] عنوان أبيض — RTL صحيح */}
                <span dir="rtl" style={{ color: '#fff', fontSize: 12, fontWeight: 700, marginTop: 2, lineHeight: 1.2, textAlign: 'center' }}>
                  {p.title}
                </span>
                {/* وصف أوضح — 10sp #27c190 */}
                <span dir="rtl" style={{ color: '#27c190', fontSize: 10, fontWeight: 600, marginTop: 1, lineHeight: 1.3, textAlign: 'center', maxHeight: 28, overflow: 'hidden' }}>
                  {p.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ [6] الشريط السفلي الثابت — زر أنعم + مكافآت أكبر ══════ */}
      <div className="relative flex-shrink-0" style={{ paddingBottom: 8, paddingTop: 4 }}>
        <div className="relative flex items-stretch" style={{ height: 80 }}>
          {/* الجانب الأيمن: زر الاشتراك — [6] تدرج أنعم بلا إطار غائر ثقيل */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              onClick={() => onSubscribe?.(currentLevel)}
              className="relative flex flex-col items-center justify-center"
              style={{ width: 140, height: 50, borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,.25)' }}
            >
              <img
                src={VIP_A.btnYes}
                alt=""
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: 'fill' }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  el.parentElement!.style.background = 'linear-gradient(180deg, #e6c022 0%, #c8a010 50%, #b08800 100%)';
                }}
              />
              <span className="relative" style={{ color: '#fff', fontSize: 17, fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,.4)' }}>
                {currentLevel.price}
              </span>
              <span className="relative" style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>
                يشترك لمدة شهر
              </span>
            </button>
            <a href="#" style={{ color: '#87eaa9', fontSize: 9, marginTop: 4, textDecoration: 'underline' }}>
              إدارة الاشتراكات
            </a>
          </div>

          {/* الجانب الأيسر: المكافآت اليومية — [6] إطارات أنعم محفورة + أيقونات أكبر */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <span dir="rtl" style={{ color: '#fff', fontSize: 10, fontWeight: 700, marginBottom: 4, textShadow: '0 1px 1px rgba(0,0,0,.3)' }}>
              اشترك للحصول على المزايا اليومية
            </span>
            <div className="flex items-center gap-2">
              {/* صندوق ×1 */}
              <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
                <img src={VIP_A.dailyItemBg} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.2))' }} />
                <img src={VIP_A.boxIcon} alt="" className="relative" style={{ width: 28, height: 24, objectFit: 'contain' }} />
                <span className="absolute" style={{ bottom: 1, right: 2, color: '#fff', fontSize: 10, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.5)' }}>
                  ×{currentLevel.dailyBox}
                </span>
              </div>
              {/* ماس */}
              <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
                <img src={VIP_A.dailyItemBg} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.2))' }} />
                <img src={VIP_A.diamondIcon} alt="" className="relative" style={{ width: 26, height: 28, objectFit: 'contain' }} />
                <span className="absolute" style={{ bottom: 1, right: 2, color: '#fff', fontSize: 10, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.5)' }}>
                  {currentLevel.dailyDiamond}
                </span>
              </div>
              {/* ذهب */}
              <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
                <img src={VIP_A.dailyItemBg} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.2))' }} />
                <img src={VIP_A.goldIcon} alt="" className="relative" style={{ width: 26, height: 28, objectFit: 'contain' }} />
                <span className="absolute" style={{ bottom: 1, right: 2, color: '#fff', fontSize: 10, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.5)' }}>
                  {currentLevel.dailyGold}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
