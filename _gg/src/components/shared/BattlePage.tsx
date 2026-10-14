'use client';

import { useState, useEffect, useMemo } from 'react';
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

// ألعاب "الأكثر لعباً" (شارة HOT)
const HOT_GAMES = new Set(['mafia', 'tobol', 'prison']);

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

export default function BattlePage() {
  const [config, setConfig] = useState<BattleConfig | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [userRole, setUserRole] = useState('guest');
  const [joinCode, setJoinCode] = useState('');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const router = useRouter();

  // تحقق من إعداد "تقليل الحركة"
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handler = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
      if (diff > 0 && activeIndex < buttons.length - 1) { setActiveIndex(i => i + 1); setAnimKey(k => k + 1); }
      else if (diff < 0 && activeIndex > 0) { setActiveIndex(i => i - 1); setAnimKey(k => k + 1); }
    }
    setTouchStart(null);
  };

  // جزيئات ذهبية متطايرة
  const particles = useMemo<Particle[]>(() => {
    if (reduceMotion) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 5,
      duration: 4 + Math.random() * 3,
    }));
  }, [animKey, reduceMotion]);

  if (!config) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#9fc4b4', fontSize: '14px' }}>جارٍ التحميل...</div>;
  }

  const buttons = config.buttons.sort((a, b) => a.tabOrder - b.tabOrder);
  const activeBtn = buttons[activeIndex];
  if (!activeBtn) return null;

  const stroke = activeBtn.strokeColor;
  const isHot = HOT_GAMES.has(activeBtn.buttonKey);
  const canAccessMaintenance = userRole === 'admin' || userRole === 'moderator';

  const switchGame = (i: number) => { setActiveIndex(i); setAnimKey(k => k + 1); };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: 'calc(100vh - 130px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 16px 120px',
        gap: '14px',
        background: `linear-gradient(180deg, #062b21 0%, #041f18 40%, #03211a 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* توهج بلون اللعبة خلف البطاقة */}
      <div style={{
        position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)',
        width: '300px', height: '300px', borderRadius: '50%',
        background: `radial-gradient(circle, ${stroke}15 0%, transparent 70%)`,
        filter: 'blur(40px)', pointerEvents: 'none', zIndex: 0,
        animation: reduceMotion ? 'none' : 'glowPulse 3s ease-in-out infinite',
      }} />
      {/* هلال زخرفي */}
      <div style={{
        position: 'absolute', top: '-30px', left: '50%', transform: 'translateX(-50%)',
        width: '280px', height: 'auto', opacity: 0.05, pointerEvents: 'none', zIndex: 0,
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
          key={`hero-${animKey}`}
          style={{
            animation: reduceMotion ? 'none' : 'heroEnter 0.5s cubic-bezier(0.22,1,0.36,1)',
            position: 'relative',
            width: '100%',
            aspectRatio: '1.35',
            borderRadius: '20px',
            overflow: 'hidden',
            border: `2px solid ${stroke}60`,
            boxShadow: `0 10px 30px rgba(0,0,0,.5), 0 0 20px ${stroke}40`,
            flexShrink: 0,
          }}
        >
          {/* الصورة — brightness + saturate + zoom بطيء */}
          <img
            src={activeBtn.imageSrc}
            alt={activeBtn.label}
            style={{
              width: '100%', height: '100%', objectFit: 'contain', display: 'block',
              filter: 'brightness(1.1) saturate(1.15)',
              animation: reduceMotion ? 'none' : 'slowZoom 6s ease-in-out infinite alternate',
            }}
          />
          {/* Overlay بلون اللعبة */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(135deg, ${stroke}20 0%, transparent 50%, ${stroke}15 100%)`,
          }} />
          {/* تدرج داكن أسفل لاسم اللعبة */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,.88) 100%)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 0 16px 0',
          }}>
            {/* اسم اللعبة فوق الصورة */}
            <span style={{
              fontSize: '22px', fontWeight: 900, color: '#fff',
              textShadow: '0 2px 8px rgba(0,0,0,.9)',
              paintOrder: 'stroke fill',
              WebkitTextStroke: `1px ${stroke}`,
            }}>
              {activeBtn.label}
            </span>
          </div>
          {/* توهج نابض حول البطاقة */}
          {!reduceMotion && (
            <div style={{
              position: 'absolute', inset: '-2px', borderRadius: '20px',
              border: `2px solid ${stroke}30`, pointerEvents: 'none',
              animation: 'glowPulse 3s ease-in-out infinite',
            }} />
          )}
          {/* لمعة ضوئية تعبر البطاقة كل 4-5 ثوانٍ */}
          {!reduceMotion && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,.25) 50%, transparent 60%)',
              backgroundSize: '240% 100%', animation: 'ggShine 4.5s ease-in-out infinite',
            }} />
          )}
          {/* جزيئات ذهبية متطايرة فوق الصورة */}
          {!reduceMotion && particles.map((p) => (
            <div key={p.id} style={{
              position: 'absolute', left: `${p.x}%`, bottom: `${p.y}%`,
              width: `${p.size}px`, height: `${p.size}px`, borderRadius: '50%',
              background: '#ffd75e', opacity: 0.5, pointerEvents: 'none',
              boxShadow: '0 0 4px #ffd75e',
              animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }} />
          ))}
          {/* شارة HOT للألعاب الأكثر لعباً */}
          {isHot && (
            <div style={{
              position: 'absolute', top: '10px', right: '10px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff', fontSize: '10px', fontWeight: 900,
              padding: '3px 10px', borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(239,68,68,.4)',
              border: '1px solid rgba(255,255,255,.2)',
              zIndex: 5,
              animation: reduceMotion ? 'none' : 'badgePulse 2s ease-in-out infinite',
            }}>
              🔥 HOT
            </div>
          )}
          {/* شارة maintenance */}
          {activeBtn.visibility === 'maintenance' && (
            <span style={{
              position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
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
          }}
        >
          {/* العراب */}
          <ModeButton
            label="العراب"
            icon="👑"
            gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
            highlight="linear-gradient(180deg, rgba(255,255,255,.25) 0%, transparent 40%)"
            shadow="0 4px 16px rgba(245,158,11,.35)"
            delay="0.08s"
            reduceMotion={reduceMotion}
            isPrimary={true}
            onClick={() => activeBtn.tabHref && router.push(activeBtn.tabHref)}
          />
          {/* الديوانية */}
          <ModeButton
            label="الديوانية"
            icon="🏛️"
            gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            highlight="linear-gradient(180deg, rgba(255,255,255,.2) 0%, transparent 40%)"
            shadow="0 4px 16px rgba(16,185,129,.35)"
            delay="0.16s"
            reduceMotion={reduceMotion}
            isPrimary={false}
            onClick={() => activeBtn.tabHref && router.push(activeBtn.tabHref + '?mode=diwaniya')}
          />
        </div>

        {/* ===== صف المشاهدة (كبسولة أنيقة خفيفة بصرياً) ===== */}
        <div
          key={`watch-${animKey}`}
          style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(6px)',
            borderRadius: '12px', border: '1px solid rgba(255,255,255,.08)',
            padding: '3px 3px 3px 3px',
            opacity: 0.85,
          }}
        >
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="أدخل كود المشاهدة..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#94a3b8', fontSize: '13px', padding: '10px 14px',
              textAlign: 'center',
            }}
            dir="ltr"
          />
          <button
            onClick={() => joinCode.trim() && router.push(`/join/${joinCode.trim()}`)}
            disabled={!joinCode.trim()}
            style={{
              padding: '8px 16px', borderRadius: '9px', border: 'none',
              cursor: joinCode.trim() ? 'pointer' : 'not-allowed',
              background: joinCode.trim() ? 'linear-gradient(135deg, #4a8d7a, #3a7d6a)' : 'rgba(100,100,100,.3)',
              color: '#fff', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'transform .1s',
            }}
            onMouseDown={(e) => joinCode.trim() && (e.currentTarget.style.transform = 'scale(.95)')}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '14px' }}>👁️</span>
            مشاهدة
          </button>
        </div>
      </div>

      {/* ===== شريط أيقونات التصفح ===== */}
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

      {/* ===== CSS keyframes ===== */}
      <style jsx>{`
        @keyframes heroEnter {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes btnEnter {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slowZoom {
          from { transform: scale(1) translateY(0); }
          to { transform: scale(1.05) translateY(-2px); }
        }
        @keyframes ggShine {
          0%, 55% { background-position: 130% 0; }
          85%, 100% { background-position: -130% 0; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-15px) translateX(5px); opacity: 0.7; }
        }
        @keyframes btnPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}

// ===== مكون زر الوضع (العراب / الديوانية) =====
function ModeButton({
  label, icon, gradient, highlight, shadow, delay, reduceMotion, isPrimary, onClick,
}: {
  label: string; icon: string; gradient: string; highlight: string;
  shadow: string; delay: string; reduceMotion: boolean; isPrimary: boolean; onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        flex: 1, minHeight: '90px', borderRadius: '16px', border: 'none', cursor: 'pointer',
        background: gradient, boxShadow: shadow,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
        position: 'relative', overflow: 'hidden',
        transform: pressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform .1s ease-out',
        animation: reduceMotion ? 'none' : `btnEnter 0.4s ease-out ${delay} both${isPrimary ? ', btnPulse 2.5s ease-in-out 0.5s infinite' : ''}`,
      }}
    >
      {/* حافة علوية فاتحة (تأثير 3D بارز) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: highlight, pointerEvents: 'none',
      }} />
      {/* لمعة تعبر الزر */}
      {!reduceMotion && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(105deg, transparent 45%, rgba(255,255,255,.15) 50%, transparent 55%)',
          backgroundSize: '200% 100%',
          animation: `ggShine ${3 + Math.random()}s ease-in-out ${delay} infinite`,
        }} />
      )}
      <span style={{
        fontSize: '28px',
        animation: reduceMotion ? 'none' : `btnPulse 2s ease-in-out ${Math.random()}s infinite`,
      }}>{icon}</span>
      <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,.3)' }}>{label}</span>
    </button>
  );
}
