'use client';

import { useEffect, useRef, useState } from 'react';

// ─── OrnamentSvga ─────────────────────────────────────────────────────────
// مكوّن مستقل لعرض معلقات SVGA في البروفايل — منفصل تماماً عن SvgaOrImg
// كي لا تتأثر إطارات الهيدر والمتجر بأي تغييرات هنا.
//
// المنطق:
// - canvas intrinsic = أبعاد الفيديو الأصلية (مثل 1200×400)
// - canvas display = يملأ الحاوية (width: 100%, height: 100%)
// - CSS object-fit: contain يحجم الفيديو داخل الحاوية مع المحافظة على النسبة
// - CSS object-position: top center يضع الفيديو في أعلى الحاوية (لا فراغ علوي)
// - الحاوية لها ارتفاع ثابت (يُحدد via CSS .yp-ornament)

interface OrnamentSvgaProps {
  src: string;
  alt?: string;
  className?: string;
}

// نعيد استخدام ذاكرة تحميل السكريبت من SvgaOrImg (نفس المتغير العام)
// كي لا نحمّل السكريبت مرتين
declare global {
  interface Window {
    SVGA?: {
      Player: new (canvas: HTMLCanvasElement) => unknown;
      Parser: new () => {
        load: (url: string, success: (videoItem: unknown) => void, failure?: (err: Error) => void) => void;
      };
    };
  }
}

let svgaScriptPromise: Promise<typeof window.SVGA> | null = null;

function loadSvgaScript(): Promise<typeof window.SVGA> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.SVGA) return Promise.resolve(window.SVGA);
  if (svgaScriptPromise) return svgaScriptPromise;

  svgaScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-svga-loader]');
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.SVGA) resolve(window.SVGA);
        else reject(new Error('SVGA script loaded but window.SVGA missing'));
      });
      existing.addEventListener('error', () => reject(new Error('SVGA script load error')));
      return;
    }
    const s = document.createElement('script');
    s.async = true;
    s.dataset.svgaLoader = 'true';
    s.src = '/svga/svga.min.js';
    s.onload = () => {
      if (window.SVGA) resolve(window.SVGA);
      else reject(new Error('SVGA loaded but missing'));
    };
    s.onerror = () => reject(new Error('SVGA script failed'));
    document.head.appendChild(s);
  });
  return svgaScriptPromise;
}

export default function OrnamentSvga({ src, alt = '', className }: OrnamentSvgaProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerRef = useRef<{ stopAnimation: (clear?: boolean) => void; clear?: () => void } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || failed) return;
    let cancelled = false;
    let localPlayer: { stopAnimation: (clear?: boolean) => void; clear?: () => void } | null = null;

    // اضبط canvas على أبعاد الحاوية مؤقتاً (قبل تحميل الفيديو)
    const setInitialSize = () => {
      const c = canvasRef.current;
      const parent = c?.parentElement;
      if (!c || !parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        c.width = Math.round(rect.width);
        c.height = Math.round(rect.height);
      }
    };
    setInitialSize();

    loadSvgaScript()
      .then((SVGA) => {
        if (cancelled || !canvasRef.current) return;
        if (playerRef.current?.stopAnimation) {
          try { playerRef.current.stopAnimation(true); } catch {}
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const player = new (SVGA as any).Player(canvasRef.current);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parser = new (SVGA as any).Parser();
        parser.load(src, (videoItem: { videoSize?: { width: number; height: number } }) => {
          if (cancelled) return;
          // اضبط canvas intrinsic على أبعاد الفيديو الأصلية
          // كي يتمكن CSS object-fit من تحجيم الفيديو داخل الحاوية بشكل صحيح
          if (videoItem?.videoSize) {
            canvasRef.current.width = Math.round(videoItem.videoSize.width);
            canvasRef.current.height = Math.round(videoItem.videoSize.height);
          }
          player.setVideoItem(videoItem);
          player.setContentMode('AspectFit');
          player.setClipsToBounds(true);
          player.loops = 0;
          player.startAnimation();
          localPlayer = player;
          playerRef.current = player;
        }, () => {
          setFailed(true);
        });
      })
      .catch(() => {
        setFailed(true);
      });

    return () => {
      cancelled = true;
      if (localPlayer) {
        try { localPlayer.stopAnimation(true); } catch {}
        try { localPlayer.clear?.(); } catch {}
      }
    };
  }, [src, failed]);

  if (failed) {
    return null; // إخفاء المعلقة عند فشل التحميل
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={alt}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: 'contain',
        objectPosition: 'top center',
      }}
    />
  );
}
