// ============================================================
// SOUND UTILITY - Game sound effects with volume control
// ============================================================

let owlAudio: HTMLAudioElement | null = null;
let roosterAudio: HTMLAudioElement | null = null;
let eliminationAudio: HTMLAudioElement | null = null;
let bgMusicAudio: HTMLAudioElement | null = null;

const VOLUME_KEY = 'mafia_volume';
const MUTED_KEY = 'mafia_muted';

let globalVolume = 0.5;
let globalMuted = false;

// Volume listeners
type VolumeListener = (volume: number, muted: boolean) => void;
const listeners: VolumeListener[] = [];

export function getVolume(): number {
  return globalVolume;
}

export function getMuted(): boolean {
  return globalMuted;
}

export function setVolume(vol: number) {
  globalVolume = Math.max(0, Math.min(1, vol));
  if (typeof window !== 'undefined') {
    localStorage.setItem(VOLUME_KEY, String(globalVolume));
  }
  applyVolumeToAll();
  notifyListeners();
}

export function toggleMuted(): boolean {
  globalMuted = !globalMuted;
  if (typeof window !== 'undefined') {
    localStorage.setItem(MUTED_KEY, String(globalMuted));
  }
  applyVolumeToAll();
  notifyListeners();
  return globalMuted;
}

export function setMuted(muted: boolean) {
  globalMuted = muted;
  if (typeof window !== 'undefined') {
    localStorage.setItem(MUTED_KEY, String(globalMuted));
  }
  applyVolumeToAll();
  notifyListeners();
}

export function onVolumeChange(listener: VolumeListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

function notifyListeners() {
  for (const l of listeners) {
    try { l(globalVolume, globalMuted); } catch {}
  }
}

function applyVolumeToAll() {
  const vol = globalMuted ? 0 : globalVolume;
  [owlAudio, roosterAudio, eliminationAudio].forEach(a => {
    if (a) a.volume = vol;
  });
  // BGM at 30% of game volume
  if (bgMusicAudio) bgMusicAudio.volume = globalMuted ? 0 : globalVolume * 0.3;
}

// Initialize from localStorage
export function initVolumeFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const savedVol = localStorage.getItem(VOLUME_KEY);
    const savedMuted = localStorage.getItem(MUTED_KEY);
    if (savedVol !== null) globalVolume = parseFloat(savedVol) || 0.5;
    if (savedMuted !== null) globalMuted = savedMuted === 'true';
  } catch {}
}

function getAudio(src: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  try {
    const audio = new Audio(src);
    audio.volume = globalMuted ? 0 : globalVolume;
    audio.loop = false;
    return audio;
  } catch {
    return null;
  }
}

export function playNightSound() {
  if (typeof window === 'undefined') return;
  try {
    if (!owlAudio) {
      owlAudio = getAudio('/sounds/owl-hooting-223549.mp3');
    }
    if (owlAudio) {
      owlAudio.volume = globalMuted ? 0 : globalVolume;
      owlAudio.currentTime = 0;
      owlAudio.play().catch(() => {});
    }
  } catch {}
}

export function playDaySound() {
  if (typeof window === 'undefined') return;
  try {
    if (!roosterAudio) {
      roosterAudio = getAudio('/sounds/rooster-crowing-364473.mp3');
    }
    if (roosterAudio) {
      roosterAudio.volume = globalMuted ? 0 : globalVolume;
      roosterAudio.currentTime = 0;
      roosterAudio.play().catch(() => {});
    }
  } catch {}
}

export function playEliminationSound() {
  if (typeof window === 'undefined') return;
  try {
    if (!eliminationAudio) {
      eliminationAudio = getAudio('/sounds/elimination.mp3');
    }
    if (eliminationAudio) {
      eliminationAudio.volume = globalMuted ? 0 : globalVolume;
      eliminationAudio.currentTime = 0;
      eliminationAudio.play().catch(() => {});
    }
  } catch {}
}

// Background music (Mafia theme)
export function playBgMusic() {
  if (typeof window === 'undefined') return;
  try {
    if (!bgMusicAudio) {
      bgMusicAudio = getAudio('/sounds/mafia-theme.mp3');
      if (bgMusicAudio) {
        bgMusicAudio.loop = true;
      }
    }
    if (bgMusicAudio) {
      bgMusicAudio.volume = globalMuted ? 0 : globalVolume * 0.3; // BGM at 30% of game volume
      bgMusicAudio.play().catch(() => {});
    }
  } catch {}
}

export function pauseBgMusic() {
  if (bgMusicAudio) {
    bgMusicAudio.pause();
  }
}

export function resumeBgMusic() {
  if (bgMusicAudio) {
    bgMusicAudio.volume = globalMuted ? 0 : globalVolume * 0.3;
    bgMusicAudio.play().catch(() => {});
  }
}

export function isBgMusicPlaying(): boolean {
  if (!bgMusicAudio) return false;
  return !bgMusicAudio.paused;
}

export function stopBgMusic() {
  if (bgMusicAudio) {
    bgMusicAudio.pause();
    bgMusicAudio.currentTime = 0;
    bgMusicAudio = null;
  }
}

// Auto-start background music on first user interaction
let autoStartDone = false;
let autoStartEnabled = false;

export function enableBgMusicAutoStart() {
  if (typeof window === 'undefined') return;
  if (autoStartDone) return;
  autoStartEnabled = true;

  const tryStart = () => {
    if (autoStartDone) return;
    autoStartDone = true;
    document.removeEventListener('click', tryStart);
    document.removeEventListener('touchstart', tryStart);
    document.removeEventListener('keydown', tryStart);
    playBgMusic();
  };

  document.addEventListener('click', tryStart, { once: true });
  document.addEventListener('touchstart', tryStart, { once: true });
  document.addEventListener('keydown', tryStart, { once: true });

  // If music was already initialized (e.g. page was interacted with before this call), try immediately
  if (bgMusicAudio && bgMusicAudio.paused) {
    playBgMusic();
    autoStartDone = true;
    document.removeEventListener('click', tryStart);
    document.removeEventListener('touchstart', tryStart);
    document.removeEventListener('keydown', tryStart);
  }
}
