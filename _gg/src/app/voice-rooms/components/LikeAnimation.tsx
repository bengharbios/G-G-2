'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { HEART_COLORS } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   LikeAnimation — TUILiveKit Exact Heart Animation

   Uses actual heart PNGs from TUILiveKit Flutter assets (gift_heart0-8.png).
   Floating hearts that rise from bottom with physics-based motion.
   Each heart has random size, color, offset, rotation, and wobble.
   ═══════════════════════════════════════════════════════════════════════ */

// Pre-load TUILiveKit heart images
const HEART_IMAGES = Array.from({ length: 9 }, (_, i) => `/gifts/gift_heart${i}.png`);

// Preload images on module load
if (typeof window !== 'undefined') {
  HEART_IMAGES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

interface Heart {
  id: number;
  x: number;
  size: number;
  heartIndex: number; // which heart image to use (0-8)
  rotation: number;
  wobbleAmp: number;
  wobbleFreq: number;
  startTime: number;
  duration: number;
}

let heartId = 0;

export default function LikeAnimation({ active }: { active: boolean }) {
  const [hearts, setHearts] = useState<Heart[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const spawnTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const spawnHeart = useCallback(() => {
    const h: Heart = {
      id: heartId++,
      x: 40 + Math.random() * 20,
      size: 16 + Math.random() * 12,
      heartIndex: Math.floor(Math.random() * HEART_IMAGES.length),
      rotation: -15 + Math.random() * 30,
      wobbleAmp: 5 + Math.random() * 10,
      wobbleFreq: 2 + Math.random() * 3,
      startTime: Date.now(),
      duration: 1800 + Math.random() * 1200,
    };
    setHearts(prev => [...prev.slice(-14), h]);
  }, []);

  useEffect(() => {
    if (active) {
      spawnHeart();
      spawnTimer.current = setInterval(spawnHeart, 120 + Math.random() * 80);
    } else {
      if (spawnTimer.current) {
        clearInterval(spawnTimer.current);
        spawnTimer.current = null;
      }
    }
    return () => {
      if (spawnTimer.current) clearInterval(spawnTimer.current);
    };
  }, [active, spawnHeart]);

  // Cleanup old hearts
  useEffect(() => {
    if (hearts.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setHearts(prev => prev.filter(h => now - h.startTime < h.duration + 200));
    }, 500);
    return () => clearInterval(timer);
  }, [hearts.length]);

  return (
    <div
      ref={containerRef}
      className="fixed left-4 bottom-24 pointer-events-none z-30"
      style={{ width: '80px', height: '200px' }}
    >
      {hearts.map(h => {
        const elapsed = Date.now() - h.startTime;
        const progress = Math.min(elapsed / h.duration, 1);
        const opacity = progress < 0.1 ? progress * 10 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
        const translateY = progress * -200;
        const translateX = Math.sin(progress * h.wobbleFreq * Math.PI) * h.wobbleAmp;

        return (
          <img
            key={h.id}
            src={HEART_IMAGES[h.heartIndex]}
            alt=""
            width={h.size}
            height={h.size}
            draggable={false}
            style={{
              position: 'absolute',
              left: `${h.x + translateX}px`,
              bottom: '0px',
              opacity: Math.max(0, opacity),
              transform: `translateY(${translateY}px) rotate(${h.rotation}deg)`,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              transition: 'none',
            }}
          />
        );
      })}
    </div>
  );
}
