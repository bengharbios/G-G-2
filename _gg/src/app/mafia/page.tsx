'use client';

import { useSyncExternalStore, useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/lib/game-store';
import LandingPage from '@/components/mafia/LandingPage';
import GameSetup from '@/components/mafia/GameSetup';
import DiwaniyaSetup from '@/components/mafia/DiwaniyaSetup';
import CardDistribution from '@/components/mafia/CardDistribution';
import NightPhase from '@/components/mafia/NightPhase';
import DayPhase from '@/components/mafia/DayPhase';
import GameOver from '@/components/mafia/GameOver';
import GameIntroCard from '@/components/mafia/GameIntroCard';
import WelcomePopup from '@/components/mafia/WelcomePopup';
import { useHostHeartbeat } from '@/lib/yalla-game-helpers';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

// ============================================================
// LEGACY HOST HEARTBEAT (preserved — posts to /api/room)
// ============================================================
function useLegacyHostHeartbeat() {
  const { roomCode, gameMode } = useGameStore();

  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    const sendHeartbeat = () => {
      fetch(`/api/room/${roomCode}/heartbeat`, { method: 'POST' }).catch(() => {});
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);
    return () => clearInterval(interval);
  }, [gameMode, roomCode]);

  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    const handleBeforeUnload = () => {
      const baseUrl = window.location.origin;
      navigator.sendBeacon(
        `${baseUrl}/api/room/${roomCode}`,
        JSON.stringify({ _method: 'DELETE' })
      );
      try {
        fetch(`/api/room/${roomCode}`, { method: 'DELETE' });
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameMode, roomCode]);
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function useQueryMode() {
  const [mode, setMode] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const m = url.searchParams.get('mode');
    if (m) setMode(m);
  }, []);
  return mode;
}

export default function Home() {
  return (
    <SubscriptionGuard gameSlug="mafia">
      <GameLayout gameSlug="mafia" gameName="المافيا" gameEmoji="🕵️" accentColor="red">
        <HomeContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function HomeContent() {
  const { phase, roomCode, gameMode, setGameMode, setRoomCode } = useGameStore();
  const mounted = useHydrated();
  // Shared heartbeat hook (posts to /api/mafia-room/[code]/heartbeat)
  useHostHeartbeat('mafia', gameMode ?? undefined, roomCode);
  // Legacy heartbeat (posts to existing /api/room/[code]/heartbeat — working API)
  useLegacyHostHeartbeat();
  const queryMode = useQueryMode();

  const [showGodfatherSetup, setShowGodfatherSetup] = useState(false);
  const [showDiwaniyaSetup, setShowDiwaniyaSetup] = useState(false);
  const [restoredFromPersist, setRestoredFromPersist] = useState(false);
  const [showGameIntro, setShowGameIntro] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // After mount, check if welcome was shown before
  useEffect(() => {
    if (!localStorage.getItem('mafia_welcome_shown')) {
      setShowWelcome(true);
    }
  }, []);

  // Game intro: only show ONCE per device (first game start ever)
  const [gameIntroDismissed, setGameIntroDismissed] = useState(false);
  useEffect(() => {
    if (localStorage.getItem('mafia_game_intro_shown')) {
      setGameIntroDismissed(true);
    }
  }, []);

  // Restore correct screen from persisted Zustand state after hydration
  useEffect(() => {
    if (!mounted || restoredFromPersist) return;
    setRestoredFromPersist(true);

    if (phase === 'setup') {
      if (gameMode === 'diwaniya' && roomCode) {
        setShowDiwaniyaSetup(true);
      } else if (gameMode === 'godfather') {
        setShowGodfatherSetup(true);
      }
    }
  }, [mounted, phase, gameMode, roomCode, restoredFromPersist]);

  // Handle ?mode=godfather or ?mode=diwaniya query (deep-link to setup)
  useEffect(() => {
    if (!mounted || restoredFromPersist) return;
    if (!queryMode) return;
    if (phase !== 'setup') return;
    queueMicrotask(() => {
      if (queryMode === 'godfather') {
        setGameMode('godfather');
        setRoomCode(null);
        setShowGodfatherSetup(true);
      } else if (queryMode === 'diwaniya') {
        setGameMode('diwaniya');
        setShowDiwaniyaSetup(true);
      }
    });
  }, [mounted, queryMode, phase, setGameMode, setRoomCode, restoredFromPersist]);

  // Show intro card when game starts — but only ONCE per device ever
  useEffect(() => {
    if (phase === 'card_distribution' && !gameIntroDismissed && restoredFromPersist) {
      setShowGameIntro(true);
    }
  }, [phase, gameIntroDismissed, restoredFromPersist]);

  // Detect phase change from setup to card_distribution for new game starts
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== 'card_distribution' && phase === 'card_distribution' && !gameIntroDismissed) {
      setShowGameIntro(true);
    }
    prevPhaseRef.current = phase;
  }, [phase, gameIntroDismissed]);

  // Reset UI state when game is explicitly reset
  useEffect(() => {
    if (phase === 'setup' && !gameMode && !roomCode) {
      setShowGodfatherSetup(false);
      setShowDiwaniyaSetup(false);
      setShowGameIntro(false);
    }
  }, [phase, gameMode, roomCode]);

  const handleDismissWelcome = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem('mafia_welcome_shown', 'true');
  }, []);

  const handleDismissGameIntro = useCallback(() => {
    setShowGameIntro(false);
    localStorage.setItem('mafia_game_intro_shown', 'true');
  }, []);

  const handleStartGodfather = useCallback(() => {
    if (showWelcome) {
      setShowWelcome(false);
      localStorage.setItem('mafia_welcome_shown', 'true');
    }
    setShowGodfatherSetup(true);
  }, [showWelcome]);

  const handleStartDiwaniya = useCallback(() => {
    if (showWelcome) {
      setShowWelcome(false);
      localStorage.setItem('mafia_welcome_shown', 'true');
    }
    setShowDiwaniyaSetup(true);
  }, [showWelcome]);

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#041F18',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🕵️</div>
          <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // ============================
  // SETUP PHASE
  // ============================
  if (phase === 'setup') {
    if (!showGodfatherSetup && !showDiwaniyaSetup) {
      return (
        <div style={{ height: '100vh', overflow: 'hidden' }}>
          <main>
            <LandingPage onStartGodfather={handleStartGodfather} onStartDiwaniya={handleStartDiwaniya} />
          </main>
          <WelcomePopup show={showWelcome} onDismiss={handleDismissWelcome} />
        </div>
      );
    }

    if (showGodfatherSetup) {
      return (
        <div style={{ height: '100vh', overflow: 'hidden' }}>
          <main>
            <GameSetup onStartGame={() => {}} />
          </main>
        </div>
      );
    }

    if (showDiwaniyaSetup) {
      return (
        <div style={{ height: '100vh', overflow: 'hidden' }}>
          <main>
            <DiwaniyaSetup onStartGame={() => {}} />
          </main>
        </div>
      );
    }
  }

  // ============================
  // GAME PHASES
  // ============================
  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <GameIntroCard
        show={showGameIntro}
        onDismiss={handleDismissGameIntro}
        gameMode={gameMode}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {phase === 'card_distribution' && <CardDistribution />}

        {[
          'night_start',
          'night_mafia_wake',
          'night_boss_kill',
          'night_silencer',
          'night_mafia_sleep',
          'night_medic',
          'night_sniper',
          'night_end',
        ].includes(phase) && <NightPhase />}

        {[
          'day_announcements',
          'day_mayor_reveal',
          'day_discussion',
          'day_voting',
          'day_elimination',
          'good_son_revenge',
        ].includes(phase) && <DayPhase />}

        {phase === 'game_over' && <GameOver />}
      </main>
    </div>
  );
}
