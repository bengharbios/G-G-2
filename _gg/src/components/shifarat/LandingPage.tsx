'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface LandingPageProps {
  onSelectMode: (mode: 'godfather' | 'diwaniya') => void;
  onQuickStart?: () => void;
}

const FLOATING_EMOJIS = ['🎯', '🔑', '🗝️', '💡', '🔍', '📜', '🎯', '🔑', '💡', '🔍'];

export default function LandingPage({ onSelectMode, onQuickStart }: LandingPageProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<'classic' | 'diwaniya' | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showRules, setShowRules] = useState(false);

  const handleJoin = () => {
    if (!joinCode.trim()) { setJoinError('يجب إدخال كود المشاهدة'); return; }
    if (!joinName.trim()) { setJoinError('يجب إدخال اسمك'); return; }
    setJoinError('');
    window.location.href = `/join/shifarat/${joinCode.trim().toUpperCase()}?name=${encodeURIComponent(joinName.trim())}`;
  };

  const handleConfirmMode = () => {
    if (selectedMode === 'classic') onSelectMode('godfather');
    else if (selectedMode === 'diwaniya') onSelectMode('diwaniya');
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: 'calc(100vh - 130px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 16px 120px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* floating emojis */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {FLOATING_EMOJIS.map((emoji, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              left: `${10 + (i * 9) % 80}%`,
              top: `${5 + (i * 13) % 70}%`,
              fontSize: '24px',
              opacity: 0.15,
            }}
            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0], opacity: [0.08, 0.2, 0.08] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      {/* top mini toolbar */}
      <div style={{
        position: 'absolute', top: '8px', left: '12px', right: '12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 50,
      }}>
        <button
          onClick={() => router.push('/shifarat')}
          style={{
            background: 'rgba(6,42,32,.8)', border: '1px solid rgba(255,214,94,.2)',
            borderRadius: '10px', padding: '6px 10px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <img src="/battle/room_refresh.webp" alt="استئناف" style={{ width: '20px', height: '20px' }} />
          <span style={{ color: '#9fc4b4', fontSize: '11px', fontWeight: 'bold' }}>استئناف</span>
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(6,42,32,.8)', border: '1px solid rgba(255,214,94,.2)',
              borderRadius: '10px', padding: '6px', cursor: 'pointer',
            }}
          >
            <img src="/battle/setting.webp" alt="إعدادات" style={{ width: '20px', height: '20px' }} />
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'rgba(6,42,32,.8)', border: '1px solid rgba(255,214,94,.2)',
              borderRadius: '10px', padding: '6px', cursor: 'pointer',
            }}
          >
            <img src="/battle/close.webp" alt="خروج" style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '380px', margin: '0 auto', marginTop: '40px' }}
      >
        {/* title + logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <motion.div
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
          >
            <img
              src="/yalla-games/shifarat.png"
              alt="الشيفرات"
              style={{
                width: '120px', height: '96px', objectFit: 'contain', margin: '0 auto 8px',
                filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.5))',
              }}
            />
          </motion.div>
          <h1 style={{
            fontSize: '28px', fontWeight: 900, color: '#feef91',
            textShadow: '0 2px 4px rgba(0,0,0,.8)',
            paintOrder: 'stroke fill',
            WebkitTextStroke: '1px #aa6e1f',
            marginBottom: '4px',
          }}>
            الشيفرات
          </h1>
          <p style={{ color: '#9fc4b4', fontSize: '12px', fontWeight: 'bold' }}>
            Shifarat — Codenames 🎯
          </p>
        </div>

        {/* divider */}
        <div style={{
          width: '100%', height: '1px',
          background: 'url(/battle/divider_in_black_mode.webp) center / 100% 100% no-repeat',
          marginBottom: '16px',
        }} />

        {/* ===== bg_mode_select panel ===== */}
        <AnimatePresence mode="wait">
          {!selectedMode ? (
            <motion.div
              key="mode-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div style={{
                background: 'url(/battle/bg_mode_select.png) center / 100% 100% no-repeat',
                borderRadius: '12px', padding: '20px 16px', marginBottom: '16px',
              }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h2 style={{
                    fontSize: '16px', fontWeight: 'bold', color: '#8dd4ff',
                    marginBottom: '2px',
                  }}>إنشاء معركة جديدة</h2>
                  <p style={{ fontSize: '11px', color: '#9fc4b4' }}>اختر طريقة اللعب</p>
                </div>

                {/* العراب */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedMode('classic')}
                  style={{
                    width: '100%', borderRadius: '16px', overflow: 'hidden',
                    border: '2px solid rgba(245,158,11,.3)', cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(245,158,11,.15), rgba(217,119,6,.08))',
                    marginBottom: '12px', padding: '14px', display: 'flex',
                    alignItems: 'center', gap: '12px', textAlign: 'right',
                    transition: 'border-color .15s',
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'rgba(245,158,11,.2)', border: '1px solid rgba(245,158,11,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <img src="/battle/icon_godfather.svg" alt="عراب" style={{ width: '28px', height: '28px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '2px' }}>العراب</h3>
                    <p style={{ fontSize: '11px', color: '#9fc4b4' }}>فريقين على جهاز واحد — العراب يتحكم باللعبة</p>
                  </div>
                </motion.button>

                {/* الديوانية */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedMode('diwaniya')}
                  style={{
                    width: '100%', borderRadius: '16px', overflow: 'hidden',
                    border: '2px solid rgba(16,185,129,.3)', cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(16,185,129,.15), rgba(5,150,105,.08))',
                    padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right',
                    transition: 'border-color .15s',
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'rgba(16,185,129,.2)', border: '1px solid rgba(16,185,129,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <img src="/battle/icon_diwaniya.svg" alt="ديوانية" style={{ width: '28px', height: '28px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#34d399', marginBottom: '2px' }}>الديوانية</h3>
                    <p style={{ fontSize: '11px', color: '#9fc4b4' }}>أنشئ غرفة وشارك الكود، المشاهدون يشاهدون</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="mode-confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              <div style={{
                background: 'url(/battle/bg_mode_select.png) center / 100% 100% no-repeat',
                borderRadius: '12px', padding: '20px 16px', marginBottom: '16px',
              }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                    {selectedMode === 'classic' ? '👑' : '🏛️'}
                  </div>
                  <h2 style={{
                    fontSize: '18px', fontWeight: 'bold',
                    color: selectedMode === 'classic' ? '#fbbf24' : '#34d399',
                  }}>
                    {selectedMode === 'classic' ? 'العراب' : 'الديوانية'}
                  </h2>
                </div>

                {selectedMode === 'classic' && (
                  <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span>👑</span><span>أنت العراب — تتحكم باللعبة بالكامل</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span>🎯</span><span>فريقان أحمر/أزرق على لوحة 5×5</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span>👁️</span><span>الجاسوس يرى الألوان ويعطي دليلاً</span>
                    </div>
                  </div>
                )}

                {selectedMode === 'diwaniya' && (
                  <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span>🏛️</span><span>أنشئ غرفة واحصل على كود</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span>👥</span><span>شارك الكود مع المشاهدين</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                      <span>⚡</span><span>بث مباشر بدون تدخل من المشاهدين</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSelectedMode(null)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.15)',
                      background: 'rgba(100,100,100,.3)', color: '#9fc4b4', fontSize: '14px', fontWeight: 'bold',
                      cursor: 'pointer',
                    }}
                  >رجوع</button>
                  <button
                    onClick={handleConfirmMode}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                      background: selectedMode === 'classic'
                        ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                        : 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
                      boxShadow: selectedMode === 'classic'
                        ? '0 4px 12px rgba(245,158,11,.3)'
                        : '0 4px 12px rgba(16,185,129,.3)',
                    }}
                  >متابعة ←</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* divider */}
        <div style={{
          width: '100%', height: '1px',
          background: 'url(/battle/divider_in_black_mode.webp) center / 100% 100% no-repeat',
          marginBottom: '16px',
        }} />

        {/* watch capsule */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(6,42,32,.6)', backdropFilter: 'blur(4px)',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,.08)',
          padding: '3px', marginBottom: '12px',
        }}>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(''); }}
            placeholder="كود المشاهدة..."
            maxLength={6}
            dir="ltr"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: '14px', padding: '10px 12px', textAlign: 'center',
              fontFamily: 'monospace', letterSpacing: '2px',
            }}
          />
          <input
            type="text"
            value={joinName}
            onChange={(e) => { setJoinName(e.target.value); setJoinError(''); }}
            placeholder="اسمك..."
            maxLength={20}
            dir="rtl"
            style={{
              width: '100px', background: 'transparent', border: 'none', outline: 'none',
              borderRight: '1px solid rgba(255,255,255,.1)',
              color: '#9fc4b4', fontSize: '13px', padding: '10px 8px', textAlign: 'center',
            }}
          />
          <button
            onClick={handleJoin}
            disabled={!joinCode.trim() || !joinName.trim()}
            style={{
              padding: '10px 16px', borderRadius: '9px', border: 'none',
              cursor: joinCode.trim() && joinName.trim() ? 'pointer' : 'not-allowed',
              background: joinCode.trim() && joinName.trim()
                ? 'linear-gradient(135deg, #4a8d7a, #3a7d6a)'
                : 'rgba(100,100,100,.3)',
              color: '#fff', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            <img src="/battle/iv_team_share.webp" alt="" style={{ width: '16px', height: '16px' }} />
            مشاهدة
          </button>
        </div>

        {joinError && (
          <p style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center', marginBottom: '8px' }}>⚠️ {joinError}</p>
        )}

        {/* rules */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <button
            onClick={() => setShowRules(!showRules)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#fbbf24', fontSize: '13px', fontWeight: 'bold',
            }}
          >{showRules ? 'إخفاء القوانين' : '📜 عرض القوانين'}</button>
        </div>

        <AnimatePresence>
          {showRules && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden', marginBottom: '8px' }}
            >
              <div style={{
                background: 'rgba(6,42,32,.8)', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,.08)', padding: '16px',
              }}>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  <h4 style={{ fontWeight: 'bold', color: '#f87171', marginBottom: '4px' }}>🎯 الهدف:</h4>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '12px', color: '#9fc4b4', fontSize: '12px' }}>
                    <li>• فريق أحمر (9 كلمات) وفريق أزرق (8 كلمات)</li>
                    <li>• الجاسوس يرى الألوان ويعطي دليلاً (كلمة + رقم)</li>
                    <li>• الفريق يخمن الكلمات المرتبطة بالدليل</li>
                  </ul>
                  <h4 style={{ fontWeight: 'bold', color: '#fb923c', marginBottom: '4px' }}>💀 القاتل:</h4>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '12px', color: '#9fc4b4', fontSize: '12px' }}>
                    <li>• بطاقة قاتل سوداء واحدة على اللوحة</li>
                    <li>• من يكشفها يخسر فوراً!</li>
                  </ul>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: '8px' }}>
                    <p style={{ color: '#fbbf24', fontSize: '12px' }}>🏆 الفريق الذي يكشف كل كلماته أولاً يفوز</p>
                    <p style={{ color: '#64748b', fontSize: '11px' }}>5×5 لوحة — 25 كلمة — 7 محايدة</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
