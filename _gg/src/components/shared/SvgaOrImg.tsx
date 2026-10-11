'use client';

import { useEffect, useRef, useState } from 'react';

// ─── SvgaOrImg ─────────────────────────────────────────────────────────
// يعرض ملفات SVGA المتحركة عبر svgaplayerweb في canvas، والصور العادية عبر <img>.
// يكتشف النوع عبر امتداد الملف.

interface SvgaOrImgProps {
  src: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
}

// ضمان تحميل سكريبت svga.min.js مرة واحدة
let svgaScriptPromise: Promise<typeof window.SVGA> | null = null;

function loadSvgaScript(): Promise<typeof window.SVGA> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if ((window as unknown as { SVGA?: unknown }).SVGA) {
    return Promise.resolve((window as unknown as { SVGA: typeof window.SVGA }).SVGA);
  }
  if (svgaScriptPromise) return svgaScriptPromise;

  svgaScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-svga-loader]');
    if (existing) {
      existing.addEventListener('load', () => {
        if ((window as unknown as { SVGA?: typeof window.SVGA }).SVGA) {
          resolve((window as unknown as { SVGA: typeof window.SVGA }).SVGA);
        } else {
          reject(new Error('SVGA script loaded but window.SVGA missing'));
        }
      });
      existing.addEventListener('error', () => reject(new Error('SVGA script load error')));
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.dataset.svgaLoader = 'true';
    // نفضّل تحميل النسخة المحلية إن وُجدت، وإلا نستخدم حزمة node_modules
    s.src = '/svga/svga.min.js';
    s.onload = () => {
      if ((window as unknown as { SVGA?: typeof window.SVGA }).SVGA) {
        resolve((window as unknown as { SVGA: typeof window.SVGA }).SVGA);
      } else {
        reject(new Error('SVGA loaded but missing'));
      }
    };
    s.onerror = () => reject(new Error('SVGA script failed'));
    document.head.appendChild(s);
  });
  return svgaScriptPromise;
}

export default function SvgaOrImg({ src, alt = '', className, loading = 'lazy', onError }: SvgaOrImgProps) {
  // ملفات SVGA فقط هي التي تحتاج تشغيل canvas
  const lowerSrc = src.toLowerCase();
  const isSvga = lowerSrc.endsWith('.svga');
  const isVideo = lowerSrc.endsWith('.mp4') || lowerSrc.endsWith('.webm') || lowerSrc.endsWith('.mov');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<{ stopAnimation: (clear?: boolean) => void; clear?: () => void } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSvga || !canvasRef.current || failed) return;
    let cancelled = false;
    let localPlayer: { stopAnimation: (clear?: boolean) => void; clear?: () => void } | null = null;

    // ضبط canvas بأبعاد الفيديو الأصلية (video.videoSize)
    // هذا يضمن أن canvas بنسبة عرض إلى ارتفاع مطابقة للفيديو، فلا فراغات جانبية/علوية
    // CSS يتولى حساب الارتفاع الظاهري تلقائياً عبر height: auto
    const syncCanvasToVideo = (videoItem: { videoSize?: { width: number; height: number } }) => {
      const c = canvasRef.current;
      if (!c || !videoItem?.videoSize) return;
      const { width, height } = videoItem.videoSize;
      if (width > 0 && height > 0) {
        // أبعاد الـ drawing buffer = أبعاد الفيديو الأصلية (نفس نسبة العرض إلى الارتفاع)
        c.width = Math.round(width);
        c.height = Math.round(height);
        c.style.display = 'block';
        // CSS height: auto يضمن أن الارتفاع الظاهري يُحسب من نسبة العرض إلى الارتباط
        // (العرض width: 100% من الحاوية، الارتفاع تلقائي)
      }
    };

    loadSvgaScript()
      .then((SVGA) => {
        if (cancelled || !canvasRef.current) return;
        // إن كان اللاعب موجوداً، نوقفه أولاً
        if (playerRef.current?.stopAnimation) {
          try { playerRef.current.stopAnimation(true); } catch {}
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const player = new (SVGA as any).Player(canvasRef.current);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parser = new (SVGA as any).Parser();
        parser.load(src, (videoItem: { videoSize?: { width: number; height: number } }) => {
          if (cancelled) return;
          // مهم: ضبط أبعاد canvas لمطابقة أبعاد الفيديو (وليس الحاوية)
          syncCanvasToVideo(videoItem);
          player.setVideoItem(videoItem);
          player.setContentMode('AspectFit'); // مطابق لنسبة الفيديو فلا فراغات
          player.setClipsToBounds(true);
          player.loops = 0; // تكرار لا نهائي
          player.startAnimation();
          localPlayer = player;
          playerRef.current = player;
        }, () => {
          setFailed(true);
          onError?.();
        });
      })
      .catch(() => {
        setFailed(true);
        onError?.();
      });

    return () => {
      cancelled = true;
      if (localPlayer) {
        try { localPlayer.stopAnimation(true); } catch {}
        try { localPlayer.clear?.(); } catch {}
      }
    };
  }, [isSvga, src, failed, onError]);

  // للفيديو (MP4/WebM/MOV) — استخدم <video>
  if (isVideo) {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        onError={() => onError?.()}
      />
    );
  }

  // للصور العادية أو عند فشل SVGA — استخدم <img>
  if (!isSvga || failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={className}
        onError={(e) => {
          // إخفاء الصورة عند الفشل
          const t = e.target as HTMLImageElement;
          t.style.display = 'none';
          onError?.();
        }}
      />
    );
  }

  return (
    <div ref={containerRef} className={`svga-wrapper ${className ?? ''}`} style={{ width: '100%', height: '100%', display: 'block' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
      />
    </div>
  );
}
