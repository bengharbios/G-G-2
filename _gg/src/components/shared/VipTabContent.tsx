'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
  icon: string;
  title: string;
  description: string;
}

const VIP_A = {
  // Tab backgrounds
  knightActive:    '/yalla-ui/full/shop_privileges_left_check.webp',
  knightInactive:  '/yalla-ui/full/shop_privileges_left_normal.webp',
  baronActive:     '/yalla-ui/full/shop_privileges_right_check.webp',
  baronInactive:   '/yalla-ui/full/shop_privileges_right_normal.webp',
  // Small tab icons
  knightIcon:      '/yalla-ui/full/shop_privileges_knight_ic.webp',
  baronIcon:       '/yalla-ui/full/shop_privileges_baron_ic.webp',
  // Large badges
  knightBadge:     '/yalla-ui/full/privilege_detail_knight_ic.webp',
  baronBadge:      '/yalla-ui/full/privilege_detail_baron_ic.webp',
  // Backgrounds
  badgeAreaBg:     '/yalla-ui/full/bg_medal_detail_title.webp',
  privilegesPanel: '/yalla-ui/full/shop_privileges_detail_bg.9.png',
  bottomInfoBg:    '/yalla-ui/full/shop_privileges_bottom_info_bg.9.png',
  bottomLabel:     '/yalla-ui/full/shop_privileges_label_bottom_ic.webp',
  // ? button
  questionIcon:    '/yalla-ui/full/question_icon.webp',
  // Navigation arrows
  arrowLeft:       '/yalla-ui/full/medal_detail_arrow.webp',
  // Daily rewards
  dailyItemBg:     '/yalla-ui/full/vip_sub_daily_item_bg.webp',
  goldIcon:        '/yalla-ui/full/signin_item_gold_ic.webp',
  diamondIcon:     '/yalla-ui/full/signin_item_diamond_ic.webp',
  boxIcon:         '/yalla-ui/full/box_mail.webp',
  // Rhombus bullet
  rhombus:         '/yalla-ui/full/vip_sub_rhombus_ic.webp',
  // Subscribe button
  btnYes:          '/yalla-ui/shop/btn_yes.9.png',
};

const VIP_LEVELS: VipLevel[] = [
  {
    id: 'knight',
    name: 'فارس',
    badgeIcon: VIP_A.knightBadge,
    smallIcon: VIP_A.knightIcon,
    tabBgActive: VIP_A.knightActive,
    tabBgInactive: VIP_A.knightInactive,
    price: '$11.99',
    dailyGold: '5727',
    dailyDiamond: '20',
    dailyBox: '1',
    themeColor: '#4c849f',
  },
  {
    id: 'baron',
    name: 'لواء',
    badgeIcon: VIP_A.baronBadge,
    smallIcon: VIP_A.baronIcon,
    tabBgActive: VIP_A.baronActive,
    tabBgInactive: VIP_A.baronInactive,
    price: '$39.99',
    dailyGold: '28000',
    dailyDiamond: '60',
    dailyBox: '1',
    themeColor: '#a5838b',
  },
];

const PRIVILEGES: VipPrivilege[] = [
  { id: 'p1', icon: '🛡️', title: 'شارة VIP',          description: 'شارة وعرض حصري' },
  { id: 'p2', icon: '🏰', title: 'غرفة VIP',          description: 'الحق في إنشاء غرفة VIP' },
  { id: 'p3', icon: '🎁', title: 'المكافآت اليومية',  description: 'اشترك للحصول على المزايا اليومية' },
  { id: 'p4', icon: '📌', title: 'تثبيت في الأعلى',   description: 'عرض الأولوية في قائمة الأصدقاء' },
  { id: 'p5', icon: '⬆️', title: 'تثبيت في الغرفة',    description: 'تثبيت أعلى قائمة المستخدمين المتصلين في الغرفة' },
  { id: 'p6', icon: '🖼️', title: 'إطار الملف الشخصي', description: 'استخدم إطار الملف الشخصي الحصري لتزيين صورة ملفك الشخصي' },
];

interface VipTabContentProps {
  onSubscribe?: (level: VipLevel) => void;
}

export default function VipTabContent({ onSubscribe }: VipTabContentProps) {
  const [activeLevel, setActiveLevel] = useState<'knight' | 'baron'>('knight');
  const currentLevel = VIP_LEVELS.find(l => l.id === activeLevel)!;

  return (
    <div className="flex flex-col flex-1 overflow-hidden" style={{ direction: 'ltr' }}>
      {/* ══════ [2] كبسولة تبديل المستوى + زر "؟" ══════ */}
      <div className="relative flex items-center justify-center" style={{ height: 40, marginTop: 4 }}>
        {/* زر "؟" على الجهة اليسرى */}
        <button
          className="absolute"
          style={{ left: 8, top: '50%', transform: 'translateY(-50%)', width: 21, height: 20, zIndex: 10 }}
          aria-label="مساعدة"
        >
          <img src={VIP_A.questionIcon} alt="؟" style={{ width: 21, height: 20, objectFit: 'contain' }} />
        </button>

        {/* كبسولة بنصفين */}
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
              style={{ objectFit: 'fill' }}
            />
            <div className="relative flex items-center gap-1.5">
              <img src={VIP_A.knightIcon} alt="" style={{ width: 18, height: 20, objectFit: 'contain' }} />
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: activeLevel === 'knight' ? '#fff' : '#428371',
                textShadow: activeLevel === 'knight' ? '0 1px 2px rgba(0,0,0,.3)' : 'none',
              }}>فارس</span>
            </div>
          </button>
          {/* لسان اللواء (يمين) */}
          <button
            onClick={() => setActiveLevel('baron')}
            className="relative flex-1 flex items-center justify-center"
            style={{ overflow: 'visible' }}
          >
            <img
              src={activeLevel === 'baron' ? VIP_A.baronActive : VIP_A.baronInactive}
              alt=""
              className="absolute inset-0 w-full h-full"
              style={{ objectFit: 'fill' }}
            />
            <div className="relative flex items-center gap-1.5">
              <img src={VIP_A.baronIcon} alt="" style={{ width: 20, height: 18, objectFit: 'contain' }} />
              <span style={{
                fontSize: 14, fontWeight: 700,
                color: activeLevel === 'baron' ? '#fff' : '#428371',
                textShadow: activeLevel === 'baron' ? '0 1px 2px rgba(0,0,0,.3)' : 'none',
              }}>لواء</span>
            </div>
          </button>
        </div>
      </div>

      {/* ══════ [3] نص الحالة ══════ */}
      <div className="text-center" style={{ marginTop: 4, marginBottom: 2 }}>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,.4)' }}>
          أنت لست VIP {currentLevel.name} حتى الآن
        </span>
      </div>

      {/* ══════ [4] منطقة الشارة ══════ */}
      <div className="relative flex items-center justify-center" style={{ height: 130 }}>
        {/* خلفية bg_medal_detail_title */}
        <img
          src={VIP_A.badgeAreaBg}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', opacity: 0.6 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* إضاءة مسرح خضراء (spotlight) */}
        <div
          className="absolute"
          style={{
            width: '60%', height: '80%',
            background: `radial-gradient(ellipse at center, ${currentLevel.themeColor}30 0%, transparent 70%)`,
            filter: 'blur(8px)',
          }}
        />
        {/* سهم تنقل يسار */}
        <img
          src={VIP_A.arrowLeft}
          alt=""
          className="absolute"
          style={{ left: 8, top: '50%', transform: 'translateY(-50%) scaleX(-1)', width: 20, height: 20, objectFit: 'contain', opacity: 0.6 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* سهم تنقل يمين */}
        <img
          src={VIP_A.arrowLeft}
          alt=""
          className="absolute"
          style={{ right: 8, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, objectFit: 'contain', opacity: 0.6 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* شارة المستوى الكبيرة */}
        <img
          src={currentLevel.badgeIcon}
          alt={currentLevel.name}
          className="relative"
          style={{ width: 100, height: 88, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.4))' }}
        />
      </div>

      {/* ══════ [5] لوحة الامتيازات (قابلة للتمرير) ══════ */}
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
          {/* شبكة عمودين */}
          <div className="relative grid grid-cols-2 gap-1 p-2">
            {PRIVILEGES.map((p) => (
              <div key={p.id} className="flex flex-col items-center text-center p-1">
                <div
                  className="flex items-center justify-center"
                  style={{ width: 44, height: 44, fontSize: 22 }}
                >
                  {p.icon}
                </div>
                <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, marginTop: 2, lineHeight: 1.2 }}>
                  {p.title}
                </span>
                <span style={{ color: '#27c190', fontSize: 9, fontWeight: 600, marginTop: 1, lineHeight: 1.3, maxHeight: 24, overflow: 'hidden' }}>
                  {p.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════ [6] الشريط السفلي الثابت ══════ */}
      <div className="relative flex-shrink-0" style={{ paddingBottom: 8, paddingTop: 4 }}>
        {/* خلفية shop_privileges_bottom_info_bg */}
        <div className="relative flex items-stretch" style={{ height: 75 }}>
          {/* الجانب الأيمن: زر الاشتراك */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              onClick={() => onSubscribe?.(currentLevel)}
              className="relative flex flex-col items-center justify-center"
              style={{ width: 130, height: 48, overflow: 'hidden' }}
            >
              <img
                src={VIP_A.btnYes}
                alt=""
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: 'fill' }}
                onError={(e) => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  el.parentElement!.style.background = 'linear-gradient(180deg, #dab00b 0%, #b08800 100%)';
                  el.parentElement!.style.borderRadius = 8;
                }}
              />
              <span className="relative" style={{ color: '#fff', fontSize: 16, fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,.4)' }}>
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

          {/* الجانب الأيسر: المكافآت اليومية */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
              اشترك للحصول على المزايا اليومية
            </span>
            <div className="flex items-center gap-2">
              {/* صندوق ×1 */}
              <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
                <img src={VIP_A.dailyItemBg} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain' }} />
                <img src={VIP_A.boxIcon} alt="" className="relative" style={{ width: 24, height: 20, objectFit: 'contain' }} />
                <span className="absolute" style={{ bottom: 1, right: 2, color: '#fff', fontSize: 9, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.5)' }}>
                  ×{currentLevel.dailyBox}
                </span>
              </div>
              {/* ماس */}
              <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
                <img src={VIP_A.dailyItemBg} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain' }} />
                <img src={VIP_A.diamondIcon} alt="" className="relative" style={{ width: 22, height: 24, objectFit: 'contain' }} />
                <span className="absolute" style={{ bottom: 1, right: 2, color: '#fff', fontSize: 9, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.5)' }}>
                  {currentLevel.dailyDiamond}
                </span>
              </div>
              {/* ذهب */}
              <div className="relative flex items-center justify-center" style={{ width: 40, height: 40 }}>
                <img src={VIP_A.dailyItemBg} alt="" className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain' }} />
                <img src={VIP_A.goldIcon} alt="" className="relative" style={{ width: 22, height: 24, objectFit: 'contain' }} />
                <span className="absolute" style={{ bottom: 1, right: 2, color: '#fff', fontSize: 9, fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,.5)' }}>
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
