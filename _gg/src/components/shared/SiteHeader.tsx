'use client';

import { useState, useEffect } from 'react';
import FrameStoreModal from './FrameStoreModal';
import SettingsModal from './SettingsModal';
import SvgaOrImg from './SvgaOrImg';
import { formatCompact } from '@/lib/format';
import { enableBgMusicAutoStart, initVolumeFromStorage } from '@/lib/sounds';

// ذاكرة مؤقتة للكتالوج — يُحمّل مرة واحدة ويُعيد استخدامه بين عناصر الهيدر
let _framesCatalogCache: Map<string, string> | null = null;
let _framesCatalogPromise: Promise<Map<string, string>> | null = null;

function getFramesCatalogMap(): Promise<Map<string, string>> {
  if (_framesCatalogCache) return Promise.resolve(_framesCatalogCache);
  if (_framesCatalogPromise) return _framesCatalogPromise;
  _framesCatalogPromise = fetch('/api/store/frames-catalog')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      const m = new Map<string, string>();
      if (d?.success && Array.isArray(d.frames)) {
        for (const f of d.frames) {
          if (f.imageUrl) m.set(String(f.id), String(f.imageUrl));
        }
      }
      _framesCatalogCache = m;
      return m;
    })
    .catch(() => {
      const m = new Map<string, string>();
      _framesCatalogCache = m;
      return m;
    });
  return _framesCatalogPromise;
}

interface SiteHeaderUser {
  id: string;
  displayName?: string;
  avatar?: string;
  frame?: string;
  role?: string;
}

interface SiteHeaderProps {
  authUser?: SiteHeaderUser | null;
  extraContent?: React.ReactNode;
  onProfileClick?: () => void;
  onLoginClick?: () => void;
  onLogout?: () => void;
}

// درع الإطار حول صورة الهيدر — يبحث عن imageUrl الحقيقي من الكتالوج
// (قد يكون PNG أو SVGA أو أي صيغة أخرى) ويرجع احتياطياً لمسار PNG الافتراضي
function frameSrcFallback(frameId?: string | null): string | null {
  const id = (frameId || '').trim();
  if (!id) return null;
  // احتياطي: مسار PNG الافتراضي للأرقام فقط
  return /^\d+$/.test(id) ? `/yalla-frames/${id}.png` : null;
}

export default function SiteHeader({
  authUser: authUserProp,
  extraContent,
  onProfileClick,
  onLoginClick,
  onLogout,
}: SiteHeaderProps) {
  // If no authUser prop provided, fetch from /api/auth/me
  const [fetchedUser, setFetchedUser] = useState<SiteHeaderProps['authUser']>(null);
  const authUser = authUserProp !== undefined ? authUserProp : fetchedUser;
  const [storeOpen, setStoreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gems, setGems] = useState<number | null>(null);
  const [gold, setGold] = useState<number | null>(null);

  // تهيئة الصوت + تشغيل الموسيقى عند أول تفاعل (يعمل من أول فتح للموقع، ليس فقط في الألعاب)
  useEffect(() => {
    initVolumeFromStorage();
    enableBgMusicAutoStart();
  }, []);

  useEffect(() => {
    // Only fetch if no prop is provided
    if (authUserProp !== undefined) return;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user) {
          setFetchedUser(d.user);
        }
      })
      .catch(() => {});
  }, [authUserProp]);

  // رصيد الجواهر والذهب — جاهز فقط بعد تكون authUser
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    fetch('/api/gems/balance')
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.success) setGems(d.balance);
      })
      .catch(() => {});
    fetch('/api/gold/balance')
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.success) setGold(d.balance);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [authUser]);

  // إعادة جلب الرصيد والإطار عند عودة التركيز/الرؤية (بعد شراء أو تجهيز إطار)
  useEffect(() => {
    if (!authUser) return;
    const refresh = () => {
      fetch('/api/gems/balance').then(r => r.json()).then(d => { if (d.success) setGems(d.balance); }).catch(() => {});
      fetch('/api/gold/balance').then(r => r.json()).then(d => { if (d.success) setGold(d.balance); }).catch(() => {});
      fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.success && d.user) setFetchedUser(d.user); }).catch(() => {});
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [authUser]);

  const isAdmin = authUser?.role === 'admin';
  // ابحث عن imageUrl الحقيقي للإطار المُجهَّز من الكتالوج (يدعم SVGA وغيرها)
  const [frameImg, setFrameImg] = useState<string | null>(null);
  useEffect(() => {
    if (!authUser?.frame) { setFrameImg(null); return; }
    let cancelled = false;
    getFramesCatalogMap().then((m) => {
      if (cancelled) return;
      const realUrl = m.get(String(authUser.frame));
      setFrameImg(realUrl || frameSrcFallback(authUser.frame));
    });
    return () => { cancelled = true; };
  }, [authUser?.frame]);

  return (
    <>
      <header className="yalla-topbar fixed top-0 left-0 right-0 z-50" style={{ overflow: 'visible' }}>
        <div className="yalla-topbar-inner" style={{ overflow: 'visible' }}>
          {/* أفاتار يسار حسب main_header مع درع الإطار المجهز */}
          <button
            onClick={() => (authUser ? onProfileClick?.() : onLoginClick?.())}
            className="avatar-hd"
            style={{ overflow: 'visible' }}
            aria-label={authUser ? 'الملف الشخصي' : 'تسجيل الدخول'}
            title={authUser ? 'الملف الشخصي' : 'تسجيل الدخول'}
          >
            <span className="avatar-frame-wrap" style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
              <img
                src={
                  authUser?.avatar ||
                  `/yalla-avatars/defaultPhoto_${((parseInt(authUser?.id || '', 10) || 0) % 12) + 1}.png`
                }
                alt="اللاعب"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  if (!t.src.includes('defaultPhoto_')) {
                    t.src = '/yalla-avatars/defaultPhoto_1.png';
                  }
                }}
              />
              {frameImg && (
                <SvgaOrImg
                  src={frameImg}
                  alt=""
                />
              )}
            </span>
          </button>
          <div className="spacer" />

          {/* الذهب — الرصيد الحقيقي من AppUser.gold */}
          <button className="coin-pill" aria-label="الذهب" title="الذهب">
            <img src="/yalla-ui/coin.webp" alt="" />
            <span>{gold === null ? '0' : formatCompact(gold)}</span>
            <img className="add-btn" src="/yalla-ui/jia.webp" alt="+" />
          </button>

          {/* الجواهر — الرصيد الحقيقي من قاعدة البيانات */}
          <button className="gem-pill" aria-label="الجواهر" title="الجواهر">
            <img src="/yalla-ui/diamonds.webp" alt="" />
            <span>{gems === null ? '0' : formatCompact(gems)}</span>
            <img className="add-btn" src="/yalla-ui/jia.webp" alt="+" />
          </button>

          {/* المتجر — سلة cart من APK: يفتح متجر الإطارات */}
          <button
            className="hd-icon cart-btn"
            aria-label="المتجر"
            title="متجر الإطارات"
            onClick={() => (authUser ? setStoreOpen(true) : onLoginClick?.())}
          >
            <img src="/yalla-ui/cart.png" alt="المتجر" />
          </button>

          {/* الإعدادات — وللمشرف: لوحة التحكم */}
          {isAdmin ? (
            <a className="hd-icon" href="/admin" aria-label="لوحة التحكم" title="لوحة التحكم">
              <img src="/yalla-ui/system.webp" alt="الإعدادات" style={{ filter: 'hue-rotate(120deg)' }} />
            </a>
          ) : (
            <button className="hd-icon" aria-label="الإعدادات" title="الإعدادات" onClick={() => setSettingsOpen(true)}>
              <img src="/yalla-ui/system.webp" alt="الإعدادات" />
            </button>
          )}

          {/* محتوى إضافي اختياري (مثل زر إنشاء غرفة) */}
          {extraContent}
        </div>
      </header>

      {/* متجر الإطارات */}
      <FrameStoreModal open={storeOpen} onOpenChange={setStoreOpen} />

      {/* نافذة الإعدادات */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        authUser={authUser}
        onLogout={onLogout}
      />
    </>
  );
}
