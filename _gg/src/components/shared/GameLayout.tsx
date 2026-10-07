'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import GameHeader from '@/components/shared/GameHeader';
import UserProfileModal from '@/components/shared/UserProfileModal';
import StoreModal from '@/components/shared/StoreModal';

// Dynamic import SideUtilityPanel to avoid SSR issues with sounds module
const SideUtilityPanel = dynamic(
  () => import('@/components/shared/SideUtilityPanel'),
  { ssr: false }
);

// ─── Types ───────────────────────────────────────────────────────────

interface GameLayoutProps {
  gameSlug: string;
  gameName: string;
  gameEmoji?: string;
  accentColor?: 'red' | 'orange' | 'amber' | 'purple' | 'violet' | 'teal' | 'rose' | 'emerald';
  phaseLabel?: string;
  children: React.ReactNode;
}

interface SubscriberInfo {
  name: string;
  email?: string;
  phone?: string;
  subscriptionCode: string;
  plan: string;
  isTrial: boolean;
  startDate?: string;
  endDate?: string;
  expiresAt?: string;
  allowedGames?: string[];
  allowedGamesInfo?: { slug: string; name: string; emoji: string; color: string }[];
  daysRemaining: number;
  trialInfo?: { sessionsUsed: number; maxSessions: number; expiresAt: string | null; daysLeft: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadSubscriberInfoFromStorage(): SubscriberInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('gg_sub_info');
    if (!raw) return null;
    return JSON.parse(raw) as SubscriberInfo;
  } catch {
    return null;
  }
}

function loadSubCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem('gg_sub_code') || '';
  } catch {
    return '';
  }
}

// ─── Component ──────────────────────────────────────────────────────

export default function GameLayout({
  gameSlug,
  gameName,
  gameEmoji = '🎮',
  accentColor = 'amber',
  phaseLabel,
  children,
}: GameLayoutProps) {
  const router = useRouter();

  // ── Panel / modal state (stable, not dependent on phase) ────────
  const [utilityOpen, setUtilityOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [subscriberInfo, setSubscriberInfo] = useState<SubscriberInfo | null>(null);
  const [gemsBalance, setGemsBalance] = useState(0);

  // ── Load subscriber info on mount ───────────────────────────────
  useEffect(() => {
    const cached = loadSubscriberInfoFromStorage();
    const code = loadSubCode();

    if (cached) {
      setTimeout(() => setSubscriberInfo(cached), 0);
    }

    if (code) {
      fetch('/api/subscription/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
        .then((res) => {
          if (res.ok) return res.json();
          return null;
        })
        .then((data) => {
          if (data && data.success && data.subscriber) {
            const info: SubscriberInfo = {
              name: data.subscriber.name,
              email: data.subscriber.email,
              phone: data.subscriber.phone,
              subscriptionCode: data.subscriber.subscriptionCode,
              plan: data.subscriber.plan,
              isTrial: data.subscriber.isTrial,
              startDate: data.subscriber.startDate,
              endDate: data.subscriber.endDate,
              expiresAt: data.subscriber.expiresAt,
              allowedGames: data.subscriber.allowedGames,
              allowedGamesInfo: data.subscriber.allowedGamesInfo,
              daysRemaining: data.subscriber.daysRemaining,
              trialInfo: data.trialInfo,
            };
            setSubscriberInfo(info);
            if (data.subscriber.gemsBalance !== undefined) {
              setGemsBalance(data.subscriber.gemsBalance);
            }
            try {
              localStorage.setItem('gg_sub_info', JSON.stringify(info));
            } catch { /* ignore */ }
          }
        })
        .catch(() => { /* silently fail */ });
    }
  }, []);

  // ── Logout handler ──────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('gg_sub_code');
      localStorage.removeItem('gg_sub_info');
    } catch { /* ignore */ }
    setProfileOpen(false);
    setUtilityOpen(false);
    router.push('/');
  }, [router]);

  // ── Exit handler (navigate to home) ─────────────────────────────
  const handleExit = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col" dir="rtl">
      {/* Game Header */}
      <GameHeader
        gameName={gameName}
        gameEmoji={gameEmoji}
        accentColor={accentColor}
        phaseLabel={phaseLabel}
        subscriberName={subscriberInfo?.name}
        gemsBalance={gemsBalance}
        onProfileToggle={() => setProfileOpen(true)}
        onStoreToggle={() => setStoreOpen(true)}
        onUtilityToggle={() => setUtilityOpen((p) => !p)}
        onExit={handleExit}
      />

      {/* Side Utility Panel */}
      <SideUtilityPanel
        open={utilityOpen}
        onToggle={() => setUtilityOpen((p) => !p)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        open={profileOpen}
        onOpenChange={setProfileOpen}
        subscriberName={subscriberInfo?.name}
        subscriberEmail={subscriberInfo?.email}
        subscriberPhone={subscriberInfo?.phone}
        subscriberCode={subscriberInfo?.subscriptionCode}
        subscriberPlan={subscriberInfo?.plan}
        isTrial={subscriberInfo?.isTrial}
        allowedGames={subscriberInfo?.allowedGames}
        startDate={subscriberInfo?.startDate}
        endDate={subscriberInfo?.endDate}
        trialSessionsUsed={subscriberInfo?.trialInfo?.sessionsUsed}
        trialMaxSessions={subscriberInfo?.trialInfo?.maxSessions}
        trialExpiresAt={subscriberInfo?.trialInfo?.expiresAt || undefined}
        onLogout={handleLogout}
      />

      {/* Store Modal */}
      <StoreModal
        open={storeOpen}
        onOpenChange={setStoreOpen}
        gemsBalance={gemsBalance}
        subscriptionCode={subscriberInfo?.subscriptionCode}
        onPurchaseComplete={(newBalance) => setGemsBalance(newBalance)}
      />

      {/* Main content area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
