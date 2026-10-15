// ============================================================
// SOUND UTILITY - Game sound effects with volume control
// ============================================================

let owlAudio: HTMLAudioElement | null = null;
let roosterAudio: HTMLAudioElement | null = null;
let eliminationAudio: HTMLAudioElement | null = null;
let bgMusicAudio: HTMLAudioElement | null = null;

const VOLUME_KEY = 'mafia_volume';
const MUTED_KEY = 'mafia_muted';
const MUSIC_ENABLED_KEY = 'yalla-music-enabled'; // تفضيل الموسيقى العام (خارج الألعاب)
const SOUND_ENABLED_KEY = 'yalla-sound-enabled'; // تفضيل الصوت العام

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

// ============================================================
// Web Audio API generated sounds for mustathib role wake-ups
// (no audio files needed — tones generated programmatically)
// ============================================================

let webAudioCtx: AudioContext | null = null;

function getWebAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!webAudioCtx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      webAudioCtx = new AC();
    }
    if (webAudioCtx.state === 'suspended') {
      webAudioCtx.resume().catch(() => {});
    }
    return webAudioCtx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, delay = 0) {
  const ctx = getWebAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur);
  } catch {}
}

// Owl hoot — soft descending "hoo-hoo" (two tones, low-mid)
export function playOwlSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(420, 0.35, 'sine', 0.18, 0);
  tone(360, 0.42, 'sine', 0.18, 0.32);
  tone(330, 0.32, 'sine', 0.14, 0.78);
}

// Wolf howl — long low-pitched growl with slight rise
export function playWolfSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  // Growl
  tone(110, 0.5, 'sawtooth', 0.12, 0);
  // Rising howl
  tone(180, 0.4, 'sawtooth', 0.14, 0.15);
  tone(220, 0.6, 'sawtooth', 0.16, 0.35);
  tone(180, 0.5, 'sawtooth', 0.12, 0.85);
}

// Crow caw — short harsh pulses
export function playCrowSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(800, 0.1, 'square', 0.1, 0);
  tone(700, 0.12, 'square', 0.12, 0.13);
  tone(850, 0.1, 'square', 0.1, 0.28);
  tone(720, 0.14, 'square', 0.13, 0.41);
}

// Magic chime — fortune teller bell melody (high pitched, ascending)
export function playMagicChime() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(1318.51, 0.18, 'sine', 0.16, 0);      // E6
  tone(1567.98, 0.18, 'sine', 0.16, 0.12);   // G6
  tone(2093, 0.32, 'triangle', 0.18, 0.24);  // C7
  tone(2637, 0.4, 'sine', 0.14, 0.42);       // E7 sparkle
}

// Doctor heal — warm gentle chord
export function playDoctorSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(523.25, 0.5, 'sine', 0.12, 0);     // C5
  tone(659.25, 0.5, 'sine', 0.12, 0);     // E5
  tone(783.99, 0.6, 'sine', 0.14, 0.05);  // G5
}

// Vote ding — for voting phase
export function playVoteSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(880, 0.15, 'sine', 0.16, 0);
  tone(1108.73, 0.22, 'sine', 0.2, 0.1);
}

// Reveal flip — card flip sound (for role reveal phase)
export function playRevealSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(600, 0.08, 'square', 0.08, 0);
  tone(900, 0.12, 'sine', 0.12, 0.06);
  tone(1200, 0.16, 'triangle', 0.1, 0.12);
}

// Death sting — when a player dies at night
export function playDeathSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(400, 0.18, 'sawtooth', 0.18, 0);
  tone(300, 0.22, 'sawtooth', 0.16, 0.12);
  tone(200, 0.4, 'sawtooth', 0.14, 0.24);
}

// Play sound for a specific role wake-up
export function playRoleSound(role: 'owl' | 'crow' | 'werewolf' | 'fortuneTeller' | 'doctor' | 'villager') {
  switch (role) {
    case 'owl': playOwlSound(); break;
    case 'crow': playCrowSound(); break;
    case 'werewolf': playWolfSound(); break;
    case 'fortuneTeller': playMagicChime(); break;
    case 'doctor': playDoctorSound(); break;
    case 'villager': break; // no sound
  }
}

// ============================================================
// Generic UI / Game event sounds — used by all 9 games
// (Web Audio API synthesis — no audio files needed)
// ============================================================

// Short UI click — for button presses
export function playClickSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(800, 0.05, 'square', 0.12, 0);
}

// Card flip — short noise burst for card flip animation
export function playCardFlipSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  // Two quick tones to mimic the swish + slap of a flipped card
  tone(600, 0.06, 'square', 0.10, 0);
  tone(900, 0.10, 'triangle', 0.14, 0.04);
  tone(1200, 0.08, 'sine', 0.10, 0.10);
}

// Win — 5-tone ascending victory fanfare (C-E-G-C-high-C)
export function playWinSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  // C5=523.25, E5=659.25, G5=783.99, C6=1046.50, C7=2093
  tone(523.25, 0.16, 'triangle', 0.18, 0);
  tone(659.25, 0.16, 'triangle', 0.18, 0.16);
  tone(783.99, 0.16, 'triangle', 0.20, 0.32);
  tone(1046.50, 0.20, 'triangle', 0.22, 0.48);
  tone(2093, 0.40, 'sine', 0.18, 0.70);
}

// Lose — 3-tone descending sad trombone (C5 -> A4 -> F4)
export function playLoseSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  // C5=523.25, A4=440, F4=349.23
  tone(523.25, 0.30, 'sawtooth', 0.16, 0);
  tone(440, 0.30, 'sawtooth', 0.16, 0.30);
  tone(349.23, 0.50, 'sawtooth', 0.18, 0.60);
}

// Tie — neutral chime, 3 notes (C-E-G soft)
export function playTieSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(523.25, 0.20, 'sine', 0.16, 0);     // C5
  tone(659.25, 0.20, 'sine', 0.16, 0.18);  // E5
  tone(783.99, 0.30, 'sine', 0.18, 0.36);  // G5
}

// Notification — soft bell for turn change / new action
export function playNotifySound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(660, 0.15, 'sine', 0.16, 0);
}

// Error — buzz for invalid action
export function playErrorSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(200, 0.20, 'sawtooth', 0.18, 0);
}

// Level up — magical chime with sparkle (E6-G6-C7-E7)
export function playLevelUpSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  // E6=1318.51, G6=1567.98, C7=2093, E7=2637
  tone(1318.51, 0.18, 'sine', 0.16, 0);
  tone(1567.98, 0.18, 'sine', 0.16, 0.12);
  tone(2093, 0.32, 'triangle', 0.18, 0.24);
  tone(2637, 0.40, 'sine', 0.14, 0.42);
}

// Coin — 2 quick high tones for gold reward jingle
export function playCoinSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  // Quick B5 -> E6 sparkle
  tone(987.77, 0.08, 'sine', 0.16, 0);
  tone(1318.51, 0.18, 'sine', 0.18, 0.07);
}

// Bomb — low rumble for risk bomb card
export function playBombSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(110, 0.20, 'sawtooth', 0.20, 0);
  tone(80, 0.40, 'sawtooth', 0.22, 0.18);
  tone(55, 0.50, 'square', 0.16, 0.40);
}

// Correct — bright ding for correct answer
export function playCorrectSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(880, 0.10, 'sine', 0.18, 0);      // A5
  tone(1318.51, 0.20, 'sine', 0.22, 0.08); // E6
}

// Wrong — descending wrong answer buzz
export function playWrongSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(330, 0.15, 'sawtooth', 0.18, 0);
  tone(220, 0.30, 'sawtooth', 0.20, 0.14);
}

// Strike — strike sound (3 strikes) for family feud
export function playStrikeSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(150, 0.18, 'square', 0.20, 0);
  tone(120, 0.30, 'sawtooth', 0.22, 0.16);
}

// Reveal answer — for baharharb answer reveal
export function playRevealSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(440, 0.10, 'triangle', 0.16, 0);
  tone(660, 0.14, 'triangle', 0.18, 0.08);
  tone(880, 0.18, 'sine', 0.18, 0.18);
}

// Tick — fast money timer tick
export function playTickSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(1200, 0.04, 'square', 0.10, 0);
}

// Sparkle — golden multiplier sound (risk2)
export function playSparkleSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(1567.98, 0.10, 'sine', 0.16, 0);   // G6
  tone(2093, 0.10, 'sine', 0.16, 0.08);   // C7
  tone(2637, 0.20, 'triangle', 0.18, 0.16); // E7
}

// Coffin — low ominous tone for coffin door (tabot)
export function playCoffinSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(70, 0.5, 'sawtooth', 0.20, 0);
  tone(90, 0.4, 'square', 0.16, 0.20);
}

// Key — bright jingle for key door (tabot)
export function playKeySound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(880, 0.08, 'sine', 0.18, 0);
  tone(1318.51, 0.12, 'sine', 0.20, 0.08);
  tone(1760, 0.16, 'sine', 0.18, 0.16);
}

// Cell open — prison cell unlock
export function playCellOpenSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(400, 0.06, 'square', 0.12, 0);
  tone(600, 0.10, 'square', 0.14, 0.05);
  tone(900, 0.18, 'sine', 0.18, 0.12);
}

// Imprison — low tone for player being sent to prison
export function playImprisonSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(220, 0.15, 'sawtooth', 0.18, 0);
  tone(150, 0.35, 'sawtooth', 0.20, 0.14);
}

// Free — high bright tone for freeing a prisoner
export function playFreeSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(783.99, 0.10, 'sine', 0.18, 0);    // G5
  tone(1046.50, 0.14, 'sine', 0.20, 0.08); // C6
  tone(1318.51, 0.18, 'sine', 0.18, 0.16); // E6
}

// Assassinate — shifarat assassin kill sound (sharp sting)
export function playAssassinateSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(1200, 0.05, 'square', 0.20, 0);
  tone(800, 0.08, 'sawtooth', 0.18, 0.04);
  tone(300, 0.30, 'sawtooth', 0.20, 0.10);
}

// Spymaster — soft chime for spymaster clue (shifarat)
export function playSpymasterSound() {
  if (typeof window === 'undefined') return;
  if (globalMuted) return;
  tone(523.25, 0.12, 'sine', 0.14, 0);
  tone(659.25, 0.16, 'sine', 0.16, 0.10);
}

// Auto-start background music on first user interaction (عند فتح الموقع، ليس فقط في الألعاب)
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
    // شغّل الموسيقى فقط إن لم يُعطّل المستخدم تفضيلها
    if (isMusicEnabled()) playBgMusic();
  };

  document.addEventListener('click', tryStart, { once: true });
  document.addEventListener('touchstart', tryStart, { once: true });
  document.addEventListener('keydown', tryStart, { once: true });

  // If music was already initialized, try immediately
  if (bgMusicAudio && bgMusicAudio.paused && isMusicEnabled()) {
    playBgMusic();
    autoStartDone = true;
    document.removeEventListener('click', tryStart);
    document.removeEventListener('touchstart', tryStart);
    document.removeEventListener('keydown', tryStart);
  }
}

// ─── تفضيلات عامة للصوت والموسيقى (خارج الألعاب) ───
export function isMusicEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const v = localStorage.getItem(MUSIC_ENABLED_KEY);
    return v === null ? true : v === 'true'; // افتراضي: مشغل
  } catch { return true; }
}

export function setMusicEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled)); } catch {}
  if (enabled) {
    // شغّل فوراً إن كان هناك تفاعل سابق
    playBgMusic();
  } else {
    pauseBgMusic();
  }
}

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const v = localStorage.getItem(SOUND_ENABLED_KEY);
    return v === null ? true : v === 'true'; // افتراضي: مشغل
  } catch { return true; }
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(SOUND_ENABLED_KEY, String(enabled)); } catch {}
  // اربط بحالة الكتم الموجودة
  if (enabled && getMuted()) {
    toggleMuted(); // إلغاء الكتم
  } else if (!enabled && !getMuted()) {
    toggleMuted(); // كتم
  }
}
