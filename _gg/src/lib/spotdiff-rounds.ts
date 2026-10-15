// ============================================================
// اختلاف الصور (Spot the Difference) — 5 Rounds of image pairs
// Each round has SVG data URLs for imageA + imageB and a list
// of normalized (0..1, 0..1) difference spots.
// ============================================================

import { SpotDiffRound } from './spotdiff-types';

// Helper: build an SVG data URL from raw SVG string content
function svgUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ============================================================
// ROUND 1 — الشاطئ (Beach)
// Image A: sky + sun upper-right + palm tree left + beach ball center
// Image B: palm tree missing one coconut, sun moved, ball color changed,
//          extra cloud, extra shell on sand
// ============================================================

const beachA = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <linearGradient id="sea1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0891b2"/>
      <stop offset="100%" stop-color="#155e75"/>
    </linearGradient>
    <linearGradient id="sand1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="600" height="240" fill="url(#sky1)"/>
  <rect y="240" width="600" height="60" fill="url(#sea1)"/>
  <rect y="300" width="600" height="100" fill="url(#sand1)"/>
  <circle cx="480" cy="80" r="40" fill="#fbbf24"/>
  <circle cx="480" cy="80" r="55" fill="#fbbf24" opacity="0.3"/>
  <path d="M100 300 L100 200 M100 200 C 60 170 80 130 100 150 C 120 130 140 170 100 200 Z" fill="#78350f"/>
  <circle cx="80" cy="180" r="10" fill="#92400e"/>
  <circle cx="120" cy="170" r="9" fill="#92400e"/>
  <path d="M100 200 Q 60 160 30 170" stroke="#65a30d" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M100 200 Q 140 160 170 170" stroke="#65a30d" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M100 200 Q 60 130 30 120" stroke="#84cc16" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M100 200 Q 140 130 170 120" stroke="#84cc16" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="300" cy="320" r="25" fill="#ef4444"/>
  <path d="M275 320 Q 300 300 325 320" stroke="#fff" stroke-width="3" fill="none"/>
  <ellipse cx="350" cy="200" rx="40" ry="12" fill="#fff" opacity="0.6"/>
  <ellipse cx="200" cy="100" rx="30" ry="10" fill="#fff" opacity="0.5"/>
  <path d="M450 320 q10 -15 25 -10 q5 15 -25 10" fill="#fef3c7" stroke="#a16207" stroke-width="1"/>
  <path d="M450 320 l-3 5 l3 5 l3 -5 z" fill="#a16207"/>
</svg>`.trim();

const beachB = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="100%" stop-color="#fde68a"/>
    </linearGradient>
    <linearGradient id="sea1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0891b2"/>
      <stop offset="100%" stop-color="#155e75"/>
    </linearGradient>
    <linearGradient id="sand1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="600" height="240" fill="url(#sky1)"/>
  <rect y="240" width="600" height="60" fill="url(#sea1)"/>
  <rect y="300" width="600" height="100" fill="url(#sand1)"/>
  <!-- DIFF 1: sun moved left + down -->
  <circle cx="420" cy="100" r="40" fill="#fbbf24"/>
  <circle cx="420" cy="100" r="55" fill="#fbbf24" opacity="0.3"/>
  <path d="M100 300 L100 200 M100 200 C 60 170 80 130 100 150 C 120 130 140 170 100 200 Z" fill="#78350f"/>
  <!-- DIFF 2: missing second coconut (only one coconut on tree in B) -->
  <circle cx="80" cy="180" r="10" fill="#92400e"/>
  <path d="M100 200 Q 60 160 30 170" stroke="#65a30d" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M100 200 Q 140 160 170 170" stroke="#65a30d" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M100 200 Q 60 130 30 120" stroke="#84cc16" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M100 200 Q 140 130 170 120" stroke="#84cc16" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- DIFF 3: ball color changed to blue -->
  <circle cx="300" cy="320" r="25" fill="#3b82f6"/>
  <path d="M275 320 Q 300 300 325 320" stroke="#fff" stroke-width="3" fill="none"/>
  <ellipse cx="350" cy="200" rx="40" ry="12" fill="#fff" opacity="0.6"/>
  <ellipse cx="200" cy="100" rx="30" ry="10" fill="#fff" opacity="0.5"/>
  <!-- DIFF 4: extra cloud -->
  <ellipse cx="500" cy="150" rx="35" ry="11" fill="#fff" opacity="0.7"/>
  <ellipse cx="465" cy="155" rx="20" ry="7" fill="#fff" opacity="0.6"/>
  <!-- DIFF 5: extra shell on the sand -->
  <path d="M150 360 q5 -10 15 -5 q5 10 -15 5" fill="#fca5a5" stroke="#7f1d1d" stroke-width="1"/>
  <path d="M150 360 l-2 3 l2 3 l2 -3 z" fill="#7f1d1d"/>
</svg>`.trim();

// ============================================================
// ROUND 2 — الغابة (Forest)
// ============================================================

const forestA = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="skyF" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bef264"/>
      <stop offset="100%" stop-color="#365314"/>
    </linearGradient>
    <linearGradient id="grassF" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#365314"/>
      <stop offset="100%" stop-color="#1a2e05"/>
    </linearGradient>
  </defs>
  <rect width="600" height="300" fill="url(#skyF)"/>
  <rect y="300" width="600" height="100" fill="url(#grassF)"/>
  <!-- Trees -->
  <rect x="100" y="180" width="20" height="120" fill="#78350f"/>
  <circle cx="110" cy="180" r="55" fill="#16a34a"/>
  <rect x="450" y="160" width="20" height="140" fill="#78350f"/>
  <circle cx="460" cy="160" r="65" fill="#15803d"/>
  <rect x="280" y="220" width="15" height="80" fill="#78350f"/>
  <circle cx="287" cy="220" r="45" fill="#22c55e"/>
  <!-- Mushrooms -->
  <ellipse cx="150" cy="370" rx="18" ry="10" fill="#dc2626"/>
  <rect x="146" y="362" width="8" height="20" fill="#fef3c7"/>
  <ellipse cx="180" cy="378" rx="14" ry="8" fill="#dc2626"/>
  <rect x="176" y="370" width="6" height="16" fill="#fef3c7"/>
  <!-- Deer -->
  <ellipse cx="380" cy="350" rx="35" ry="18" fill="#92400e"/>
  <circle cx="420" cy="335" r="14" fill="#92400e"/>
  <path d="M420 325 L415 315 L425 315 Z M425 325 L430 315 L420 315 Z" fill="#78350f"/>
  <rect x="370" y="365" width="5" height="20" fill="#78350f"/>
  <rect x="385" y="365" width="5" height="20" fill="#78350f"/>
  <rect x="405" y="365" width="5" height="20" fill="#78350f"/>
  <rect x="420" y="365" width="5" height="20" fill="#78350f"/>
  <!-- Sun rays / light -->
  <circle cx="50" cy="60" r="25" fill="#fde047" opacity="0.7"/>
  <!-- Pond -->
  <ellipse cx="220" cy="380" rx="40" ry="10" fill="#0891b2" opacity="0.7"/>
</svg>`.trim();

const forestB = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="skyF" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#bef264"/>
      <stop offset="100%" stop-color="#365314"/>
    </linearGradient>
    <linearGradient id="grassF" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#365314"/>
      <stop offset="100%" stop-color="#1a2e05"/>
    </linearGradient>
  </defs>
  <rect width="600" height="300" fill="url(#skyF)"/>
  <rect y="300" width="600" height="100" fill="url(#grassF)"/>
  <!-- DIFF 1: middle tree color changed (darker green) -->
  <rect x="100" y="180" width="20" height="120" fill="#78350f"/>
  <circle cx="110" cy="180" r="55" fill="#166534"/>
  <rect x="450" y="160" width="20" height="140" fill="#78350f"/>
  <circle cx="460" cy="160" r="65" fill="#15803d"/>
  <rect x="280" y="220" width="15" height="80" fill="#78350f"/>
  <circle cx="287" cy="220" r="45" fill="#22c55e"/>
  <!-- DIFF 2: missing second mushroom -->
  <ellipse cx="150" cy="370" rx="18" ry="10" fill="#dc2626"/>
  <rect x="146" y="362" width="8" height="20" fill="#fef3c7"/>
  <!-- DIFF 3: deer direction flipped (head on left) -->
  <ellipse cx="380" cy="350" rx="35" ry="18" fill="#92400e"/>
  <circle cx="340" cy="335" r="14" fill="#92400e"/>
  <path d="M340 325 L335 315 L345 315 Z M345 325 L350 315 L340 315 Z" fill="#78350f"/>
  <rect x="370" y="365" width="5" height="20" fill="#78350f"/>
  <rect x="385" y="365" width="5" height="20" fill="#78350f"/>
  <rect x="405" y="365" width="5" height="20" fill="#78350f"/>
  <rect x="420" y="365" width="5" height="20" fill="#78350f"/>
  <circle cx="50" cy="60" r="25" fill="#fde047" opacity="0.7"/>
  <ellipse cx="220" cy="380" rx="40" ry="10" fill="#0891b2" opacity="0.7"/>
  <!-- DIFF 4: extra flower -->
  <circle cx="500" cy="350" r="5" fill="#ec4899"/>
  <circle cx="500" cy="345" r="3" fill="#fbcfe8"/>
  <circle cx="505" cy="350" r="5" fill="#ec4899"/>
  <circle cx="500" cy="355" r="5" fill="#ec4899"/>
  <circle cx="495" cy="350" r="5" fill="#ec4899"/>
  <circle cx="500" cy="350" r="3" fill="#fde047"/>
  <!-- DIFF 5: rock added -->
  <ellipse cx="100" cy="380" rx="20" ry="8" fill="#525252"/>
  <ellipse cx="95" cy="378" rx="12" ry="5" fill="#737373"/>
</svg>`.trim();

// ============================================================
// ROUND 3 — السماء الليلية (Night Sky)
// ============================================================

const nightA = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#skyN)"/>
  <!-- Stars -->
  <circle cx="100" cy="80" r="3" fill="#fef3c7"/>
  <circle cx="180" cy="120" r="2" fill="#fef3c7"/>
  <circle cx="260" cy="60" r="4" fill="#fef3c7"/>
  <circle cx="340" cy="100" r="2" fill="#fef3c7"/>
  <circle cx="420" cy="150" r="3" fill="#fef3c7"/>
  <circle cx="500" cy="90" r="2" fill="#fef3c7"/>
  <circle cx="550" cy="200" r="3" fill="#fef3c7"/>
  <circle cx="80" cy="220" r="2" fill="#fef3c7"/>
  <!-- Big dipper constellation -->
  <line x1="150" y1="180" x2="200" y2="200" stroke="#fef3c7" stroke-width="1" opacity="0.5"/>
  <line x1="200" y1="200" x2="250" y2="190" stroke="#fef3c7" stroke-width="1" opacity="0.5"/>
  <circle cx="150" cy="180" r="3" fill="#fef3c7"/>
  <circle cx="200" cy="200" r="3" fill="#fef3c7"/>
  <circle cx="250" cy="190" r="3" fill="#fef3c7"/>
  <!-- Crescent moon (facing left) -->
  <circle cx="450" cy="100" r="40" fill="#fde68a"/>
  <circle cx="435" cy="95" r="40" fill="#0f172a"/>
  <!-- Planet (red) -->
  <circle cx="300" cy="250" r="25" fill="#dc2626"/>
  <ellipse cx="300" cy="250" rx="35" ry="6" fill="none" stroke="#fca5a5" stroke-width="2" opacity="0.6"/>
  <!-- Shooting star (going right) -->
  <line x1="50" y1="300" x2="120" y2="320" stroke="#fef3c7" stroke-width="3" stroke-linecap="round"/>
  <circle cx="120" cy="320" r="4" fill="#fef3c7"/>
  <!-- Mountains bottom -->
  <polygon points="0,400 100,300 200,400" fill="#312e81"/>
  <polygon points="200,400 320,280 440,400" fill="#312e81"/>
  <polygon points="400,400 500,310 600,400" fill="#312e81"/>
</svg>`.trim();

const nightB = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#skyN)"/>
  <!-- DIFF 1: missing one star (the 420,150 one is gone) -->
  <circle cx="100" cy="80" r="3" fill="#fef3c7"/>
  <circle cx="180" cy="120" r="2" fill="#fef3c7"/>
  <circle cx="260" cy="60" r="4" fill="#fef3c7"/>
  <circle cx="340" cy="100" r="2" fill="#fef3c7"/>
  <circle cx="500" cy="90" r="2" fill="#fef3c7"/>
  <circle cx="550" cy="200" r="3" fill="#fef3c7"/>
  <circle cx="80" cy="220" r="2" fill="#fef3c7"/>
  <!-- DIFF 2: constellation missing the middle line/point -->
  <line x1="150" y1="180" x2="200" y2="200" stroke="#fef3c7" stroke-width="1" opacity="0.5"/>
  <circle cx="150" cy="180" r="3" fill="#fef3c7"/>
  <circle cx="200" cy="200" r="3" fill="#fef3c7"/>
  <circle cx="250" cy="190" r="3" fill="#fef3c7"/>
  <!-- DIFF 3: crescent moon flipped (facing right) -->
  <circle cx="450" cy="100" r="40" fill="#fde68a"/>
  <circle cx="465" cy="95" r="40" fill="#0f172a"/>
  <!-- DIFF 4: planet color changed to green -->
  <circle cx="300" cy="250" r="25" fill="#16a34a"/>
  <ellipse cx="300" cy="250" rx="35" ry="6" fill="none" stroke="#86efac" stroke-width="2" opacity="0.6"/>
  <!-- DIFF 5: shooting star direction flipped (going left) -->
  <line x1="120" y1="300" x2="50" y2="320" stroke="#fef3c7" stroke-width="3" stroke-linecap="round"/>
  <circle cx="50" cy="320" r="4" fill="#fef3c7"/>
  <polygon points="0,400 100,300 200,400" fill="#312e81"/>
  <polygon points="200,400 320,280 440,400" fill="#312e81"/>
  <polygon points="400,400 500,310 600,400" fill="#312e81"/>
</svg>`.trim();

// ============================================================
// ROUND 4 — القرية (Village)
// ============================================================

const villageA = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="skyV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="groundV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#84cc16"/>
      <stop offset="100%" stop-color="#4d7c0f"/>
    </linearGradient>
  </defs>
  <rect width="600" height="280" fill="url(#skyV)"/>
  <rect y="280" width="600" height="120" fill="url(#groundV)"/>
  <!-- Sun -->
  <circle cx="80" cy="80" r="30" fill="#fbbf24"/>
  <!-- House 1 -->
  <rect x="120" y="200" width="120" height="100" fill="#dc2626"/>
  <polygon points="120,200 180,150 240,200" fill="#7f1d1d"/>
  <rect x="160" y="230" width="20" height="40" fill="#fef3c7"/>
  <rect x="200" y="220" width="25" height="25" fill="#fef3c7"/>
  <rect x="125" y="220" width="5" height="5" fill="#1e293b"/>
  <!-- House 2 -->
  <rect x="320" y="180" width="140" height="120" fill="#0891b2"/>
  <polygon points="320,180 390,120 460,180" fill="#155e75"/>
  <rect x="370" y="220" width="40" height="80" fill="#92400e"/>
  <circle cx="402" cy="260" r="3" fill="#fbbf24"/>
  <rect x="350" y="200" width="20" height="20" fill="#fef3c7"/>
  <rect x="410" y="200" width="20" height="20" fill="#fef3c7"/>
  <!-- Smoke from chimney (going right) -->
  <rect x="430" y="150" width="20" height="30" fill="#7f1d1d"/>
  <circle cx="445" cy="135" r="10" fill="#cbd5e1" opacity="0.7"/>
  <circle cx="465" cy="125" r="8" fill="#cbd5e1" opacity="0.5"/>
  <circle cx="485" cy="115" r="6" fill="#cbd5e1" opacity="0.4"/>
  <!-- Tree -->
  <rect x="510" y="240" width="15" height="60" fill="#78350f"/>
  <circle cx="517" cy="240" r="35" fill="#16a34a"/>
  <!-- Fence -->
  <rect x="20" y="320" width="6" height="40" fill="#fef3c7"/>
  <rect x="40" y="320" width="6" height="40" fill="#fef3c7"/>
  <rect x="60" y="320" width="6" height="40" fill="#fef3c7"/>
  <rect x="80" y="320" width="6" height="40" fill="#fef3c7"/>
  <line x1="15" y1="335" x2="90" y2="335" stroke="#fef3c7" stroke-width="3"/>
  <!-- Path -->
  <path d="M390 300 L380 360 L400 400 L420 400 L420 360 Z" fill="#a16207"/>
</svg>`.trim();

const villageB = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="skyV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="groundV" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#84cc16"/>
      <stop offset="100%" stop-color="#4d7c0f"/>
    </linearGradient>
  </defs>
  <rect width="600" height="280" fill="url(#skyV)"/>
  <rect y="280" width="600" height="120" fill="url(#groundV)"/>
  <circle cx="80" cy="80" r="30" fill="#fbbf24"/>
  <!-- DIFF 1: house 1 color changed to blue -->
  <rect x="120" y="200" width="120" height="100" fill="#1d4ed8"/>
  <polygon points="120,200 180,150 240,200" fill="#1e3a8a"/>
  <rect x="160" y="230" width="20" height="40" fill="#fef3c7"/>
  <!-- DIFF 2: missing window on house 1 (200,220) -->
  <rect x="125" y="220" width="5" height="5" fill="#1e293b"/>
  <!-- House 2 -->
  <rect x="320" y="180" width="140" height="120" fill="#0891b2"/>
  <polygon points="320,180 390,120 460,180" fill="#155e75"/>
  <rect x="370" y="220" width="40" height="80" fill="#92400e"/>
  <circle cx="402" cy="260" r="3" fill="#fbbf24"/>
  <rect x="350" y="200" width="20" height="20" fill="#fef3c7"/>
  <rect x="410" y="200" width="20" height="20" fill="#fef3c7"/>
  <rect x="430" y="150" width="20" height="30" fill="#7f1d1d"/>
  <!-- DIFF 3: smoke direction flipped (going left) -->
  <circle cx="435" cy="135" r="10" fill="#cbd5e1" opacity="0.7"/>
  <circle cx="415" cy="125" r="8" fill="#cbd5e1" opacity="0.5"/>
  <circle cx="395" cy="115" r="6" fill="#cbd5e1" opacity="0.4"/>
  <!-- Tree -->
  <rect x="510" y="240" width="15" height="60" fill="#78350f"/>
  <circle cx="517" cy="240" r="35" fill="#16a34a"/>
  <!-- DIFF 4: extra fence post -->
  <rect x="20" y="320" width="6" height="40" fill="#fef3c7"/>
  <rect x="40" y="320" width="6" height="40" fill="#fef3c7"/>
  <rect x="60" y="320" width="6" height="40" fill="#fef3c7"/>
  <rect x="80" y="320" width="6" height="40" fill="#fef3c7"/>
  <rect x="100" y="320" width="6" height="40" fill="#fef3c7"/>
  <line x1="15" y1="335" x2="110" y2="335" stroke="#fef3c7" stroke-width="3"/>
  <!-- DIFF 5: missing path -->
  <path d="M390 300 L380 360 L400 400 L420 400 L420 360 Z" fill="#4d7c0f"/>
</svg>`.trim();

// ============================================================
// ROUND 5 — تحت الماء (Underwater)
// ============================================================

const underwaterA = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="seaU" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0891b2"/>
      <stop offset="100%" stop-color="#164e63"/>
    </linearGradient>
    <linearGradient id="sandU" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
  </defs>
  <rect width="600" height="360" fill="url(#seaU)"/>
  <rect y="360" width="600" height="40" fill="url(#sandU)"/>
  <!-- Sun rays -->
  <polygon points="100,0 80,200 120,200" fill="#fef3c7" opacity="0.15"/>
  <polygon points="300,0 280,200 320,200" fill="#fef3c7" opacity="0.15"/>
  <polygon points="500,0 480,200 520,200" fill="#fef3c7" opacity="0.15"/>
  <!-- Fish 1 (orange) -->
  <ellipse cx="150" cy="150" rx="30" ry="18" fill="#f97316"/>
  <polygon points="120,150 100,135 100,165" fill="#f97316"/>
  <circle cx="165" cy="145" r="3" fill="#1e293b"/>
  <!-- Fish 2 (blue) -->
  <ellipse cx="400" cy="200" rx="25" ry="15" fill="#3b82f6"/>
  <polygon points="375,200 360,188 360,212" fill="#3b82f6"/>
  <circle cx="412" cy="196" r="3" fill="#1e293b"/>
  <!-- Seaweed 1 -->
  <path d="M80 380 Q 70 350 80 320 Q 90 290 80 260" stroke="#16a34a" stroke-width="8" fill="none" stroke-linecap="round"/>
  <!-- Seaweed 2 -->
  <path d="M520 380 Q 530 350 520 320 Q 510 290 520 260" stroke="#16a34a" stroke-width="8" fill="none" stroke-linecap="round"/>
  <!-- Bubbles -->
  <circle cx="200" cy="80" r="5" fill="#fff" opacity="0.4"/>
  <circle cx="220" cy="60" r="3" fill="#fff" opacity="0.3"/>
  <circle cx="450" cy="100" r="6" fill="#fff" opacity="0.4"/>
  <circle cx="470" cy="80" r="4" fill="#fff" opacity="0.3"/>
  <!-- Coral -->
  <ellipse cx="250" cy="380" rx="20" ry="10" fill="#be185d"/>
  <ellipse cx="260" cy="370" rx="15" ry="8" fill="#db2777"/>
  <ellipse cx="245" cy="372" rx="12" ry="6" fill="#f472b6"/>
  <!-- Treasure chest -->
  <rect x="330" y="350" width="60" height="30" fill="#92400e"/>
  <rect x="330" y="345" width="60" height="10" fill="#a16207"/>
  <rect x="355" y="355" width="10" height="10" fill="#fbbf24"/>
</svg>`.trim();

const underwaterB = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="seaU" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0891b2"/>
      <stop offset="100%" stop-color="#164e63"/>
    </linearGradient>
    <linearGradient id="sandU" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fde68a"/>
      <stop offset="100%" stop-color="#92400e"/>
    </linearGradient>
  </defs>
  <rect width="600" height="360" fill="url(#seaU)"/>
  <rect y="360" width="600" height="40" fill="url(#sandU)"/>
  <polygon points="100,0 80,200 120,200" fill="#fef3c7" opacity="0.15"/>
  <polygon points="300,0 280,200 320,200" fill="#fef3c7" opacity="0.15"/>
  <polygon points="500,0 480,200 520,200" fill="#fef3c7" opacity="0.15"/>
  <!-- Fish 1 (orange) - now facing the other direction (DIFF 1) -->
  <ellipse cx="150" cy="150" rx="30" ry="18" fill="#f97316"/>
  <polygon points="180,150 200,135 200,165" fill="#f97316"/>
  <circle cx="135" cy="145" r="3" fill="#1e293b"/>
  <!-- Fish 2 (blue) - missing (DIFF 2) -->
  <!-- Seaweed 1 -->
  <path d="M80 380 Q 70 350 80 320 Q 90 290 80 260" stroke="#16a34a" stroke-width="8" fill="none" stroke-linecap="round"/>
  <!-- DIFF 3: Seaweed 2 color changed to purple -->
  <path d="M520 380 Q 530 350 520 320 Q 510 290 520 260" stroke="#9333ea" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="200" cy="80" r="5" fill="#fff" opacity="0.4"/>
  <circle cx="220" cy="60" r="3" fill="#fff" opacity="0.3"/>
  <circle cx="450" cy="100" r="6" fill="#fff" opacity="0.4"/>
  <circle cx="470" cy="80" r="4" fill="#fff" opacity="0.3"/>
  <!-- DIFF 4: extra bubble -->
  <circle cx="300" cy="60" r="4" fill="#fff" opacity="0.35"/>
  <ellipse cx="250" cy="380" rx="20" ry="10" fill="#be185d"/>
  <ellipse cx="260" cy="370" rx="15" ry="8" fill="#db2777"/>
  <ellipse cx="245" cy="372" rx="12" ry="6" fill="#f472b6"/>
  <!-- DIFF 5: treasure chest position shifted -->
  <rect x="380" y="340" width="60" height="30" fill="#92400e"/>
  <rect x="380" y="335" width="60" height="10" fill="#a16207"/>
  <rect x="405" y="345" width="10" height="10" fill="#fbbf24"/>
</svg>`.trim();

// ============================================================
// Export the 5 rounds with difference spots
// ============================================================
export const SPOTDIFF_ROUNDS: SpotDiffRound[] = [
  {
    id: 'beach',
    title: 'الشاطئ',
    imageA: svgUrl(beachA),
    imageB: svgUrl(beachB),
    differences: [
      { id: 'b1', x: 0.70, y: 0.25, radius: 0.10, found: false }, // sun moved (in B at 420/600 = 0.70, 100/400 = 0.25)
      { id: 'b2', x: 0.20, y: 0.425, radius: 0.04, found: false }, // missing coconut (120/600 = 0.20, 170/400 = 0.425)
      { id: 'b3', x: 0.50, y: 0.80, radius: 0.06, found: false }, // ball color changed (300/600 = 0.5, 320/400 = 0.80)
      { id: 'b4', x: 0.80, y: 0.375, radius: 0.07, found: false }, // extra cloud (500/600 ~ 0.83, 150/400 = 0.375)
      { id: 'b5', x: 0.25, y: 0.90, radius: 0.04, found: false }, // extra shell on sand (150/600 = 0.25, 360/400 = 0.90)
    ],
  },
  {
    id: 'forest',
    title: 'الغابة',
    imageA: svgUrl(forestA),
    imageB: svgUrl(forestB),
    differences: [
      { id: 'f1', x: 0.183, y: 0.45, radius: 0.10, found: false }, // tree color changed (110/600 = 0.183, 180/400 = 0.45)
      { id: 'f2', x: 0.293, y: 0.93, radius: 0.05, found: false }, // missing mushroom (180/600 = 0.30, 378/400 = 0.945)
      { id: 'f3', x: 0.567, y: 0.838, radius: 0.07, found: false }, // deer direction flipped (340/600 = 0.567, 335/400 = 0.838)
      { id: 'f4', x: 0.833, y: 0.875, radius: 0.06, found: false }, // extra flower (500/600 = 0.833, 350/400 = 0.875)
      { id: 'f5', x: 0.167, y: 0.95, radius: 0.07, found: false }, // rock added (100/600 = 0.167, 380/400 = 0.95)
    ],
  },
  {
    id: 'night',
    title: 'السماء الليلية',
    imageA: svgUrl(nightA),
    imageB: svgUrl(nightB),
    differences: [
      { id: 'n1', x: 0.70, y: 0.375, radius: 0.05, found: false }, // missing star (420/600 = 0.70, 150/400 = 0.375)
      { id: 'n2', x: 0.417, y: 0.483, radius: 0.05, found: false }, // constellation missing line (250/600 = 0.417, 190/400 = 0.475)
      { id: 'n3', x: 0.75, y: 0.25, radius: 0.08, found: false }, // moon flipped (450/600 = 0.75, 100/400 = 0.25)
      { id: 'n4', x: 0.50, y: 0.625, radius: 0.06, found: false }, // planet color changed (300/600 = 0.50, 250/400 = 0.625)
      { id: 'n5', x: 0.10, y: 0.80, radius: 0.05, found: false }, // shooting star flipped (50/600 = 0.083, 320/400 = 0.80)
    ],
  },
  {
    id: 'village',
    title: 'القرية',
    imageA: svgUrl(villageA),
    imageB: svgUrl(villageB),
    differences: [
      { id: 'v1', x: 0.30, y: 0.625, radius: 0.13, found: false }, // house color changed (180/600 = 0.30, 250/400 = 0.625)
      { id: 'v2', x: 0.375, y: 0.583, radius: 0.05, found: false }, // missing window (225/600 = 0.375, 232/400 = 0.583)
      { id: 'v3', x: 0.667, y: 0.313, radius: 0.07, found: false }, // smoke direction (400/600 = 0.667, 125/400 = 0.313)
      { id: 'v4', x: 0.175, y: 0.90, radius: 0.04, found: false }, // extra fence post (105/600 = 0.175, 360/400 = 0.90)
      { id: 'v5', x: 0.667, y: 0.875, radius: 0.06, found: false }, // missing path (400/600 = 0.667, 350/400 = 0.875)
    ],
  },
  {
    id: 'underwater',
    title: 'تحت الماء',
    imageA: svgUrl(underwaterA),
    imageB: svgUrl(underwaterB),
    differences: [
      { id: 'u1', x: 0.25, y: 0.375, radius: 0.08, found: false }, // fish 1 direction (150/600 = 0.25, 150/400 = 0.375)
      { id: 'u2', x: 0.667, y: 0.50, radius: 0.07, found: false }, // missing fish 2 (400/600 = 0.667, 200/400 = 0.50)
      { id: 'u3', x: 0.867, y: 0.70, radius: 0.06, found: false }, // seaweed color (520/600 = 0.867, 280/400 = 0.70)
      { id: 'u4', x: 0.50, y: 0.15, radius: 0.03, found: false }, // extra bubble (300/600 = 0.50, 60/400 = 0.15)
      { id: 'u5', x: 0.683, y: 0.875, radius: 0.07, found: false }, // chest shifted (410/600 = 0.683, 350/400 = 0.875)
    ],
  },
];
