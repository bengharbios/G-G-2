'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────

interface CatalogFrame {
  id: string;
  nameAr: string;
  imageUrl: string;
  rarity: string;
  price: number;
  isFree: boolean;
}

interface CatalogItem extends CatalogFrame {
  kind: 'ornament' | 'theme' | 'card';
}

type StoreTab = 'frame' | 'ornament' | 'theme' | 'card';
type SubFilter = 'all' | 'owned' | 'lux' | 'rare';

interface FrameStoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBalanceChange?: (balance: number) => void;
}

const STORE_TABS: Array<{ key: StoreTab; label: string }> = [
  { key: 'frame', label: 'الإطارات' },
  { key: 'ornament', label: 'المعلقات' },
  { key: 'theme', label: 'المواضيع' },
  { key: 'card', label: 'البطاقات' },
];

const SUB_FILTERS: Array<{ key: SubFilter; label: string }> = [
  { key: 'all', label: 'الكل' },
  { key: 'owned', label: 'المتاح' },
  { key: 'lux', label: 'الفاخر' },
  { key: 'rare', label: 'النادر' },
];

const RARITY_LABEL: Record<string, string> = {
  legendary: 'أسطوري',
  epic: 'ملحمي',
  rare: 'نادر',
  common: 'عادي',
};

const RARITY_BADGE: Record<string, string> = {
  legendary: 'fs-badge fs-badge--legendary',
  epic: 'fs-badge fs-badge--epic',
  rare: 'fs-badge fs-badge--rare',
  common: 'fs-badge fs-badge--common',
};

// ─── Component ──────────────────────────────────────────────────────────

export default function FrameStoreModal({ open, onOpenChange, onBalanceChange }: FrameStoreModalProps) {
  const [frames, setFrames] = useState<CatalogFrame[]>([]);
  const [decors, setDecors] = useState<CatalogItem[]>([]);
  const [ownedFrames, setOwnedFrames] = useState<Set<string>>(new Set());
  const [ownedDecor, setOwnedDecor] = useState<Set<string>>(new Set());
  const [balance, setBalance] = useState<number | null>(null);
  const [tab, setTab] = useState<StoreTab>('frame');
  const [sub, setSub] = useState<SubFilter>('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<(CatalogFrame | CatalogItem) | null>(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok');

  const load = useCallback(async () => {
    try {
      const [cat, dec, own, bal] = await Promise.all([
        fetch('/api/store/frames-catalog').then((r) => r.json()),
        fetch('/api/store/decor-catalog').then((r) => r.json()),
        fetch('/api/frames').then((r) => r.json()),
        fetch('/api/gems/balance').then((r) => r.json()),
      ]);
      if (cat?.success && Array.isArray(cat.frames)) setFrames(cat.frames);
      if (dec?.success && Array.isArray(dec.items)) setDecors(dec.items);
      if (dec?.success && Array.isArray(dec.ownedDecor)) setOwnedDecor(new Set(dec.ownedDecor.map(String)));
      if (own?.success && Array.isArray(own.userFrames)) {
        setOwnedFrames(new Set(own.userFrames.map((uf: { frame?: { id?: unknown } }) => String(uf.frame?.id ?? ''))));
      }
      if (bal?.success && typeof bal.balance === 'number') {
        setBalance(bal.balance);
        onBalanceChange?.(bal.balance);
      }
    } catch {
      /* silent */
    }
  }, [onBalanceChange]);

  useEffect(() => {
    if (open) {
      setMsg('');
      setConfirmItem(null);
      load();
    }
  }, [open, load]);

  const doPurchase = useCallback(
    async (item: CatalogFrame | CatalogItem) => {
      const isFrame = !('kind' in item);
      setPurchasing(item.id);
      setMsg('');
      try {
        const res = await fetch(isFrame ? '/api/store/purchase-frame' : '/api/store/purchase-decor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ frameId: item.id, itemId: item.id }),
        });
        const d = await res.json();
        if (res.ok && d.success) {
          if (isFrame) setOwnedFrames((prev) => new Set(prev).add(item.id));
          else setOwnedDecor((prev) => new Set(prev).add(item.id));
          if (typeof d.newBalance === 'number') {
            setBalance(d.newBalance);
            onBalanceChange?.(d.newBalance);
          }
          setMsgType('ok');
          setMsg(item.isFree
            ? `حصلت على «${d.nameAr || item.nameAr}» مجاناً!`
            : `تم شراء «${d.nameAr || item.nameAr}» بنجاح! يمكنك تجهيزه من نافذة الزينة`);
          setConfirmItem(null);
        } else {
          setMsgType('err');
          setMsg(d.error || 'فشل الشراء');
          if (d.alreadyOwned) {
            if (isFrame) setOwnedFrames((prev) => new Set(prev).add(item.id));
            else setOwnedDecor((prev) => new Set(prev).add(item.id));
          }
        }
      } catch {
        setMsgType('err');
        setMsg('تعذر الاتصال بالخادم');
      } finally {
        setPurchasing(null);
      }
    },
    [onBalanceChange]
  );

  const isOwned = (item: CatalogFrame | CatalogItem) =>
    'kind' in item ? ownedDecor.has(item.id) : ownedFrames.has(item.id);

  const visible: Array<CatalogFrame | CatalogItem> =
    (tab === 'frame'
      ? frames
      : decors.filter((d) => d.kind === tab)
    ).filter((f) => {
      if (sub === 'owned') return isOwned(f);
      if (sub === 'lux') return f.rarity === 'legendary' || f.rarity === 'epic';
      if (sub === 'rare') return f.rarity === 'rare';
      return true;
    });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fs-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => onOpenChange(false)}
        >
          <div className="fs-panel" dir="rtl" onClick={(e) => e.stopPropagation()}>
            {/* الشريط العلوي: إغلاق + رصيد الجواهر */}
            <div className="fs-topbar">
              <button className="fs-close" onClick={() => onOpenChange(false)} aria-label="إغلاق">
                <X className="w-5 h-5" />
              </button>
              <div className="fs-wallet" title="رصيد الجواهر">
                <img src="/yalla-ui/diamonds.webp" alt="" />
                <span dir="ltr">{balance === null ? '…' : balance.toLocaleString('en-US')}</span>
                <img className="fs-wallet-add" src="/yalla-ui/jia.webp" alt="+" />
              </div>
            </div>

            {/* العنوان */}
            <div className="fs-titlewrap">
              <h2 className="fs-title">المتجر</h2>
            </div>

            {/* التبويبات الرئيسية */}
            <div className="fs-tabs">
              {STORE_TABS.map((t) => (
                <button
                  key={t.key}
                  className={`fs-tab${tab === t.key ? ' fs-tab--on' : ''}`}
                  onClick={() => { setTab(t.key); setSub('all'); }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* التبويبات الفرعية: الكل / المتاح / الفاخر / النادر */}
            <div className="fs-subtabs">
              {SUB_FILTERS.map((s) => (
                <button
                  key={s.key}
                  className={`fs-subtab${sub === s.key ? ' fs-subtab--on' : ''}`}
                  onClick={() => setSub(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* الرسائل */}
            {msg && <div className={`fs-msg ${msgType === 'ok' ? 'fs-msg--ok' : 'fs-msg--err'}`}>{msg}</div>}

            {/* الشبكة */}
            <div className="fs-bodygrid">
              {visible.length === 0 && (
                <div className="fs-empty">لا توجد عناصر في هذا التصنيف بعد</div>
              )}
              {visible.map((f) => {
                const isFrame = !('kind' in f);
                const owned = isOwned(f);
                return (
                  <button
                    key={`${isFrame ? 'f' : 'd'}-${f.id}`}
                    className={`fs-card${owned ? ' fs-card--owned' : ''}`}
                    title={`${f.nameAr} — ${RARITY_LABEL[f.rarity] || 'عادي'}${f.isFree ? ' — مجاني' : ` — ${f.price} جوهرة`}`}
                    onClick={() => {
                      if (owned) {
                        setMsgType('ok');
                        setMsg('تملك هذا العنصر — يمكنك تجهيزه من نافذة الزينة في ملفك الشخصي');
                        return;
                      }
                      setMsg('');
                      setConfirmItem(f);
                    }}
                  >
                    <span className="fs-card-name">{f.nameAr}</span>
                    <span className={`fs-card-imgwrap ${owned ? 'fs-card-imgwrap--owned' : ''}`}>
                      {f.imageUrl ? (
                        <img
                          src={f.imageUrl}
                          alt={f.nameAr}
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <span className="fs-nopic">عنصر مصمم</span>
                      )}
                      {owned && <i className="fs-check"><Check className="w-4 h-4" /></i>}
                    </span>
                    <span className={owned ? 'fs-price fs-price--owned' : f.isFree ? 'fs-price fs-price--free' : 'fs-price'}>
                      {owned ? '✓ تم الشراء' : f.isFree ? 'مجاني' : f.price}
                    </span>
                    <span className={RARITY_BADGE[f.rarity] || RARITY_BADGE.common}>{RARITY_LABEL[f.rarity] || 'عادي'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* نافذة تأكيد الشراء */}
          <AnimatePresence>
            {confirmItem && (
              <motion.div
                className="fs-confirmwrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmItem(null)}
              >
                <div className="fs-confirm" dir="rtl" onClick={(e) => e.stopPropagation()}>
                  <h3>{confirmItem.isFree ? 'الحصول على العنصر' : 'شراء من المتجر'}</h3>
                  <span className="fs-confirm-img">
                    {confirmItem.imageUrl && (
                      <img src={confirmItem.imageUrl} alt={confirmItem.nameAr} />
                    )}
                  </span>
                  <p className="fs-confirm-name">{confirmItem.nameAr}</p>
                  <p className="fs-confirm-price">
                    {confirmItem.isFree
                      ? 'مجاني — اضغط للحصول عليه'
                      : `السعر: ${confirmItem.price} جوهرة`}
                    {!confirmItem.isFree && typeof balance === 'number' && (
                      <span className="fs-confirm-balance"> (رصيدك: {balance.toLocaleString('en-US')})</span>
                    )}
                  </p>
                  {msgType === 'err' && msg && <p className="fs-confirm-err">{msg}</p>}
                  <div className="fs-confirm-actions">
                    <button className="fs-btn fs-btn--cancel" onClick={() => setConfirmItem(null)}>
                      إلغاء
                    </button>
                    <button
                      className="fs-btn fs-btn--buy"
                      disabled={purchasing === confirmItem.id}
                      onClick={() => doPurchase(confirmItem)}
                    >
                      {purchasing === confirmItem.id
                        ? 'جارٍ التنفيذ…'
                        : confirmItem.isFree
                          ? 'احصل عليه'
                          : 'شراء الآن'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
