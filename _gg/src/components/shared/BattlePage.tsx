'use client';

import { useState, useEffect } from 'react';
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

const GAME_ICONS: Record<string, { select: string; unselect: string; label: string }> = {
  mafia:       { select: '/battle/game_select_mafia_icon_select.webp',       unselect: '/battle/game_select_mafia_icon_unselect.webp',       label: 'المافيا' },
  tobol:       { select: '/battle/game_select_war_drums_icon_select.webp',    unselect: '/battle/game_select_war_drums_icon_unselect.webp',    label: 'طبول' },
  tabot:       { select: '/battle/game_select_coffin_icon_select.webp',       unselect: '/battle/game_select_coffin_icon_unselect.webp',       label: 'التابوت' },
  prison:      { select: '/battle/game_select_prison_icon_select.webp',       unselect: '/battle/game_select_prison_icon_unselect.webp',       label: 'السجن' },
  risk:        { select: '/battle/game_select_risk_icon_select.webp',         unselect: '/battle/game_select_risk_icon_unselect.webp',         label: 'المجازفة' },
  risk2:       { select: '/battle/game_select_risk_icon_select.webp',         unselect: '/battle/game_select_risk_icon_unselect.webp',         label: 'مجازفة 2' },
  baharharb:   { select: '/battle/game_select_bahr_icon_select.webp',         unselect: '/battle/game_select_bahr_icon_unselect.webp',         label: 'بحر وحرب' },
  familyfeud:  { select: '/battle/game_select_family_icon_select.webp',      unselect: '/battle/game_select_family_icon_unselect.webp',      label: 'فاميلي' },
  shifarat:    { select: '/battle/game_select_cipher_icon_select.webp',      unselect: '/battle/game_select_cipher_icon_unselect.webp',      label: 'الشيفرات' },
};

export default function BattlePage() {
  const [config, setConfig] = useState<BattleConfig | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userRole, setUserRole] = useState('guest');
  const [joinCode, setJoinCode] = useState('');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [animKey, setAnimKey] = useState(0);
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
      } catch {}
    }
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.user) setUserRole(data.user.role || 'user');
      } catch {}
    }
    fetchConfig();
    fetchUser();
    return () => { cancelled = true; };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIndex < buttons.length - 1) {
        setActiveIndex(activeIndex + 1);
        setAnimKey(k => k + 1);
      } else if (diff < 0 && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
        setAnimKey(k => k + 1);
      }
    }
    setTouchStart(null);
  };

  if (!config) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#9fc4b4', fontSize: '14px' }}>جارٍ التحميل...</div>;
  }

  const buttons = config.buttons.sort((a, b) => a.tabOrder - b.tabOrder);
  const activeBtn = buttons[activeIndex];
  if (!activeBtn) return null;

  const stroke = activeBtn.strokeColor;
  const canAccessMaintenance = userRole === 'admin' || userRole === 'moderator';

  const switchGame = (i: number) => {
    setActiveIndex(i);
    setAnimKey(k => k + 1);
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: 'calc(100vh - 130px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 16px 120px',
        gap: '14px',
        background: 'linear-gradient(180deg, #062b21 0%, #041f18 40%, #03211a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* خلفية زخرفية: هلال + نجوم بشفافية منخفضة جداً */}
      <div style={{
        position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
        width: '280px', height: 'auto', opacity: 0.06, pointerEvents: 'none', zIndex: 0,
      }}>
        <img src="/battle/hall_title_bg.webp" alt="" style={{ width: '100%' }} />
      </div>

      {/* ===== منطقة الانزلاق ===== */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 1 }}
      >
        {/* ===== البطاقة الرئيسية (Hero Card) ===== */}
        <div
          key={animKey}
          style={{
            animation: 'heroFadeIn 0.4s ease-out',
            position: 'relative',
            width: '100%',
            aspectRatio: '1.35',
            borderRadius: '20px',
            overflow: 'hidden',
            border: `2px solid ${stroke}50`,
            boxShadow: `0 8px 28px rgba(0,0,0,.5), 0 0 16px ${stroke}30`,
            flexShrink: 0,
          }}
        >
          <img
            src={activeBtn.imageSrc}
            alt={activeBtn.label}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              animation: 'ggFloat 2.6s ease-in-out infinite',
            }}
          />
          {/* تدرج داكن في الأسفل لاسم اللعبة */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,.85) 100%)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 14px 0',
          }}>
            <span style={{
              fontSize: '22px', fontWeight: 900, color: '#fff',
              textShadow: '0 2px 6px rgba(0,0,0,.8)',
              paintOrder: 'stroke fill',
              WebkitTextStroke: `1px ${stroke}`,
            }}>
              {activeBtn.label}
            </span>
          </div>
          {/* تأثير لمعان */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,.15) 50%, transparent 58%)',
            backgroundSize: '240% 100%', animation: 'ggShine 4.2s ease-in-out infinite',
          }} />
          {/* شارة maintenance */}
          {activeBtn.visibility === 'maintenance' && (
            <span style={{
              position: 'absolute', top: '8px', left: '50%', transform: 'translateX(-50%)',
              background: '#f59e0b', color: '#78350f', fontSize: '9px', fontWeight: 900,
              padding: '3px 10px', borderRadius: '6px', zIndex: 5,
            }}>🔧 صيانة</span>
          )}
        </div>

        {/* ===== صف الأوضاع: العراب + الديوانية ===== */}
        <div
          key={`btns-${animKey}`}
          style={{
            display: 'flex', gap: '12px',
            animation: 'btnsFadeIn 0.4s ease-out 0.1s both',
          }}
        >
          {/* العراب */}
          <button
            onClick={() => activeBtn.tabHref && router.push(activeBtn.tabHref)}
            style={{
              flex: 1, minHeight: '90px',
              borderRadius: '16px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 4px 14px rgba(245,158,11,.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
              transition: 'transform .12s',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(.96)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '28px' }}>👑</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>العراب</span>
          </button>
          {/* الديوانية */}
          <button
            onClick={() => activeBtn.tabHref && router.push(activeBtn.tabHref + '?mode=diwaniya')}
            style={{
              flex: 1, minHeight: '90px',
              borderRadius: '16px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 14px rgba(16,185,129,.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
              transition: 'transform .12s',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(.96)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '28px' }}>🏛️</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>الديوانية</span>
          </button>
        </div>

        {/* ===== صف المشاهدة (كبسولة أنيقة) ===== */}
        <div
          key={`watch-${animKey}`}
          style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)',
            borderRadius: '14px', border: '1px solid rgba(255,255,255,.1)',
            padding: '4px 4px 4px 4px',
            animation: 'btnsFadeIn 0.4s ease-out 0.2s both',
          }}
        >
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="أدخل كود المشاهدة..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: '14px', padding: '12px 14px',
              textAlign: 'center',
            }}
            dir="ltr"
          />
          <button
            onClick={() => joinCode.trim() && router.push(`/join/${joinCode.trim()}`)}
            disabled={!joinCode.trim()}
            style={{
              padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: joinCode.trim() ? 'pointer' : 'not-allowed',
              background: joinCode.trim() ? 'linear-gradient(135deg, #4a8d7a, #3a7d6a)' : 'rgba(100,100,100,.4)',
              color: '#fff', fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'transform .12s',
            }}
            onMouseDown={(e) => joinCode.trim() && (e.currentTarget.style.transform = 'scale(.96)')}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '16px' }}>👁️</span>
            مشاهدة
          </button>
        </div>
      </div>

      {/* ===== شريط أيقونات التصفح — مطابق لـ yalla lodo ===== */}
      <div style={{
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          background: 'url(/battle/battle_game_select_bg.png) center / 100% 100% no-repeat',
          height: '45px', padding: '0 16px', direction: 'ltr',
          overflowX: 'auto', scrollbarWidth: 'none', maxWidth: '95vw',
        }}>
          {buttons.map((btn, i) => {
            const icons = GAME_ICONS[btn.buttonKey];
            if (!icons) return null;
            const isActive = i === activeIndex;
            return (
              <button key={btn.id} onClick={() => switchGame(i)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0,
              }}>
                <img src={isActive ? icons.select : icons.unselect} alt={btn.label}
                  style={{ width: '33px', height: '26px', objectFit: 'contain' }} />
                <span style={{
                  fontSize: '9px', fontWeight: 'bold',
                  color: isActive ? '#f59e0b' : '#4AC595',
                  whiteSpace: 'nowrap', marginTop: '1px',
                }}>{icons.label}</span>
              </button>
            );
          })}
        </div>
        {/* مؤشر النقاط */}
        <div style={{ display: 'flex', gap: '8px', direction: 'ltr' }}>
          {buttons.map((_, i) => (
            <div key={i} style={{
              width: i === activeIndex ? '20px' : '6px', height: '6px', borderRadius: '3px',
              background: i === activeIndex ? '#f59e0b' : 'rgba(255,255,255,.25)',
              transition: 'all .2s',
            }} />
          ))}
        </div>
      </div>

      {/* CSS keyframes */}
      <style jsx>{`
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes btnsFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ggFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ggShine {
          0%, 55% { background-position: 130% 0; }
          85%, 100% { background-position: -130% 0; }
        }
      `}</style>
    </div>
  );
}
