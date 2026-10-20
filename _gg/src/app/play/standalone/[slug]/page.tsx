'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

/**
 * صفحة ألعاب HTML5 مستقلة (single-file games من GitHub).
 * تُعرض عبر iframe من /standalone-games/<slug>/index.html
 */
export default function StandaloneGamePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [loaded, setLoaded] = useState(false);

  // قم بتنظيف أي حالة قديمة
  useEffect(() => {
    try {
      localStorage.removeItem(`${slug}-game-storage`);
    } catch {}
  }, [slug]);

  const gameMeta: Record<string, { name: string; emoji: string }> = {
    '2048': { name: '2048', emoji: '🎯' },
    'wordle': { name: 'وردل', emoji: '🔤' },
    'trap-the-cat': { name: 'افخخ القطة', emoji: '🐱' },
    'coreball': { name: 'كور بول', emoji: '⚫' },
    'sand-game': { name: 'لعبة الرمل', emoji: '🏜️' },
    'spacebar-clicker': { name: 'نقر المسافة', emoji: '⌨️' },
    'google-dino': { name: 'الديناصور', emoji: '🦖' },
  };

  const meta = gameMeta[slug] || { name: slug, emoji: '🎮' };

  return (
    <SubscriptionGuard gameSlug={slug}>
      <GameLayout gameSlug={slug} gameName={meta.name} gameEmoji={meta.emoji} accentColor="orange">
        <div className="relative w-full" style={{ minHeight: 'calc(100vh - 56px)' }}>
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl" style={{ background: 'linear-gradient(180deg, #07111d 0%, #1a0e08 50%, #07111d 100%)' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: '64px', marginBottom: '16px' }}
              >
                {meta.emoji}
              </motion.div>
              <p style={{ color: '#9fc4b4', fontSize: '15px' }}>جاري تحميل {meta.name}...</p>
            </div>
          )}
          <iframe
            src={`/standalone-games/${slug}/index.html`}
            title={meta.name}
            onLoad={() => setLoaded(true)}
            className="w-full"
            style={{
              minHeight: 'calc(100vh - 56px)',
              border: '0',
              display: loaded ? 'block' : 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          {loaded && (
            <div className="fixed top-2 right-2 z-50">
              <a href={`/#game-${slug}`} className="inline-block">
                <Button variant="outline" size="sm" className="bg-slate-900/80 border-orange-500/40 text-orange-200 hover:bg-slate-800/80 backdrop-blur">
                  <Home className="w-4 h-4 ml-2" />
                  خروج
                </Button>
              </a>
            </div>
          )}
        </div>
      </GameLayout>
    </SubscriptionGuard>
  );
}
