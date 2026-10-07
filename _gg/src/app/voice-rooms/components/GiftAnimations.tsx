'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ActiveGiftAnimation } from '../types';
import { GIFT_GRADES } from '../types';

/* ═══════════════════════════════════════════════════════════════════════
   GiftAnimations — 5-Tier Canvas-Based Gift Effects (matching 17ae.com)

   Grade 0 (Free):    No particle effect, just banner slide-in
   Grade 1 (Basic):   Small heart particles float up, simple banner
   Grade 2 (Medium):  Confetti particles fall from top + banner
   Grade 3 (Premium): Fireworks explosion from center + banner with glow
   Grade 4 (Luxury):  Full-screen canvas-confetti explosion + large banner

   SVGA Gifts: Full animation rendered in center of screen (like video)

   Banner design (matching 17ae.com notification):
   - Rounded rectangle with gradient background (grade color)
   - Sender info + gift emoji + name + receiver name
   - Price in gold text
   - Slide-in animation from top
   ═══════════════════════════════════════════════════════════════════════ */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;
  rotSpeed: number;
  shape: 'circle' | 'rect' | 'star' | 'heart';
  gravity?: number;
}

const PARTICLE_COLORS = [
  '#FF3B30', '#AF52DE', '#FF9500', '#FFCC00', '#34C759',
  '#007AFF', '#6C54E8', '#00E5E5', '#F23C5B', '#FFD700',
];

const HEART_COLORS = ['#FF3B30', '#FF6B6B', '#FF1493', '#FF69B4', '#E91E63'];

// Duration per grade (ms)
const GRADE_DURATION: Record<number, number> = {
  0: 2000,
  1: 3000,
  2: 3500,
  3: 4500,
  4: 6000,
};

function getGradeConfig(grade: number) {
  const g = GIFT_GRADES[grade as keyof typeof GIFT_GRADES];
  return g || GIFT_GRADES[0];
}

// ─── SVGA Player Component ────────────────────────────────────────────

function SVGAPlayer({ svgaUrl, bmType, onComplete }: { svgaUrl: string; bmType?: number; onComplete?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!containerRef.current || !svgaUrl) return;

    let parser: any = null;
    let player: any = null;
    let cancelled = false;

    const loadSVGA = async () => {
      try {
        const SVGA = await import('svgaplayerweb');
        if (cancelled) return;
        parser = new SVGA.Parser();

        parser.load(svgaUrl, (videoItem: any) => {
          if (cancelled || !containerRef.current) return;
          // Clear previous content completely
          containerRef.current.innerHTML = '';
          // Create fresh player
          player = new SVGA.Player(containerRef.current!);
          playerRef.current = player;
          player.loops = 1;
          player.clearsAfterStop = false;
          player.setContentMode('AspectFit');
          player.setVideoItem(videoItem);
          player.startAnimation();
          player.onFinished(() => {
            onCompleteRef.current?.();
          });

          // Fix canvas centering: svgaplayerweb creates a canvas with raw video dimensions
          // We need to force it to be centered and fit within the container
          requestAnimationFrame(() => {
            if (!containerRef.current) return;
            const canvas = containerRef.current.querySelector('canvas');
            if (canvas) {
              const vw = videoItem.videoSize?.width || videoItem.params?.viewBoxWidth || canvas.width;
              const vh = videoItem.videoSize?.height || videoItem.params?.viewBoxHeight || canvas.height;
              const cw = containerRef.current.clientWidth;
              const ch = containerRef.current.clientHeight;
              if (vw > 0 && vh > 0 && cw > 0 && ch > 0) {
                const scale = Math.min(cw / vw, ch / vh);
                canvas.style.position = 'absolute';
                canvas.style.left = `${(cw - vw * scale) / 2}px`;
                canvas.style.top = `${(ch - vh * scale) / 2}px`;
                canvas.style.width = `${vw * scale}px`;
                canvas.style.height = `${vh * scale}px`;
              }
            }
          });
        }, () => {
          // Parse failed, just complete
          onCompleteRef.current?.();
        });
      } catch {
        onCompleteRef.current?.();
      }
    };

    loadSVGA();

    return () => {
      cancelled = true;
      try {
        if (playerRef.current) {
          playerRef.current.stopAnimation();
          playerRef.current.clear();
          playerRef.current = null;
        }
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      } catch { /* ignore cleanup errors */ }
    };
  }, [svgaUrl]);

  // bmType: 1 = fullscreen, 2 = large centered, 0/else = medium
  const isFullscreen = bmType === 1;
  const isLarge = bmType === 2;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 1 }}
    >
      <div
        ref={containerRef}
        style={{
          width: isFullscreen ? '100%' : isLarge ? '85%' : '75%',
          maxWidth: isFullscreen ? 'none' : isLarge ? 520 : 450,
          height: isFullscreen ? '100%' : isLarge ? '70%' : 400,
          position: 'relative',
          overflow: 'hidden',
          animation: 'giftMediaScaleIn 0.4s cubic-bezier(.175,.885,.32,1.275) forwards',
        }}
      />
    </div>
  );
}

// ─── Particle Creation Functions ─────────────────────────────────────────

function createHeartParticles(
  count: number,
  canvasW: number,
  startY: number,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvasW * 0.15 + Math.random() * canvasW * 0.7,
      y: startY,
      vx: (Math.random() - 0.5) * 2.5,
      vy: -(1.5 + Math.random() * 3),
      size: 5 + Math.random() * 7,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      life: 0,
      maxLife: 50 + Math.random() * 40,
      rotation: 0,
      rotSpeed: (Math.random() - 0.5) * 4,
      shape: 'heart',
      gravity: -0.01, // float up
    });
  }
  return particles;
}

function createConfettiParticles(
  count: number,
  canvasW: number,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvasW,
      y: -10 - Math.random() * 40,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 2 + Math.random() * 3.5,
      size: 4 + Math.random() * 6,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      life: 0,
      maxLife: 60 + Math.random() * 40,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      shape: 'rect',
      gravity: 0.06,
    });
  }
  return particles;
}

function createFireworksParticles(
  count: number,
  centerX: number,
  centerY: number,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 3 + Math.random() * 6;
    particles.push({
      x: centerX + (Math.random() - 0.5) * 20,
      y: centerY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 5,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      life: 0,
      maxLife: 35 + Math.random() * 30,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 8,
      shape: Math.random() > 0.5 ? 'star' : 'circle',
      gravity: 0.08,
    });
  }
  return particles;
}

function createStarParticles(
  count: number,
  centerX: number,
  centerY: number,
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 2 + Math.random() * 3;
    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 6,
      color: ['#FFD700', '#FFCC00', '#FF9500', '#FFA500'][Math.floor(Math.random() * 4)],
      life: 0,
      maxLife: 40 + Math.random() * 30,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
      shape: 'star',
      gravity: 0.03,
    });
  }
  return particles;
}

// ─── Drawing Functions ──────────────────────────────────────────────────

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, rotation: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.beginPath();
  const s = size / 10;
  ctx.moveTo(0, -s * 3);
  ctx.bezierCurveTo(-s * 5, -s * 8, -s * 10, -s * 2, 0, s * 5);
  ctx.bezierCurveTo(s * 10, -s * 2, s * 5, -s * 8, 0, -s * 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, rotation: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = ((i * 4 * Math.PI) / 5) - Math.PI / 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ─── Banner Component ───────────────────────────────────────────────────

function GiftBanner({ anim }: { anim: ActiveGiftAnimation }) {
  const grade = anim.grade ?? 0;
  const gradeConfig = getGradeConfig(grade);
  const gradeColor = gradeConfig.color;

  // Build gradient based on grade
  const gradientColors: Record<number, [string, string]> = {
    0: ['rgba(143,154,178,0.85)', 'rgba(79,88,107,0.85)'],
    1: ['rgba(52,199,89,0.85)', 'rgba(0,122,255,0.85)'],
    2: ['rgba(0,122,255,0.85)', 'rgba(88,86,214,0.85)'],
    3: ['rgba(175,82,222,0.9)', 'rgba(88,86,214,0.9)'],
    4: ['rgba(255,215,0,0.9)', 'rgba(255,159,0,0.9)'],
  };
  const [g1, g2] = gradientColors[grade] || gradientColors[0];

  // Glow for grade >= 3
  const glowStyle = grade >= 3
    ? `0 0 24px ${gradeColor}60, 0 0 48px ${gradeColor}30`
    : `0 4px 16px rgba(0,0,0,0.3)`;

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 overflow-hidden"
      style={{
        top: 60,
        padding: '10px 16px',
        background: `linear-gradient(135deg, ${g1}, ${g2})`,
        borderRadius: 14,
        boxShadow: glowStyle,
        maxWidth: 360,
        width: '92%',
        animation: 'giftBannerSlideIn 0.5s cubic-bezier(.175,.885,.32,1.275) forwards',
        zIndex: 2,
      }}
    >
      {/* Sender avatar */}
      <div
        className="shrink-0 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          width: 36,
          height: 36,
          backgroundColor: 'rgba(255,255,255,0.2)',
          border: `2px solid ${gradeColor}`,
        }}
      >
        {anim.senderAvatar ? (
          <img
            src={anim.senderAvatar}
            alt={anim.senderName}
            className="w-full h-full object-cover rounded-full"
            draggable={false}
          />
        ) : (
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
            {anim.senderName.charAt(0)}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            lineHeight: '16px',
          }}
        >
          {anim.senderName}
          <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}> أرسل </span>
          <span style={{ fontSize: 16 }}>{anim.emoji}</span>
          <span> {anim.giftName} </span>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>إلى</span>
          <span> {anim.receiverName}</span>
        </p>
      </div>

      {/* Price badge */}
      <div
        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full"
        style={{
          backgroundColor: 'rgba(255,215,0,0.2)',
          border: `1px solid rgba(255,215,0,0.4)`,
        }}
      >
        <span style={{ fontSize: 10 }}>💎</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#FFD700' }}>
          {anim.price.toLocaleString()}
        </span>
      </div>

      <style>{`
        @keyframes giftBannerSlideIn {
          from { transform: translate(-50%, -30px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes giftBannerSlideOut {
          from { transform: translate(-50%, 0); opacity: 1; }
          to { transform: translate(-50%, -30px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function GiftAnimations({
  activeAnimation,
}: {
  activeAnimation: ActiveGiftAnimation | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrame = useRef<number>(0);
  const confettiFired = useRef(false);

  // Fire canvas-confetti for Grade 4
  const fireCanvasConfetti = useCallback(async () => {
    try {
      const confetti = (await import('canvas-confetti')).default;
      // Fire from center
      await confetti({
        particleCount: 100,
        spread: 120,
        origin: { y: 0.6, x: 0.5 },
        colors: ['#FFD700', '#FF6B6B', '#00C896', '#FF9500', '#AF52DE', '#007AFF'],
        ticks: 200,
        gravity: 1.2,
        scalar: 1.2,
        shapes: ['circle', 'square'],
      });
      // Second burst from left
      await confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.65 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
        ticks: 150,
        scalar: 0.9,
      });
      // Third burst from right
      await confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.65 },
        colors: ['#FFD700', '#FFA500', '#FF6347'],
        ticks: 150,
        scalar: 0.9,
      });
    } catch {
      // canvas-confetti not available, skip
    }
  }, []);

  // Spawn particles based on grade
  const spawnParticles = useCallback((anim: ActiveGiftAnimation) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const grade = anim.grade ?? 0;

    switch (grade) {
      case 0:
        // No particles
        particlesRef.current = [];
        break;
      case 1:
        // Hearts float up
        particlesRef.current = createHeartParticles(
          getGradeConfig(1).particleCount,
          canvas.width,
          canvas.height * 0.8,
        );
        break;
      case 2:
        // Confetti from top
        particlesRef.current = createConfettiParticles(
          getGradeConfig(2).particleCount,
          canvas.width,
        );
        break;
      case 3:
        // Fireworks from center
        particlesRef.current = createFireworksParticles(
          getGradeConfig(3).particleCount,
          canvas.width / 2,
          canvas.height * 0.35,
        );
        break;
      case 4:
        // Stars from center (canvas-confetti handles the rest)
        particlesRef.current = createStarParticles(
          getGradeConfig(4).particleCount,
          canvas.width / 2,
          canvas.height * 0.35,
        );
        break;
      default:
        particlesRef.current = [];
    }
  }, []);

  useEffect(() => {
    if (!activeAnimation) {
      confettiFired.current = false;
      particlesRef.current = [];
      return;
    }

    const grade = activeAnimation.grade ?? 0;

    // Spawn particles
    spawnParticles(activeAnimation);

    // Fire canvas-confetti for Grade 4
    if (grade >= 4 && !confettiFired.current) {
      confettiFired.current = true;
      setTimeout(fireCanvasConfetti, 300);
    }

    // If Grade 0, no canvas animation needed
    if (grade === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const duration = GRADE_DURATION[grade] || 3000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration + 500) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);
      for (const p of particlesRef.current) {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += (p.gravity ?? 0.05);
        p.rotation += p.rotSpeed;

        // Fade out in last 20% of life
        const lifeRatio = p.life / p.maxLife;
        const alpha = lifeRatio > 0.8
          ? Math.max(0, (1 - lifeRatio) / 0.2)
          : Math.min(1, lifeRatio / 0.1);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'heart') {
          drawHeart(ctx, p.x, p.y, p.size, p.rotation);
        } else if (p.shape === 'rect') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else if (p.shape === 'star') {
          drawStar(ctx, p.x, p.y, p.size, p.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animFrame.current = requestAnimationFrame(animate);
    };

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [activeAnimation, spawnParticles, fireCanvasConfetti]);

  if (!activeAnimation) return null;

  const grade = activeAnimation.grade ?? 0;
  const hasVideo = !!activeAnimation.video;
  const hasGiftImage = !!activeAnimation.giftImageUrl;
  const hasSVGA = activeAnimation.format === 'svga' && !!activeAnimation.animationResourceUrl;
  const hasMediaOverlay = hasVideo || hasGiftImage || hasSVGA;

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Dark backdrop for media overlays */}
      {hasMediaOverlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            animation: 'giftOverlayFadeIn 0.3s ease-out forwards',
            zIndex: 0,
          }}
        />
      )}

      {/* SVGA animation overlay — fullscreen for bmType 1, large for bmType 2 */}
      {hasSVGA && (
        <SVGAPlayer
          key={activeAnimation.id}
          svgaUrl={activeAnimation.animationResourceUrl!}
          bmType={activeAnimation.bmType}
          onComplete={() => {}}
        />
      )}

      {/* VAP Video overlay */}
      {hasVideo && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 1 }}
        >
          <video
            key={activeAnimation.id}
            src={activeAnimation.video}
            autoPlay
            muted
            playsInline
            style={{
              width: activeAnimation.bmType === 1 ? '100%' : '70%',
              maxWidth: 420,
              height: activeAnimation.bmType === 1 ? '100%' : 'auto',
              objectFit: 'contain',
              animation: 'giftMediaScaleIn 0.4s cubic-bezier(.175,.885,.32,1.275) forwards',
            }}
            onEnded={() => {}}
          />
        </div>
      )}

      {/* Custom gift image — animated cinematic overlay */}
      {hasGiftImage && !hasVideo && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 1 }}
        >
          <div
            className="relative"
            style={{
              animation: 'giftImageCinematic 3.5s cubic-bezier(.25,.46,.45,.94) forwards',
            }}
          >
            {/* Glow ring behind image */}
            <div
              className="absolute rounded-full"
              style={{
                inset: -20,
                background: `radial-gradient(circle, ${getGradeConfig(grade).color}40 0%, transparent 70%)`,
                animation: 'giftGlowPulse 1.5s ease-in-out infinite',
              }}
            />
            {/* Sparkle particles around image */}
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className="absolute"
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: ['#FFD700', '#FF9500', '#AF52DE', '#34C759', '#FF3B30', '#00E5E5'][i],
                  top: `${20 + Math.sin(i * 1.05) * 45}%`,
                  left: `${20 + Math.cos(i * 1.05) * 45}%`,
                  animation: `sparkleFloat ${1.2 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0,
                }}
              />
            ))}
            {/* Gift image */}
            <img
              src={activeAnimation.giftImageUrl}
              alt={activeAnimation.giftName}
              draggable={false}
              style={{
                width: activeAnimation.bmType === 1 ? '70vw' : '55vw',
                maxWidth: 320,
                height: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.4))',
                position: 'relative',
                zIndex: 2,
              }}
            />
          </div>
        </div>
      )}

      {/* Canvas for custom particles (grades 1-4, no media overlay) */}
      {grade > 0 && !hasMediaOverlay && (
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{ width: '100%', maxWidth: '400px', height: '300px' }}
        />
      )}

      {/* Gift Banner (all grades) */}
      <GiftBanner anim={activeAnimation} />

      {/* Grade indicator glow (grade >= 3, no media overlay) */}
      {grade >= 3 && !hasMediaOverlay && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, ${getGradeConfig(grade).color}15 0%, transparent 70%)`,
            pointerEvents: 'none',
            animation: 'gradeGlowFade 2s ease-out forwards',
          }}
        />
      )}

      <style>{`
        @keyframes gradeGlowFade {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes giftMediaScaleIn {
          0% { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes giftOverlayFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes giftImageCinematic {
          0% { opacity: 0; transform: scale(0.5) translateY(40px); }
          15% { opacity: 1; transform: scale(1.08) translateY(-5px); }
          25% { transform: scale(1) translateY(0); }
          50% { transform: scale(1) translateY(-10px); }
          70% { opacity: 1; transform: scale(1.02) translateY(0); }
          85% { opacity: 0.6; transform: scale(1.05) translateY(-15px); }
          100% { opacity: 0; transform: scale(1.1) translateY(-30px); }
        }
        @keyframes giftGlowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
        @keyframes sparkleFloat {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          30% { opacity: 1; transform: translateY(-12px) scale(1); }
          70% { opacity: 0.8; transform: translateY(-24px) scale(0.8); }
          100% { opacity: 0; transform: translateY(-40px) scale(0.3); }
        }
      `}</style>
    </div>
  );
}
