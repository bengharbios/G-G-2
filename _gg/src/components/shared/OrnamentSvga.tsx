'use client';

import { useEffect, useRef, useState } from 'react';

// ─── OrnamentSvga ─────────────────────────────────────────────────────────
// مكوّن مستقل لعرض معلقات SVGA في البروفايل — منفصل تماماً عن SvgaOrImg
//
// المنطق:
// - بعد تحميل الفيديو، نعرف نسبة عرضه إلى ارتفاعه (مثل 1200:400 = 3:1)
// - نحسب ارتفاع العرض = عرض الحاوية ÷ نسبة الفيديو (مثل 350÷3 = 117px)
// - نضبط canvas intrinsic = (عرض الحاوية) × (ارتفاع العرض المحسوب)
//   → canvas intrinsic له نفس نسبة الفيديو → AspectFit يملأ canvas بالكامل
// - canvas display = 100% × 100% من الحاوية = (عرض الحاوية) × (ارتفاع العرض)
// - لا حاجة لـ object-fit (لا يعمل على canvas بموثوقية)
// - لا فراغات، لا فيضان، فيديو يملأ canvas بالكامل

interface OrnamentSvgaProps {
  src: string;
  alt?: string;
  className?: string;
}

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
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<{ stopAnimation: (clear?: boolean) => void; clear?: () => void } | null>(null);
  const [failed, setFailed] = useState(false);
  // ارتفاع الحاوية المحسوب من نسبة الفيديو — يُضبط عبر React state
  const [wrapperHeight, setWrapperHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current || failed) return;
    let cancelled = false;
    let localPlayer: { stopAnimation: (clear?: boolean) => void; clear?: () => void } | null = null;

    // ضبط canvas intrinsic = أبعاد الحاوية بنسبة الفيديو
    // كي يملأ الفيديو canvas بالكامل (AspectFit يملأ لأن النسب متطابقة)
    const syncCanvasSize = (videoSize?: { width: number; height: number }) => {
      const c = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!c || !wrapper) return;

      // عرض الحاوية (من العنصر الأم .yp-ornament أو من wrapper نفسه)
      const parentEl = wrapper.parentElement;
      if (!parentEl) return;
      const parentRect = parentEl.getBoundingClientRect();
      const parentWidth = parentRect.width;
      if (parentWidth <= 0) return;

      if (videoSize) {
        // بعد تحميل الفيديو: احسب الارتفاع من نسبة الفيديو
        const ratio = videoSize.height / videoSize.width; // مثل 400/1200 = 0.333
        const displayHeight = Math.round(parentWidth * ratio); // مثل 350 × 0.333 = 117
        // canvas intrinsic = نفس أبعاد العرض (لا حاجة لتحجيم)
        c.width = Math.round(parentWidth);
        c.height = displayHeight;
        // الحاوية بارتفاع الفيديو المحسوب
        setWrapperHeight(displayHeight);
      } else {
        // قبل تحميل الفيديو: حجم مؤقت بنسبة 3:1 (تقدير أولي)
        c.width = Math.round(parentWidth);
        c.height = Math.round(parentWidth / 3);
      }
    };
    syncCanvasSize();

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
          // اضبط canvas على أبعاد الحاوية بنسبة الفيديو
          syncCanvasSize(videoItem?.videoSize);
          player.setVideoItem(videoItem);
          player.setContentMode('AspectFit'); // يملأ canvas لأن النسب متطابقة
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

    // مراقب تغيّر حجم الحاوية لإعادة ضبط canvas
    const parentEl = wrapperRef.current?.parentElement;
    const ro = parentEl
      ? new ResizeObserver(() => {
          // أعد الضبط فقط إذا كان الفيديو محمّلاً
          if (playerRef.current) {
            const c = canvasRef.current;
            const wrapper = wrapperRef.current;
            if (!c || !wrapper) return;
            const pEl = wrapper.parentElement;
            if (!pEl) return;
            const pw = pEl.getBoundingClientRect().width;
            if (pw > 0) {
              // نسبة الفيديو محفوظة في canvas.height/width
              const ratio = c.height / c.width;
              const dh = Math.round(pw * ratio);
              c.width = Math.round(pw);
              c.height = dh;
              setWrapperHeight(dh);
            }
          }
        })
      : null;
    if (parentEl && ro) ro.observe(parentEl);

    return () => {
      cancelled = true;
      ro?.disconnect();
      if (localPlayer) {
        try { localPlayer.stopAnimation(true); } catch {}
        try { localPlayer.clear?.(); } catch {}
      }
    };
  }, [src, failed]);

  if (failed) return null;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        width: '100%',
        height: wrapperHeight ? `${wrapperHeight}px` : undefined,
        display: 'block',
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={alt}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
