'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

// مطابق أيقونات select/unselect لكل لعبة
const GAME_ICONS: Record<string, { select: string; unselect: string }> = {
  mafia:       { select: '/battle/game_select_mafia_icon_select.webp',       unselect: '/battle/game_select_mafia_icon_unselect.webp' },
  tobol:       { select: '/battle/game_select_war_drums_icon_select.webp',    unselect: '/battle/game_select_war_drums_icon_unselect.webp' },
  tabot:       { select: '/battle/game_select_coffin_icon_select.webp',       unselect: '/battle/game_select_coffin_icon_unselect.webp' },
  prison:      { select: '/battle/game_select_prison_icon_select.webp',       unselect: '/battle/game_select_prison_icon_unselect.webp' },
  risk:        { select: '/battle/game_select_risk_icon_select.webp',         unselect: '/battle/game_select_risk_icon_unselect.webp' },
  risk2:       { select: '/battle/game_select_risk_icon_select.webp',         unselect: '/battle/game_select_risk_icon_unselect.webp' },
  baharharb:   { select: '/battle/game_select_bahr_icon_select.webp',         unselect: '/battle/game_select_bahr_icon_unselect.webp' },
  familyfeud:  { select: '/battle/game_select_family_icon_select.webp',      unselect: '/battle/game_select_family_icon_unselect.webp' },
  shifarat:    { select: '/battle/game_select_cipher_icon_select.webp',      unselect: '/battle/game_select_cipher_icon_unselect.webp' },
};

// الفئات للفلترة
const CATEGORIES = [
  { key: 'all',        label: '🎯 الكل' },
  { key: 'اجتماعية',    label: '🎭 اجتماعية' },
  { key: 'حربية',       label: '⚔️ حربية' },
  { key: 'ذكاء',        label: '🧠 ذكاء' },
  { key: 'مجازفة',      label: '🎲 مجازفة' },
  { key: 'رعب',         label: '🪦 رعب' },
  { key: 'استراتيجية',  label: '🏰 استراتيجية' },
];

// تصنيف كل لعبة
const GAME_CATEGORIES: Record<string, string> = {
  mafia: 'اجتماعية',
  familyfeud: 'اجتماعية',
  tobol: 'حربية',
  prison: 'استراتيجية',
  baharharb: 'ذكاء',
  shifarat: 'ذكاء',
  risk: 'مجازفة',
  risk2: 'مجازفة',
  tabot: 'رعب',
};

export default function BattlePage() {
  const [config, setConfig] = useState<BattleConfig | null>(null);
  const [activeGameIndex, setActiveGameIndex] = useState(0);
  const [showAllGames, setShowAllGames] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userRole, setUserRole] = useState<string>('guest');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // معالجة اللمس للانزلاق الأفقي
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeGameIndex < buttons.length - 1) {
        setActiveGameIndex(activeGameIndex + 1);
      } else if (diff < 0 && activeGameIndex > 0) {
        setActiveGameIndex(activeGameIndex - 1);
      }
    }
    setTouchStart(null);
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 text-sm">جارٍ تحميل الألعاب...</div>
      </div>
    );
  }

  const buttons = config.buttons.sort((a, b) => a.tabOrder - b.tabOrder);
  const bgColor = config.configs.page_background || '#041F18';
  const activeButton = buttons[activeGameIndex];

  // ألعاب مفلترة (لوضع "مشاهدة الكل")
  const filteredGames = categoryFilter === 'all'
    ? buttons
    : buttons.filter((b) => GAME_CATEGORIES[b.buttonKey] === categoryFilter);

  return (
    <div className="battle-page" style={{ background: bgColor, minHeight: 'auto', display: 'flex', flexDirection: 'column', paddingBottom: '130px' }}>
      {showAllGames ? (
        // ===== وضع "مشاهدة الكل" — شبكة + فلترة تصنيفات =====
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '120px' }}>
          {/* زر العودة */}
          <button
            onClick={() => setShowAllGames(false)}
            style={{
              position: 'fixed', top: '60px', right: '12px', zIndex: 100,
              background: 'rgba(6,42,32,.92)', color: '#ffe9b0',
              border: '1px solid rgba(255,214,94,.45)', borderRadius: '8px',
              padding: '6px 14px', fontSize: '12px', fontWeight: 'bold',
            }}
          >
            ‹ عودة
          </button>

          {/* فلترة التصنيفات */}
          <div style={{
            display: 'flex', gap: '8px', padding: '12px 16px',
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                style={{
                  padding: '6px 14px', borderRadius: '9999px',
                  fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap',
                  border: 'none', cursor: 'pointer',
                  background: categoryFilter === cat.key ? '#f59e0b' : 'rgba(15,23,42,.6)',
                  color: categoryFilter === cat.key ? '#0f172a' : '#94a3b8',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* شبكة الألعاب */}
          <div className="gg-grid" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px', padding: '18px 5px 8px' }}>
            {filteredGames.map((btn, i) => (
              <button
                key={btn.id}
                onClick={() => handleButtonClick(btn)}
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
        </div>
      ) : (
        // ===== وضع الانزلاق — كل لعبة في صفحة منفصلة =====
        <>
          {/* منطقة الانزلاق الأفقي */}
          <div
            ref={scrollRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              flex: 1, display: 'flex', overflow: 'hidden',
              alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}
          >
            {activeButton && (
              <button
                onClick={() => handleButtonClick(activeButton)}
                className="gg-card"
                style={{
                  width: `${Math.min(activeButton.width, 280)}px`,
                  height: `${Math.min(activeButton.height, 224)}px`,
                  border: 'none', padding: 0, background: 'none',
                  borderRadius: '16px', overflow: 'hidden',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <img
                  src={activeButton.imageSrc}
                  alt={activeButton.label}
                  style={{
                    width: '100%', height: '100%', objectFit: 'fill', display: 'block',
                    filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.45))',
                    animation: 'ggFloat 2.6s ease-in-out infinite',
                  }}
                />
                <span
                  style={{
                    position: 'absolute', bottom: '6px', left: 0, right: 0,
                    textAlign: 'center', fontSize: '18px', fontWeight: 900,
                    color: '#fff', whiteSpace: 'nowrap',
                    paintOrder: 'stroke fill',
                    WebkitTextStroke: `1px ${activeButton.strokeColor}`,
                    textShadow: '0 1px 3px rgba(0,0,0,.55)',
                  }}
                >
                  {activeButton.label}
                </span>
                {activeButton.visibility === 'maintenance' && (
                  <span style={{
                    position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)',
                    background: '#f59e0b', color: '#78350f', fontSize: '8px', fontWeight: 900,
                    padding: '2px 6px', borderRadius: '4px', zIndex: 5,
                  }}>🔧</span>
                )}
              </button>
            )}

            {/* مؤشر الصفحة (نقاط) */}
            <div style={{
              position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '6px', direction: 'ltr',
            }}>
              {buttons.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === activeGameIndex ? '20px' : '6px',
                    height: '6px', borderRadius: '3px',
                    background: i === activeGameIndex ? '#f59e0b' : 'rgba(255,255,255,.3)',
                    transition: 'all .2s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* زر "مشاهدة الكل" */}
          <div style={{ position: 'fixed', top: '60px', left: '12px', zIndex: 100 }}>
            <button
              onClick={() => setShowAllGames(true)}
              style={{
                background: 'rgba(6,42,32,.92)', color: '#ffe9b0',
                border: '1px solid rgba(255,214,94,.45)', borderRadius: '8px',
                padding: '6px 14px', fontSize: '12px', fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              ⊞ مشاهدة الكل
            </button>
          </div>
        </>
      )}

      {/* شريط أزرار تبديل الألعاب — مطابق لـ yalla ludo (ll_game_switch) */}
      {!showAllGames && (
        <div style={{
          position: 'fixed', bottom: '75px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px',
            background: 'rgba(6,42,32,.95)', borderRadius: '24px', padding: '6px 20px',
            border: '1px solid rgba(255,214,94,.2)', direction: 'ltr',
          }}>
            {buttons.map((btn, i) => {
              const icons = GAME_ICONS[btn.buttonKey];
              const isActive = i === activeGameIndex;
              return (
                <button
                  key={btn.id}
                  onClick={() => setActiveGameIndex(i)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  }}
                >
                  {icons ? (
                    <img
                      src={isActive ? icons.select : icons.unselect}
                      alt={btn.label}
                      style={{ width: '33px', height: '26px', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ width: '33px', height: '26px' }} />
                  )}
                  <span style={{
                    fontSize: '9px', fontWeight: 'bold',
                    color: isActive ? '#f59e0b' : '#4AC595',
                    whiteSpace: 'nowrap', marginTop: '2px',
                  }}>
                    {btn.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
