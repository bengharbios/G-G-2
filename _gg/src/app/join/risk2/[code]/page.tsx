'use client';

import { useState, useEffect, useRef, useCallback, useSyncExternalStore, use as useReact } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Loader2 } from 'lucide-react';
import Risk2SpectatorView from '@/components/risk2/Risk2SpectatorView';

// ============================================================
// Hydration guard
// ============================================================
function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

// ============================================================
// Join Form Component
// ============================================================
function JoinForm({ code, initialName }: { code: string; initialName: string }) {
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('يجب إدخال اسمك');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/risk2-room/${code}/spectator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError('الغرفة غير موجودة أو انتهت صلاحيتها');
        } else {
          const data = await res.json().catch(() => null);
          setError(data?.error || 'حدث خطأ غير متوقع');
        }
        setLoading(false);

        if (attempts < 3) {
          setAttempts((prev) => prev + 1);
        }
        return;
      }

      const data = await res.json();
      if (data.ok && data.spectatorId) {
        window.location.href = `/join/risk2/${code}?spectatorId=${data.spectatorId}&name=${encodeURIComponent(name.trim())}`;
        return;
      }

      setError('حدث خطأ غير متوقع');
      setLoading(false);
    } catch {
      setError('تعذر الاتصال بالخادم');
      setLoading(false);

      if (attempts < 3) {
        setAttempts((prev) => prev + 1);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
          className="text-5xl mb-3"
        >
          🎴
        </motion.div>
        <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-amber-400 mb-2">
          الانضمام كمشاهد
        </h1>
        <p className="text-xs text-slate-400">أدخل اسمك وانضم لمراقبة اللعبة</p>
      </div>

      {/* Room Code Display */}
      <Card className="bg-gradient-to-bl from-orange-950/40 via-slate-900/80 to-slate-900/80 border-orange-500/30 mb-6">
        <CardContent className="pt-5 sm:pt-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg sm:text-xl font-bold text-orange-300">كود الغرفة</h2>
            </div>
            <p className="text-3xl sm:text-4xl font-mono font-bold text-white tracking-[0.3em]" dir="ltr">{code}</p>
          </div>
        </CardContent>
      </Card>

      {/* Join Form */}
      <Card className="bg-slate-900/80 border-slate-700/50 mb-6">
        <CardContent className="pt-5 sm:pt-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              <h3 className="text-base font-bold text-orange-300">معلومات المشاهد</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">اسمك</label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="أدخل اسمك هنا..."
                className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 text-right h-12 focus:border-orange-500/50"
                dir="rtl"
                maxLength={20}
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-xs text-center"
              >
                ⚠️ {error}
              </motion.p>
            )}

            {attempts > 0 && attempts < 3 && !error && (
              <p className="text-slate-500 text-[10px] text-center">محاولة {attempts} من 3</p>
            )}

            <Button
              type="submit"
              disabled={loading || !name.trim() || attempts >= 3}
              className="w-full bg-gradient-to-l from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white font-bold text-base sm:text-lg py-5 sm:py-6 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الانضمام...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 ml-2" />
                  انضمام
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Back Link */}
      <div className="text-center">
        <a href="/risk2" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          ← العودة لصفحة اللعبة
        </a>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function JoinRisk2Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = useReact(params);
  const mounted = useHydrated();
  const searchParams = useSearchParams();
  const spectatorId = searchParams.get('spectatorId');
  const queryName = searchParams.get('name');

  // Auto-join when name is in URL but no spectatorId yet
  const [autoJoining, setAutoJoining] = useState(false);
  const autoJoinAttempted = useRef(false);

  const attemptAutoJoin = useCallback(() => {
    if (!queryName || spectatorId || autoJoinAttempted.current) return;
    const trimmedName = decodeURIComponent(queryName).trim();
    if (!trimmedName) return;
    autoJoinAttempted.current = true;
    setAutoJoining(true);
    fetch(`/api/risk2-room/${code}/spectator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName }),
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (data.ok && data.spectatorId) {
          window.location.href = `/join/risk2/${code}?spectatorId=${data.spectatorId}&name=${encodeURIComponent(trimmedName)}`;
        } else {
          setAutoJoining(false);
        }
      })
      .catch(() => {
        setAutoJoining(false);
      });
  }, [code, queryName, spectatorId]);

  useEffect(() => {
    if (mounted) {
      attemptAutoJoin();
    }
  }, [mounted, attemptAutoJoin]);

  if (!mounted || autoJoining) {
    return (
      <div className="min-h-screen flex items-center justify-center risk-bg" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">👁️</div>
          <p className="text-slate-400">{autoJoining ? 'جاري الانضمام كمشاهد...' : 'جاري التحميل...'}</p>
        </div>
      </div>
    );
  }

  // If spectatorId is present, show spectator view
  if (spectatorId) {
    return <Risk2SpectatorView roomCode={code} />;
  }

  // Otherwise show join form (fallback for direct navigation without name)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 risk-bg" dir="rtl">
      <JoinForm code={code} initialName={queryName ? decodeURIComponent(queryName) : ''} />
    </div>
  );
}
