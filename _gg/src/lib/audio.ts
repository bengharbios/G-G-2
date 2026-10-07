// ============================================================
// AUDIO UTILITY - Game Sound Effects
// ============================================================

let nightAudio: HTMLAudioElement | null = null;
let roosterAudio: HTMLAudioElement | null = null;

function getNightAudio(): HTMLAudioElement {
  if (!nightAudio) {
    nightAudio = new Audio('/night-owl.mp3');
    nightAudio.volume = 0.7;
  }
  return nightAudio;
}

function getRoosterAudio(): HTMLAudioElement {
  if (!roosterAudio) {
    roosterAudio = new Audio('/morning-rooster.mp3');
    roosterAudio.volume = 0.8;
  }
  return roosterAudio;
}

export function playNightSound() {
  try {
    const audio = getNightAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay may be blocked - ignore silently
    });
  } catch {
    // Audio not supported
  }
}

export function playMorningSound() {
  try {
    const audio = getRoosterAudio();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Autoplay may be blocked - ignore silently
    });
  } catch {
    // Audio not supported
  }
}
