// ============================================================
// Yalla Game Helpers — Shared utilities for all games
// (Yalla Ludo style consistent across all 9 games)
// ============================================================

import { useState, useEffect } from 'react';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
} from './sounds';

// StrokeTextStyle_Yes (from yalla ludo styles.xml)
// textColor: #aa6e1f (ذهبي داكن), stroke_color: #feef91 (ذهبي فاتح)
export const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

// Game-specific config — used to theme each game's Yalla Ludo UI
export interface YallaGameConfig {
  slug: string;        // e.g. 'prison', 'risk', 'mustathib'
  title: string;       // e.g. 'السجن'
  subtitle: string;    // e.g. 'Prison — Escape the cell'
  logoPath: string;    // e.g. '/yalla-games/prison.png'
  floatingEmojis: string[];  // e.g. ['🔒', '⛓️', '🔑']
  themeColor?: string; // optional accent color (defaults to gold)
}

// Common body class for in-game-setup screens — hides header chrome + bottom nav
export function useInGameSetupMode() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('in-game-setup');
    return () => {
      document.body.classList.remove('in-game-setup');
    };
  }, []);
}

// Hook for header sound toggle state
export function useYallaSoundState() {
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setMusicOn(isMusicEnabled());
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  return { musicOn, soundOn, toggleMusic, toggleSound };
}

// Hook for diwaniya host heartbeat — sends PUT to /api/{gameSlug}-room/[code]/heartbeat
// every 5 seconds. Also sends DELETE on beforeunload.
export function useHostHeartbeat(gameSlug: string, gameMode: string | undefined, roomCode: string | null) {
  useEffect(() => {
    if (gameMode !== 'diwaniya' || !roomCode) return;

    // Try multiple API path patterns — most games use /api/{slug}-room/[code]/heartbeat
    // Some games (tabot, mafia, shifarat, baharharb, familyfeud, mustathib) may use /api/room/[code]/heartbeat
    const heartbeatUrl = `/api/${gameSlug}-room/${roomCode}/heartbeat`;

    const sendHeartbeat = () => {
      fetch(heartbeatUrl, { method: 'POST' }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 5000);

    const handleBeforeUnload = () => {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      navigator.sendBeacon(
        `${baseUrl}/api/${gameSlug}-room/${roomCode}`,
        JSON.stringify({ _method: 'DELETE' })
      );
      try {
        fetch(`/api/${gameSlug}-room/${roomCode}`, { method: 'DELETE' });
      } catch { /* ignore */ }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameSlug, gameMode, roomCode]);
}

// Hook to fetch viewer count + viewer list periodically (diwaniya mode only)
export function useViewerCount(gameSlug: string, isDiwaniyaHost: boolean, roomCode: string | null) {
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<Array<{ id: string; name: string; joinedAt: number }>>([]);

  useEffect(() => {
    if (!isDiwaniyaHost || !roomCode) return;
    const fetchViewers = () => {
      fetch(`/api/${gameSlug}-room/${roomCode}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.room?.spectators) {
            setViewers(d.room.spectators);
            setViewerCount(d.room.spectators.length);
          }
        })
        .catch(() => {});
    };
    fetchViewers();
    const iv = setInterval(fetchViewers, 5000);
    return () => clearInterval(iv);
  }, [gameSlug, isDiwaniyaHost, roomCode]);

  return { viewerCount, viewers };
}

// Hook to build smart deep-link URLs (like YoYo)
export function useShareLinks(gameSlug: string, isDiwaniyaHost: boolean, roomCode: string | null) {
  const [shareLink, setShareLink] = useState('');
  const [directLink, setDirectLink] = useState('');
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!isDiwaniyaHost || !roomCode) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const pkg = 'com.bengharbios.ggames';

    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        const hostUserId = d?.user?.id || '';
        const fromParam = hostUserId ? `&from=${encodeURIComponent(hostUserId)}` : '';
        setShareLink(`${baseUrl}/r/${gameSlug}/${roomCode}?pkg=${pkg}${fromParam}`);
        setDirectLink(`${baseUrl}/r/${gameSlug}/${roomCode}?pkg=${pkg}${fromParam}&direct=1`);
      })
      .catch(() => {
        setShareLink(`${baseUrl}/r/${gameSlug}/${roomCode}?pkg=${pkg}`);
        setDirectLink(`${baseUrl}/r/${gameSlug}/${roomCode}?pkg=${pkg}&direct=1`);
      });
  }, [gameSlug, isDiwaniyaHost, roomCode]);

  const copyShareLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = shareLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const shareExternally = async () => {
    if (!directLink) return;
    const shareData = {
      title: 'شاهد المعركة على G-G',
      text: 'انضم لمشاهدة المعركة:',
      url: directLink,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(directLink).then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2000);
        });
      }
    } catch { /* user cancelled */ }
  };

  return { shareLink, directLink, shareCopied, copyShareLink, shareExternally };
}

// Hook to fetch godfather (host) info + award rewards when game ends
export function useGameRewards(trigger: boolean, gameSlug: string, outcome: 'win' | 'play' | 'loss' = 'win', playerCount: number = 2) {
  const [godfather, setGodfather] = useState<{ name: string; avatar: string } | null>(null);
  const [rewards, setRewards] = useState<{ xp: number; gold: number; leveledUp: boolean; newLevel: number | null } | null>(null);

  useEffect(() => {
    if (!trigger) return;
    let cancelled = false;

    async function fetchAndReward() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (cancelled) return;
        if (meData.success && meData.user) {
          const u = meData.user;
          const avatarUrl = u.avatar || `/yalla-avatars/defaultPhoto_${((parseInt(u.id || '0', 10) || 0) % 12) + 1}.png`;
          setGodfather({ name: u.displayName || u.username || 'العراب', avatar: avatarUrl });
        }

        try {
          const rewardRes = await fetch('/api/game/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameSlug, outcome, playerCount }),
          });
          const rewardData = await rewardRes.json();
          if (cancelled) return;
          if (rewardData.success) {
            setRewards({
              xp: rewardData.xpAwarded || 0,
              gold: rewardData.goldAwarded || 0,
              leveledUp: !!rewardData.leveledUp,
              newLevel: rewardData.newLevel ?? null,
            });
          } else {
            setRewards({ xp: 0, gold: 0, leveledUp: false, newLevel: null });
          }
        } catch {
          if (!cancelled) setRewards({ xp: 0, gold: 0, leveledUp: false, newLevel: null });
        }
      } catch { /* silent */ }
    }
    fetchAndReward();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return { godfather, rewards };
}
