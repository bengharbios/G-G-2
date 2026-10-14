'use client';

/**
 * AppShell — الهيدر والقائمة السفلية الموحّدة لكل الصفحات الرئيسية:
 *   /            → ألعاب (games)
 *   /friends     → أصدقائي (friends)
 *   /voice-rooms → المجلس (council)
 *
 * الميزّات:
 * - هيدر واحد وقائمة سفلية واحدة تُحمّل مرة واحدة عند التنقل بين هذه الصفحات
 * - إدارة المصادقة (authUser) في مكان واحد
 * - فتح بروفايلي (YallaProfileDialog) من زر الصورة في الهيدر — يعمل في كل الصفحات
 * - فتح/إغلاق نوافذ الدخول/التسجيل
 * - شاشة تحميل أولية مع غزال يجري (GazelleLoader)
 * - إجبار تسجيل الدخول على الصفحات المحميّة فقط (/ و /friends)
 *
 * ملاحظة: المسار /voice-rooms يبقى يدعم الضيوف (Guests) — لا يُجبر تسجيل الدخول.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import SiteHeader from './SiteHeader';
import SiteBottomNav from './SiteBottomNav';
import YallaProfileDialog from './YallaProfileDialog';
import { LoginModal, RegisterModal, type AuthUser } from '@/components/AuthModals';
import { AppShellContext, type AppShellUser, type AppShellContextValue, type SubscriberProfile } from './AppShellContext';
import GazelleLoader from './GazelleLoader';

// ─── Routes that should render the persistent shell (header + bottom nav) ───
const SHELL_ROUTES = ['/', '/friends', '/voice-rooms', '/tobol', '/mafia', '/prison', '/risk', '/risk2', '/tabot', '/baharharb', '/familyfeud', '/shifarat'];

// ─── Routes that REQUIRE authentication — show login modal automatically ───
const FORCED_AUTH_ROUTES = ['/', '/friends'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function isShellRoute(pathname: string): boolean {
  return SHELL_ROUTES.includes(pathname) || SHELL_ROUTES.some(p => pathname.startsWith(p + '/'));
}

function isForcedAuthRoute(pathname: string): boolean {
  return FORCED_AUTH_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'));
}

type BottomTab = 'games' | 'events' | 'council' | 'friends';

function deriveActiveTab(pathname: string): BottomTab {
  if (pathname.startsWith('/friends')) return 'friends';
  if (pathname.startsWith('/voice-rooms')) return 'council';
  if (pathname === '/' || pathname.startsWith('/#')) return 'games';
  return 'games';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const showShell = isShellRoute(pathname);
  const forceAuth = isForcedAuthRoute(pathname);

  const [authUser, setAuthUser] = useState<AppShellUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [subscriberProfile, setSubscriberProfile] = useState<SubscriberProfile | null>(null);

  // ── التمرير لأعلى عند تغيير المسار — كل صفحة تبدأ من أعلاها ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    // أيضاً: إن كان هناك عنصر بقى عليه scroll (مثل overflow-y-auto) نُصفّره
    const scrollables = document.querySelectorAll('[data-scrollable="true"]');
    scrollables.forEach(el => { (el as HTMLElement).scrollTop = 0; });
  }, [pathname]);

  // ── Fetch /api/auth/me once on mount ──
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.user) {
          setAuthUser(data.user as AppShellUser);
        } else if (forceAuth) {
          // لم يسجّل الدخول — نفتح نافذة الدخول تلقائياً
          setLoginOpen(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        if (forceAuth) setLoginOpen(true);
      })
      .finally(() => {
        if (!cancelled) setAuthChecking(false);
      });
    return () => { cancelled = true; };
  }, [forceAuth]);

  // ── Fetch subscriber profile (if any) ──
  useEffect(() => {
    let cancelled = false;
    try {
      const subCode = localStorage.getItem('gg_sub_code');
      if (!subCode) return;
      fetch('/api/subscription/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: subCode }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          if (data.success && data.subscriber) {
            setSubscriberProfile(data as SubscriberProfile);
          }
        })
        .catch(() => { /* silent fail */ });
    } catch { /* localStorage unavailable */ }
    return () => { cancelled = true; };
  }, []);

  // ── Auth callbacks ──
  const handleAuthSuccess = useCallback((user: AuthUser) => {
    setAuthUser(user as unknown as AppShellUser);
    setLoginOpen(false);
    setRegisterOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { /* silent */ }
    try { localStorage.removeItem('gg_sub_code'); } catch {}
    setAuthUser(null);
    setSubscriberProfile(null);
    setProfileOpen(false);
    window.location.reload();
  }, []);

  const openProfile = useCallback(() => setProfileOpen(true), []);
  const openLogin = useCallback(() => setLoginOpen(true), []);
  const openRegister = useCallback(() => setRegisterOpen(true), []);

  const onProfileUpdated = useCallback((patch: Partial<AppShellUser>) => {
    setAuthUser((u) => (u ? { ...u, ...patch } : u));
  }, []);

  // ── Context value ──
  const ctxValue = useMemo<AppShellContextValue>(() => ({
    authUser,
    openProfile,
    openLogin,
    openRegister,
    handleLogout,
    subscriberProfile,
    onProfileUpdated,
  }), [authUser, openProfile, openLogin, openRegister, handleLogout, subscriberProfile, onProfileUpdated]);

  // ── If not a shell route (game lobby, etc.) — just render children ──
  if (!showShell) {
    return <>{children}</>;
  }

  // ── Auth check loading screen (with running gazelle) ──
  if (authChecking) {
    return <GazelleLoader fullScreen label="جارٍ تحميل الجلسة..." />;
  }

  // ── Not authenticated on a forced-auth route — show login modal over blank bg ──
  if (!authUser && forceAuth) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center opacity-40">
            <img src="/platform-logo.png" alt="ألعاب الغريب" className="w-20 h-20 mx-auto mb-4 rounded-xl" />
            <p className="text-slate-500 text-sm">سجّل دخولك للمتابعة</p>
          </div>
        </div>

        <LoginModal
          open={loginOpen}
          onOpenChange={(open) => {
            // منع الإغلاق بدون تسجيل دخول
            if (!open && !authUser) return;
            setLoginOpen(open);
          }}
          onSwitchToRegister={() => setRegisterOpen(true)}
          onLoginSuccess={handleAuthSuccess}
        />
        <RegisterModal
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          onSwitchToLogin={() => setLoginOpen(true)}
          onRegisterSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // ── Active tab for bottom nav ──
  const activeTab = deriveActiveTab(pathname);

  // ── Main shell with persistent header + bottom nav + modals ──
  return (
    <AppShellContext.Provider value={ctxValue}>
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
        {/* الهيدر الموحّد — يحمّل مرة واحدة عند التنقل بين التبويبات */}
        <SiteHeader
          authUser={authUser}
          onProfileClick={openProfile}
          onLoginClick={openLogin}
          onLogout={handleLogout}
        />

        {/* Spacer for fixed header */}
        <div className="h-14 sm:h-16" />

        {/* محتوى الصفحة */}
        {children}

        {/* الأزرار السفلية الموحّدة */}
        <SiteBottomNav activeTab={activeTab} />

        {/* نوافذ الدخول/التسجيل */}
        <LoginModal
          open={loginOpen}
          onOpenChange={setLoginOpen}
          onSwitchToRegister={() => setRegisterOpen(true)}
          onLoginSuccess={handleAuthSuccess}
        />
        <RegisterModal
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          onSwitchToLogin={() => setLoginOpen(true)}
          onRegisterSuccess={handleAuthSuccess}
        />

        {/* نافذة بروفايلي — تفتح من زر الصورة في الهيدر على أي صفحة */}
        <YallaProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          authUser={authUser}
          subscriberCode={subscriberProfile?.subscriber?.subscriptionCode}
          subscriberPlan={subscriberProfile?.subscriber?.plan}
          isTrial={subscriberProfile?.subscriber?.isTrial}
          allowedGames={subscriberProfile?.subscriber?.allowedGames}
          onLoginClick={() => { setProfileOpen(false); setTimeout(() => setLoginOpen(true), 150); }}
          onRegisterClick={() => { setProfileOpen(false); setTimeout(() => setRegisterOpen(true), 150); }}
          onLogout={handleLogout}
          onProfileUpdated={onProfileUpdated}
        />
      </div>
    </AppShellContext.Provider>
  );
}
