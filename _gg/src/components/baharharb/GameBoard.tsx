'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useBaharHarbStore } from '@/lib/baharharb-store';
import {
  useInGameSetupMode,
  useYallaSoundState,
  useHostHeartbeat,
  useViewerCount,
  useShareLinks,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';

// ============================================================
// Sound effects (Web Audio API) — preserved from inline page
// ============================================================
function useSoundEffects(enabled: boolean) {
  const getCtx = useCallback(() => {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }, []);

  const playReveal = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, [enabled, getCtx]);

  const playScore = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.3);
      });
    } catch {}
  }, [enabled, getCtx]);

  const playWin = useCallback(() => {
    if (!enabled) return;
    try {
      const ctx = getCtx();
      const notes = [523, 659, 784, 1047, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch {}
  }, [enabled, getCtx]);

  return { playReveal, playScore, playWin };
}

const FLOATING_EMOJIS = ['🌊', '⚔️', '🚢', '🏝️', '⚓', '🔱'];
const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👎', '👏', '🙏', '💪', '🔥', '⚔️', '🌊', '🎯', '💀', '🏆', '🥇', '⚓', '🎉', '💯', '❤️', '💔', '✨', '⚡', '🌟', '👑', '🤝', '🫡', '😤', '🤯'];

export default function GameBoard() {
  const router = useRouter();
  const {
    playMode,
    team1Name,
    team2Name,
    totalQuestions,
    currentQuestionIndex,
    questions,
    team1Score,
    team2Score,
    showClue1,
    showClue2,
    showAnswer1,
    showAnswer2,
    gameMode,
    roomCode,
    revealClue1,
    revealClue2,
    revealAnswer1,
    revealAnswer2,
    awardTeam1,
    awardTeam2,
    nextQuestion,
    prevQuestion,
    goToGameOver,
    resetGame,
  } = useBaharHarbStore();

  const { musicOn, soundOn, toggleMusic, toggleSound } = useYallaSoundState();
  useInGameSetupMode();
  useHostHeartbeat('baharharb', gameMode, roomCode);

  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;
  const { viewerCount, viewers } = useViewerCount('baharharb', isDiwaniyaHost, roomCode);
  const { shareLink, directLink, shareCopied, copyShareLink, shareExternally } = useShareLinks('baharharb', isDiwaniyaHost, roomCode);

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: number; name: string; text: string; emoji?: string }[]>([]);

  const soundRef = useRef(soundOn);
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  const { playReveal, playScore, playWin } = useSoundEffects(soundRef.current);

  const question = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;

  const handleRevealClue1 = useCallback(() => {
    if (!showClue1) playReveal();
    revealClue1();
  }, [showClue1, playReveal, revealClue1]);
  const handleRevealClue2 = useCallback(() => {
    if (!showClue2) playReveal();
    revealClue2();
  }, [showClue2, playReveal, revealClue2]);
  const handleRevealAnswer1 = useCallback(() => {
    if (!showAnswer1) playReveal();
    revealAnswer1();
  }, [showAnswer1, playReveal, revealAnswer1]);
  const handleRevealAnswer2 = useCallback(() => {
    if (!showAnswer2) playReveal();
    revealAnswer2();
  }, [showAnswer2, playReveal, revealAnswer2]);
  const handleTeam1Score = useCallback(() => {
    playScore();
    awardTeam1();
  }, [playScore, awardTeam1]);
  const handleTeam2Score = useCallback(() => {
    playScore();
    awardTeam2();
  }, [playScore, awardTeam2]);
  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      playWin();
      goToGameOver();
    } else {
      nextQuestion();
    }
  }, [isLastQuestion, playWin, goToGameOver, nextQuestion]);

  if (!question) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9fc4b4' }}>
        جاري التحميل...
      </div>
    );
  }

  const battleLog = useBaharHarbStore.getState().battleLog;

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        height: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 8px',
        gap: '6px',
        overflow: 'hidden',
      }}
    >
      {/* ══════════ أيقونات الهيدر ══════════ */}
      <div className="tobol-header-actions" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className={`tobol-header-btn ${musicOn ? 'active' : ''}`}
            onClick={toggleMusic}
            aria-label={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
            title={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          >
            <img src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'} alt="sound" />
          </button>
          <button
            type="button"
            className="tobol-header-btn"
            onClick={() => setShowChat(true)}
            aria-label="دردشة"
            title="دردشة"
          >
            <img src="/battle/icon_chat.webp" alt="chat" />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isDiwaniyaHost && (
            <button
              type="button"
              className="tobol-eye-btn"
              onClick={() => setShowViewers(true)}
              aria-label="المشاهدون"
              title="المشاهدون"
            >
              <img src="/battle/icon_viewers.webp" alt="viewers" />
              <span className="tobol-eye-count">{viewerCount}</span>
            </button>
          )}
          <button
            type="button"
            className="tobol-header-btn"
            onClick={() => setShowExitDialog(true)}
            aria-label="خروج"
            title="خروج"
          >
            <img src="/battle/btn_exit.webp" alt="exit" />
          </button>
        </div>
      </div>

      {/* ══════════ العنوان + النقاط (compact) ══════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '24px' }}>🌊⚔️</div>
          <h1 style={{ ...STROKE_STYLE, fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>بحر و حرب</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Team 1 panel */}
          <div className="tobol-team-panel-compact team-red active-turn" style={{ flex: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#22d3ee', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {playMode === 'individuals' ? 'لاعب 1' : team1Name}
            </span>
            <motion.span
              key={team1Score}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              style={{ fontSize: '20px', fontWeight: 900, color: '#67e8f9' }}
            >
              {team1Score}
            </motion.span>
          </div>

          <div className="tobol-vs-badge" style={{ width: '32px', height: '32px' }}>
            <img src="/battle/vs_pk.webp" alt="VS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          {/* Team 2 panel */}
          <div className="tobol-team-panel-compact team-blue active-turn" style={{ flex: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f43f5e', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {playMode === 'individuals' ? 'لاعب 2' : team2Name}
            </span>
            <motion.span
              key={team2Score}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              style={{ fontSize: '20px', fontWeight: 900, color: '#fda4af' }}
            >
              {team2Score}
            </motion.span>
          </div>
        </div>

        <button
          type="button"
          className="tobol-log-btn"
          onClick={() => setShowBattleLog(true)}
          aria-label="سجل المعركة"
          title="سجل المعركة"
        >
          <img src="/battle/icon_log.webp" alt="log" />
          <span className="log-count">{battleLog.length}</span>
        </button>
      </div>

      {/* ══════════ شريط التقدم ══════════ */}
      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9fc4b4', fontWeight: 700, marginBottom: '2px' }}>
          <span>السؤال {currentQuestionIndex + 1} من {totalQuestions}</span>
          <span>⚙️ العِراب</span>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,.4)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(254,239,145,.2)' }}>
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #22d3ee, #f43f5e)',
              borderRadius: '6px',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* ══════════ لوحة الإشعار ══════════ */}
      <div className="tobol-board-notice-v3 attack" style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <span className="tobol-notice-dot" />
        <span style={{ fontSize: '13px' }}>🌊</span>
        <span>اكشف الأدلة ودع الفرق تخمن — الإجابات تتشابه في الحروف!</span>
      </div>

      {/* ══════════ بطاقتا الدلائل (بحر + حرب) ══════════ */}
      <div style={{ flex: 1, display: 'flex', gap: '8px', maxWidth: '480px', margin: '0 auto', width: '100%', alignItems: 'stretch', overflow: 'hidden' }}>
        {/* Sea Card (بحر) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`sea-${currentQuestionIndex}`}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              borderRadius: '14px',
              border: '1.5px solid rgba(34,211,238,.35)',
              background: 'linear-gradient(180deg, rgba(8,47,73,.85), rgba(2,12,18,.85))',
              boxShadow: '0 6px 18px rgba(0,0,0,.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🌊</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#22d3ee', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>بحر</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <AnimatePresence mode="wait">
                {!showClue1 ? (
                  <motion.button key="hidden-clue1" exit={{ opacity: 0 }}
                    onClick={handleRevealClue1}
                    style={{
                      background: 'rgba(34,211,238,.18)', border: '1px solid rgba(34,211,238,.4)',
                      borderRadius: '8px', padding: '8px 14px', color: '#22d3ee', fontSize: '12px', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    <span>👁️</span> اعرض الدليل
                  </motion.button>
                ) : (
                  <motion.p key="clue1" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ color: '#e0f2fe', fontSize: '15px', fontWeight: 600, lineHeight: 1.6, padding: '0 4px' }}
                  >
                    {question.clues[0]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(34,211,238,.18)' }}>
              <AnimatePresence mode="wait">
                {!showAnswer1 ? (
                  <motion.div key="hidden-ans1" exit={{ opacity: 0 }} style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={handleRevealAnswer1}
                      style={{
                        background: 'transparent', border: 'none',
                        color: 'rgba(34,211,238,.65)', fontSize: '11px', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <span>🙈</span> كشف الإجابة
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="ans1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '20px', fontWeight: 900, color: '#67e8f9', textShadow: '0 0 8px rgba(34,211,238,.4)' }}>
                      {question.answers[0]}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* War Card (حرب) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`war-${currentQuestionIndex}`}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              borderRadius: '14px',
              border: '1.5px solid rgba(244,63,94,.35)',
              background: 'linear-gradient(180deg, rgba(76,5,25,.85), rgba(2,12,18,.85))',
              boxShadow: '0 6px 18px rgba(0,0,0,.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚔️</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f43f5e', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>حرب</span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <AnimatePresence mode="wait">
                {!showClue2 ? (
                  <motion.button key="hidden-clue2" exit={{ opacity: 0 }}
                    onClick={handleRevealClue2}
                    style={{
                      background: 'rgba(244,63,94,.18)', border: '1px solid rgba(244,63,94,.4)',
                      borderRadius: '8px', padding: '8px 14px', color: '#f43f5e', fontSize: '12px', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                  >
                    <span>👁️</span> اعرض الدليل
                  </motion.button>
                ) : (
                  <motion.p key="clue2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ color: '#fee2e2', fontSize: '15px', fontWeight: 600, lineHeight: 1.6, padding: '0 4px' }}
                  >
                    {question.clues[1]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(244,63,94,.18)' }}>
              <AnimatePresence mode="wait">
                {!showAnswer2 ? (
                  <motion.div key="hidden-ans2" exit={{ opacity: 0 }} style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={handleRevealAnswer2}
                      style={{
                        background: 'transparent', border: 'none',
                        color: 'rgba(244,63,94,.65)', fontSize: '11px', fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <span>🙈</span> كشف الإجابة
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="ans2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '20px', fontWeight: 900, color: '#fda4af', textShadow: '0 0 8px rgba(244,63,94,.4)' }}>
                      {question.answers[1]}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══════════ أزرار النقاط + التنقل ══════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        {playMode === 'teams' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleTeam1Score}
              style={{
                padding: '10px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #0891b2, #0e7490)',
                color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(8,145,178,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              ✅ {team1Name}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleTeam2Score}
              style={{
                padding: '10px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #e11d48, #be123c)',
                color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(225,29,72,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
            >
              ✅ {team2Name}
            </motion.button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,.12)', background: 'rgba(100,100,100,.3)',
              color: currentQuestionIndex === 0 ? '#4b5563' : '#cbd5e1', fontSize: '13px', fontWeight: 700,
              cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            ➡ العودة
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            style={{
              flex: 2, padding: '10px', borderRadius: '10px', border: 'none',
              background: isLastQuestion
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #f59e0b, #ea580c)',
              color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(245,158,11,.3)',
            }}
          >
            {isLastQuestion ? '🏁 إنهاء اللعبة' : 'السؤال التالي ⬅'}
          </motion.button>
        </div>
      </div>

      {/* ══════════ صندوق مشاركة الديوانية ══════════ */}
      {isDiwaniyaHost && (
        <div className="tobol-share-box" style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
          <div className="tobol-share-title">
            <img src="/battle/icon_share.webp" alt="share" />
            <span>كود الغرفة لمشاهدة الديوانية</span>
          </div>
          <div className="tobol-share-code-row">
            <span className="tobol-share-code-label">الكود</span>
            <span className="tobol-share-code-value">{roomCode}</span>
            <button className="tobol-share-btn" onClick={copyShareLink}>
              <img src="/battle/icon_copy.webp" alt="copy" />
              {shareCopied ? 'تم!' : 'نسخ'}
            </button>
          </div>
          <div className="tobol-share-link-row">
            <input className="tobol-share-link-input" value={shareLink} readOnly dir="ltr" />
            <button className="tobol-share-direct-btn" onClick={shareExternally}>
              <img src="/battle/icon_share_ext.webp" alt="share" />
              مشاركة
            </button>
          </div>
        </div>
      )}

      {/* ══════════ حوار الخروج ══════════ */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #0e2a22, #061812)',
                border: '1.5px solid rgba(254,239,145,.25)',
                borderRadius: '18px',
                padding: '20px',
                width: '100%', maxWidth: '300px',
                textAlign: 'center',
                boxShadow: '0 14px 36px rgba(0,0,0,.55)',
              }}
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                الخروج من المعركة؟
              </h3>
              <p style={{ color: '#9fc4b4', fontSize: '12px', marginBottom: '16px', lineHeight: 1.5 }}>
                سيتم إنهاء الجلسة وعدم حفظ أي تقدم. هل أنت متأكد؟
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowExitDialog(false)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,.12)',
                    background: 'rgba(80,80,80,.3)',
                    color: '#cbd5e1', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  }}
                >إلغاء</button>
                <button onClick={() => { resetGame(); router.push('/'); }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220,38,38,.35)',
                  }}
                >نعم، اخرج</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ مشروط سجل المعركة ══════════ */}
      <AnimatePresence>
        {showBattleLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBattleLog(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 100, padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-log-modal"
              style={{ width: '100%', maxWidth: '360px' }}
            >
              <div className="tobol-log-modal-header">
                <h3 className="tobol-log-modal-title">📜 سجل المعركة</h3>
                <button onClick={() => setShowBattleLog(false)} style={{ background: 'none', border: 'none', color: '#9fc4b4', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
              <div className="tobol-log-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {battleLog.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280', fontSize: '13px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📜</div>
                    لا توجد إجراءات بعد
                  </div>
                ) : (
                  [...battleLog].reverse().map((entry) => (
                    <div key={entry.id} style={{
                      padding: '8px 10px', marginBottom: '4px',
                      borderRadius: '8px', border: '1px solid rgba(255,255,255,.08)',
                      background: entry.team === 1 ? 'rgba(34,211,238,.08)' : 'rgba(244,63,94,.08)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ fontSize: '14px' }}>{entry.team === 1 ? '🌊' : '⚔️'}</span>
                      <span style={{ fontSize: '12px', color: '#cbd5e1', flex: 1 }}>{entry.message}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ مشروط الدردشة ══════════ */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowChat(false); setShowEmojiPicker(false); }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-chat-panel"
              style={{ width: '100%', maxWidth: '420px', height: '70vh' }}
            >
              <div className="tobol-chat-panel-header">
                <h3 className="tobol-chat-panel-title">💬 دردشة المعركة</h3>
                <button className="tobol-chat-panel-close" onClick={() => { setShowChat(false); setShowEmojiPicker(false); }}>✕</button>
              </div>
              <div className="tobol-chat-panel-body" style={{ flex: 1, overflowY: 'auto' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '12px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>💬</div>
                    اكتب أول رسالة
                  </div>
                ) : (
                  chatMessages.map((m) => (
                    <div key={m.id} style={{ marginBottom: '6px', padding: '6px 10px', borderRadius: '10px', background: 'rgba(255,255,255,.05)' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#feef91' }}>{m.name}:</span>{' '}
                      <span style={{ fontSize: '13px', color: '#cbd5e1' }}>{m.text} {m.emoji}</span>
                    </div>
                  ))
                )}
              </div>
              {showEmojiPicker && (
                <div className="tobol-emoji-picker" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                  {EMOJIS.map((emoji) => (
                    <button key={emoji} onClick={() => {
                      setChatInput(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }} style={{ fontSize: '18px', padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <div className="tobol-chat-panel-input-row">
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>😊</button>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="اكتب رسالة..."
                  dir="rtl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && chatInput.trim()) {
                      setChatMessages(prev => [...prev, { id: prev.length + 1, name: 'العراب', text: chatInput.trim() }]);
                      setChatInput('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (chatInput.trim()) {
                      setChatMessages(prev => [...prev, { id: prev.length + 1, name: 'العراب', text: chatInput.trim() }]);
                      setChatInput('');
                    }
                  }}
                >إرسال</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ مشروط المشاهدين ══════════ */}
      <AnimatePresence>
        {showViewers && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowViewers(false)}
            className="tobol-viewers-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-viewers-modal"
            >
              <div className="tobol-viewers-header">
                <h3 className="tobol-viewers-title">
                  <img src="/battle/icon_viewers.webp" alt="viewers" />
                  المشاهدون
                </h3>
                <button className="tobol-viewers-close" onClick={() => setShowViewers(false)}>✕</button>
              </div>
              <div className="tobol-viewers-body">
                {viewers.length === 0 ? (
                  <div className="tobol-viewers-empty">
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>👥</div>
                    <p style={{ color: '#9fc4b4', fontSize: '13px' }}>لا يوجد مشاهدون حالياً</p>
                    <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>شارك كود الغرفة ليصلك المشاهدون</p>
                  </div>
                ) : (
                  viewers.map((v, idx) => (
                    <div key={v.id} className="tobol-viewers-item">
                      <div className="tobol-viewers-avatar">{v.name.charAt(0)}</div>
                      <div className="tobol-viewers-info">
                        <p className="tobol-viewers-name">{v.name}</p>
                        <p className="tobol-viewers-joined">انضم منذ {Math.floor((Date.now() - v.joinedAt) / 60000)} دقيقة</p>
                      </div>
                      <span className="tobol-viewers-rank">#{idx + 1}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="tobol-viewers-footer">
                <p>إجمالي المشاهدين: {viewers.length}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
