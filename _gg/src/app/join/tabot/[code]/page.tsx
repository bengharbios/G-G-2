'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSyncExternalStore } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import SpectatorView from '@/components/tabot/SpectatorView';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function TabotJoinContent() {
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
  const [stateJson, setStateJson] = useState('{}');
  const [hostName, setHostName] = useState('');

  // Poll room state
  useEffect(() => {
    if (!connected || !code) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/room/${code}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.stateJson) setStateJson(data.stateJson);
        if (data?.hostName) setHostName(data.hostName);
      } catch { /* silent */ }
    };
    poll();
    const iv = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [connected, code]);

  // Send heartbeat to keep spectator alive
  useEffect(() => {
    if (!spectatorId || !code) return;
    const beat = () => {
      fetch(`/api/room/${code}/spectator`, {
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
      fetch(`/api/room/${code}/spectator?id=${spectatorId}`, { method: 'DELETE' }).catch(() => {});
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
        const roomRes = await fetch(`/api/room/${code}`);
        if (!roomRes.ok) {
          if (roomRes.status === 404) {
            setError('الغرفة غير موجودة أو انتهت صلاحيتها');
            setConnecting(false);
            return;
          }
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 2000));
            continue;
          }
          setError('فشل في الاتصال بالغرفة');
          setConnecting(false);
          return;
        }

        const roomData = await roomRes.json();
        if (roomData?.stateJson) setStateJson(roomData.stateJson);
        if (roomData?.hostName) setHostName(roomData.hostName);

        const specRes = await fetch(`/api/room/${code}/spectator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: pName, gameType: 'tabot' }),
        });

        if (!specRes.ok) {
          if (attempt < 3) {
            await new Promise(r => setTimeout(r, 2000));
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
          await new Promise(r => setTimeout(r, 2000));
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
    if (!mounted || !nameFromUrl) return;
    if (connected) return;
    setInputName(nameFromUrl);
    connectAsSpectator(nameFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, nameFromUrl]);

  const handleJoin = () => {
    if (!inputName.trim()) { setNameError('يجب إدخال اسمك'); return; }
    if (inputName.trim().length < 2) { setNameError('الاسم قصير جداً'); return; }
    setNameError('');
    connectAsSpectator(inputName.trim());
  };

  // Connected → spectator view
  if (connected && spectatorName && !error) {
    return (
      <div className="flex flex-col min-h-screen tobol-bg">
        <div className="sticky top-0 z-50 border-b border-amber-800/50 bg-slate-950/90 backdrop-blur-sm">
          <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-purple-600/50 text-purple-300">
                👁
              </div>
              <div>
                <p className="text-xs font-bold text-purple-300">{spectatorName}</p>
                <p className="text-[9px] text-slate-500">مشاهد • غرفة {code}</p>
              </div>
            </div>
            <a href="/tabot" className="text-xs text-slate-400 hover:text-red-400 transition-colors">خروج ✕</a>
          </div>
        </div>
        <main className="flex-1">
          <SpectatorView stateJson={stateJson} roomCode={code} hostName={hostName} />
        </main>
      </div>
    );
  }

  // Before hydration
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">⚰️</div>
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
          <div className="text-5xl mb-4 animate-bounce">👁</div>
          <p className="text-slate-400">جاري الانضمام كمشاهد...</p>
          {code && <p className="text-slate-500 text-xs mt-2 font-mono">كود: {code}</p>}
        </div>
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
            onClick={() => { setError(''); setConnecting(false); }}
            className="block mx-auto text-sm text-amber-400 hover:text-amber-300 underline mb-3 cursor-pointer"
          >
            إعادة المحاولة
          </button>
          <a href="/tabot" className="text-sm text-amber-400 hover:text-amber-300 underline">العودة للصفحة الرئيسية</a>
        </div>
      </div>
    );
  }

  // Name entry
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 tobol-bg" dir="rtl">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">⚰️</div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-amber-300 to-purple-400 mb-2">
            مشاهدة الهروب من التابوت
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
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-5 sm:p-6">
            <div className="space-y-3">
              <div className="text-center mb-2">
                <p className="text-xs text-purple-300">وضع المشاهدة — شاهد اللعبة مباشرة</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">اسمك كمشاهد</label>
                <input
                  value={inputName}
                  onChange={(e) => { setInputName(e.target.value); setNameError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="اسمك..."
                  className="w-full bg-slate-800/50 border border-purple-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12 text-lg rounded-lg px-3 outline-none focus:border-purple-400/50"
                  dir="rtl" maxLength={20} autoFocus
                />
              </div>
              {nameError && <p className="text-red-400 text-xs text-center">⚠️ {nameError}</p>}
              <button onClick={handleJoin}
                className="w-full bg-gradient-to-l from-purple-600 to-purple-900 hover:from-purple-500 hover:to-purple-800 text-white font-bold text-base sm:text-lg py-4 rounded-xl transition-all cursor-pointer">
                👁 شاهد اللعبة
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-yellow-500/30 rounded-2xl p-5 sm:p-6 text-center">
            <p className="text-yellow-300 text-sm mb-3">الكود غير موجود في الرابط</p>
            <a href="/tabot" className="text-sm text-amber-400 hover:text-amber-300 underline">العودة للصفحة الرئيسية</a>
          </div>
        )}

        <div className="text-center mt-4">
          <a href="/tabot" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← العودة للصفحة الرئيسية</a>
        </div>
      </div>
    </div>
  );
}

export default function TabotJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center tobol-bg">
        <div className="text-center"><div className="text-5xl mb-4 animate-bounce">⚰️</div><p className="text-slate-400">جاري التحميل...</p></div>
      </div>
    }>
      <TabotJoinContent />
    </Suspense>
  );
}
