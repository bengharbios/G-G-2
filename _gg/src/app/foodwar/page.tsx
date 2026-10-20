'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import GameLayout from '@/components/shared/GameLayout';

/**
 * صفحة "حرب الاكلات" — تعرض النسخة الأصلية من loveligo.com عبر iframe.
 * الملفات الأصلية موجودة في public/foodwar-game/index.html
 * تعمل بvanilla JS + canvas wheel + 105 أطعمة عربية حقيقية.
 */
export default function FoodWarPage() {
  return (
    <SubscriptionGuard gameSlug="foodwar">
      <GameLayout gameSlug="foodwar" gameName="حرب الاكلات" gameEmoji="🍕" accentColor="emerald">
        <FoodWarFrame />
      </GameLayout>
    </SubscriptionGuard>
  );
}

function FoodWarFrame() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const [loaded, setLoaded] = useState(false);

  // قم بتنظيف أي حالة قديمة من foodwar-game-storage عند الدخول
  useEffect(() => {
    try {
      localStorage.removeItem('foodwar-game-storage');
      localStorage.removeItem('foodwar-game-storage__disconnect_ts');
    } catch {}
  }, []);

  // مرر وضع العرّاب/الديوانية عبر hash للـiframe (إن أردت لاحقاً)
  const iframeSrc = `/foodwar-game/index.html${mode ? `#mode=${mode}` : ''}`;

  return (
    <div className="relative w-full" style={{ minHeight: 'calc(100vh - 56px)' }}>
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center" dir="rtl" style={{ background: 'linear-gradient(180deg, #07111d 0%, #1a0e08 50%, #07111d 100%)' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ fontSize: '64px', marginBottom: '16px' }}
          >
            🍕
          </motion.div>
          <p style={{ color: '#9fc4b4', fontSize: '15px' }}>جاري تحميل لعبة حرب الاكلات...</p>
        </div>
      )}
      <iframe
        src={iframeSrc}
        title="حرب الاكلات"
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
          <a href="/#game-foodwar" className="inline-block">
            <Button variant="outline" size="sm" className="bg-slate-900/80 border-orange-500/40 text-orange-200 hover:bg-slate-800/80 backdrop-blur">
              <Home className="w-4 h-4 ml-2" />
              خروج
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
