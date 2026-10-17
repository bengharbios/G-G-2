'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSpotDiffStore } from '@/lib/spotdiff-store';
import { DIFFICULTY_CONFIG, FLASHI_CATEGORY_LABELS, FLASHI_HIT_RADIUS_VMIN } from '@/lib/spotdiff-types';
import type { FlashiCategory } from '@/lib/flashi_images';
import {
  isMusicEnabled,
  setMusicEnabled,
  isSoundEnabled,
  setSoundEnabled,
  playClickSound,
  playCorrectSound,
  playWrongSound,
} from '@/lib/sounds';
import '@/styles/flashi-spotdiff.css';

// G-G gold stroke text style (from yalla ludo styles.xml — kept for quit dialog title)
const STROKE_STYLE: React.CSSProperties = {
  color: '#feef91',
  paintOrder: 'stroke fill',
  WebkitTextStroke: '1px #aa6e1f',
};

interface MissMarker {
  id: number;
  topVmin: number;
  leftVmin: number;
}

interface ClickFeedbackItem {
  id: number;
  kind: 'hit' | 'miss';
  topVmin: number;
  leftVmin: number;
}

interface ChatMsg {
  id: number;
  sender: string;
  text: string;
}

const EMOJIS = ['😀', '😂', '😍', '😎', '🤔', '😢', '😡', '👍', '👏', '🙏', '🔥', '🎯', '🔍', '💡', '⭐', '✓', '✗', '🏆', '🎉', '💯', '❤️', '🖼️', '👀', '⏱️'];

// Helper: get current vmin in pixels
function vminPx(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.innerWidth, window.innerHeight) / 100;
}

// ============================================================
// Click feedback floating text (✓ hit, ✗ miss)
// ============================================================
function ClickFeedback({ item, onDone }: { item: ClickFeedbackItem; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      key={item.id}
      initial={{ opacity: 1, scale: 0.6, y: 0 }}
      animate={{ opacity: 0, scale: 1.4, y: -30 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      className={`flashi-click-feedback ${item.kind}`}
      style={{
        top: `${item.topVmin}vmin`,
        left: `${item.leftVmin}vmin`,
        fontSize: '5vmin',
        position: 'absolute',
      }}
    >
      {item.kind === 'hit' ? '✓ +100' : '✗'}
    </motion.div>
  );
}

// ============================================================
// Header chat button — uses G-G tobol-* chat panel but flashi-styled trigger
// ============================================================
function HeaderChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [unread, setUnread] = useState(0);
  const [showEmojis, setShowEmojis] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setShowEmojis(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && msgEndRef.current) {
      msgEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg: ChatMsg = { id: Date.now(), sender: 'لاعب', text };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setShowEmojis(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setInput(prev => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <>
      <button
        type="button"
        className="flashi-header-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="دردشة الطاولة"
        title="دردشة الطاولة"
        style={{ position: 'relative' }}
      >
        <img src="/battle/icon_chat.webp" alt="chat" />
        {unread > 0 && <span className="chat-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="tobol-chat-panel-overlay"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="tobol-chat-panel"
            >
              <div className="tobol-chat-panel-header">
                <span className="tobol-chat-panel-title">
                  <img src="/battle/icon_chat.webp" alt="" style={{ width: '16px', height: '16px' }} />
                  دردشة الطاولة
                </span>
                <button onClick={() => setIsOpen(false)} className="tobol-chat-panel-close" aria-label="إغلاق">×</button>
              </div>
              <div className="tobol-chat-panel-body">
                {messages.length === 0 ? (
                  <p className="tobol-chat-empty">
                    لا رسائل بعد — أرسل أول رسالة.
                    <br />
                    (الدردشة مؤقتة، تُحذف عند إغلاق اللعبة)
                  </p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="tobol-chat-msg me">
                      <span className="msg-sender">{m.sender}</span>
                      <span className="msg-bubble">{m.text}</span>
                    </div>
                  ))
                )}
                <div ref={msgEndRef} />
              </div>
              <AnimatePresence>
                {showEmojis && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="tobol-emoji-picker">
                      {EMOJIS.map((e, i) => (
                        <button key={i} type="button" onClick={() => handleEmojiClick(e)} aria-label={`emoji ${e}`}>{e}</button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="tobol-chat-panel-input-row">
                <button
                  type="button"
                  className="tobol-emoji-btn"
                  onClick={() => setShowEmojis(p => !p)}
                  aria-label="إيموجي"
                  title="إيموجي"
                >
                  <img src="/battle/icon_chat_emoji.webp" alt="emoji" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  placeholder="أرسل رسالة..."
                  maxLength={200}
                  dir="rtl"
                />
                <button onClick={handleSend} disabled={!input.trim()}>إرسال</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════
// MAIN GAME BOARD — Flashi.me + G-G style hybrid
// Single component, no legacy Tobol fallback (per user instruction:
// 'لا تدمج الكود في الكود القديم').
// ════════════════════════════════════════════════════════════════════════
export default function GameBoard() {
  const router = useRouter();
  const {
    phase, currentRound, currentRoundData,
    foundDifferences, differences, score, timeLeft, totalRounds,
    totalFound, totalDifferences, findDifference, registerMiss,
    tickTimer, resetGame, difficulty,
    flashiCatalog, flashiCategory, setFlashiCategory,
    loadFlashiCatalog,
  } = useSpotDiffStore();

  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [feedbacks, setFeedbacks] = useState<ClickFeedbackItem[]>([]);
  const [misses, setMisses] = useState<MissMarker[]>([]);
  const nextFeedbackId = useRef(0);
  const nextMissId = useRef(0);
  const circleDivRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Load flashi catalog on mount if not loaded
  useEffect(() => {
    loadFlashiCatalog();
  }, [loadFlashiCatalog]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('in-game-setup');
    return () => {
      document.body.classList.remove('in-game-setup');
    };
  }, []);

  useEffect(() => {
    setMusicOn(isMusicEnabled());
    setSoundOn(isSoundEnabled());
  }, []);

  // Timer tick
  useEffect(() => {
    if (phase !== 'playing') return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, tickTimer]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  };

  const handleQuitGame = () => {
    resetGame();
    router.push('/spotdiff');
  };

  // ─── Click handler: convert pixel coords → vmin, then check hit ──────────
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!currentRoundData || !currentRoundData.flashiDiffs) return;
    const img = imgRef.current;
    if (!img) return;
    // circleDiv is the positioning reference (like flashi)
    const cdiv = circleDivRef.current;
    if (!cdiv) return;
    const rect = cdiv.getBoundingClientRect();
    const vmin = vminPx();
    const clickTopVmin = (e.clientY - rect.top) / vmin;
    const clickLeftVmin = (e.clientX - rect.left) / vmin;
    const imageShift = currentRoundData.imageShift ?? 53.5;

    // Check against each unfound difference — click must be on the B-side marker
    // (top + imageShift, same left)
    let hitIdx = -1;
    for (let i = 0; i < currentRoundData.flashiDiffs.length; i++) {
      const d = currentRoundData.flashiDiffs[i];
      const bTop = d.topVmin + imageShift;
      const bLeft = d.leftVmin;
      const distSq = (clickTopVmin - bTop) ** 2 + (clickLeftVmin - bLeft) ** 2;
      if (Math.sqrt(distSq) <= FLASHI_HIT_RADIUS_VMIN) {
        // Check not already found
        const diffId = `flashi-diff-${currentRound}-${i}`;
        if (!foundDifferences.includes(diffId)) {
          hitIdx = i;
          break;
        }
      }
    }

    const fbId = nextFeedbackId.current++;
    if (hitIdx >= 0) {
      const diffId = `flashi-diff-${currentRound}-${hitIdx}`;
      const d = currentRoundData.flashiDiffs[hitIdx];
      const ok = findDifference(diffId);
      if (ok) {
        if (soundOn) playCorrectSound();
        setFeedbacks(prev => [...prev, {
          id: fbId,
          kind: 'hit',
          topVmin: d.topVmin + imageShift,
          leftVmin: d.leftVmin,
        }]);
      }
    } else {
      if (soundOn) playWrongSound();
      registerMiss();
      const missId = nextMissId.current++;
      setMisses(prev => [...prev, { id: missId, topVmin: clickTopVmin, leftVmin: clickLeftVmin }]);
      setFeedbacks(prev => [...prev, {
        id: fbId,
        kind: 'miss',
        topVmin: clickTopVmin,
        leftVmin: clickLeftVmin,
      }]);
      setTimeout(() => {
        setMisses(prev => prev.filter(m => m.id !== missId));
      }, 1500);
    }
  };

  // ─── Loading state while catalog is being fetched ─────────────────────
  if (!currentRoundData) {
    return (
      <div className="flashi-game-root" dir="rtl">
        <div className="flashi-loading">
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🔍</div>
          <p>جاري تحميل الجولة...</p>
          {!flashiCatalog && <p style={{ fontSize: '2vmin', marginTop: '8px' }}>تحميل مكتبة 7005 صورة...</p>}
        </div>
      </div>
    );
  }

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const foundCount = foundDifferences.length;
  const totalForRound = currentRoundData.differences.length;
  const remainingDiffs = Math.max(0, totalForRound - foundCount);
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerDisplay = `${mins}:${String(secs).padStart(2, '0')}`;
  const imageShift = currentRoundData.imageShift ?? 53.5;

  // Build list of (found, topVmin, leftVmin) for each diff, for B-side markers
  const diffMarkers = useMemo(() => {
    if (!currentRoundData.flashiDiffs) return [];
    return currentRoundData.flashiDiffs.map((d, i) => {
      const diffId = `flashi-diff-${currentRound}-${i}`;
      return {
        id: diffId,
        idx: i,
        found: foundDifferences.includes(diffId),
        topVmin: d.topVmin + imageShift,
        leftVmin: d.leftVmin,
      };
    });
  }, [currentRoundData, foundDifferences, currentRound, imageShift]);

  return (
    <div className="flashi-game-root" dir="rtl">
      {/* ══════════ Header actions (sound / chat / quit) ══════════ */}
      <div className="flashi-header-actions">
        <button
          type="button"
          className="flashi-header-btn"
          onClick={toggleMusic}
          aria-label={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          title={musicOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          style={musicOn ? {} : { opacity: 0.5 }}
        >
          <img
            src={musicOn ? '/battle/icon_sound_on.webp' : '/battle/icon_sound_off.webp'}
            alt="sound"
          />
        </button>
        <HeaderChatButton />
        <button
          type="button"
          className="flashi-header-btn"
          onClick={() => setShowQuitDialog(true)}
          aria-label="إنهاء اللعبة بدون حفظ"
          title="إنهاء اللعبة بدون حفظ"
        >
          <img src="/battle/btn_quit_game.webp" alt="quit" />
        </button>
      </div>

      <div className="flashi-game-div">
        {/* ══════════ Logo / Title (animated rainbow announcement) ══════════ */}
        <table className="flashi-logo-table" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td>
                <span className="flashi-announcement">لعبة اختلاف الصور</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══════════ Settings Table ══════════ */}
        <table className="flashi-settings-table" cellPadding={0} cellSpacing={0}>
          <tbody>
            {/* Row 1: diff counter | "الأسرع" | fastest select | "الوقت" | timer select | timer */}
            <tr>
              <td className="flashi-timer" id="diffNum">{remainingDiffs}</td>
              <td className="flashi-title">الأسرع</td>
              <td>
                <select className="flashi-select" defaultValue="لا" aria-label="الأسرع">
                  <option>نعم</option>
                  <option>لا</option>
                </select>
              </td>
              <td className="flashi-title">الوقت</td>
              <td>
                <select className="flashi-select" defaultValue="دقيقة" aria-label="الوقت">
                  <option>15 ثانية</option>
                  <option>30 ثانية</option>
                  <option>45 ثانية</option>
                  <option>دقيقة</option>
                  <option>دقيقة ونصف</option>
                  <option>دقيقتان</option>
                  <option>دقيقتان ونصف</option>
                  <option>3 دقائق</option>
                  <option>4 دقائق</option>
                  <option>5 دقائق</option>
                </select>
              </td>
              <td className="flashi-timer" id="timer">{timerDisplay}</td>
            </tr>
            {/* Row 2: "نوع الصور" | type select | "عدد الأخطاء" | wrong select */}
            <tr>
              <td className="flashi-title" colSpan={3}>نوع الصور</td>
              <td colSpan={3}>
                <select
                  className="flashi-select"
                  value={flashiCategory}
                  onChange={(e) => setFlashiCategory(e.target.value as FlashiCategory | 'random')}
                  aria-label="نوع الصور"
                >
                  {Object.entries(FLASHI_CATEGORY_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="flashi-title" colSpan={3}>عدد الأخطاء</td>
              <td colSpan={3}>
                <select className="flashi-select" value={totalForRound} readOnly aria-label="عدد الأخطاء">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </td>
            </tr>
            {/* Row 3: 4 action buttons (flashi color palette) */}
            <tr>
              <td
                className="flashi-btn flashi-btn-new"
                colSpan={5}
                onClick={() => {
                  if (soundOn) playClickSound();
                  // Reload page to get a new image (flashi-style "صورة جديدة")
                  window.location.reload();
                }}
              >
                صورة جديدة
              </td>
              <td
                className="flashi-btn flashi-btn-start"
                colSpan={5}
                onClick={() => {
                  if (soundOn) playClickSound();
                  router.push('/spotdiff');
                }}
              >
                بدء اللعبة
              </td>
              <td
                className="flashi-btn flashi-btn-answers"
                colSpan={5}
                onClick={() => {
                  if (soundOn) playClickSound();
                  setShowAnswers(s => !s);
                }}
              >
                {showAnswers ? 'إخفاء الأجوبة' : 'إظهار الأجوبة'}
              </td>
              <td
                className="flashi-btn flashi-btn-score"
                colSpan={6}
                onClick={() => {
                  if (soundOn) playClickSound();
                  setShowScore(s => !s);
                }}
              >
                {showScore ? 'إخفاء السكور' : 'إظهار السكور'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══════════ Round pill (G-G style) ══════════ */}
        <div style={{ textAlign: 'center' }}>
          <span className="flashi-round-pill">
            <span>🖼️</span>
            <span>{currentRoundData.title}</span>
            <span style={{ color: '#86efac' }}>
              {foundCount}/{totalForRound}
            </span>
            <span style={{ color: '#9fc4b4', fontSize: '2.4vmin' }}>
              • جولة {currentRound + 1}/{totalRounds}
            </span>
            {flashiCatalog && (
              <span style={{ color: '#fbbf24', fontSize: '2vmin' }}>
                • {flashiCatalog.length.toLocaleString('en')} صورة
              </span>
            )}
          </span>
        </div>

        {/* ══════════ Game Image Area ══════════ */}
        <table className="flashi-game-table" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              <td>
                {/* circleDiv = relative container, image inside, circles overlaid */}
                <div ref={circleDivRef} className="flashi-circle-div">
                  {/* The single flashi image (A stacked above B) */}
                  <img
                    ref={imgRef}
                    src={currentRoundData.imageUrl || currentRoundData.imageA}
                    alt="اختلاف الصور — اضغط على الفروقات"
                    draggable={false}
                    onClick={handleImageClick}
                    className="flashi-puzz-img"
                  />

                  {/* B-side circle markers — visible when found OR when answers shown */}
                  {diffMarkers.map((m) => (
                    (m.found || showAnswers) && (
                      <motion.div
                        key={m.id + (m.found ? '-found' : '-answer')}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', bounce: 0.4 }}
                        className="flashi-circle-img shown"
                        style={{
                          top: `${m.topVmin}vmin`,
                          left: `${m.leftVmin}vmin`,
                          width: '9.5vmin',
                          height: '9.5vmin',
                          border: m.found ? '3px solid #22c55e' : '3px solid #fbbf24',
                          borderRadius: '50%',
                          background: m.found
                            ? 'rgba(34,197,94,.18)'
                            : 'rgba(251,191,36,.15)',
                          boxShadow: m.found
                            ? '0 0 12px rgba(34,197,94,.6)'
                            : '0 0 12px rgba(251,191,36,.5)',
                        }}
                      />
                    )
                  ))}

                  {/* A-side circle markers (faint outline for visual reference when answers shown) */}
                  {showAnswers && currentRoundData.flashiDiffs?.map((d, i) => (
                    <motion.div
                      key={`a-marker-${i}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.5 }}
                      transition={{ type: 'spring', bounce: 0.4 }}
                      className="flashi-circle-img shown"
                      style={{
                        top: `${d.topVmin}vmin`,
                        left: `${d.leftVmin}vmin`,
                        width: '9.5vmin',
                        height: '9.5vmin',
                        border: '2px dashed rgba(251,191,36,0.5)',
                        borderRadius: '50%',
                        background: 'transparent',
                      }}
                    />
                  ))}

                  {/* Miss markers (red X) */}
                  {misses.map(m => (
                    <motion.div
                      key={m.id}
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 1, opacity: 0.4 }}
                      transition={{ duration: 0.3 }}
                      className="flashi-miss-marker"
                      style={{
                        top: `${m.topVmin}vmin`,
                        left: `${m.leftVmin}vmin`,
                      }}
                    >✗</motion.div>
                  ))}

                  {/* Click feedback floating text */}
                  {feedbacks.map(fb => (
                    <ClickFeedback
                      key={fb.id}
                      item={fb}
                      onDone={() => setFeedbacks(prev => prev.filter(f => f.id !== fb.id))}
                    />
                  ))}

                  {/* B-side label badge */}
                  <div style={{
                    position: 'absolute',
                    top: `${imageShift + 1}vmin`,
                    right: '5%',
                    background: 'rgba(0,3,9,.7)',
                    color: '#ffdd00',
                    fontSize: '2.4vmin',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'ltBukraBold, Noto Sans Arabic, sans-serif',
                    zIndex: 12,
                  }}>B — اضغط هنا</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ══════════ Score Table (toggleable) ══════════ */}
        <AnimatePresence>
          {showScore && (
            <motion.table
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flashi-score-table"
              cellPadding={0}
              cellSpacing={0}
            >
              <tbody>
                <tr>
                  <td>النقاط</td>
                  <td>{score}</td>
                </tr>
                <tr>
                  <td>الفروق المكتشفة</td>
                  <td>{foundCount}/{totalForRound}</td>
                </tr>
                <tr>
                  <td>إجمالي الفروق</td>
                  <td>{totalFound}/{totalDifferences}</td>
                </tr>
                <tr>
                  <td>الصعوبة</td>
                  <td>{cfg.label}</td>
                </tr>
                <tr>
                  <td>الجولة</td>
                  <td>{currentRound + 1}/{totalRounds}</td>
                </tr>
              </tbody>
            </motion.table>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════ Quit dialog (G-G Tobol style) ══════════ */}
      <AnimatePresence>
        {showQuitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQuitDialog(false)}
            className="flashi-quit-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 16 }}
              transition={{ type: 'spring', bounce: 0.32 }}
              onClick={(e) => e.stopPropagation()}
              className="flashi-quit-dialog"
            >
              <div style={{ fontSize: '38px', marginBottom: '6px' }}>🚪</div>
              <h3 style={{ ...STROKE_STYLE, fontSize: '17px', fontWeight: 900, marginBottom: '6px' }}>
                إنهاء اللعبة؟
              </h3>
              <p>
                نقاطك: {score} — سيتم إعادة تعيين اللعبة.
              </p>
              <div className="actions">
                <button
                  onClick={() => setShowQuitDialog(false)}
                  className="cancel"
                >إلغاء</button>
                <button
                  onClick={handleQuitGame}
                  className="quit"
                >نعم، اخرج</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
