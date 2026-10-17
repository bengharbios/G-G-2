'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSyncExternalStore } from 'react';

function useHydrated() { return useSyncExternalStore(() => () => {}, () => true, () => false); }

function ShipsJoinContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = typeof params?.code === 'string' ? params.code : '';
  const nameFromUrl = searchParams?.get('name') || '';
  const mounted = useHydrated();
  const [spectatorId, setSpectatorId] = useState('');
  const [spectatorName, setSpectatorName] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [inputName, setInputName] = useState('');
  const connectAttempted = useRef(false);
  const [authUser, setAuthUser] = useState<{ displayName?: string } | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!cancelled && d.success && d.user) setAuthUser(d.user);
    }).catch(() => {}).finally(() => { if (!cancelled) setAuthChecking(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!spectatorId || !code) return;
    const beat = () => fetch(`/api/ships-room/${code}/spectator`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ spectatorId }) }).catch(() => {});
    beat();
    const iv = setInterval(beat, 5000);
    return () => clearInterval(iv);
  }, [spectatorId, code]);

  useEffect(() => {
    if (!spectatorId || !code) return;
    return () => { fetch(`/api/ships-room/${code}/spectator?id=${spectatorId}`, { method: 'DELETE' }).catch(() => {}); };
  }, [spectatorId, code]);

  const connectAsSpectator = useCallback(async (pName: string) => {
    if (!code) { setError('كود الغرفة مفقود'); return; }
    setConnecting(true); setError('');
    try {
      const roomRes = await fetch(`/api/ships-room/${code}`);
      if (!roomRes.ok) { setError('الغرفة غير موجودة'); setConnecting(false); return; }
      const specRes = await fetch(`/api/ships-room/${code}/spectator`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: pName }) });
      if (!specRes.ok) { setError('فشل التسجيل'); setConnecting(false); return; }
      const specData = await specRes.json();
      if (specData.success) { setSpectatorId(specData.spectatorId || ''); setSpectatorName(pName); setConnected(true); return; }
    } catch { setError('تعذر الاتصال'); }
    setConnecting(false);
  }, [code]);

  useEffect(() => {
    if (!mounted || connectAttempted.current || authChecking) return;
    const name = nameFromUrl || authUser?.displayName;
    if (name) { connectAttempted.current = true; setInputName(name); connectAsSpectator(name); }
  }, [mounted, authChecking, nameFromUrl, authUser, connectAsSpectator]);

  if (connected) {
    return (
      <div className="flex flex-col min-h-screen tobol-bg" dir="rtl">
        <div className="sticky top-0 z-50 border-b border-indigo-800/50 bg-slate-950/90 backdrop-blur-sm">
          <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '20px' }}>🚢</span>
              <div>
                <p className="text-xs font-bold text-indigo-300">{spectatorName} — مشاهد</p>
                <p className="text-[9px] text-slate-500">غرفة {code}</p>
              </div>
            </div>
            <a href="/diwaniya" className="text-xs text-slate-400 hover:text-red-400">خروج ✕</a>
          </div>
        </div>
        <main className="flex-1 flex items-center justify-center" style={{ padding: '20px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚢</div>
            <h1 style={{ color: '#feef91', fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>سفن — وضع المشاهدة</h1>
            <p style={{ color: '#9fc4b4', fontSize: '14px', marginBottom: '8px' }}>أنت تشاهد المعركة في الغرفة {code}</p>
            <p style={{ color: '#fbbf24', fontSize: '12px' }}>💡 ستظهر حالة اللعبة + النقاط + الهجمات مباشرة</p>
          </div>
        </main>
      </div>
    );
  }

  if (!mounted || authChecking) return <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl"><div className="text-center"><div className="text-5xl mb-4 animate-bounce">🚢</div><p className="text-slate-400">جاري التحميل...</p></div></div>;
  if (connecting) return <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl"><div className="text-center"><div className="text-5xl mb-4 animate-bounce">👁</div><p className="text-slate-400">جاري الانضمام كمشاهد...</p></div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl"><div className="text-center max-w-sm mx-auto p-4"><div className="text-5xl mb-4">💔</div><p className="text-red-400 text-lg font-bold mb-2">{error}</p><button onClick={() => { setError(''); setConnecting(false); }} className="block mx-auto text-sm text-cyan-400 underline mb-3 cursor-pointer">إعادة المحاولة</button><a href="/diwaniya" className="text-sm text-cyan-400 underline">العودة</a></div></div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 tobol-bg" dir="rtl">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🚢</div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-amber-300 to-indigo-400 mb-2">مشاهدة سفن</h1>
          {code ? <p className="text-slate-400 text-xs sm:text-sm font-bold">الغرفة: <span className="font-mono text-white tracking-wider">{code}</span></p> : <p className="text-yellow-400 text-xs">⚠️ كود الغرفة غير موجود</p>}
        </div>
        {code ? (
          <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-5 sm:p-6">
            <div className="space-y-3">
              <div className="text-center mb-2"><p className="text-xs text-indigo-300">وضع المشاهدة — شاهد المعركة مباشرة</p></div>
              {authUser?.displayName ? (
                <div className="text-center p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
                  <p className="text-sm text-indigo-300 font-bold">{authUser.displayName}</p>
                  <p className="text-[10px] text-slate-400">✓ مسجّل دخول</p>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">اسمك كمشاهد</label>
                  <input value={inputName} onChange={(e) => setInputName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && inputName.trim() && connectAsSpectator(inputName.trim())} placeholder="اسمك..." className="w-full bg-slate-800/50 border border-indigo-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12 text-lg rounded-lg px-3 outline-none focus:border-indigo-400/50" dir="rtl" maxLength={20} autoFocus />
                </div>
              )}
              <button onClick={() => { if (inputName.trim()) connectAsSpectator(inputName.trim()); else if (authUser?.displayName) connectAsSpectator(authUser.displayName); }} className="w-full bg-gradient-to-l from-indigo-600 to-blue-800 hover:from-indigo-500 hover:to-blue-700 text-white font-bold text-base sm:text-lg py-4 rounded-xl transition-all cursor-pointer">👁 شاهد المعركة</button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-yellow-500/30 rounded-2xl p-5 sm:p-6 text-center">
            <p className="text-yellow-300 text-sm mb-3">الكود غير موجود</p>
            <a href="/diwaniya" className="text-sm text-cyan-400 hover:text-cyan-300 underline">العودة</a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShipsJoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center tobol-bg"><div className="text-center"><div className="text-5xl mb-4 animate-bounce">🚢</div><p className="text-slate-400">جاري التحميل...</p></div></div>}>
      <ShipsJoinContent />
    </Suspense>
  );
}
