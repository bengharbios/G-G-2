'use client';

import { useSyncExternalStore, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFamilyFeudStore } from '@/lib/familyfeud-store';
import LandingPage from '@/components/familyfeud/LandingPage';
import GameSetup from '@/components/familyfeud/GameSetup';
import GameBoard from '@/components/familyfeud/GameBoard';
import GameOver from '@/components/familyfeud/GameOver';
import { useHostHeartbeat } from '@/lib/yalla-game-helpers';
import SubscriptionGuard from '@/components/SubscriptionGuard';

// ============================================================
// Hydration guard
// ============================================================
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// ============================================================
// Main Page
// ============================================================
export default function FamilyFeudPage() {
  return (
    <SubscriptionGuard gameSlug="familyfeud">
      <FamilyFeudContent />
    </SubscriptionGuard>
  );
}

function FamilyFeudContent() {
  const { uiPhase, setUiPhase, setGameMode, gameMode, roomCode, showGameOver } = useFamilyFeudStore();
  const mounted = useHydrated();
  const searchParams = useSearchParams();

  // Start host heartbeat in Diwaniya mode (uses generic /api/familyfeud-room/[code]/heartbeat pattern)
  useHostHeartbeat('familyfeud', gameMode, roomCode);

  // ===== قراءة ?mode=godfather أو ?mode=diwaniya من URL =====
  // إذا جاء من صفحة الألعاب (BattlePage)، تخطي LandingPage وانتقل مباشرة لـ Setup
  useEffect(() => {
    if (!mounted) return;
    const mode = searchParams.get('mode');
    if (mode === 'godfather' && uiPhase === 'landing') {
      setGameMode('classic');
      setUiPhase('godfather_setup');
    } else if (mode === 'diwaniya' && uiPhase === 'landing') {
      setGameMode('diwaniya');
      setUiPhase('diwaniya_setup');
    }
  }, [mounted, searchParams, uiPhase, setGameMode, setUiPhase]);

  const handleStartLocal = useCallback(() => {
    setGameMode('classic');
    setUiPhase('godfather_setup');
  }, [setUiPhase, setGameMode]);

  const handleStartDiwaniya = useCallback(() => {
    setGameMode('diwaniya');
    setUiPhase('diwaniya_setup');
  }, [setUiPhase, setGameMode]);

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆👨‍👩‍👧‍👦</div>
          <p style={{ color: '#9fc4b4' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // ============================
  // LANDING PAGE
  // ============================
  if (uiPhase === 'landing') {
    return (
      <main>
        <LandingPage onStartLocal={handleStartLocal} onStartDiwaniya={handleStartDiwaniya} />
      </main>
    );
  }

  // ============================
  // SETUP PAGE (godfather_setup or diwaniya_setup — same GameSetup component)
  // ============================
  if (uiPhase === 'godfather_setup' || uiPhase === 'diwaniya_setup') {
    return (
      <main>
        <GameSetup />
      </main>
    );
  }

  // ============================
  // PLAYING / GAME OVER (NO SCROLL)
  // ============================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <main style={{ flex: 1, overflow: 'hidden' }}>
        {showGameOver ? <GameOver /> : <GameBoard />}
      </main>
    </div>
  );
}
