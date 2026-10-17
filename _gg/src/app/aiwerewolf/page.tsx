'use client';
import { useEffect, useState } from 'react';
import {
  useInGameSetupMode,
  useYallaSoundState,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';

/**
 * AI Werewolf — G-G wrapper page
 *
 * Embeds the AI Werewolf Vite build via an iframe and overlays the standard
 * Tobol war-theme header (sound toggle + chat icon + quit-game button) so the
 * experience matches every other G-G game.
 *
 * The iframe content is at /aiwerewolf/index.html (rebuilt from
 * /tmp/aiwerewolf-arabic).
 */
export default function AIWerewolfPage() {
  useInGameSetupMode();

  const { musicOn, toggleMusic } = useYallaSoundState();
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  // Force a fresh iframe load on every mount so guest state resets cleanly.
  useEffect(() => {
    setIframeKey(k => k + 1);
  }, []);

  const handleQuit = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: '#041F18',
      }}
    >
      {/* ══════════ G-G header (sound + chat + quit) — matches Tobol ══════════ */}
      <div className="tobol-header-actions" style={{ position: 'fixed', top: '8px', left: '12px', zIndex: 10000 }}>
        {/* Sound toggle */}
        <button
          type="button"
          className={`tobol-header-btn ${musicOn ? 'active' : ''}`}
          onClick={toggleMusic}
          aria-label={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          title={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
        >
          <img
            src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'}
            alt="sound"
          />
        </button>

        {/* Chat button — visual only for now (no live multiplayer yet) */}
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => { /* chat — non-functional for now */ }}
          aria-label="دردشة المعركة"
          title="دردشة المعركة"
        >
          <img src="/battle/icon_chat.webp" alt="chat" />
        </button>

        {/* Quit game */}
        <button
          type="button"
          className="tobol-header-btn"
          onClick={() => setShowQuitDialog(true)}
          aria-label="إنهاء اللعبة بدون حفظ"
          title="إنهاء اللعبة بدون حفظ"
        >
          <img src="/battle/btn_quit_game.webp" alt="quit" />
        </button>
      </div>

      {/* ══════════ Title overlay — Tobol war-drums look ══════════ */}
      <div
        style={{
          position: 'fixed',
          top: '6px',
          left: 0,
          right: 0,
          textAlign: 'center',
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>🐺</span>
          <span
            style={{
              ...STROKE_STYLE,
              fontSize: '16px',
              fontWeight: 900,
              textShadow: '0 2px 4px rgba(0,0,0,.85)',
              lineHeight: 1,
            }}
          >
            المستذئب العربي
          </span>
          <span style={{ fontSize: '14px' }}>⚔️</span>
        </div>
        <div style={{ color: '#9fc4b4', fontSize: '9px', fontWeight: 600, marginTop: '1px' }}>
          AI Werewolf — معركة القرية
        </div>
      </div>

      {/* ══════════ The AI Werewolf game (iframe) ══════════ */}
      <iframe
        key={iframeKey}
        src="/aiwerewolf/index.html"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        title="AI Werewolf — المستذئب العربي"
        allow="fullscreen; microphone"
      />

      {/* ══════════ Quit dialog ══════════ */}
      {showQuitDialog && (
        <div
          onClick={() => setShowQuitDialog(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(180deg, #0e2a22, #061812)',
              border: '1.5px solid rgba(254,239,145,.25)',
              borderRadius: '18px',
              padding: '20px',
              width: '100%',
              maxWidth: '300px',
              textAlign: 'center',
              boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              direction: 'rtl',
            }}
          >
            <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
            <h3
              style={{
                ...STROKE_STYLE,
                fontSize: '17px',
                fontWeight: 900,
                margin: '0 0 6px',
              }}
            >
              الخروج من المعركة؟
            </h3>
            <p
              style={{
                color: '#9fc4b4',
                fontSize: '12px',
                marginBottom: '16px',
                lineHeight: 1.5,
                marginTop: '0',
              }}
            >
              سيتم إنهاء الجلسة وعدم حفظ أي تقدم. هل أنت متأكد؟
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowQuitDialog(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,.12)',
                  background: 'rgba(80,80,80,.3)',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleQuit}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220,38,38,.35)',
                }}
              >
                نعم، اخرج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
