'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import MafiaSpectatorView from '@/components/mafia/MafiaSpectatorView';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function MafiaJoinContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const codeParam = params?.code;
  const code = typeof codeParam === 'string' ? codeParam : '';
  const nameFromUrl = searchParams?.get('name') || '';
  const mounted = useHydrated();

  const [spectatorId, setSpectatorId] = useState('');
  const [spectatorName, setSpectatorName] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [inputName, setInputName] = useState('');
  const [nameError, setNameError] = useState('');
  const connectAttempted = useRef(false);

  // Send heartbeat to keep spectator alive
  useEffect(() => {
    if (!spectatorId || !code) return;
    const beat = () => {
      fetch(`/api/mafia-room/${code}/spectator`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spectatorId }),
      }).catch(() => {});
    };
    beat();
    const iv = setInterval(beat, 5000);
    return () => clearInterval(iv);
  }, [spectatorId, code]);

  // Cleanup on unmount
  useEffect(() => {
    if (!spectatorId || !code) return;
    return () => {
      fetch(`/api/mafia-room/${code}/spectator?id=${spectatorId}`, { method: 'DELETE' }).catch(() => {});
    };
  }, [spectatorId, code]);

  // Connect as spectator
  const connectAsSpectator = useCallback(async (pName: string) => {
    if (!code) {
      setError('كود الغرفة مفقود');
      return;
    }
    setConnecting(true);
    setError('');

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const roomRes = await fetch(`/api/mafia-room/${code}`);
        if (!roomRes.ok) {
          if (roomRes.status === 404) {
            setError('الغرفة غير موجودة أو انتهت صلاحيتها');
            setConnecting(false);
            return;
          }
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          setError('فشل في الاتصال بالغرفة');
          setConnecting(false);
          return;
        }

        const specRes = await fetch(`/api/mafia-room/${code}/spectator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: pName }),
        });

        if (!specRes.ok) {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          setError('فشل التسجيل');
          setConnecting(false);
          return;
        }

        const specData = await specRes.json();
        if (specData.success) {
          setSpectatorId(specData.spectatorId || '');
          setSpectatorName(pName);
          setConnected(true);
          return;
        }
      } catch {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        setError('تعذر الاتصال بالخادم');
        setConnecting(false);
        return;
      }
    }
  }, [code]);

  // Auto-connect when hydrated with name in URL
  useEffect(() => {
    if (!mounted || connectAttempted.current) return;
    if (!nameFromUrl) return;
    connectAttempted.current = true;
    setInputName(nameFromUrl);
    connectAsSpectator(nameFromUrl);
  }, [mounted, nameFromUrl, connectAsSpectator]);

  const handleJoin = () => {
    if (!inputName.trim()) {
      setNameError('يجب إدخال اسمك');
      return;
    }
    if (inputName.trim().length < 2) {
      setNameError('الاسم قصير جداً');
      return;
    }
    setNameError('');
    connectAsSpectator(inputName.trim());
  };

  // Connected → spectator view
  if (connected && spectatorName && !error) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="sticky top-0 z-50 border-b border-red-900/40 bg-slate-950/90 backdrop-blur-sm">
          <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-red-600/50 text-red-300">
                👁
              </div>
              <div>
                <p className="text-xs font-bold text-red-300">{spectatorName}</p>
                <p className="text-[9px] text-slate-500">مشاهد • غرفة {code}</p>
              </div>
            </div>
            <a href="/mafia" className="text-xs text-slate-400 hover:text-red-400 transition-colors">
              خروج ✕
            </a>
          </div>
        </div>
        <main className="flex-1">
          <MafiaSpectatorView roomCode={code} />
        </main>
      </div>
    );
  }

  // Before hydration
  if (!mounted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        dir="rtl"
        style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0303 100%)' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎩</div>
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Connecting
  if (connecting) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        dir="rtl"
        style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0303 100%)' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">👁</div>
          <p className="text-slate-400">جاري الانضمام كمشاهد...</p>
          {code && (
            <p className="text-slate-500 text-xs mt-2 font-mono">كود: {code}</p>
          )}
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        dir="rtl"
        style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0303 100%)' }}
      >
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">💔</div>
          <p className="text-red-400 text-lg font-bold mb-2">{error}</p>
          {code && (
            <p className="text-slate-500 text-xs mb-4">
              كود: <span className="font-mono text-white">{code}</span>
            </p>
          )}
          <button
            onClick={() => {
              setError('');
              setConnecting(false);
            }}
            className="block mx-auto text-sm text-red-400 hover:text-red-300 underline mb-3 cursor-pointer"
          >
            إعادة المحاولة
          </button>
          <a
            href="/mafia"
            className="text-sm text-red-400 hover:text-red-300 underline"
          >
            العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    );
  }

  // Name entry
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4"
      dir="rtl"
      style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0303 100%)' }}
    >
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🎩</div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-red-400 mb-2">
            مشاهدة المافيا
          </h1>
          {code ? (
            <p className="text-slate-400 text-xs sm:text-sm font-bold">
              الغرفة: <span className="font-mono text-white tracking-wider">{code}</span>
            </p>
          ) : (
            <p className="text-yellow-400 text-xs">⚠️ كود الغرفة غير موجود في الرابط</p>
          )}
        </div>

        {code ? (
          <div className="bg-slate-900/80 border border-red-500/30 rounded-2xl p-5 sm:p-6">
            <div className="space-y-3">
              <div className="text-center mb-2">
                <p className="text-xs text-red-300">وضع المشاهدة — شاهد المعركة مباشرة</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">اسمك كمشاهد</label>
                <input
                  value={inputName}
                  onChange={(e) => {
                    setInputName(e.target.value);
                    setNameError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="اسمك..."
                  className="w-full bg-slate-800/50 border border-red-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12 text-lg rounded-lg px-3 outline-none focus:border-red-400/50"
                  dir="rtl"
                  maxLength={20}
                  autoFocus
                />
              </div>
              {nameError && (
                <p className="text-red-400 text-xs text-center">⚠️ {nameError}</p>
              )}
              <button
                onClick={handleJoin}
                className="w-full bg-gradient-to-l from-red-700 to-rose-900 hover:from-red-600 hover:to-rose-800 text-white font-bold text-base sm:text-lg py-4 rounded-xl transition-all cursor-pointer"
              >
                👁 شاهد المعركة
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-yellow-500/30 rounded-2xl p-5 sm:p-6 text-center">
            <p className="text-yellow-300 text-sm mb-3">الكود غير موجود في الرابط</p>
            <a
              href="/mafia"
              className="text-sm text-red-400 hover:text-red-300 underline"
            >
              العودة للصفحة الرئيسية
            </a>
          </div>
        )}

        <div className="text-center mt-4">
          <a
            href="/mafia"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export default function MafiaJoinPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0303 100%)' }}
        >
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce">🎩</div>
            <p className="text-slate-400">جاري التحميل...</p>
          </div>
        </div>
      }
    >
      <MafiaJoinContent />
    </Suspense>
  );
}
