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

const GAME_TYPES = ['ludo', 'domino', 'jackaroo', 'other'] as const;
const GAME_LABELS: Record<string, string> = {
  ludo: 'لودو',
  domino: 'دومينو',
  jackaroo: 'جاكارو',
  other: 'أخرى',
};

export default function BattlePage() {
  const [config, setConfig] = useState<BattleConfig | null>(null);
  const [activeGame, setActiveGame] = useState<string>('ludo');
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

  const configs = config.configs;
  const bgColor = configs.page_background || '#041F18';
  const activeButtons = config.buttons.filter((b) => b.gameType === activeGame);
  const availableGames = GAME_TYPES.filter((g) => config.buttons.some((b) => b.gameType === g));

  return (
    <div className="battle-page" style={{ background: bgColor }}>
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

      {/* الهيرو — الهلال + شعار اللعبة النشطة */}
      <div className="battle-hero">
        {configs.hero_moon_image && <img className="bh-moon" src={configs.hero_moon_image} alt="" />}
        {activeGame === 'ludo' && configs.ludo_title_image && <img className="bh-logo" src={configs.ludo_title_image} alt="Ludo" />}
        {activeGame === 'domino' && configs.domino_title_image && <img className="bh-logo" src={configs.domino_title_image} alt="Domino" />}
        {activeGame === 'jackaroo' && configs.jackaroo_title_image && <img className="bh-logo" src={configs.jackaroo_title_image} alt="Jackaroo" />}
        {activeGame === 'other' && configs.other_title_image && <img className="bh-logo" src={configs.other_title_image} alt="Other" />}
      </div>

      {/* شريط تبديل الألعاب (4 أزرار) */}
      <div className="game-select-bar" style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '8px 0' }}>
        {availableGames.map((g) => {
          const selectIcon = configs[`${g}_select_icon`];
          const unselectIcon = configs[`${g}_unselect_icon`];
          const isActive = activeGame === g;
          return (
            <button
              key={g}
              onClick={() => setActiveGame(g)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              {selectIcon && unselectIcon ? (
                <img src={isActive ? selectIcon : unselectIcon} alt={GAME_LABELS[g] || g} style={{ width: '48px', height: '40px', objectFit: 'contain' }} />
              ) : (
                <span style={{ color: isActive ? '#f59e0b' : '#94a3b8', fontSize: '13px', fontWeight: 'bold', padding: '8px 12px' }}>
                  {GAME_LABELS[g] || g}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* أزرار اللعبة النشطة */}
      <div className="mode-wrap" style={{ position: 'relative', zIndex: 1 }}>
        {/* الصف الأول: الأزرار الكبيرة (width >= 150) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {activeButtons.filter((b) => b.width >= 150).map((btn) => (
            <BattleButtonCard key={btn.id} btn={btn} onClick={() => handleButtonClick(btn)} canAccessMaintenance={canAccessMaintenance} />
          ))}
        </div>
        {/* الصف الثاني: الأزرار الصغيرة (width < 150) */}
        {activeButtons.some((b) => b.width < 150) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '5px', flexWrap: 'wrap' }}>
            {activeButtons.filter((b) => b.width < 150).map((btn) => (
              <BattleButtonCard key={btn.id} btn={btn} onClick={() => handleButtonClick(btn)} canAccessMaintenance={canAccessMaintenance} />
            ))}
          </div>
        )}
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

function BattleButtonCard({ btn, onClick, canAccessMaintenance }: { btn: BattleButtonData; onClick: () => void; canAccessMaintenance: boolean }) {
  const isMaintenance = btn.visibility === 'maintenance';
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        width: `${btn.width}px`,
        height: `${btn.height}px`,
        border: 'none',
        padding: 0,
        background: 'none',
        cursor: 'pointer',
        borderRadius: '16px',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <img
        src={btn.imageSrc}
        alt={btn.label}
        style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: '6px',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontWeight: 900,
          color: '#fff',
          whiteSpace: 'nowrap',
          paintOrder: 'stroke fill',
          WebkitTextStroke: `1px ${btn.strokeColor}`,
          textShadow: '0 1px 3px rgba(0,0,0,.55)',
          fontSize: btn.width >= 150 ? '16px' : '14px',
        }}
      >
        {btn.label}
      </span>
      {isMaintenance && (
        <span
          style={{
            position: 'absolute',
            top: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#f59e0b',
            color: '#78350f',
            fontSize: '8px',
            fontWeight: 900,
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid #92400e',
            zIndex: 5,
          }}
        >
          🔧
        </span>
      )}
    </button>
  );
}
