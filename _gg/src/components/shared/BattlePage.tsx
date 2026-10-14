'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BattleButtonData {
  id: string;
  gameType: string;
  buttonKey: string;
  label: string;
  imageSrc: string;
  strokeColor: string;
  width: number;
  height: number;
  tabHref: string;
  tabOrder: number;
  visibility: 'visible' | 'hidden' | 'maintenance';
}

interface BattleConfig {
  theme: { id: string; themeKey: string; themeName: string };
  configs: Record<string, string>;
  buttons: BattleButtonData[];
}

export default function BattlePage() {
  const [config, setConfig] = useState<BattleConfig | null>(null);
  const [userRole, setUserRole] = useState<string>('guest');
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function fetchConfig() {
      try {
        const res = await fetch('/api/battle/config', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data.success) return;
        setConfig(data);
      } catch { /* silent */ }
    }
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user) setUserRole(data.user.role || 'user');
      } catch { /* silent */ }
    }
    fetchConfig();
    fetchUser();
    return () => { cancelled = true; };
  }, []);

  const canAccessMaintenance = userRole === 'admin' || userRole === 'moderator';

  const handleButtonClick = (btn: BattleButtonData) => {
    if (btn.visibility === 'maintenance' && !canAccessMaintenance) {
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(245,158,11,.95);color:#0f172a;padding:10px 20px;border-radius:8px;font-weight:bold;font-size:13px;z-index:9999;';
      toast.textContent = '🚧 هذا القسم تحت الصيانة';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
      return;
    }
    if (btn.tabHref) router.push(btn.tabHref);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 text-sm">جارٍ تحميل الألعاب...</div>
      </div>
    );
  }

  const themeKey = config.theme.themeKey;
  const buttons = config.buttons.sort((a, b) => a.tabOrder - b.tabOrder);
  const configs = config.configs;

  // ─── القالب الأول (current): تصميم Tailwind الأصلي (card-border-spin + grid) ─
  if (themeKey === 'current') {
    return (
      <div className="min-h-screen bg-slate-950 text-white" style={{ paddingBottom: '75px' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6">
          <h2 className="text-lg font-black text-white mb-4">🎮 الألعاب</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(167px, 1fr))',
              gap: '16px',
            }}
          >
            {buttons.map((btn, i) => {
              const isAvailable = btn.isActive && btn.visibility !== 'hidden';
              const isMaintenance = btn.visibility === 'maintenance';
              return (
                <Link
                  key={btn.id}
                  href={isAvailable ? btn.tabHref : '#'}
                  onClick={(e) => {
                    if (!isAvailable || (isMaintenance && !canAccessMaintenance)) {
                      e.preventDefault();
                      handleButtonClick(btn);
                    }
                  }}
                  className="group relative block rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  style={{
                    width: '100%',
                    aspectRatio: '167 / 134',
                    borderColor: btn.strokeColor + '40',
                    background: `linear-gradient(135deg, ${btn.strokeColor}30, transparent)`,
                  }}
                >
                  <img
                    src={btn.imageSrc}
                    alt={btn.label}
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <h3 className="text-base font-black text-white mb-1">{btn.label}</h3>
                  </div>
                  {isMaintenance && (
                    <span className="absolute top-2 left-2 bg-amber-400 text-amber-950 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-600">🔧</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── القالب الثاني (yalla): نمط yalla ludo (gg-card + ggFloat + ggShine + rank-bar + hero) ─
  const bgColor = configs.page_background || '#041F18';
  return (
    <div className="battle-page" style={{ background: bgColor, minHeight: '100vh' }}>
      {/* شريط الرابطة */}
      <div className="rank-bar">
        <div className="rank-cell" style={configs.rank_bar_background_my ? { background: `url(${configs.rank_bar_background_my}) center / 100% 100% no-repeat` } : {}}>
          <div className="rk-side">
            {configs.rank_cup_image && <img className="rk-cup" src={configs.rank_cup_image} alt="" />}
            {configs.rank_lock_image && <img className="rk-lock" src={configs.rank_lock_image} alt="" />}
            <span className="rk-label">League</span>
          </div>
          <span className="rk-tx">ستفتح البطولة عند المستوى الرابع!</span>
        </div>
        <div className="rank-cell global" style={configs.rank_bar_background_global ? { background: `url(${configs.rank_bar_background_global}) center / 100% 100% no-repeat` } : {}}>
          <span className="rk-tx">No.1000+</span>
          <div className="rk-side">
            {configs.rank_global_image && <img className="rk-globe" src={configs.rank_global_image} alt="" />}
            <span className="rk-label">Rank</span>
          </div>
        </div>
      </div>

      {/* الهيرو */}
      <div className="battle-hero">
        {configs.hero_moon_image && <img className="bh-moon" src={configs.hero_moon_image} alt="" />}
      </div>

      {/* شبكة الألعاب — gg-grid من yalla ludo */}
      <div className="gg-grid">
        {buttons.map((btn, i) => (
          <button
            key={btn.id}
            onClick={() => handleButtonClick(btn)}
            data-game={btn.buttonKey}
            className="gg-card"
            style={!btn.isActive ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
          >
            <img src={btn.imageSrc} alt={btn.label} />
            <span
              className="gg-name"
              style={{ WebkitTextStroke: `1px ${btn.strokeColor}` }}
            >
              {btn.label}
            </span>
            {btn.visibility === 'maintenance' && (
              <span style={{
                position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)',
                background: '#f59e0b', color: '#78350f', fontSize: '8px', fontWeight: 900,
                padding: '2px 6px', borderRadius: '4px', zIndex: 5,
              }}>🔧</span>
            )}
          </button>
        ))}
      </div>

      {/* المكتب السفلي */}
      {configs.bottom_desk_image && (
        <div style={{ position: 'fixed', bottom: '75px', left: 0, right: 0, zIndex: 0, pointerEvents: 'none' }}>
          <img src={configs.bottom_desk_image} alt="" style={{ width: '100%', height: '42px', objectFit: 'cover' }} />
        </div>
      )}
    </div>
  );
}
