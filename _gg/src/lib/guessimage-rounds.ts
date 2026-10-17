// ============================================================
// خمن الصورة (Guess the Image) — 5 Rounds
// Each round has an image + an answer (the word the player must guess)
// + a hint (category) shown to help the player.
// PLACEHOLDER rounds — will be replaced with extracted flashi images.
// ============================================================

import { GuessImageRound } from './guessimage-types';

// Helper: build an SVG data URL from raw SVG content
function svgUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ─── Round SVG generators (simple icons for now) ─────────────────────
function iconSvg(emoji: string, color: string, label: string): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${color}88"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg)"/>
  <text x="300" y="220" font-size="180" text-anchor="middle" dominant-baseline="central">${emoji}</text>
  <text x="300" y="360" font-size="24" text-anchor="middle" fill="white" font-family="Arial">${label}</text>
</svg>`;
}

export const GUESSIMAGE_ROUNDS: GuessImageRound[] = [
  {
    id: 'guess-1-beach',
    title: 'الجولة 1',
    imageA: svgUrl(iconSvg('🏖️', '#0891b2', 'Beach')),
    imageB: svgUrl(iconSvg('🏖️', '#0891b2', 'Beach')),
    answer: 'شاطئ',
    hint: 'مكان للنزهة',
    differences: [],
  },
  {
    id: 'guess-2-cat',
    title: 'الجولة 2',
    imageA: svgUrl(iconSvg('🐱', '#f59e0b', 'Cat')),
    imageB: svgUrl(iconSvg('🐱', '#f59e0b', 'Cat')),
    answer: 'قطة',
    hint: 'حيوان أليف',
    differences: [],
  },
  {
    id: 'guess-3-car',
    title: 'الجولة 3',
    imageA: svgUrl(iconSvg('🚗', '#dc2626', 'Car')),
    imageB: svgUrl(iconSvg('🚗', '#dc2626', 'Car')),
    answer: 'سيارة',
    hint: 'وسيلة نقل',
    differences: [],
  },
  {
    id: 'guess-4-tree',
    title: 'الجولة 4',
    imageA: svgUrl(iconSvg('🌳', '#15803d', 'Tree')),
    imageB: svgUrl(iconSvg('🌳', '#15803d', 'Tree')),
    answer: 'شجرة',
    hint: 'نبات كبير',
    differences: [],
  },
  {
    id: 'guess-5-house',
    title: 'الجولة 5',
    imageA: svgUrl(iconSvg('🏠', '#7c3aed', 'House')),
    imageB: svgUrl(iconSvg('🏠', '#7c3aed', 'House')),
    answer: 'بيت',
    hint: 'مسكن',
    differences: [],
  },
];
