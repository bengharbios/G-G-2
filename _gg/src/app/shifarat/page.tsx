'use client';

import { useSyncExternalStore, useState, useEffect, useRef } from 'react';
import { useShifaratStore } from '@/lib/shifarat-store';
import LandingPage from '@/components/shifarat/LandingPage';
import GameSetup from '@/components/shifarat/GameSetup';
import DiwaniyaSetup from '@/components/shifarat/DiwaniyaSetup';
import PlayingPhase from '@/components/shifarat/PlayingPhase';
import GameOver from '@/components/shifarat/GameOver';
import { useHostHeartbeat } from '@/lib/yalla-game-helpers';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

// ============================================================
// HOST HEARTBEAT HOOK (legacy path /api/room — preserved)
// ============================================================
function useLegacyHostHeartbeat() {
  const { roomCode, gameMode } = useShifaratStore();

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

export default function ShifaratPage() {
  return (
    <SubscriptionGuard gameSlug="shifarat">
      <GameLayout gameSlug="shifarat" gameName="الشيفرات" gameEmoji="🎯" accentColor="emerald">
        <HomeContent />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function HomeContent() {
  const {
    phase, roomCode, gameMode,
    setGameMode,
    setRoomCode,
    resetGame,
    startGame,
  } = useShifaratStore();
  const mounted = useHydrated();
  // Shared heartbeat hook (posts to /api/shifarat-room/[code]/heartbeat)
  useHostHeartbeat('shifarat', gameMode ?? undefined, roomCode);
  // Legacy heartbeat (posts to existing /api/room/[code]/heartbeat — working API)
  useLegacyHostHeartbeat();
  const queryMode = useQueryMode();

  const [showGodfatherSetup, setShowGodfatherSetup] = useState(false);
  const [showDiwaniyaSetup, setShowDiwaniyaSetup] = useState(false);
  const hasRestoredRef = useRef(false);

  // Restore the correct setup view from persisted state
  useEffect(() => {
    if (!mounted || hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    queueMicrotask(() => {
      if (phase === 'setup') {
        if (gameMode === 'diwaniya' && roomCode) setShowDiwaniyaSetup(true);
        else if (gameMode === 'godfather') setShowGodfatherSetup(true);
      }
    });
  }, [mounted, phase, gameMode, roomCode]);

  // Handle ?mode=godfather or ?mode=diwaniya query (deep-link to setup)
  useEffect(() => {
    if (!mounted || hasRestoredRef.current) return;
    if (!queryMode) return;
    if (phase !== 'setup') return;
    queueMicrotask(() => {
      if (queryMode === 'godfather') {
        setGameMode('godfather');
        useShifaratStore.getState().setRoomCode(null);
        setShowGodfatherSetup(true);
      } else if (queryMode === 'diwaniya') {
        setGameMode('diwaniya');
        setShowDiwaniyaSetup(true);
      }
    });
  }, [mounted, queryMode, phase, setGameMode]);

  // Reset setup view when game is fully reset
  useEffect(() => {
    if (phase === 'setup' && !gameMode && !roomCode) {
      queueMicrotask(() => {
        setShowGodfatherSetup(false);
        setShowDiwaniyaSetup(false);
      });
    }
  }, [phase, gameMode, roomCode]);

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
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
          <p style={{ color: '#9fc4b4', fontSize: '14px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (phase === 'setup') {
    if (!showGodfatherSetup && !showDiwaniyaSetup) {
      return (
        <main style={{ height: '100vh', overflow: 'hidden' }}>
          <LandingPage onSelectMode={(mode) => {
            if (mode === 'godfather') setShowGodfatherSetup(true);
            else setShowDiwaniyaSetup(true);
          }} />
        </main>
      );
    }
    if (showGodfatherSetup) {
      const handleStart = (settings: {
        team1Name: string;
        team2Name: string;
        timer: number;
        categories: string[];
        firstTeam: 'red' | 'blue';
        redSpymaster?: string;
        blueSpymaster?: string;
      }) => {
        useShifaratStore.getState().startGame(
          settings.team1Name,
          settings.team2Name,
          settings.categories,
          settings.timer,
          settings.firstTeam,
          settings.redSpymaster,
          settings.blueSpymaster,
        );
        setShowGodfatherSetup(false);
      };
      return (
        <main style={{ height: '100vh', overflow: 'hidden' }}>
          <GameSetup onStart={handleStart} onBack={() => { resetGame(); setShowGodfatherSetup(false); }} />
        </main>
      );
    }
    if (showDiwaniyaSetup) {
      const handleStart = (_code: string, settings: any) => {
        useShifaratStore.getState().startGame(
          settings.team1Name,
          settings.team2Name,
          settings.categories,
          settings.timer,
          settings.firstTeam,
          settings.redSpymaster,
          settings.blueSpymaster,
        );
        useShifaratStore.getState().setRoomCode(_code);
        useShifaratStore.getState().setGameMode('diwaniya');
        setShowDiwaniyaSetup(false);
      };
      return (
        <main style={{ height: '100vh', overflow: 'hidden' }}>
          <DiwaniyaSetup onStart={handleStart} onBack={() => { resetGame(); setShowDiwaniyaSetup(false); }} />
        </main>
      );
    }
  }

  // In-game phases
  const isActiveGame = phase === 'spymaster_view' || phase === 'clue_given' || phase === 'team_guessing' || phase === 'turn_result' || phase === 'turn_switch';

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isActiveGame && <PlayingPhase />}
        {phase === 'game_over' && <GameOver />}
      </main>
    </div>
  );
}
