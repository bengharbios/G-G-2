'use client';

// ════════════════════════════════════════════════════════════════
// /join/guessimage/[code]?name=NAME — Spectator entry page
// Mirrors /join/spotdiff/[code]/page.tsx exactly.
//
// Auto-connect priority:
//   1) URL has ?name=... → use it (covers deep-link pre-filled name)
//   2) User is authed → use displayName (no input needed)
//   3) Otherwise → show name input
// ════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import GuessImageSpectatorView from '@/components/guessimage/GuessImageSpectatorView';
import SvgaOrImg from '@/components/shared/SvgaOrImg';

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  frame?: string;
}

function frameSrcFallback(frameId?: string | null): string | null {
  const id = (frameId || '').trim();
  if (!id) return null;
  return /^\d+$/.test(id) ? `/yalla-frames/${id}.png` : null;
}

function avatarSrc(avatar?: string, id?: string): string {
  if (avatar) return avatar;
  const seed = (parseInt(id || '', 10) || 0) % 12 + 1;
  return `/yalla-avatars/defaultPhoto_${seed}.png`;
}

function GuessImageJoinContent() {
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

  // Auth user state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [frameImg, setFrameImg] = useState<string | null>(null);

  // Fetch authed user on mount
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.user) setAuthUser(data.user as AuthUser);
      })
      .catch(() => { /* silent */ })
      .finally(() => { if (!cancelled) setAuthChecking(false); });
    return () => { cancelled = true; };
  }, []);

  // Load frame for authed user
  useEffect(() => {
    if (!authUser?.frame) { setFrameImg(null); return; }
    let cancelled = false;
    fetch('/api/store/frames-catalog')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled || !d?.success || !Array.isArray(d.frames)) return;
        const m = new Map<string, string>();
        for (const f of d.frames) {
          if (f.imageUrl) m.set(String(f.id), String(f.imageUrl));
        }
        if (!cancelled) setFrameImg(m.get(String(authUser.frame)) || frameSrcFallback(authUser.frame));
      })
      .catch(() => {
        if (!cancelled) setFrameImg(frameSrcFallback(authUser.frame));
      });
    return () => { cancelled = true; };
  }, [authUser?.frame]);

  // Send heartbeat to keep spectator alive
  useEffect(() => {
    if (!spectatorId || !code) return;
    const beat = () => {
      fetch(`/api/guessimage-room/${code}/spectator`, {
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
      fetch(`/api/guessimage-room/${code}/spectator?id=${spectatorId}`, { method: 'DELETE' }).catch(() => {});
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
        // First verify room exists
        const roomRes = await fetch(`/api/guessimage-room/${code}`);
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

        // Register as spectator — pass authInfo so server-side spec record carries it
        const specRes = await fetch(`/api/guessimage-room/${code}/spectator`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: pName,
            authInfo: authUser ? {
              userId: authUser.id,
              avatar: authUser.avatar,
              frame: authUser.frame,
              displayName: authUser.displayName,
            } : undefined,
          }),
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
  }, [code, authUser]);

  // Auto-connect logic
  useEffect(() => {
    if (!mounted || connectAttempted.current) return;
    if (authChecking) return;
    if (nameFromUrl) {
      connectAttempted.current = true;
      setInputName(nameFromUrl);
      connectAsSpectator(nameFromUrl);
      return;
    }
    if (authUser?.displayName) {
      connectAttempted.current = true;
      setInputName(authUser.displayName);
      connectAsSpectator(authUser.displayName);
      return;
    }
  }, [mounted, authChecking, nameFromUrl, authUser, connectAsSpectator]);

  const handleJoin = () => {
    if (!inputName.trim()) { setNameError('يجب إدخال اسمك'); return; }
    if (inputName.trim().length < 2) { setNameError('الاسم قصير جداً'); return; }
    setNameError('');
    connectAsSpectator(inputName.trim());
  };

  // Connected → spectator view (read-only)
  if (connected && spectatorName && !error) {
    return (
      <div className="flex flex-col min-h-screen tobol-bg">
        <div className="sticky top-0 z-50 border-b border-amber-800/50 bg-slate-950/90 backdrop-blur-sm">
          <div className="max-w-md mx-auto flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              {authUser ? (
                <div style={{ position: 'relative', width: '32px', height: '32px', flexShrink: 0 }}>
                  <span className="avatar-frame-wrap" style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                      <img
                        src={avatarSrc(authUser.avatar, authUser.id)}
                        alt={authUser.displayName || spectatorName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          if (!t.src.includes('defaultPhoto_')) {
                            t.src = '/yalla-avatars/defaultPhoto_1.png';
                          }
                        }}
                      />
                    </div>
                    {frameImg && <SvgaOrImg src={frameImg} alt="" />}
                  </span>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-amber-600/50 text-amber-300">
                  👁
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-amber-300">{spectatorName}</p>
                <p className="text-[9px] text-slate-500">
                  {authUser ? `مشاهد • مسجّل الدخول • غرفة ${code}` : `مشاهد • غرفة ${code}`}
                </p>
              </div>
            </div>
            <a href="/diwaniya" className="text-xs text-slate-400 hover:text-red-400 transition-colors">خروج ✕</a>
          </div>
        </div>
        <main className="flex-1">
          <GuessImageSpectatorView roomCode={code} spectatorAuthUser={authUser} />
        </main>
      </div>
    );
  }

  // Before hydration
  if (!mounted || authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🧩</div>
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
          <a href="/diwaniya" className="text-sm text-amber-400 hover:text-amber-300 underline">العودة لصفحة الديوانية</a>
        </div>
      </div>
    );
  }

  // Name entry (only shown if user is NOT authed and URL has no ?name=)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-4 tobol-bg" dir="rtl">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🧩</div>
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 mb-2">
            مشاهدة اللعبة
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
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-5 sm:p-6">
            <div className="space-y-3">
              <div className="text-center mb-2">
                <p className="text-xs text-amber-300">وضع المشاهدة — شاهد اللعبة مباشرة</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  💡 سجّل دخولك لربح الذهب والخبرة عند الفوز
                </p>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">اسمك كمشاهد</label>
                <input
                  value={inputName}
                  onChange={(e) => { setInputName(e.target.value); setNameError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="اسمك..."
                  className="w-full bg-slate-800/50 border border-amber-500/30 text-slate-200 placeholder:text-slate-500 text-right h-12 text-lg rounded-lg px-3 outline-none focus:border-amber-400/50"
                  dir="rtl" maxLength={20} autoFocus
                />
              </div>
              {nameError && <p className="text-red-400 text-xs text-center">⚠️ {nameError}</p>}
              <button onClick={handleJoin}
                className="w-full bg-gradient-to-l from-amber-600 to-orange-800 hover:from-amber-500 hover:to-orange-700 text-white font-bold text-base sm:text-lg py-4 rounded-xl transition-all cursor-pointer">
                👁 شاهد اللعبة
              </button>
              <div className="text-center pt-2">
                <a href="/login" className="text-xs text-amber-400 hover:text-amber-300 underline">
                  🔑 سجّل دخولك لربح الذهب
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-yellow-500/30 rounded-2xl p-5 sm:p-6 text-center">
            <p className="text-yellow-300 text-sm mb-3">الكود غير موجود في الرابط</p>
            <a href="/diwaniya" className="text-sm text-amber-400 hover:text-amber-300 underline">العودة لصفحة الديوانية</a>
          </div>
        )}

        <div className="text-center mt-4">
          <a href="/diwaniya" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← العودة لصفحة الديوانية</a>
        </div>
      </div>
    </div>
  );
}

export default function GuessImageJoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center tobol-bg">
        <div className="text-center"><div className="text-5xl mb-4 animate-bounce">🧩</div><p className="text-slate-400">جاري التحميل...</p></div>
      </div>
    }>
      <GuessImageJoinContent />
    </Suspense>
  );
}
