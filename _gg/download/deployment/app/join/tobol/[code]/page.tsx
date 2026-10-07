'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import TobolSpectatorView from '@/components/tobol/TobolSpectatorView';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function TobolJoinContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const codeParam = params?.code;
  const code = typeof codeParam === 'string' ? codeParam : '';
  const name = searchParams?.get('name') || '';
  const mounted = useHydrated();

  const [spectatorName, setSpectatorName] = useState('');
  const [spectatorId, setSpectatorId] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [inputName, setInputName] = useState('');
  const [nameError, setNameError] = useState('');
  const connectAttempted = useRef(false);

  // Send heartbeat to keep spectator alive
  useEffect(() => {
    if (!spectatorId || !code) return;
    const beat = () => {
      fetch(`/api/tobol-room/${code}/spectator`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spectatorId }),
      }).catch(() => {});
    };
    beat();
    const iv = setInterval(beat, 5000);
    return () => clearInterval(iv);
  }, [spectatorId, code]);

  // Cleanup spectator on unmount
  useEffect(() => {
    if (!spectatorId || !code) return;
    return () => {
      fetch(`/api/tobol-room/${code}/spectator?id=${spectatorId}`, { method: 'DELETE' }).catch(() => {});
    };
  }, [spectatorId, code]);

  // Connect function with retry logic using async/await
  const connectAsSpectator = useCallback(async (sName: string) => {
    if (!code) {
      setError('كود الغرفة مفقود');
      return;
    }
    setConnecting(true);
    setError('');
    console.log(`[Tobol] Connecting to room ${code} as ${sName}...`);

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`[Tobol] Attempt ${attempt}/${MAX_RETRIES} - fetching room...`);
        const res = await fetch(`/api/tobol-room/${code}`);

        if (!res.ok) {
          console.log(`[Tobol] Room fetch failed: ${res.status}`);
          if (res.status === 404) {
            setError('الغرفة غير موجودة أو انتهت صلاحيتها');
            setConnecting(false);
            return;
          }
          // Retry for server errors
          if (attempt < MAX_RETRIES) {
            console.log(`[Tobol] Retrying in ${RETRY_DELAY}ms...`);
            await new Promise(r => setTimeout(r, RETRY_DELAY));
            continue;
          }
          setError('فشل في الاتصال بالغرفة');
          setConnecting(false);
          return;
        }

        const data = await res.json();
        console.log(`[Tobol] Room found, phase: ${data.room?.phase}, spectators: ${data.room?.spectators?.length || 0}`);

        // Check if game is already over
        if (data.room?.phase === 'game_over') {
          console.log('[Tobol] Game already over, showing results');
          setGameOver(true);
          setSpectatorName(sName);
          setConnected(true);
          return;
        }

        // Register as spectator
        console.log('[Tobol] Registering as spectator...');
        const specRes = await fetch(`/api/tobol-room/${code}/spectator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: sName }),
        });

        if (!specRes.ok) {
          console.log(`[Tobol] Spectator registration failed: ${specRes.status}`);
          if (attempt < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, RETRY_DELAY));
            continue;
          }
          setError('فشل التسجيل كمشاهد');
          setConnecting(false);
          return;
        }

        const specData = await specRes.json();
        console.log('[Tobol] Connected as spectator:', specData);

        if (specData.success) {
          setSpectatorId(specData.spectatorId || '');
          setSpectatorName(sName);
          setConnected(true);
          return;
        } else {
          setError('فشل التسجيل كمشاهد');
          setConnecting(false);
          return;
        }
      } catch (err) {
        console.error(`[Tobol] Connection error (attempt ${attempt}):`, err);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, RETRY_DELAY));
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
    if (!mounted || !name || connectAttempted.current) return;
    connectAttempted.current = true;
    setSpectatorName(name);
    connectAsSpectator(name);
  }, [mounted, name, connectAsSpectator]);

  const handleConnect = () => {
    if (!inputName.trim()) { setNameError('يجب إدخال اسمك'); return; }
    if (inputName.trim().length < 2) { setNameError('الاسم قصير جداً'); return; }
    setNameError('');
    connectAsSpectator(inputName.trim());
  };

  // Before hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">👁️</div>
          <p className="text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Connecting
  if (connecting) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">👁️</div>
          <p className="text-slate-400">جاري الاتصال بالغرفة...</p>
          {code && <p className="text-slate-500 text-xs mt-2 font-mono">كود: {code}</p>}
        </div>
      </div>
    );
  }

  // Connected → spectator view
  if (connected && spectatorName && !error) {
    return (
      <div className="flex flex-col min-h-screen tobol-bg">
        <div className="sticky top-0 z-50 border-b border-green-800/50 bg-slate-950/90 backdrop-blur-sm">
          <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">👁️</span>
              <div>
                <p className="text-xs font-bold text-green-300">{spectatorName}</p>
                <p className="text-[9px] text-slate-500">مشاهد • غرفة {code}</p>
              </div>
            </div>
            {gameOver && (
              <span className="text-[10px] font-bold text-yellow-300 bg-yellow-950/40 border border-yellow-500/30 px-2 py-0.5 rounded-lg">
                🏁 انتهت المعركة
              </span>
            )}
            <a href="/diwaniya" className="text-xs text-slate-400 hover:text-red-400 transition-colors">خروج ✕</a>
          </div>
        </div>
        <main className="flex-1"><TobolSpectatorView roomCode={code} /></main>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center max-w-sm mx-auto p-4">
          <div className="text-5xl mb-4">💔</div>
          <p className="text-red-400 text-lg font-bold mb-2">{error}</p>
          {code && <p className="text-slate-500 text-xs mb-4">كود: <span className="font-mono text-white">{code}</span></p>}
          <button
            onClick={() => { setError(''); connectAsSpectator(spectatorName || inputName || name); }}
            className="block mx-auto text-sm text-blue-400 hover:text-blue-300 underline mb-3 cursor-pointer"
          >
            إعادة المحاولة
          </button>
          <a href="/diwaniya" className="text-sm text-blue-400 hover:text-blue-300 underline">العودة لصفحة الديوانية</a>
        </div>
      </div>
    );
  }

  // Name entry form (no code or no name in URL)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 tobol-bg" dir="rtl">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">👁️</div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-300 to-blue-400 mb-2">
            مشاهدة طبول الحرب
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
          <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-5 sm:p-6">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">اسمك كمشاهد</label>
                <input
                  value={inputName}
                  onChange={(e) => { setInputName(e.target.value); setNameError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                  placeholder="اسمك..."
                  className="w-full bg-slate-800/50 border border-blue-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12 text-lg rounded-lg px-3 outline-none focus:border-blue-400/50"
                  dir="rtl" maxLength={20} autoFocus
                />
              </div>
              {nameError && <p className="text-red-400 text-xs text-center">⚠️ {nameError}</p>}
              <button onClick={handleConnect}
                className="w-full bg-gradient-to-l from-blue-600 to-indigo-800 hover:from-blue-500 hover:to-indigo-700 text-white font-bold text-base sm:text-lg py-4 rounded-xl transition-all cursor-pointer">
                👁️ انضم للمشاهدة
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-yellow-500/30 rounded-2xl p-5 sm:p-6 text-center">
            <p className="text-yellow-300 text-sm mb-3">الكود غير موجود في الرابط</p>
            <p className="text-slate-400 text-xs mb-4">تأكد من استخدام الرابط الصحيح من صفحة الديوانية</p>
            <a href="/diwaniya" className="text-sm text-blue-400 hover:text-blue-300 underline">العودة لصفحة الديوانية</a>
          </div>
        )}

        <div className="text-center mt-4">
          <a href="/diwaniya" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← العودة لصفحة الديوانية</a>
        </div>
      </div>
    </div>
  );
}

export default function TobolJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center tobol-bg">
        <div className="text-center"><div className="text-5xl mb-4 animate-bounce">👁️</div><p className="text-slate-400">جاري التحميل...</p></div>
      </div>
    }>
      <TobolJoinContent />
    </Suspense>
  );
}
