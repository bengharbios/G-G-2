/* ═══════════════════════════════════════════════════════════════════════
   Sound Effects System — Web Audio API (no files needed)
   Generates UI sounds programmatically for voice room events
   ═══════════════════════════════════════════════════════════════════════ */

'use client';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Helper: play a tone with specific frequency, duration, type and volume
function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, delay = 0) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {
    // Audio context may not be available
  }
}

// Helper: play a multi-tone melody
function playMelody(notes: Array<{ freq: number; dur: number; delay: number; type?: OscillatorType; vol?: number }>) {
  notes.forEach(note => {
    playTone(note.freq, note.dur, note.type || 'sine', note.vol || 0.2, note.delay);
  });
}

/** Play join sound — ascending two-note chime */
export function playJoinSound() {
  playMelody([
    { freq: 523.25, dur: 0.15, delay: 0, type: 'sine', vol: 0.2 },    // C5
    { freq: 659.25, dur: 0.2, delay: 0.08, type: 'sine', vol: 0.25 },  // E5
  ]);
}

/** Play leave sound — descending two-note */
export function playLeaveSound() {
  playMelody([
    { freq: 659.25, dur: 0.15, delay: 0, type: 'sine', vol: 0.2 },    // E5
    { freq: 440, dur: 0.2, delay: 0.08, type: 'sine', vol: 0.2 },     // A4
  ]);
}

/** Play mic on sound — quick ascending */
export function playMicOnSound() {
  playMelody([
    { freq: 440, dur: 0.08, delay: 0, type: 'sine', vol: 0.15 },
    { freq: 554.37, dur: 0.08, delay: 0.05, type: 'sine', vol: 0.15 },
    { freq: 659.25, dur: 0.12, delay: 0.1, type: 'sine', vol: 0.2 },
  ]);
}

/** Play mic off sound — quick descending */
export function playMicOffSound() {
  playMelody([
    { freq: 659.25, dur: 0.08, delay: 0, type: 'sine', vol: 0.15 },
    { freq: 554.37, dur: 0.08, delay: 0.05, type: 'sine', vol: 0.15 },
    { freq: 440, dur: 0.12, delay: 0.1, type: 'sine', vol: 0.2 },
  ]);
}

/** Play gift sound — happy sparkle */
export function playGiftSound() {
  playMelody([
    { freq: 523.25, dur: 0.1, delay: 0, type: 'sine', vol: 0.2 },     // C5
    { freq: 659.25, dur: 0.1, delay: 0.06, type: 'sine', vol: 0.2 },  // E5
    { freq: 783.99, dur: 0.1, delay: 0.12, type: 'sine', vol: 0.25 }, // G5
    { freq: 1046.50, dur: 0.3, delay: 0.18, type: 'sine', vol: 0.2 }, // C6
  ]);
}

/** Play gift received sound — special coin sound */
export function playGiftReceivedSound() {
  playMelody([
    { freq: 1318.51, dur: 0.08, delay: 0, type: 'sine', vol: 0.15 },  // E6
    { freq: 1567.98, dur: 0.08, delay: 0.04, type: 'sine', vol: 0.15 }, // G6
    { freq: 2093, dur: 0.3, delay: 0.08, type: 'triangle', vol: 0.2 },  // C7
  ]);
}

/** Play notification sound — gentle ding */
export function playNotificationSound() {
  playMelody([
    { freq: 880, dur: 0.15, delay: 0, type: 'sine', vol: 0.15 },
    { freq: 1108.73, dur: 0.25, delay: 0.1, type: 'sine', vol: 0.2 },
  ]);
}

/** Play error sound — low buzz */
export function playErrorSound() {
  playMelody([
    { freq: 200, dur: 0.2, delay: 0, type: 'sawtooth', vol: 0.1 },
    { freq: 180, dur: 0.3, delay: 0.1, type: 'sawtooth', vol: 0.08 },
  ]);
}

/** Play seat request sound — doorbell-like */
export function playSeatRequestSound() {
  playMelody([
    { freq: 659.25, dur: 0.12, delay: 0, type: 'sine', vol: 0.2 },
    { freq: 783.99, dur: 0.2, delay: 0.1, type: 'sine', vol: 0.25 },
  ]);
}

/** Play kick sound — harsh buzz */
export function playKickSound() {
  playMelody([
    { freq: 150, dur: 0.15, delay: 0, type: 'square', vol: 0.08 },
    { freq: 120, dur: 0.25, delay: 0.1, type: 'square', vol: 0.06 },
  ]);
}

/** Play achievement unlocked sound — fanfare */
export function playAchievementSound() {
  playMelody([
    { freq: 523.25, dur: 0.1, delay: 0, type: 'sine', vol: 0.2 },     // C5
    { freq: 659.25, dur: 0.1, delay: 0.08, type: 'sine', vol: 0.2 },  // E5
    { freq: 783.99, dur: 0.1, delay: 0.16, type: 'sine', vol: 0.2 },  // G5
    { freq: 1046.50, dur: 0.1, delay: 0.24, type: 'sine', vol: 0.25 }, // C6
    { freq: 1318.51, dur: 0.4, delay: 0.32, type: 'sine', vol: 0.3 },  // E6
  ]);
}

// ── Soundboard sounds ──

export const SOUNDBOARD_ITEMS = [
  { id: 'laugh', emoji: '😂', nameAr: 'ضحك', nameEn: 'Laugh', play: () => playMelody([
    { freq: 300, dur: 0.05, delay: 0, type: 'sawtooth', vol: 0.05 },
    { freq: 450, dur: 0.05, delay: 0.06, type: 'sawtooth', vol: 0.05 },
    { freq: 350, dur: 0.05, delay: 0.12, type: 'sawtooth', vol: 0.05 },
    { freq: 500, dur: 0.05, delay: 0.18, type: 'sawtooth', vol: 0.04 },
    { freq: 400, dur: 0.08, delay: 0.24, type: 'sawtooth', vol: 0.05 },
  ]) },
  { id: 'clap', emoji: '👏', nameAr: 'تصفيق', nameEn: 'Clap', play: () => {
    for (let i = 0; i < 5; i++) {
      playTone(800 + Math.random() * 400, 0.04, 'sine', 0.12 + Math.random() * 0.08, i * 0.08);
    }
  }},
  { id: 'whistle', emoji: '😤', nameAr: 'صفير', nameEn: 'Whistle', play: () => playMelody([
    { freq: 1200, dur: 0.15, delay: 0, type: 'sine', vol: 0.15 },
    { freq: 1400, dur: 0.15, delay: 0.1, type: 'sine', vol: 0.2 },
    { freq: 1200, dur: 0.15, delay: 0.2, type: 'sine', vol: 0.15 },
  ]) },
  { id: 'wow', emoji: '😮', nameAr: 'واو', nameEn: 'Wow', play: () => playMelody([
    { freq: 400, dur: 0.1, delay: 0, type: 'sine', vol: 0.2 },
    { freq: 800, dur: 0.15, delay: 0.08, type: 'sine', vol: 0.25 },
    { freq: 600, dur: 0.2, delay: 0.16, type: 'sine', vol: 0.2 },
  ]) },
  { id: 'boo', emoji: '👎', nameAr: 'بوو', nameEn: 'Boo', play: () => playMelody([
    { freq: 200, dur: 0.2, delay: 0, type: 'sawtooth', vol: 0.08 },
    { freq: 180, dur: 0.2, delay: 0.15, type: 'sawtooth', vol: 0.06 },
    { freq: 160, dur: 0.3, delay: 0.3, type: 'sawtooth', vol: 0.05 },
  ]) },
  { id: 'drumroll', emoji: '🥁', nameAr: 'طبلة', nameEn: 'Drumroll', play: () => {
    for (let i = 0; i < 15; i++) {
      playTone(200 + Math.random() * 100, 0.05, 'sine', 0.1, i * 0.04);
    }
    playTone(150, 0.3, 'sine', 0.2, 0.6);
  }},
  { id: 'airhorn', emoji: '📯', nameAr: 'بوق', nameEn: 'Airhorn', play: () => playMelody([
    { freq: 500, dur: 0.15, delay: 0, type: 'sawtooth', vol: 0.1 },
    { freq: 600, dur: 0.15, delay: 0.1, type: 'sawtooth', vol: 0.1 },
    { freq: 700, dur: 0.15, delay: 0.2, type: 'sawtooth', vol: 0.12 },
    { freq: 600, dur: 0.15, delay: 0.3, type: 'sawtooth', vol: 0.1 },
  ]) },
  { id: 'heartbeat', emoji: '💓', nameAr: 'نبض', nameEn: 'Heartbeat', play: () => {
    playTone(60, 0.08, 'sine', 0.25, 0);
    playTone(55, 0.12, 'sine', 0.2, 0.1);
    playTone(60, 0.08, 'sine', 0.25, 0.35);
    playTone(55, 0.15, 'sine', 0.2, 0.45);
  }},
] as const;

// ── Play sound by ID (for received sound effect events from other users) ──
export function playSoundById(soundId: string) {
  const item = SOUNDBOARD_ITEMS.find(s => s.id === soundId);
  if (item) {
    item.play();
  }
}

/** Play sound effect by type name (for system events) */
export function playSystemSound(type: 'join' | 'leave' | 'micOn' | 'micOff' | 'gift' | 'giftReceived' | 'notification' | 'seatRequest' | 'kick' | 'error' | 'achievement') {
  switch (type) {
    case 'join': playJoinSound(); break;
    case 'leave': playLeaveSound(); break;
    case 'micOn': playMicOnSound(); break;
    case 'micOff': playMicOffSound(); break;
    case 'gift': playGiftSound(); break;
    case 'giftReceived': playGiftReceivedSound(); break;
    case 'notification': playNotificationSound(); break;
    case 'seatRequest': playSeatRequestSound(); break;
    case 'kick': playKickSound(); break;
    case 'error': playErrorSound(); break;
    case 'achievement': playAchievementSound(); break;
  }
}
