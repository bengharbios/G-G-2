'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ════════════════════════════════════════════════════════════════════════════
// StoreMainPage — صفحة المتجر الرئيسي (fragment_rl_shop.xml)
// شبكة أقسام على رفوف، بأضواء زينة معلقة
// ════════════════════════════════════════════════════════════════════════════

const A = {
  rlShopBg:        '/yalla-ui/full/rl_shop_bg_new.9.png',
  rlShopItemBg:    '/yalla-ui/full/rl_shop_item_bg.webp',
  rlShopDivider:   '/yalla-ui/full/rl_shop_item_divider.9.png',
  skinClose:       '/yalla-ui/full/skin_close.webp',
  diamonds:        '/yalla-ui/full/diamonds.webp',
  coin:            '/yalla-ui/full/coin.webp',
  jia:             '/yalla-ui/full/jia.webp',
  bgShopTopBanner: '/yalla-ui/full/bg_shop_top_banner.webp',
  // Section icons (from RLShopFragment.smali)
  rlShopSkin:        '/yalla-ui/full/rl_shop_skin.webp',
  rlShopDomino:      '/yalla-ui/full/rl_shop_domino.webp',
  rlShopJackaroo:    '/yalla-ui/full/rl_shop_jackaroo.webp',
  rlShopCard:        '/yalla-ui/full/rl_shop_card.webp',
  rlShopId:          '/yalla-ui/full/rl_shop_id.webp',
  rlShopTheme:       '/yalla-ui/full/rl_shop_theme.webp',
  rlShopPinOnTop:    '/yalla-ui/full/rl_shop_pin_on_top.webp',
  rlShopCar:         '/yalla-ui/full/rl_shop_car.webp',
  rlShopEnterEffect: '/yalla-ui/full/rl_shop_enter_effect.webp',
  iconDecorShop:     '/yalla-ui/full/icon_decor_shop.webp',
  reddot:            '/yalla-ui/full/reddot.webp',
};

interface StoreCategory {
  id: string;
  nameAr: string;
  icon: string;
  layoutType: string;
  sortOrder: number;
  redDotCondition: string;
}

interface StoreMainPageProps {
  open: boolean;
  onClose: () => void;
  gems: number | null;
  gold: number | null;
  onCategoryClick?: (category: StoreCategory) => void;
  onChargeClick?: () => void;
}

export default function StoreMainPage({ open, onClose, gems, gold, onCategoryClick, onChargeClick }: StoreMainPageProps) {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    fetch('/api/store/categories')
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.categories); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  // Group categories into rows of 3
  const rows: StoreCategory[][] = [];
  for (let i = 0; i < categories.length; i += 3) {
    rows.push(categories.slice(i, i + 3));
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #3DB57A 0%, #2A8A5C 100%)',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          direction: 'ltr',
        }}
      >
        {/* ══════ خلفية rl_shop_bg_new ══════ */}
        <img
          src={A.rlShopBg}
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ objectFit: 'fill', opacity: 0.7 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.15) 100%)' }}
        />

        {/* ══════ أضواء الزينة المعلقة (star_light.svga — بديل CSS موثّق) ══════ */}
        <div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{
            height: 50,
            background: 'linear-gradient(180deg, rgba(255,255,200,.15) 0%, transparent 100%)',
            filter: 'blur(8px)',
          }}
        >
          {/* Sparkle dots — بديل CSS لـ star_light.svga */}
          {[20, 35, 50, 65, 80].map((pct, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${pct}%`,
                top: `${10 + (i % 3) * 12}px`,
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'rgba(255,255,200,.6)',
                animation: `twinkle ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
          <style>{`
            @keyframes twinkle {
              0%, 100% { opacity: 0.3; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
            }
          `}</style>
        </div>

        {/* ══════ الشريط العلوي: X يسار + كبسولات الماس/الذهب ══════ */}
        <div className="relative z-20 flex items-center px-3 pt-2 pb-1" style={{ direction: 'ltr' }}>
          <button
            onClick={onClose}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32 }}
            aria-label="إغلاق"
          >
            <img src={A.skinClose} alt="إغلاق" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          </button>
          <div className="flex-1 flex items-center justify-center gap-3">
            {/* Diamond pill */}
            <div className="relative flex items-center" style={{ marginRight: 4 }}>
              <div className="flex items-center justify-center" style={{
                width: 100, height: 26, background: '#0c3c30', borderRadius: 13,
                paddingRight: 36, paddingLeft: 8,
                boxShadow: 'inset 0 1.5px 0 rgba(0,0,0,.5), inset 0 -1px 0 rgba(255,255,255,.1)',
              }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
                  {gems ?? '0'}
                </span>
              </div>
              <img src={A.diamonds} alt="" className="absolute" style={{
                right: -4, top: '50%', transform: 'translateY(-50%)',
                width: 32, height: 32, objectFit: 'contain',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.4))', zIndex: 10,
              }} />
            </div>
            {/* Gold pill */}
            <div className="relative flex items-center">
              <div className="flex items-center justify-center" style={{
                width: 100, height: 26, background: '#0c3c30', borderRadius: 13,
                paddingRight: 36, paddingLeft: 8,
                boxShadow: 'inset 0 1.5px 0 rgba(0,0,0,.5), inset 0 -1px 0 rgba(255,255,255,.1)',
              }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 800, textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
                  {gold ?? '0'}
                </span>
              </div>
              <img src={A.coin} alt="" className="absolute" style={{
                right: -4, top: '50%', transform: 'translateY(-50%)',
                width: 32, height: 32, objectFit: 'contain',
                filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.4))', zIndex: 10,
              }} />
            </div>
          </div>
          {/* "+" charge button */}
          <button
            onClick={() => onChargeClick?.()}
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, opacity: 0.8 }}
            aria-label="شحن"
          >
            <img src={A.jia} alt="+" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          </button>
        </div>

        {/* ══════ شبكة الأقسام على رفوف ══════ */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative flex-1 overflow-y-auto"
          style={{ marginTop: 4 }}
        >
          {loading && (
            <div className="flex justify-center items-center h-full">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {rows.map((row, rowIdx) => (
            <div key={rowIdx}>
              {/* Row of section items */}
              <div className="flex justify-center gap-1 px-2 py-2">
                {row.map((cat) => (
                  <StoreSectionItem
                    key={cat.id}
                    category={cat}
                    onClick={() => onCategoryClick?.(cat)}
                  />
                ))}
                {/* Fill empty slots with invisible placeholders */}
                {Array.from({ length: 3 - row.length }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ width: 120, height: 0 }} />
                ))}
              </div>
              {/* Shelf divider after each row */}
              <StoreShelfDivider />
            </div>
          ))}

          {/* Spacer at bottom */}
          <div style={{ height: 60 }} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// StoreSectionItem — عنصر قسم على شبكة المتجر (rl_shop_item.xml)
// - منصة دائرية (rl_shop_item_bg.webp, 103×102dip)
// - أيقونة القسم فوق المنصة (120×90dip)
// - اسم القسم أسفل المنصة (80×21dip, auto-size 8-11sp)
// - نقطة حمراء (reddot.webp, 10×10dip)
// - نجوم لامعة (star_rl_shop.svga — بديل CSS موثّق)
// ════════════════════════════════════════════════════════════════════════════
function StoreSectionItem({ category, onClick }: { category: StoreCategory; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
      style={{ width: 120, height: 130, marginTop: -18 }}
    >
      {/* Star animation (star_rl_shop.svga — بديل CSS موثّق) */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 120, height: 80, top: 0,
          background: 'radial-gradient(ellipse at center, rgba(255,255,200,.15) 0%, transparent 70%)',
          filter: 'blur(4px)',
        }}
      />

      {/* Platform (rl_shop_item_bg.webp) */}
      <img
        src={A.rlShopItemBg}
        alt=""
        className="absolute"
        style={{
          width: 103, height: 102,
          top: 0, left: '50%', transform: 'translateX(-50%)',
          objectFit: 'contain',
        }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* Section icon */}
      <img
        src={category.icon}
        alt={category.nameAr}
        className="absolute"
        style={{
          width: 80, height: 60,
          top: 15, left: '50%', transform: 'translateX(-50%)',
          objectFit: 'contain',
          filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.3))',
        }}
        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
      />

      {/* Red dot */}
      <img
        src={A.reddot}
        alt=""
        className="absolute"
        style={{
          width: 10, height: 10,
          right: 25, bottom: 35,
          display: category.redDotCondition ? 'block' : 'none',
        }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* Section name */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          width: 90, height: 21,
          bottom: 5, left: '50%', transform: 'translateX(-50%)',
        }}
      >
        <span style={{
          color: '#fff', fontSize: 10, fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,.5)',
          textAlign: 'center', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: 80,
        }}>
          {category.nameAr}
        </span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// StoreShelfDivider — الرف بين صفوف الأقسام (rl_shop_item_divider.xml)
// rl_shop_item_divider.9.png (full width × 89dip, 9-patch)
// ════════════════════════════════════════════════════════════════════════════
function StoreShelfDivider() {
  return (
    <div className="relative w-full" style={{ height: 30, marginTop: -10, marginBottom: -5 }}>
      <img
        src={A.rlShopDivider}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'fill', opacity: 0.9 }}
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          el.style.display = 'none';
          el.parentElement!.style.background = 'linear-gradient(180deg, rgba(62,206,170,.4) 0%, rgba(45,168,135,.6) 50%, rgba(31,122,95,.8) 100%)';
          el.parentElement!.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,.3)';
        }}
      />
    </div>
  );
}
