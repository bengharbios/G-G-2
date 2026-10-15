'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFamilyFeudStore } from '@/lib/familyfeud-store';
import {
  useInGameSetupMode,
  useYallaSoundState,
  useHostHeartbeat,
  useViewerCount,
  useShareLinks,
  STROKE_STYLE,
} from '@/lib/yalla-game-helpers';
import { getQuestionCategory, getDifficultyInfo } from '@/lib/familyfeud-questions';
import { playClickSound, playNotifySound, playTickSound } from '@/lib/sounds';

const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👎', '👏', '🙏', '💪', '🔥', '⚔️', '🌊', '🎯', '💀', '🏆', '🥇', '⚓', '🎉', '💯', '❤️', '💔', '✨', '⚡', '🌟', '👑', '🤝', '🫡', '😤', '🤯'];

// ============================================================
// Sound effects (preserved from original inline page)
// ============================================================
function useSoundEffects(soundEnabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(soundEnabled);
  useEffect(() => { enabledRef.current = soundEnabled; }, [soundEnabled]);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AC();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((type: OscillatorType, freq: number, dur: number, gain = 0.2, when = 0) => {
    if (!enabledRef.current) return;
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
      g.gain.setValueAtTime(gain, ctx.currentTime + when);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + when + dur);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + dur);
    } catch {}
  }, [getCtx]);

  const playCorrect = useCallback(() => {
    playTone('sine', 880, 0.5, 0.25, 0);
    playTone('sine', 1100, 0.4, 0.25, 0.1);
    playTone('sine', 1320, 0.4, 0.25, 0.2);
  }, [playTone]);

  const playBuzz = useCallback(() => {
    playTone('sawtooth', 90, 0.4, 0.3);
    playTone('sawtooth', 70, 0.4, 0.3, 0.15);
  }, [playTone]);

  const playStrike = useCallback(() => {
    playTone('square', 200, 0.4, 0.25);
    playTone('triangle', 150, 0.45, 0.2, 0.05);
  }, [playTone]);

  const playReveal = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, [getCtx]);

  const playSteal = useCallback(() => {
    for (let i = 0; i < 4; i++) playTone('triangle', 300 + i * 100, 0.2, 0.15, i * 0.15);
  }, [playTone]);

  const playWin = useCallback(() => {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((f, i) => playTone('sine', f, 0.3, 0.2, i * 0.15));
  }, [playTone]);

  const playCountdown = useCallback(() => playTone('sine', 1000, 0.1, 0.15), [playTone]);

  const playTopAnswer = useCallback(() => {
    [1047, 1319, 1568].forEach((f, i) => playTone('sine', f, 0.4, 0.3, i * 0.12));
  }, [playTone]);

  return { playCorrect, playBuzz, playStrike, playReveal, playSteal, playWin, playCountdown, playTopAnswer };
}

export default function GameBoard() {
  const router = useRouter();
  const s = useFamilyFeudStore();
  const {
    uiPhase,
    gameMode,
    roomCode,
    team1Name, team2Name, team1Emoji, team2Emoji,
    team1Score, team2Score, currentTeam, strikes, round, totalRounds,
    gamePhase, selectedQuestions, currentAnswers, roundScore,
    fmQuestions, fmAnswers1, fmAnswers2, fmRevealed1, fmRevealed2,
    fmScore1, fmScore2, fmPhase, fmSelected1, fmSelected2,
    timeLeft, timerRunning, showGameOver,
    showRoundResult, roundResultType, roundResultTeamName, roundResultPoints,
    roundTimeLeft, roundTimerRunning,
    celebration300, revealStreak, hintsUsedThisRound,
    scoreAnimation, feedback,
    roundHistory, gameStats, regularRoundScore1, regularRoundScore2,
    handleFaceOffStart, handleRevealAnswer, handleAddStrike, handlePassToOtherTeam,
    handleSteal, handleNoSteal, handleRevealAll, handleUseHint, handleSkipQuestion,
    handleEndGame, handleReset, goToFastMoneyFromGameboard,
    setRoundTimeLeft, setRoundTimerRunning, tickRoundTimer, finishRoundTimerStrike,
    handleStartTimer, handleSelectFM1, handleSelectFM2, handleRevealFM1, handleRevealFM2,
    handleInputFM1, handleInputFM2, setFmPhase, setTimeLeft, setTimerRunning,
    tickFastMoneyTimer, finishFastMoneyTimer,
    setHintsUsedThisRound,
  } = s;

  const { musicOn, soundOn, toggleMusic } = useYallaSoundState();
  useInGameSetupMode();
  useHostHeartbeat('familyfeud', gameMode, roomCode);

  const isDiwaniyaHost = gameMode === 'diwaniya' && !!roomCode;
  const { viewerCount, viewers } = useViewerCount('familyfeud', isDiwaniyaHost, roomCode);
  const { shareLink, shareCopied, copyShareLink, shareExternally } = useShareLinks('familyfeud', isDiwaniyaHost, roomCode);

  // Push full game state to the room whenever it changes so spectators see
  // revealed answers, strikes, score changes, fast money state, and game over
  // in real time. The zustand store only sends partial updates from
  // handleEndGame; this hook fills in the gaps.
  useEffect(() => {
    if (!isDiwaniyaHost || !roomCode) return;
    const body = {
      phase: gamePhase,
      uiPhase,
      gamePhase,
      showGameOver,
      team1Name,
      team2Name,
      team1Emoji,
      team2Emoji,
      team1Score,
      team2Score,
      currentTeam,
      strikes,
      round,
      totalRounds,
      selectedQuestions,
      currentAnswers,
      roundScore,
      fmQuestions,
      fmAnswers1,
      fmAnswers2,
      fmRevealed1,
      fmRevealed2,
      fmScore1,
      fmScore2,
      fmPhase,
      fmSelected1,
      fmSelected2,
      timeLeft,
      timerRunning,
      regularRoundScore1,
      regularRoundScore2,
      roundHistory,
      gameStats,
    };
    fetch(`/api/familyfeud-room/${roomCode}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isDiwaniyaHost,
    roomCode,
    gamePhase,
    uiPhase,
    showGameOver,
    team1Name,
    team2Name,
    team1Emoji,
    team2Emoji,
    team1Score,
    team2Score,
    currentTeam,
    strikes,
    round,
    totalRounds,
    selectedQuestions,
    currentAnswers,
    roundScore,
    fmQuestions,
    fmAnswers1,
    fmAnswers2,
    fmRevealed1,
    fmRevealed2,
    fmScore1,
    fmScore2,
    fmPhase,
    fmSelected1,
    fmSelected2,
    timeLeft,
    timerRunning,
    regularRoundScore1,
    regularRoundScore2,
    roundHistory,
    gameStats,
  ]);

  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showBattleLog, setShowBattleLog] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ id: number; name: string; text: string; emoji?: string }[]>([]);

  const soundRef = useRef(soundOn);
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  const { playReveal, playCorrect, playBuzz, playStrike, playSteal, playWin, playCountdown, playTopAnswer } = useSoundEffects(soundRef.current);

  const currentQuestion = selectedQuestions[round - 1];

  // NOTE: current round's answers are reset in the faceoff-phase effect
  // further below (so we don't need a duplicate effect here).

  // Round timer countdown
  const roundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (roundTimerRunning && roundTimeLeft > 0 && gamePhase === 'gameboard') {
      if (roundTimeLeft <= 5) playCountdown();
      roundTimerRef.current = setTimeout(() => tickRoundTimer(), 1000);
    } else if (roundTimerRunning && roundTimeLeft === 0 && gamePhase === 'gameboard') {
      roundTimerRef.current = setTimeout(() => {
        setRoundTimerRunning(false);
        playBuzz();
        handleAddStrike();
      }, 0);
    }
    return () => {
      if (roundTimerRef.current) clearTimeout(roundTimerRef.current);
    };
  }, [roundTimerRunning, roundTimeLeft, gamePhase, playCountdown, playBuzz, tickRoundTimer, setRoundTimerRunning, handleAddStrike]);

  // Fast Money timer
  const fastMoneyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      // Tick every second to give the "fast money timer tick" feel.
      playTickSound();
      if (timeLeft <= 5) playCountdown();
      fastMoneyTimerRef.current = setTimeout(() => tickFastMoneyTimer(), 1000);
    } else if (timerRunning && timeLeft === 0) {
      fastMoneyTimerRef.current = setTimeout(() => {
        setTimerRunning(false);
        playBuzz();
      }, 0);
    }
    return () => {
      if (fastMoneyTimerRef.current) clearTimeout(fastMoneyTimerRef.current);
    };
  }, [timerRunning, timeLeft, playCountdown, playBuzz, tickFastMoneyTimer, setTimerRunning]);

  // Wrap handlers with sound effects
  const onReveal = useCallback((idx: number) => {
    playReveal();
    setTimeout(() => playCorrect(), 200);
    if (idx === 0) setTimeout(() => playTopAnswer(), 350);
    handleRevealAnswer(idx);
  }, [playReveal, playCorrect, playTopAnswer, handleRevealAnswer]);

  const onStrike = useCallback(() => {
    playStrike();
    handleAddStrike();
    // playSteal when 3 strikes is handled in handleAddStrike (gamePhase becomes 'steal')
    setTimeout(() => {
      if (useFamilyFeudStore.getState().gamePhase === 'steal') playSteal();
    }, 100);
  }, [playStrike, playSteal, handleAddStrike]);

  const onSteal = useCallback(() => {
    playCorrect();
    handleSteal();
  }, [playCorrect, handleSteal]);

  const onNoSteal = useCallback(() => {
    playStrike();
    handleNoSteal();
  }, [playStrike, handleNoSteal]);

  const onRevealAll = useCallback(() => {
    playCorrect();
    handleRevealAll();
  }, [playCorrect, handleRevealAll]);

  const onHint = useCallback(() => {
    playReveal();
    handleUseHint();
  }, [playReveal, handleUseHint]);

  // Wrap pass-to-other-team + skip-question with a click sound so the
  // current turn change is announced audibly.
  const onPassToOtherTeam = useCallback(() => {
    playClickSound();
    playNotifySound();
    handlePassToOtherTeam();
  }, [handlePassToOtherTeam]);

  const onSkipQuestion = useCallback(() => {
    playClickSound();
    playNotifySound();
    handleSkipQuestion();
  }, [handleSkipQuestion]);

  const onFaceOffStart = useCallback((team: 1 | 2) => {
    playCorrect();
    handleFaceOffStart(team);
  }, [playCorrect, handleFaceOffStart]);

  const onEndGame = useCallback(() => {
    playWin();
    handleEndGame();
  }, [playWin, handleEndGame]);

  // 300+ points celebration effect
  const prevTeam1ScoreRef = useRef(0);
  const prevTeam2ScoreRef = useRef(0);
  useEffect(() => {
    if (prevTeam1ScoreRef.current < 300 && team1Score >= 300) {
      requestAnimationFrame(() => {
        s.setCelebration300({ show: true, teamName: team1Name });
      });
      playWin();
      const t = setTimeout(() => s.setCelebration300({ show: false, teamName: '' }), 3000);
      prevTeam1ScoreRef.current = team1Score;
      return () => clearTimeout(t);
    }
    if (prevTeam2ScoreRef.current < 300 && team2Score >= 300) {
      requestAnimationFrame(() => {
        s.setCelebration300({ show: true, teamName: team2Name });
      });
      playWin();
      const t = setTimeout(() => s.setCelebration300({ show: false, teamName: '' }), 3000);
      prevTeam2ScoreRef.current = team2Score;
      return () => clearTimeout(t);
    }
    prevTeam1ScoreRef.current = team1Score;
    prevTeam2ScoreRef.current = team2Score;
  }, [team1Score, team2Score, team1Name, team2Name, playWin, s]);

  // Sync current question's answers when round changes
  useEffect(() => {
    if (currentQuestion && selectedQuestions.length > 0 && round <= totalRounds) {
      // Only reset when entering a new round's faceoff phase
      if (gamePhase === 'faceoff') {
        const t = setTimeout(() => {
          // Replace currentAnswers with fresh set from current question
          useFamilyFeudStore.setState({
            currentAnswers: currentQuestion.answers.map((a: { text: string; points: number; revealed: boolean }) => ({ ...a, revealed: false })),
            roundScore: 0,
            strikes: 0,
            hintsUsedThisRound: 0,
          });
          // Start round timer if enabled
          if (s.roundTimerDuration > 0) {
            setRoundTimeLeft(s.roundTimerDuration);
            setRoundTimerRunning(true);
          }
        }, 0);
        return () => clearTimeout(t);
      }
    }
  }, [round, selectedQuestions, totalRounds, gamePhase, currentQuestion, setRoundTimeLeft, setRoundTimerRunning, s.roundTimerDuration]);

  if (!currentQuestion && gamePhase !== 'fast_money' && gamePhase !== 'game_over') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9fc4b4', height: '100%' }}>
        جاري تحميل الأسئلة...
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="tobol-setup-root"
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        background: 'url(/battle/game_bg.webp) center / cover no-repeat, #041F18',
        display: 'flex',
        flexDirection: 'column',
        padding: '6px 8px 100px',
        gap: '6px',
        overflowY: 'auto',
      }}
    >
      {/* ══════════ أيقونات الهيدر ══════════ */}
      <div className="tobol-header-actions" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" className={`tobol-header-btn ${musicOn ? 'active' : ''}`} onClick={toggleMusic} aria-label="sound">
            <img src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'} alt="sound" />
          </button>
          <button type="button" className="tobol-header-btn" onClick={() => setShowChat(true)} aria-label="chat">
            <img src="/battle/icon_chat.webp" alt="chat" />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {isDiwaniyaHost && (
            <button type="button" className="tobol-eye-btn" onClick={() => setShowViewers(true)} aria-label="viewers">
              <img src="/battle/icon_viewers.webp" alt="viewers" />
              <span className="tobol-eye-count">{viewerCount}</span>
            </button>
          )}
          <button type="button" className="tobol-header-btn" onClick={() => setShowExitDialog(true)} aria-label="exit">
            <img src="/battle/btn_exit.webp" alt="exit" />
          </button>
        </div>
      </div>

      {/* ══════════ العنوان + النقاط ══════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '24px' }}>🏆👨‍👩‍👧‍👦</div>
          <h1 style={{ ...STROKE_STYLE, fontSize: '14px', fontWeight: 900, lineHeight: 1 }}>فاميلي فيود</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div className="tobol-team-panel-compact team-red active-turn" style={{ flex: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team1Emoji} {team1Name}
            </span>
            <motion.span key={team1Score} initial={{ scale: 1.5 }} animate={{ scale: 1 }} style={{ fontSize: '20px', fontWeight: 900, color: '#fde68a' }}>
              {team1Score}
            </motion.span>
          </div>

          <div className="tobol-vs-badge" style={{ width: '32px', height: '32px' }}>
            <img src="/battle/vs_pk.webp" alt="VS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div className="tobol-team-panel-compact team-blue active-turn" style={{ flex: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f43f5e', maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team2Emoji} {team2Name}
            </span>
            <motion.span key={team2Score} initial={{ scale: 1.5 }} animate={{ scale: 1 }} style={{ fontSize: '20px', fontWeight: 900, color: '#fda4af' }}>
              {team2Score}
            </motion.span>
          </div>
        </div>

        <button type="button" className="tobol-log-btn" onClick={() => setShowBattleLog(true)} aria-label="log">
          <img src="/battle/icon_log.webp" alt="log" />
          <span className="log-count">{roundHistory.length}</span>
        </button>
      </div>

      {/* ══════════ شريط الجولة ══════════ */}
      <div style={{ width: '100%', maxWidth: '480px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#9fc4b4', fontWeight: 700 }}>
          الجولة {round}/{totalRounds}
        </span>
        <div style={{ flex: 1, height: '6px', background: 'rgba(0,0,0,.4)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(254,239,145,.2)' }}>
          <motion.div
            style={{ height: '100%', background: 'linear-gradient(90deg, #fbbf24, #f43f5e)', borderRadius: '6px' }}
            initial={{ width: 0 }}
            animate={{ width: `${(round / totalRounds) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {roundTimerRunning && (
          <motion.div
            initial={{ scale: 0.8 }} animate={{ scale: 1 }}
            style={{
              padding: '2px 8px', borderRadius: '8px',
              border: `1px solid ${roundTimeLeft <= 5 ? 'rgba(239,68,68,.5)' : 'rgba(251,191,36,.5)'}`,
              background: roundTimeLeft <= 5 ? 'rgba(239,68,68,.15)' : 'rgba(251,191,36,.15)',
              color: roundTimeLeft <= 5 ? '#f87171' : '#fbbf24',
              fontSize: '11px', fontWeight: 900,
            }}
          >
            ⏱️ {roundTimeLeft}
          </motion.div>
        )}
      </div>

      {/* ══════════ لوحة الإشعار ══════════ */}
      <div className={`tobol-board-notice-v3 ${gamePhase === 'steal' ? 'trap' : 'attack'}`} style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <span className="tobol-notice-dot" />
        <span style={{ fontSize: '13px' }}>{gamePhase === 'steal' ? '⚡' : gamePhase === 'faceoff' ? '⚔️' : '👑'}</span>
        <span>
          {gamePhase === 'steal'
            ? `فرصة السرقة لفريق ${currentTeam === 1 ? team2Name : team1Name}!`
            : gamePhase === 'faceoff'
              ? `المواجهة — اختر الفريق الذي يبدأ الجولة ${round}`
              : `الفريق ${currentTeam === 1 ? team1Name : team2Name} يلعب الآن — اضغط على الإجابات لكشفها`}
        </span>
      </div>

      {/* ══════════ منطقة اللعب (تختلف حسب الطور) ══════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '480px', margin: '0 auto', width: '100%' }}>
        <AnimatePresence mode="wait">
          {/* FACEOFF PHASE */}
          {gamePhase === 'faceoff' && currentQuestion && (
            <motion.div
              key={`faceoff-${round}`}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}
            >
              {/* Question card */}
              <div style={{
                padding: '12px 14px', borderRadius: '14px',
                background: 'linear-gradient(180deg, rgba(120,53,15,.85), rgba(2,12,18,.85))',
                border: '1.5px solid rgba(251,191,36,.4)', boxShadow: '0 6px 18px rgba(0,0,0,.45)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '18px' }}>⚔️</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>المواجهة</span>
                </div>
                <p style={{ color: '#fde68a', fontSize: '15px', fontWeight: 700, textAlign: 'center', lineHeight: 1.5 }}>
                  {currentQuestion.question}
                </p>
              </div>

              {/* Faceoff answers preview (top 3 hidden) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {currentAnswers.slice(0, 4).map((a, i) => (
                  <div key={i} style={{
                    padding: '10px', borderRadius: '10px',
                    background: a.revealed ? 'rgba(251,191,36,.15)' : 'rgba(0,0,0,.4)',
                    border: `1px solid ${a.revealed ? 'rgba(251,191,36,.5)' : 'rgba(255,255,255,.1)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: a.revealed ? '#fde68a' : '#6b7280' }}>
                      {a.revealed ? a.text : `#${i + 1}`}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#fbbf24' }}>{a.points}</span>
                  </div>
                ))}
              </div>

              {/* Team choice buttons */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                <p style={{ textAlign: 'center', color: '#9fc4b4', fontSize: '11px', fontWeight: 600 }}>
                  العِراب: اضغط الفريق الذي أجاب أولاً
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => onFaceOffStart(1)}
                    style={{
                      padding: '14px', borderRadius: '12px', border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245,158,11,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >{team1Emoji} {team1Name} يبدأ</motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => onFaceOffStart(2)}
                    style={{
                      padding: '14px', borderRadius: '12px', border: 'none',
                      background: 'linear-gradient(135deg, #e11d48, #be123c)',
                      color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(225,29,72,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >{team2Emoji} {team2Name} يبدأ</motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* GAMEBOARD / STEAL PHASE */}
          {(gamePhase === 'gameboard' || gamePhase === 'steal') && currentQuestion && (
            <motion.div
              key={`board-${round}-${gamePhase}`}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}
            >
              {/* Question */}
              <div style={{
                padding: '8px 12px', borderRadius: '10px',
                background: 'linear-gradient(180deg, rgba(120,53,15,.85), rgba(2,12,18,.85))',
                border: '1px solid rgba(251,191,36,.4)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{getQuestionCategory(currentQuestion).icon}</span>
                    <span style={{ fontSize: '10px', color: '#9fc4b4' }}>{getQuestionCategory(currentQuestion).label}</span>
                  </div>
                  {currentQuestion.difficulty && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '6px',
                      ...getDifficultyInfoStyle(currentQuestion.difficulty),
                    }}>
                      {getDifficultyInfo(currentQuestion.difficulty).icon} {getDifficultyInfo(currentQuestion.difficulty).label}
                    </span>
                  )}
                </div>
                <p style={{ color: '#fde68a', fontSize: '14px', fontWeight: 700, textAlign: 'center', marginTop: '4px', lineHeight: 1.4 }}>
                  {currentQuestion.question}
                </p>
              </div>

              {/* Answer slots grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', flex: 1, overflow: 'hidden' }}>
                {currentAnswers.map((a, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => !a.revealed && onReveal(i)}
                    disabled={a.revealed}
                    style={{
                      padding: '10px', borderRadius: '10px', cursor: a.revealed ? 'default' : 'pointer',
                      background: a.revealed
                        ? 'linear-gradient(135deg, rgba(251,191,36,.25), rgba(245,158,11,.15))'
                        : 'linear-gradient(135deg, rgba(15,23,42,.85), rgba(2,12,18,.85))',
                      border: `1.5px solid ${a.revealed ? 'rgba(251,191,36,.55)' : 'rgba(255,255,255,.12)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
                      boxShadow: a.revealed ? '0 0 10px rgba(251,191,36,.25)' : 'none',
                      transition: 'all .15s',
                    }}
                  >
                    <span style={{
                      fontSize: '13px', fontWeight: 700,
                      color: a.revealed ? '#fde68a' : '#6b7280',
                      flex: 1, textAlign: 'right',
                    }}>
                      {a.revealed ? a.text : `#${i + 1}`}
                    </span>
                    {a.revealed && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        style={{
                          fontSize: '14px', fontWeight: 900, color: '#fbbf24',
                          background: 'rgba(0,0,0,.4)', padding: '2px 6px', borderRadius: '6px',
                        }}
                      >{a.points}</motion.span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Strike marks */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={strikes > i ? { scale: [0.5, 1.2, 1], rotate: [0, -10, 10, 0] } : { scale: 1, rotate: 0 }}
                    style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: strikes > i ? 'rgba(244,63,94,.25)' : 'rgba(0,0,0,.3)',
                      border: `1.5px solid ${strikes > i ? 'rgba(244,63,94,.7)' : 'rgba(255,255,255,.1)'}`,
                      fontSize: '16px', fontWeight: 900,
                      color: strikes > i ? '#f87171' : '#4b5563',
                    }}
                  >{strikes > i ? '✗' : i + 1}</motion.div>
                ))}
                <span style={{ fontSize: '11px', color: '#9fc4b4', fontWeight: 700, marginInlineStart: '6px' }}>
                  {strikes}/3 ضربات
                </span>
              </div>

              {/* Action buttons row */}
              {gamePhase === 'gameboard' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onStrike}
                    style={{
                      padding: '10px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                      color: '#fff', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}
                  >✗ ضربة</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onPassToOtherTeam}
                    style={{
                      padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)',
                      background: 'rgba(100,100,100,.3)',
                      color: '#cbd5e1', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}
                  >↔ تمرير</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onHint} disabled={hintsUsedThisRound >= 2}
                    style={{
                      padding: '10px', borderRadius: '10px', border: '1px solid rgba(251,191,36,.4)',
                      background: hintsUsedThisRound >= 2 ? 'rgba(100,100,100,.3)' : 'rgba(251,191,36,.15)',
                      color: hintsUsedThisRound >= 2 ? '#4b5563' : '#fbbf24',
                      fontSize: '12px', fontWeight: 700,
                      cursor: hintsUsedThisRound >= 2 ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}
                  >💡 تلميح ({2 - hintsUsedThisRound})</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onSkipQuestion}
                    style={{
                      padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,.12)',
                      background: 'rgba(100,100,100,.3)',
                      color: '#cbd5e1', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}
                  >⏭️ تخطي</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onRevealAll}
                    style={{
                      gridColumn: '1 / -1', padding: '10px', borderRadius: '10px', border: '1px solid rgba(251,191,36,.4)',
                      background: 'rgba(251,191,36,.15)',
                      color: '#fbbf24', fontSize: '12px', fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    }}
                  >👁️ كشف الكل (نقاط الجولة: {roundScore})</motion.button>
                </div>
              ) : (
                /* STEAL PHASE — show steal/no-steal buttons */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onSteal}
                    style={{
                      padding: '14px', borderRadius: '12px', border: 'none',
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(22,163,74,.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >✅ سرقة ناجحة</motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onNoSteal}
                    style={{
                      padding: '14px', borderRadius: '12px', border: '1px solid rgba(244,63,94,.4)',
                      background: 'rgba(244,63,94,.15)',
                      color: '#fda4af', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >❌ فشل السرقة</motion.button>
                </div>
              )}

              {/* Next round button (when all revealed) */}
              {gamePhase === 'gameboard' && currentAnswers.every((a) => a.revealed) && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    playCorrect();
                    useFamilyFeudStore.getState().handleAwardAndNextRound();
                  }}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '12px', borderRadius: '10px', border: 'none',
                    background: round >= totalRounds
                      ? 'linear-gradient(135deg, #f59e0b, #eab308)'
                      : 'linear-gradient(135deg, #f59e0b, #dc2626)',
                    color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245,158,11,.3)',
                  }}
                >{round >= totalRounds ? '💰 جولة المال السريع ←' : 'الجولة التالية ←'}</motion.button>
              )}
            </motion.div>
          )}

          {/* FAST MONEY PHASE */}
          {gamePhase === 'fast_money' && (
            <motion.div
              key="fast-money"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}
            >
              {/* Fast money phase label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 900, color: '#fbbf24' }}>💰 المال السريع</span>
                {timerRunning && (
                  <motion.div
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    style={{
                      padding: '4px 10px', borderRadius: '8px',
                      background: timeLeft <= 5 ? 'rgba(239,68,68,.2)' : 'rgba(251,191,36,.15)',
                      border: `1px solid ${timeLeft <= 5 ? 'rgba(239,68,68,.5)' : 'rgba(251,191,36,.5)'}`,
                      color: timeLeft <= 5 ? '#f87171' : '#fbbf24', fontSize: '13px', fontWeight: 900,
                    }}
                  >⏱️ {timeLeft}</motion.div>
                )}
              </div>

              {fmPhase === 'intro' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '48px' }}>💰</div>
                  <h3 style={{ ...STROKE_STYLE, fontSize: '18px', fontWeight: 900 }}>جولة المال السريع</h3>
                  <p style={{ color: '#9fc4b4', fontSize: '12px', lineHeight: 1.5, maxWidth: '300px' }}>
                    لاعبان من كل فريق يجيبان على 5 أسئلة سريعة. اللاعب الثاني لا يحصل على نقاط للإجابات المكررة مع اللاعب الأول.
                  </p>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setFmPhase('team1'); handleStartTimer(); }}
                    style={{
                      padding: '14px 24px', borderRadius: '12px', border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#fff', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 6px 18px rgba(245,158,11,.35)',
                    }}
                  >ابدأ — {team1Name} {team1Emoji} →</motion.button>
                </div>
              )}

              {(fmPhase === 'team1' || fmPhase === 'team2') && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                  <div style={{
                    padding: '6px 10px', borderRadius: '8px',
                    background: fmPhase === 'team1' ? 'rgba(251,191,36,.15)' : 'rgba(244,63,94,.15)',
                    border: `1px solid ${fmPhase === 'team1' ? 'rgba(251,191,36,.4)' : 'rgba(244,63,94,.4)'}`,
                    color: fmPhase === 'team1' ? '#fbbf24' : '#fda4af', fontSize: '12px', fontWeight: 800,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span>{fmPhase === 'team1' ? `${team1Emoji} ${team1Name}` : `${team2Emoji} ${team2Name}`}</span>
                    <span>{fmPhase === 'team1' ? `النقاط: ${fmScore1}` : `النقاط: ${fmScore2}`}</span>
                  </div>

                  {fmQuestions.map((q, qi) => {
                    const sel = fmPhase === 'team1' ? fmSelected1[qi] : fmSelected2[qi];
                    const revealed = fmPhase === 'team1' ? fmRevealed1[qi] : fmRevealed2[qi];
                    const answerText = fmPhase === 'team1' ? fmAnswers1[qi] : fmAnswers2[qi];
                    return (
                      <div key={qi} style={{
                        padding: '8px 10px', borderRadius: '10px',
                        background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                          <span style={{ fontSize: '12px', color: '#9fc4b4', fontWeight: 700 }}>Q{qi + 1}</span>
                          {revealed && sel !== undefined && (
                            <span style={{ fontSize: '12px', fontWeight: 900, color: '#fbbf24' }}>+{q.answers[sel]?.points || 0}</span>
                          )}
                        </div>
                        <p style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px', marginTop: '2px' }}>{q.question}</p>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {q.answers.map((a, ai) => (
                            <button key={ai}
                              onClick={() => fmPhase === 'team1' ? handleSelectFM1(qi, ai) : handleSelectFM2(qi, ai)}
                              disabled={revealed}
                              style={{
                                padding: '4px 8px', borderRadius: '6px', cursor: revealed ? 'default' : 'pointer',
                                background: sel === ai ? 'rgba(251,191,36,.25)' : 'rgba(255,255,255,.05)',
                                border: `1px solid ${sel === ai ? 'rgba(251,191,36,.5)' : 'rgba(255,255,255,.1)'}`,
                                color: sel === ai ? '#fde68a' : '#9fc4b4',
                                fontSize: '10px', fontWeight: 700,
                              }}
                            >{a.text} ({a.points})</button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={answerText || ''}
                          onChange={(e) => fmPhase === 'team1' ? handleInputFM1(qi, e.target.value) : handleInputFM2(qi, e.target.value)}
                          placeholder="أو اكتب إجابة مخصصة..."
                          disabled={revealed}
                          dir="rtl"
                          style={{
                            width: '100%', marginTop: '4px', padding: '4px 6px', borderRadius: '6px',
                            background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,255,255,.1)',
                            color: '#fff', fontSize: '11px', outline: 'none',
                          }}
                        />
                        {!revealed ? (
                          <button onClick={() => fmPhase === 'team1' ? handleRevealFM1(qi) : handleRevealFM2(qi)}
                            style={{
                              marginTop: '4px', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                              background: 'rgba(34,197,94,.2)', border: '1px solid rgba(34,197,94,.4)',
                              color: '#86efac', fontSize: '10px', fontWeight: 700,
                            }}
                          >👁️ كشف</button>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Next phase button */}
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (fmPhase === 'team1') {
                        setFmPhase('team2');
                        handleStartTimer();
                      } else {
                        setFmPhase('results');
                      }
                    }}
                    style={{
                      padding: '12px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#fff', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                    }}
                  >{fmPhase === 'team1' ? `التالي — ${team2Name} ${team2Emoji} →` : 'النتائج →'}</motion.button>
                </div>
              )}

              {fmPhase === 'results' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
                  <div style={{
                    padding: '10px', borderRadius: '12px',
                    background: 'linear-gradient(180deg, rgba(120,53,15,.85), rgba(2,12,18,.85))',
                    border: '1.5px solid rgba(251,191,36,.4)',
                  }}>
                    <h3 style={{ textAlign: 'center', color: '#fde68a', fontSize: '13px', fontWeight: 800, marginBottom: '8px' }}>
                      💰 نتائج المال السريع
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.2)' }}>
                        <p style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>{team1Name}</p>
                        <p style={{ fontSize: '10px', color: '#9fc4b4' }}>الجولات: {regularRoundScore1}</p>
                        <p style={{ fontSize: '10px', color: '#34d399' }}>المال السريع: +{fmScore1}</p>
                        <p style={{ fontSize: '14px', color: '#fde68a', fontWeight: 900, marginTop: '4px' }}>
                          {regularRoundScore1 + fmScore1}
                        </p>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(244,63,94,.1)', border: '1px solid rgba(244,63,94,.2)' }}>
                        <p style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 700 }}>{team2Name}</p>
                        <p style={{ fontSize: '10px', color: '#9fc4b4' }}>الجولات: {regularRoundScore2}</p>
                        <p style={{ fontSize: '10px', color: '#34d399' }}>المال السريع: +{fmScore2}</p>
                        <p style={{ fontSize: '14px', color: '#fda4af', fontWeight: 900, marginTop: '4px' }}>
                          {regularRoundScore2 + fmScore2}
                        </p>
                      </div>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={onEndGame}
                    style={{
                      padding: '12px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #f59e0b, #eab308)',
                      color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245,158,11,.3)',
                    }}
                  >🏆 إنهاء اللعبة</motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* ══════════ Feedback overlay (correct/wrong) ══════════ */}
      <AnimatePresence>
        {feedback.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              position: 'fixed', bottom: '120px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 200, pointerEvents: 'none',
            }}
          >
            <div style={{
              padding: '10px 16px', borderRadius: '14px',
              background: feedback.correct
                ? 'linear-gradient(135deg, rgba(34,197,94,.95), rgba(22,163,74,.95))'
                : 'linear-gradient(135deg, rgba(239,68,68,.95), rgba(220,38,38,.95))',
              border: `1px solid ${feedback.correct ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.25)'}`,
              color: '#fff', fontSize: '14px', fontWeight: 800, textAlign: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,.4)',
            }}>
              <div style={{ fontSize: '24px', marginBottom: '4px' }}>{feedback.correct ? '✅' : '❌'}</div>
              {feedback.answer || (feedback.correct ? 'صحيح!' : 'خطأ!')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ Round result card ══════════ */}
      <AnimatePresence>
        {showRoundResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
              zIndex: 200, pointerEvents: 'none',
            }}
          >
            <div style={{
              padding: '20px 28px', borderRadius: '18px', textAlign: 'center',
              background: roundResultType === 'steal_success'
                ? 'linear-gradient(135deg, rgba(245,158,11,.95), rgba(220,38,38,.95))'
                : roundResultType === 'steal_fail'
                  ? 'linear-gradient(135deg, rgba(100,116,139,.95), rgba(51,65,85,.95))'
                  : 'linear-gradient(135deg, rgba(245,158,11,.95), rgba(234,179,8,.95))',
              border: '1px solid rgba(255,255,255,.3)',
              color: '#fff', boxShadow: '0 14px 36px rgba(0,0,0,.5)',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>
                {roundResultType === 'steal_success' ? '⚡' : roundResultType === 'steal_fail' ? '🛡️' : '🏆'}
              </div>
              <p style={{ fontSize: '15px', fontWeight: 800, marginBottom: '4px' }}>{roundResultTeamName}</p>
              <p style={{ fontSize: '22px', fontWeight: 900 }}>+{roundResultPoints}</p>
              <p style={{ fontSize: '11px', marginTop: '4px', opacity: 0.85 }}>
                {roundResultType === 'steal_success' ? 'سرقة ناجحة!' : roundResultType === 'steal_fail' ? 'تم الحفاظ على النقاط' : 'الجولة مكتملة'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ 300+ points celebration ══════════ */}
      <AnimatePresence>
        {celebration300.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #d97706, #e11d48, #d97706)',
              borderRadius: '24px', padding: '32px 40px', textAlign: 'center',
              border: '2px solid rgba(254,239,145,.5)',
              boxShadow: '0 20px 60px rgba(245,158,11,.5)',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🏆</div>
              <p style={{ fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>{celebration300.teamName}</p>
              <p style={{ fontSize: '18px', fontWeight: 800, color: '#fde68a' }}>وصل لـ 300 نقطة!</p>
              <div style={{ fontSize: '28px', marginTop: '8px' }}>🎉✨🎊</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ Streak indicator ══════════ */}
      <AnimatePresence>
        {revealStreak >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400 }}
            style={{
              position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 150, pointerEvents: 'none',
            }}
          >
            <div style={{
              padding: '6px 14px', borderRadius: '999px',
              background: 'linear-gradient(135deg, #f59e0b, #e11d48)',
              border: '1px solid rgba(254,239,145,.4)',
              color: '#fff', fontSize: '13px', fontWeight: 900,
              boxShadow: '0 4px 12px rgba(245,158,11,.35)',
            }}>🔥 ×{revealStreak}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ Score change animation ══════════ */}
      <AnimatePresence>
        {scoreAnimation.visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 100, pointerEvents: 'none',
            }}
          >
            <div style={{
              padding: '12px 20px', borderRadius: '14px',
              background: scoreAnimation.team === 1
                ? 'rgba(251,191,36,.2)'
                : 'rgba(244,63,94,.2)',
              border: `1px solid ${scoreAnimation.team === 1 ? 'rgba(251,191,36,.4)' : 'rgba(244,63,94,.4)'}`,
              color: scoreAnimation.team === 1 ? '#fde68a' : '#fda4af',
              fontSize: '20px', fontWeight: 900, backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 24px rgba(0,0,0,.4)',
            }}>+{scoreAnimation.points} نقاط</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ حوار الخروج ══════════ */}
      <AnimatePresence>
        {showExitDialog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowExitDialog(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(180deg, #0e2a22, #061812)',
                border: '1.5px solid rgba(254,239,145,.25)',
                borderRadius: '18px', padding: '20px',
                width: '100%', maxWidth: '300px', textAlign: 'center',
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
                  style={{ flex: 1, padding: '10px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,.12)', background: 'rgba(80,80,80,.3)',
                    color: '#cbd5e1', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >إلغاء</button>
                <button onClick={() => { handleReset(); router.push('/'); }}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(220,38,38,.35)' }}
                >نعم، اخرج</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ سجل المعركة ══════════ */}
      <AnimatePresence>
        {showBattleLog && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowBattleLog(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-log-modal"
              style={{ width: '100%', maxWidth: '360px' }}
            >
              <div className="tobol-log-modal-header">
                <h3 className="tobol-log-modal-title">📜 سجل الجولات</h3>
                <button onClick={() => setShowBattleLog(false)} style={{ background: 'none', border: 'none', color: '#9fc4b4', fontSize: '20px', cursor: 'pointer' }}>✕</button>
              </div>
              <div className="tobol-log-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {roundHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#6b7280', fontSize: '13px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>📜</div>
                    لا توجد جولات بعد
                  </div>
                ) : (
                  [...roundHistory].reverse().map((entry) => (
                    <div key={`${entry.round}-${entry.team}-${entry.type}`} style={{
                      padding: '8px 10px', marginBottom: '4px',
                      borderRadius: '8px', border: '1px solid rgba(255,255,255,.08)',
                      background: entry.team === 1 ? 'rgba(251,191,36,.08)' : 'rgba(244,63,94,.08)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ fontSize: '14px' }}>{entry.team === 1 ? '👑' : '🏛️'}</span>
                      <span style={{ fontSize: '11px', color: '#9fc4b4', fontWeight: 700 }}>الجولة {entry.round}</span>
                      <span style={{ fontSize: '11px', color: '#cbd5e1', flex: 1 }}>
                        {entry.team === 1 ? team1Name : team2Name} — {entry.type}
                      </span>
                      <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 900 }}>+{entry.points}</span>
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowChat(false); setShowEmojiPicker(false); }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(2px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
            }}
          >
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowViewers(false)}
            className="tobol-viewers-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 16 }}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getDifficultyInfoStyle(diff: 'easy' | 'medium' | 'hard'): React.CSSProperties {
  switch (diff) {
    case 'easy': return { background: 'rgba(34,197,94,.15)', color: '#86efac' };
    case 'medium': return { background: 'rgba(251,191,36,.15)', color: '#fde68a' };
    case 'hard': return { background: 'rgba(244,63,94,.15)', color: '#fda4af' };
  }
}
