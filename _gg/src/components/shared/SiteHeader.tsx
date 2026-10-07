'use client';

import { useState, useEffect, useRef } from 'react';

interface SiteHeaderProps {
  /** Pass auth user from parent (recommended). Falls back to /api/auth/me if not provided. */
  authUser?: {
    id: string;
    username: string;
    email?: string;
    displayName?: string;
    phone?: string;
    avatar?: string;
    role?: string;
    vipLevel?: number;
  } | null;
  /** Optional extra content to render on the right side of the header */
  extraContent?: React.ReactNode;
  /** Called when profile avatar is clicked */
  onProfileClick?: () => void;
  /** Called when login button is clicked */
  onLoginClick?: () => void;
  /** Called when logout is clicked (if not provided, default logout is used) */
  onLogout?: () => void;
}

function useActivePlayers() {
  const [count, setCount] = useState(214);
  const [visible, setVisible] = useState(true);
  const countRef = useRef(214);

  useEffect(() => {
    countRef.current = count;
  }, [count]);

  useEffect(() => {
    const randomBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    const changeCount = () => {
      setVisible(false);
      setTimeout(() => {
        const delta = randomBetween(-8, 8);
        const next = Math.max(142, Math.min(287, countRef.current + delta));
        setCount(next);
        setVisible(true);
      }, 300);
    };

    const timeout = setTimeout(changeCount, randomBetween(10000, 30000));
    const interval = setInterval(changeCount, randomBetween(10000, 30000));

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  return { count, visible };
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

  const isAdmin = authUser?.role === 'admin';
  const avatarLetter = authUser?.displayName?.charAt(0) || 'غ';

  return (
    <header className="yalla-topbar fixed top-0 left-0 right-0 z-50">
      <div className="yalla-topbar-inner">
        {/* أفاتار يسار كما في main_header.xml — صورة اللاعب دائماً:
            صورة الحساب إن وجدت، وإلا أفاتار يلا الافتراضي (photo_img_v2) حسب معرف اللاعب.
            الضغط يفتح الملف للمسجل وشاشة الدخول للزائر — بلا أيقونات دخول/خروج */}
        <button
          onClick={() => (authUser ? onProfileClick?.() : onLoginClick?.())}
          className="avatar-hd"
          style={{ overflow: 'hidden' }}
          aria-label={authUser ? 'الملف الشخصي' : 'تسجيل الدخول'}
          title={authUser ? 'الملف الشخصي' : 'تسجيل الدخول'}
        >
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
        </button>
        <div className="spacer" />

        {/* الذهب — حبة bg_add_coin من main_header.xml */}
        <button className="coin-pill" aria-label="الذهب" title="الذهب">
          <img src="/yalla-ui/coin.webp" alt="" />
          <span>0</span>
          <img className="add-btn" src="/yalla-ui/jia.webp" alt="+" />
        </button>

        {/* الجواهر */}
        <button className="gem-pill" aria-label="الجواهر" title="الجواهر">
          <img src="/yalla-ui/diamonds.webp" alt="" />
          <span>0</span>
          <img className="add-btn" src="/yalla-ui/jia.webp" alt="+" />
        </button>

        {/* المتجر — سلة cart من APK */}
        <button className="hd-icon cart-btn" aria-label="المتجر" title="المتجر">
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
  );
}
