'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import SvgaOrImg from './SvgaOrImg';

// ════════════════════════════════════════════════════════════════════════════
// StoreSubPage — صفحة فرعية للمتجر (عناصر قسم معين)
// مطابق لـ fragment_skin / fragment_domino_skin / fragment_floating_decor
// بنية: شريط علوي + عنوان + فلاتر + شبكة عناصر على رفوف
// ════════════════════════════════════════════════════════════════════════════

const A = {
  skinClose:    '/yalla-ui/full/skin_close.webp',
  skinBg:       '/yalla-ui/full/skin_bg.9.png',
  skinDivider:  '/yalla-ui/full/skin_divider.9.png',
  shelves:      '/yalla-ui/full/shelves.webp',
  skinCheck:    '/yalla-ui/full/skin_check.webp',
  lock:         '/yalla-ui/full/lock.webp',
  skinLimitTime:'/yalla-ui/full/skin_limit_time.webp',
  diamonds:     '/yalla-ui/full/diamonds.webp',
  coin:         '/yalla-ui/full/coin.webp',
  jia:          '/yalla-ui/full/jia.webp',
  cutPrice:     '/yalla-ui/full/cut_price.webp',
  bnYes:        '/yalla-ui/shop/btn_yes.9.png',
  shopItemBg:   '/yalla-ui/full/shop_item_bg.webp',
  bgSelectLight:'/yalla-ui/full/bg_decor_select_light.9.png',
};

interface StoreItem {
  id: string;
  nameAr: string;
  imageUrl: string;
  animatedUrl?: string;
  rarity: string;
  price: number;
  isFree: boolean;
  sortOrder: number;
  isNew: boolean;
  discountPercent: number;
  source: string;
  kind: string;
  owned: boolean;
}

interface StoreCategory {
  id: string;
  nameAr: string;
  icon: string;
  layoutType: string;
  sortOrder: number;
  redDotCondition: string;
}

interface StoreSubPageProps {
  open: boolean;
  onClose: () => void;
  category: StoreCategory | null;
  gems: number | null;
  gold: number | null;
  onChargeClick?: () => void;
  onPurchase?: (item: StoreItem) => void;
}

// Filter tags from source (fragment_skin.xml sv_filter — dynamic from server)
const DEFAULT_FILTERS = [
  { key: 'all', label: 'الكل' },
  { key: 'owned', label: 'المملوك' },
  { key: 'rare', label: 'النادر' },
  { key: 'epic', label: 'الفاخر' },
];

export default function StoreSubPage({ open, onClose, category, gems, gold, onChargeClick, onPurchase }: StoreSubPageProps) {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

  useEffect(() => {
    if (!open || !category) return;
    let cancelled = false;
    Promise.resolve().then(() => { setLoading(true); setSelectedItem(null); });
    fetch(`/api/store/items?categoryId=${category.id}`)
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.success) {
          setItems(d.items);
          setOwnedIds(d.owned || []);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, category]);

  if (!open || !category) return null;

  // Filter items based on activeFilter
  const filteredItems = items.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'owned') return ownedIds.includes(item.id);
    if (activeFilter === 'rare') return item.rarity === 'rare';
    if (activeFilter === 'epic') return item.rarity === 'epic' || item.rarity === 'legendary';
    return true;
  });

  // Group into rows of 2 (matching source: 2-column grid for skins/themes)
  const rows: StoreItem[][] = [];
  for (let i = 0; i < filteredItems.length; i += 2) {
    rows.push(filteredItems.slice(i, i + 2));
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 24 }}
        className="fixed inset-0 z-[110] flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #2A8A5C 0%, #1a5a3d 100%)',
          direction: 'ltr',
        }}
      >
        {/* skin_bg.9.png overlay */}
        <img
          src={A.skinBg}
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ objectFit: 'fill', opacity: 0.6 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />

        {/* ══════ الشريط العلوي ══════ */}
        <div className="relative z-20 flex items-center px-3 pt-2 pb-1" style={{ direction: 'ltr' }}>
          <button onClick={onClose} className="flex items-center justify-center" style={{ width: 32, height: 32 }} aria-label="رجوع">
            <img src={A.skinClose} alt="رجوع" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          </button>
          <div className="flex-1 flex items-center justify-center gap-3">
            {/* Diamond pill */}
            <div className="relative flex items-center">
              <div className="flex items-center justify-center" style={{
                width: 90, height: 24, background: '#0c3c30', borderRadius: 12,
                paddingRight: 32, paddingLeft: 6,
                boxShadow: 'inset 0 1px 0 rgba(0,0,0,.4), inset 0 -1px 0 rgba(255,255,255,.08)',
              }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>{gems ?? '0'}</span>
              </div>
              <img src={A.diamonds} alt="" className="absolute" style={{
                right: -3, top: '50%', transform: 'translateY(-50%)',
                width: 28, height: 28, objectFit: 'contain', zIndex: 10,
              }} />
            </div>
            {/* Gold pill */}
            <div className="relative flex items-center">
              <div className="flex items-center justify-center" style={{
                width: 90, height: 24, background: '#0c3c30', borderRadius: 12,
                paddingRight: 32, paddingLeft: 6,
                boxShadow: 'inset 0 1px 0 rgba(0,0,0,.4), inset 0 -1px 0 rgba(255,255,255,.08)',
              }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>{gold ?? '0'}</span>
              </div>
              <img src={A.coin} alt="" className="absolute" style={{
                right: -3, top: '50%', transform: 'translateY(-50%)',
                width: 28, height: 28, objectFit: 'contain', zIndex: 10,
              }} />
            </div>
          </div>
          <button onClick={() => onChargeClick?.()} style={{ width: 28, height: 28, opacity: 0.8 }}>
            <img src={A.jia} alt="+" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          </button>
        </div>

        {/* ══════ عنوان القسم ══════ */}
        <div className="relative z-10 flex items-center justify-center" style={{ padding: '4px 0 2px' }}>
          <div className="flex items-center gap-2" dir="rtl">
            {category.icon && (
              <img src={category.icon} alt="" style={{ width: 24, height: 20, objectFit: 'contain' }} />
            )}
            <span style={{
              color: '#87ebaa', fontSize: 17, fontWeight: 700,
              textShadow: '0 3px 2px rgba(0,0,0,.4)',
            }}>
              {category.nameAr}
            </span>
          </div>
        </div>

        {/* ══════ الفلاتر (sv_filter) ══════ */}
        <div className="relative z-10 flex items-center gap-2 overflow-x-auto px-3 py-1" style={{ scrollbarWidth: 'none' }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>
          {DEFAULT_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="flex-shrink-0 px-3 py-1 rounded-full transition-all"
              style={{
                background: activeFilter === f.key ? '#1a8a6a' : 'rgba(0,0,0,.25)',
                border: activeFilter === f.key ? '1px solid rgba(135,234,170,.4)' : '1px solid rgba(255,255,255,.06)',
                color: activeFilter === f.key ? '#87ebaa' : '#94a3b8',
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* skin_divider.9.png */}
        <div className="relative z-10" style={{ height: 6 }}>
          <img src={A.skinDivider} alt="" className="w-full h-full" style={{ objectFit: 'fill' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>

        {/* ══════ شبكة العناصر على رفوف ══════ */}
        <div className="relative z-10 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {loading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full">
              <img src="/yalla-ui/full/tips_no_data.webp" alt="" style={{ width: 60, height: 60, opacity: 0.5 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span style={{ color: '#75cfb0', fontSize: 12, fontWeight: 700, marginTop: 5 }}>لا توجد عناصر</span>
            </div>
          )}

          {rows.map((row, rowIdx) => (
            <div key={rowIdx}>
              {/* Row of items */}
              <div className="flex justify-center gap-2 px-2 py-2">
                {row.map((item) => (
                  <StoreItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItem?.id === item.id}
                    onSelect={() => setSelectedItem(item)}
                  />
                ))}
                {row.length === 1 && <div style={{ width: 140, height: 0 }} />}
              </div>
              {/* Shelf after each row */}
              <ShelfDivider />
            </div>
          ))}

          <div style={{ height: 60 }} />
        </div>

        {/* ══════ شريط الشراء (عند اختيار عنصر) ══════ */}
        {selectedItem && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="relative z-30 flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{
              background: 'rgba(0,0,0,.5)',
              borderTop: '1px solid rgba(255,255,255,.1)',
              backdropFilter: 'blur(4px)',
            }}
          >
            {/* Selected item info */}
            <div className="flex items-center gap-3">
              <div style={{ width: 40, height: 40, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))' }}>
                <SvgaOrImg
                  src={selectedItem.animatedUrl || selectedItem.imageUrl}
                  alt={selectedItem.nameAr}
                />
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{selectedItem.nameAr}</div>
                <div style={{ color: '#94a3b8', fontSize: 10 }}>
                  {selectedItem.rarity} · {selectedItem.source === 'imported' ? 'مستورد' : 'محلي'}
                </div>
              </div>
            </div>
            {/* Buy/Apply button */}
            {selectedItem.owned ? (
              <button
                className="flex items-center justify-center px-4 py-2 rounded-lg"
                style={{ background: 'linear-gradient(180deg, #2bc895 0%, #1a8a6a 100%)', boxShadow: '0 2px 4px rgba(0,0,0,.2)' }}
              >
                <img src={A.skinCheck} alt="" style={{ width: 18, height: 20, objectFit: 'contain', marginRight: 6 }} />
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>تطبيق</span>
              </button>
            ) : selectedItem.isFree ? (
              <button
                onClick={() => onPurchase?.(selectedItem)}
                className="flex items-center justify-center px-4 py-2 rounded-lg"
                style={{ background: 'linear-gradient(180deg, #2bc895 0%, #1a8a6a 100%)', boxShadow: '0 2px 4px rgba(0,0,0,.2)' }}
              >
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>مجاني</span>
              </button>
            ) : (
              <button
                onClick={() => onPurchase?.(selectedItem)}
                className="relative flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #dab00b 0%, #b08800 100%)', boxShadow: '0 2px 4px rgba(0,0,0,.2)' }}
              >
                {/* cut_price (old price) if discount */}
                {selectedItem.discountPercent > 0 && (
                  <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 10, textDecoration: 'line-through' }}>
                    {selectedItem.price}
                  </span>
                )}
                <img src={A.diamonds} alt="" style={{ width: 14, height: 16, objectFit: 'contain' }} />
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, textShadow: '0 1px 1px rgba(0,0,0,.3)' }}>
                  {selectedItem.price}
                </span>
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// StoreItemCard — بطاقة عنصر (item_skin_theme.xml + item_decor_shop.xml)
// 112×158dip (theme) or 165×114dip (decor)
// حالات: عادية، محددة (إطار أخضر مضيء)، مملوكة (✓)، جديدة (NEW)، مقفلة (باهتة)
// ════════════════════════════════════════════════════════════════════════════
function StoreItemCard({ item, isSelected, onSelect }: { item: StoreItem; isSelected: boolean; onSelect: () => void }) {
  const rarityColors: Record<string, string> = {
    common: '#6b7280',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#fbbf24',
  };
  const rarityColor = rarityColors[item.rarity] || '#6b7280';

  return (
    <div
      onClick={onSelect}
      className="relative cursor-pointer transition-all"
      style={{
        width: 140,
        height: 160,
        opacity: item.owned ? 0.85 : 1,
      }}
    >
      {/* shop_item_bg.webp background */}
      <img
        src={A.shopItemBg}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'fill', opacity: 0.9 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />

      {/* Selection glow (bg_decor_select_light) */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 2px ${rarityColor}, 0 0 12px ${rarityColor}55`,
            borderRadius: 8,
          }}
        />
      )}

      {/* NEW tag (top-left) — CSS alternative (no skin_new drawable in source) */}
      {item.isNew && (
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: 4, left: -2, width: 40, height: 16,
            background: 'linear-gradient(135deg, #ff6b35 0%, #de374d 100%)',
            borderRadius: '6px 0 6px 6px',
            zIndex: 10,
            boxShadow: '0 1px 3px rgba(0,0,0,.4)',
          }}
        >
          <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>NEW</span>
        </div>
      )}

      {/* Owned check mark (skin_check.webp) */}
      {item.owned && (
        <img
          src={A.skinCheck}
          alt="owned"
          className="absolute"
          style={{
            bottom: 5, right: 5,
            width: 20, height: 22, objectFit: 'contain',
            zIndex: 10,
          }}
        />
      )}

      {/* Item image (center) */}
      <div className="absolute flex items-center justify-center" style={{ top: 15, left: 0, right: 0, bottom: 30 }}>
        <div style={{
          maxWidth: '80%', maxHeight: '80%',
          width: '80%', height: '80%',
          filter: 'drop-shadow(0 3px 4px rgba(0,0,0,.4))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SvgaOrImg
            src={item.animatedUrl || item.imageUrl}
            alt={item.nameAr}
          />
        </div>
      </div>

      {/* Item name (bottom strip) */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          bottom: 2, left: 4, right: 4, height: 20,
        }}
      >
        <span style={{
          color: '#fff', fontSize: 9, fontWeight: 700,
          textShadow: '0 1px 1px rgba(0,0,0,.5)',
          textAlign: 'center', whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: 120,
        }}>
          {item.nameAr}
        </span>
      </div>

      {/* Price tag (if not free and not owned) */}
      {!item.owned && !item.isFree && item.price > 0 && (
        <div
          className="absolute flex items-center justify-center gap-1"
          style={{
            bottom: 22, left: '50%', transform: 'translateX(-50%)',
            padding: '1px 6px', borderRadius: 8,
            background: 'rgba(0,0,0,.4)',
          }}
        >
          <img src={A.diamonds} alt="" style={{ width: 10, height: 12, objectFit: 'contain' }} />
          <span style={{ color: '#fff782', fontSize: 10, fontWeight: 700, textShadow: '0 1px 1px #000' }}>
            {item.price}
          </span>
        </div>
      )}

      {/* Discount tag (cut_price) */}
      {item.discountPercent > 0 && (
        <div
          className="absolute"
          style={{
            top: 4, right: 4, width: 30, height: 14,
            background: '#ef4444', borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <span style={{ color: '#fff', fontSize: 8, fontWeight: 700 }}>-{item.discountPercent}%</span>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ShelfDivider — رف بين صفوف العناصر (rl_shop_item_divider / skin_item_divider)
// ════════════════════════════════════════════════════════════════════════════
function ShelfDivider() {
  return (
    <div className="relative w-full" style={{ height: 20, marginTop: -5, marginBottom: -2 }}>
      <img
        src={A.shelves}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'bottom', opacity: 0.85 }}
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          el.style.display = 'none';
          el.parentElement!.style.background = 'linear-gradient(180deg, rgba(62,206,170,.3) 0%, rgba(45,168,135,.4) 60%, rgba(31,122,95,.6) 100%)';
        }}
      />
    </div>
  );
}
