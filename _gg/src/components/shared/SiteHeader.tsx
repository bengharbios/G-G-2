'use client';

import { useState, useEffect } from 'react';
import FrameStoreModal from './FrameStoreModal';
import { formatCompact } from '@/lib/format';

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

// درع الإطار حول صورة الهيدر — نفس مسار صور الإطارات المحلية
function frameSrc(frameId?: string | null): string | null {
  const id = (frameId || '').trim();
  return id && /^\d+$/.test(id) ? `/yalla-frames/${id}.png` : null;
}

export default function SiteHeader({
  authUser: authUserProp,
  extraContent,
  onProfileClick,
  onLoginClick,
}: SiteHeaderProps) {
  // If no authUser prop provided, fetch from /api/auth/me
  const [fetchedUser, setFetchedUser] = useState<SiteHeaderProps['authUser']>(null);
  const authUser = authUserProp !== undefined ? authUserProp : fetchedUser;
  const [storeOpen, setStoreOpen] = useState(false);
  const [gems, setGems] = useState<number | null>(null);
  const [gold, setGold] = useState<number | null>(null);

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
  const frameImg = frameSrc(authUser?.frame);

  return (
    <>
      <header className="yalla-topbar fixed top-0 left-0 right-0 z-50">
        <div className="yalla-topbar-inner">
          {/* أفاتار يسار حسب main_header مع درع الإطار المجهز */}
          <button
            onClick={() => (authUser ? onProfileClick?.() : onLoginClick?.())}
            className="avatar-hd"
            style={{ overflow: 'hidden' }}
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
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  if (!t.src.includes('defaultPhoto_')) {
                    t.src = '/yalla-avatars/defaultPhoto_1.png';
                  }
                }}
              />
              {frameImg && (
                <img
                  src={frameImg}
                  alt=""
                  style={{
                    position: 'absolute', inset: '-18%', width: '136%', height: '136%',
                    objectFit: 'contain', pointerEvents: 'none',
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
            <button className="hd-icon" aria-label="الإعدادات" title="الإعدادات">
              <img src="/yalla-ui/system.webp" alt="الإعدادات" />
            </button>
          )}

          {/* محتوى إضافي اختياري (مثل زر إنشاء غرفة) */}
          {extraContent}
        </div>
      </header>

      {/* متجر الإطارات */}
      <FrameStoreModal open={storeOpen} onOpenChange={setStoreOpen} />
    </>
  );
}
