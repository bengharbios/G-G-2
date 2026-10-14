'use client';

import { useState, useEffect, useRef } from 'react';
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

// مطابق أيقونات select/unselect لكل لعبة (من classified/Icon Games)
const GAME_ICONS: Record<string, { select: string; unselect: string; label: string }> = {
  mafia:       { select: '/battle/game_select_mafia_icon_select.webp',       unselect: '/battle/game_select_mafia_icon_unselect.webp',       label: 'المافيا' },
  tobol:       { select: '/battle/game_select_war_drums_icon_select.webp',    unselect: '/battle/game_select_war_drums_icon_unselect.webp',    label: 'طبول' },
  tabot:       { select: '/battle/game_select_coffin_icon_select.webp',       unselect: '/battle/game_select_coffin_icon_unselect.webp',       label: 'التابوت' },
  prison:      { select: '/battle/game_select_prison_icon_select.webp',       unselect: '/battle/game_select_prison_icon_unselect.webp',       label: 'السجن' },
  risk:        { select: '/battle/game_select_risk_icon_select.webp',         unselect: '/battle/game_select_risk_icon_unselect.webp',         label: 'المجازفة' },
  risk2:       { select: '/battle/game_select_risk_icon_select.webp',         unselect: '/battle/game_select_risk_icon_unselect.webp',         label: 'المجازفة 2' },
  baharharb:   { select: '/battle/game_select_bahr_icon_select.webp',         unselect: '/battle/game_select_bahr_icon_unselect.webp',         label: 'بحر وحرب' },
  familyfeud:  { select: '/battle/game_select_family_icon_select.webp',      unselect: '/battle/game_select_family_icon_unselect.webp',      label: 'فاميلي' },
  shifarat:    { select: '/battle/game_select_cipher_icon_select.webp',      unselect: '/battle/game_select_cipher_icon_unselect.webp',      label: 'الشيفرات' },
};

export default function BattlePage() {
  const [config, setConfig] = useState<BattleConfig | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userRole, setUserRole] = useState<string>('guest');
  const [joinCode, setJoinCode] = useState('');
  const [touchStart, setTouchStart] = useState<number | null>(null);
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

  const canAccessMaintenance = userRole === 'admin' || userRole === 'moderator';

  // معالجة الانزلاق الأفقي
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIndex < buttons.length - 1) setActiveIndex(activeIndex + 1);
      else if (diff < 0 && activeIndex > 0) setActiveIndex(activeIndex - 1);
    }
    setTouchStart(null);
  };

  if (!config) {
    return <div className="flex items-center justify-center min-h-[50vh] text-slate-500 text-sm">جارٍ التحميل...</div>;
  }

  const buttons = config.buttons.sort((a, b) => a.tabOrder - b.tabOrder);
  const bgColor = config.configs.page_background || '#041F18';
  const activeBtn = buttons[activeIndex];
  const icons = activeBtn ? GAME_ICONS[activeBtn.buttonKey] : null;

  const handleHost = () => {
    if (activeBtn?.tabHref) router.push(activeBtn.tabHref);
  };
  const handleDiwaniya = () => {
    if (activeBtn?.tabHref) router.push(activeBtn.tabHref + '?mode=diwaniya');
  };
  const handleWatch = () => {
    if (joinCode.trim()) router.push(`/join/${joinCode.trim()}`);
  };

  return (
    <div
      style={{
        background: bgColor,
        minHeight: 'calc(100vh - 130px)',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '10px',
      }}
    >
      {/* ===== منطقة الانزلاق ===== */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingTop: '20px',
          position: 'relative',
        }}
      >
        {activeBtn && (
          <>
            {/* اسم اللعبة فوق */}
            <h2
              style={{
                color: '#fff',
                fontSize: '22px',
                fontWeight: 900,
                marginBottom: '12px',
                textAlign: 'center',
                paintOrder: 'stroke fill',
                WebkitTextStroke: `1px ${activeBtn.strokeColor}`,
                textShadow: '0 2px 4px rgba(0,0,0,.6)',
              }}
            >
              {activeBtn.label}
            </h2>

            {/* صورة اللعبة كبيرة في إطار */}
            <div
              style={{
                position: 'relative',
                width: '220px',
                height: '176px',
                borderRadius: '16px',
                overflow: 'hidden',
                border: `2px solid ${activeBtn.strokeColor}80`,
                boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                marginBottom: '20px',
              }}
            >
              <img
                src={activeBtn.imageSrc}
                alt={activeBtn.label}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'fill',
                  display: 'block',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.4))',
                  animation: 'ggFloat 2.6s ease-in-out infinite',
                }}
              />
              {/* تأثير لمعان */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,.22) 50%, transparent 58%)',
                  backgroundSize: '240% 100%',
                  animation: 'ggShine 4.2s ease-in-out infinite',
                }}
              />
              {activeBtn.visibility === 'maintenance' && (
                <span style={{
                  position: 'absolute', top: '6px', left: '50%', transform: 'translateX(-50%)',
                  background: '#f59e0b', color: '#78350f', fontSize: '9px', fontWeight: 900,
                  padding: '3px 8px', borderRadius: '4px', zIndex: 5,
                }}>🔧 صيانة</span>
              )}
            </div>

            {/* زر العراب + زر الديوانية */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
              <button
                onClick={handleHost}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245,158,11,.3)',
                }}
              >
                👑 العراب
              </button>
              <button
                onClick={handleDiwaniya}
                style={{
                  padding: '10px 24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16,185,129,.3)',
                }}
              >
                🏛️ الديوانية
              </button>
            </div>

            {/* زر مشاهدة + حقل إدخال الكود */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '280px' }}>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="أدخل كود المشاهدة..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,.2)',
                  background: 'rgba(0,0,0,.4)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none',
                  textAlign: 'center',
                }}
                dir="ltr"
              />
              <button
                onClick={handleWatch}
                disabled={!joinCode.trim()}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  background: joinCode.trim() ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(100,100,100,.5)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: joinCode.trim() ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                }}
              >
                👁️ مشاهدة
              </button>
            </div>
          </>
        )}
      </div>

      {/* ===== شريط أيقونات التصفح — مطابق لـ yalla ludo ll_game_switch ===== */}
      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        {/* الشريط الرئيسي — خلفية battle_game_select_bg */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            background: 'url(/battle/battle_game_select_bg.png) center / 100% 100% no-repeat',
            height: '45px',
            padding: '0 20px',
            direction: 'ltr',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            maxWidth: '95vw',
          }}
        >
          {buttons.map((btn, i) => {
            const icons = GAME_ICONS[btn.buttonKey];
            const isActive = i === activeIndex;
            if (!icons) return null;
            return (
              <button
                key={btn.id}
                onClick={() => setActiveIndex(i)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <img
                  src={isActive ? icons.select : icons.unselect}
                  alt={btn.label}
                  style={{ width: '33px', height: '26px', objectFit: 'contain' }}
                />
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 'bold',
                    color: isActive ? '#f59e0b' : '#4AC595',
                    whiteSpace: 'nowrap',
                    marginTop: '1px',
                  }}
                >
                  {icons.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* مؤشر النقاط */}
        <div style={{ display: 'flex', gap: '10px', direction: 'ltr' }}>
          {buttons.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === activeIndex ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === activeIndex ? '#f59e0b' : 'rgba(255,255,255,.25)',
                transition: 'all .2s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
