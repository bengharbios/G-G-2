// ===== محرك اللودو — سيرفل موثوق (Authoritative) =====
// رقعة 15×15، حلقة 52 خلية، عمود بيت 5 خلايا + المركز
// الوضع النسبي للقطعة: -1 = في القاعدة، 0..50 = على الحلقة، 51..55 = عمود البيت، 56 = وصلت للبيت

// الحلقة باتجاه عقارب الساعة، الفهرس 0 = مربع انطلاق الأحمر [1,6]
const RING = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0], [8, 0],
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14], [6, 14],
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6],
];

// مربعات الانطلاق لكل لون (فهارس الحلقة)
const STARTS = [0, 13, 26, 39];
// المربعات الآمنة: مربعات الانطلاق + النجوم
const SAFE = new Set([0, 13, 26, 39, 8, 21, 34, 47]);

// أعمدة البيت (إحداثيات الخمس خلايا من الخارج نحو المركز)
// مطابقة لرقعة يلا 13001: أحمر (أسفل-يسار) يدخل من اليسار صعوداً، أخضر (أعلى-يسار) من الأعلى
const HOME_PATHS = [
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],    // أحمر — يدخل من اليسار (نحو المركز)
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],    // أخضر — يدخل من الأعلى
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],// أصفر — يدخل من اليمين
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],// أزرق — يدخل من الأسفل
];

// قواعد القواعد الأربع (منطقة 6×6 لكل لون) لرسم العميل
// ترتيب مطابق لرقعة يلا لودو 13001 الحقيقية: أحمر أسفل-يسار، أخضر أعلى-يسار، أصفر أسفل-يمين، أزرق أعلى-يمين
const BASES = [
  { x: 0, y: 9 },   // أحمر أسفل اليسار
  { x: 0, y: 0 },   // أخضر أعلى اليسار
  { x: 9, y: 9 },   // أصفر أسفل اليمين
  { x: 9, y: 0 },   // أزرق أعلى اليمين
];

const COLORS = [
  { name: 'red',    main: '#FF4D5E', dark: '#C6202F', light: '#FF8A94' },
  { name: 'green',  main: '#2EDB74', dark: '#0FA34D', light: '#8FF0B6' },
  { name: 'yellow', main: '#FFC53D', dark: '#D89400', light: '#FFE08A' },
  { name: 'blue',   main: '#2E9BFF', dark: '#0F5FC6', light: '#8FC9FF' },
];

const WIN_POS = 56;

function ringPosFor(playerColor, rel) {
  // يعيد [x,y] لإحداثيات الخلية على اللوحة
  if (rel <= 50) {
    const idx = (STARTS[playerColor] + rel) % 52;
    return RING[idx];
  }
  if (rel <= 55) return HOME_PATHS[playerColor][rel - 51];
  return [7, 7]; // المركز
}

function absRingIdx(playerColor, rel) {
  if (rel < 0 || rel > 50) return -1;
  return (STARTS[playerColor] + rel) % 52;
}

function isSafeAbs(idx) { return SAFE.has(idx); }

// ============ إنشاء اللعبة ============
function createLudo(room, seatPlayers) {
  // seatPlayers: [{id, name, grad, seat, bot}] — من 2 إلى 4
  const players = seatPlayers.slice(0, 4).map((p, i) => ({
    color: i,
    userId: p.id,
    name: p.name,
    grad: p.grad ?? 0,
    seat: p.seat,
    bot: !!p.bot,
  }));
  return {
    type: 'ludo',
    room,
    players,
    turn: 0,
    dice: null,
    phase: 'roll',        // roll | move | over
    sixStreak: 0,
    tokens: players.map(() => [-1, -1, -1, -1]),
    finished: players.map(() => [false, false, false, false]),
    homeCount: players.map(() => 0),
    legalMoves: [],
    winner: null,
    finishedOrder: [],
    lastEvent: null,
    turnDeadline: Date.now() + 15000,
    timers: [],
  };
}

function clearTimers(g) {
  if (g && Array.isArray(g.timers)) g.timers.forEach((t) => clearTimeout(t));
  if (g) g.timers = [];
}
function later(g, fn, ms) { g.timers.push(setTimeout(fn, ms)); }

// إشعار موحّد: يُستدعى عند أي تغيير في الحالة (حتى من أدوار البوتات)
function notify(g, info) {
  if (typeof g.onChange === 'function') {
    try { g.onChange(info || {}); } catch (e) { console.error('ludo notify error', e); }
  }
}

// القطع القانونية للتحريك بعد رمي النرد
function legalTokens(g, pi, dice) {
  const toks = g.tokens[pi];
  const out = [];
  for (let t = 0; t < 4; t++) {
    const p = toks[t];
    if (p === -1) {
      if (dice === 6) out.push(t);          // فتح من القاعدة بـ6 فقط
    } else if (p < WIN_POS) {
      if (p + dice <= WIN_POS) out.push(t); // يجب الوصول بالضبط
    }
  }
  return out;
}

function occupiedTokensAtAbs(g, absIdx, exceptPi) {
  const res = [];
  g.players.forEach((pl, pi) => {
    if (pi === exceptPi) return;
    g.tokens[pi].forEach((rel, ti) => {
      if (rel >= 0 && rel <= 50 && absRingIdx(pi, rel) === absIdx) res.push({ pi, ti });
    });
  });
  return res;
}

// تنفيذ حركة قطعة وإرجاع الأحداث
function applyMove(g, pi, ti, dice) {
  const events = [];
  const toks = g.tokens[pi];
  const from = toks[ti];

  if (from === -1) {
    toks[ti] = 0;
    events.push({ kind: 'open', pi, ti, abs: absRingIdx(pi, 0) });
  } else {
    toks[ti] = from + dice;
    events.push({ kind: 'move', pi, ti, from, to: toks[ti] });
  }

  // أسر؟
  const abs = absRingIdx(pi, toks[ti]);
  if (abs >= 0 && !isSafeAbs(abs)) {
    const victims = occupiedTokensAtAbs(g, abs, pi);
    victims.forEach(({ pi: vpi, ti: vti }) => {
      g.tokens[vpi][vti] = -1;
      events.push({ kind: 'capture', by: pi, victim: vpi, vti, abs });
    });
  }

  // وصول للبيت؟
  if (toks[ti] === WIN_POS) {
    g.homeCount[pi] += 1;
    events.push({ kind: 'home', pi, ti, total: g.homeCount[pi] });
    if (g.homeCount[pi] === 4) {
      g.winner = pi;
      g.phase = 'over';
      g.finishedOrder.push(pi);
      events.push({ kind: 'win', pi });
      return events;
    }
  }

  return events;
}

function extraRoll(g, pi, dice, events) {
  if (g.phase === 'over') return false;
  const captured = events.some((e) => e.kind === 'capture');
  const reachedHome = events.some((e) => e.kind === 'home' && e.pi === pi);
  const opened = events.some((e) => e.kind === 'open' && e.pi === pi);
  if (dice === 6 || captured || reachedHome || opened) return true;
  return false;
}

// الرمي
function roll(g, pi) {
  if (g.phase !== 'roll' || g.turn !== pi) return { ok: false, error: 'ليس دورك' };
  const dice = 1 + Math.floor(Math.random() * 6);
  g.dice = dice;
  if (dice === 6) {
    g.sixStreak += 1;
    if (g.sixStreak >= 3) {
      // ثلاث ستات = فقدان الدور
      g.sixStreak = 0;
      g.lastEvent = { kind: 'triple-six', pi };
      notify(g, { dice: { color: pi, dice }, toasts: ['ثلاث ستات متتالية — فقدان الدور!'] });
      later(g, () => nextTurn(g), 800);
      return { ok: true, dice, lost: true };
    }
  } else {
    g.sixStreak = 0;
  }
  g.legalMoves = legalTokens(g, pi, dice);
  if (g.legalMoves.length === 0) {
    g.lastEvent = { kind: 'no-move', pi, dice };
    notify(g, { dice: { color: pi, dice }, toasts: [`${g.players[pi].name}: لا حركة متاحة`] });
    later(g, () => nextTurn(g), 900);
    return { ok: true, dice, noMove: true };
  }
  g.phase = 'move';
  g.turnDeadline = Date.now() + 12000;
  notify(g, { dice: { color: pi, dice } });
  // حركة واحدة فقط → تحريك تلقائي (مثل يلا)
  if (g.legalMoves.length === 1) {
    const ti = g.legalMoves[0];
    later(g, () => { if (g.phase === 'move') doMove(g, pi, ti); }, 650);
  }
  return { ok: true, dice };
}

function doMove(g, pi, ti) {
  if (g.phase !== 'move' || g.turn !== pi) return { ok: false, error: 'غير مسموح' };
  if (!g.legalMoves.includes(ti)) return { ok: false, error: 'قطعة غير قانونية' };
  const dice = g.dice;
  const events = applyMove(g, pi, ti, dice);
  g.legalMoves = [];
  const toasts = [];
  events.forEach((ev) => {
    if (ev.kind === 'capture') toasts.push(`${g.players[pi].name} أسر قطعة ${['الحمراء', 'الخضراء', 'الصفراء', 'الزرقاء'][ev.victim]}! ⚔️`);
    if (ev.kind === 'home') toasts.push(`قطعة ${g.players[pi].name} وصلت للبيت 🏠 (${ev.total}/4)`);
  });
  if (g.phase === 'over') {
    g.lastEvent = events[events.length - 1];
    notify(g, { events, toasts, winner: pi });
    return { ok: true, events, over: true };
  }
  if (extraRoll(g, pi, dice, events)) {
    g.phase = 'roll';
    g.dice = null;
    g.turnDeadline = Date.now() + 15000;
    g.lastEvent = events[events.length - 1] || null;
    notify(g, { events, toasts });
    scheduleBot(g);
    return { ok: true, events, extra: true };
  }
  g.lastEvent = events[events.length - 1] || null;
  notify(g, { events, toasts });
  nextTurn(g);
  return { ok: true, events };
}

function nextTurn(g) {
  clearTimers(g); // اقتل كل المؤقتات القديمة قبل جدولة الجديدة — يمنع تداخل الأدوار
  g.turn = (g.turn + 1) % g.players.length;
  g.dice = null;
  g.phase = 'roll';
  g.sixStreak = 0;
  g.legalMoves = [];
  g.turnDeadline = Date.now() + 15000;
  notify(g, {});
  scheduleBot(g);
}

// مهلة الدور: تخطٍ تلقائي
function checkTimeout(g) {
  if (g.phase === 'over') return;
  if (Date.now() > g.turnDeadline) {
    if (g.phase === 'move' && g.legalMoves.length) {
      doMove(g, g.turn, g.legalMoves[0]);
    } else {
      nextTurn(g);
    }
  }
}

// البوتات
function scheduleBot(g) {
  if (g.phase === 'over') return;
  const pl = g.players[g.turn];
  if (!pl || !pl.bot) {
    // مراقبة المهلة للاعب البشري
    later(g, () => checkTimeout(g), Math.max(100, g.turnDeadline - Date.now()) + 200);
    return;
  }
  later(g, () => {
    if (g.phase === 'over' || g.players[g.turn] !== pl) return;
    const r = roll(g, g.turn);
    if (!r.ok) {
      // استرداد ذاتي: لو فشل الرمي جدول انتقال دور بدلاً من التجمد
      later(g, () => { if (g.phase !== 'over') nextTurn(g); }, 400);
      return;
    }
    later(g, () => {
      if (g.phase !== 'move') return;
      const toks = g.tokens[g.turn];
      // استراتيجية بوت بسيطة: فتح إن أمكن، ثم أسر إن أمكن، ثم الأقرب للبيت
      let best = g.legalMoves[0];
      let bestScore = -1;
      g.legalMoves.forEach((ti) => {
        let score = toks[ti] === -1 ? 5 : toks[ti] / 10;
        const np = toks[ti] === -1 ? 0 : toks[ti] + g.dice;
        const abs = absRingIdx(g.turn, np);
        if (abs >= 0 && !isSafeAbs(abs)) {
          const victims = occupiedTokensAtAbs(g, abs, g.turn);
          if (victims.length) score += 10;
        } else if (abs >= 0) score += 2;
        if (np === WIN_POS) score += 8;
        if (score > bestScore) { bestScore = score; best = ti; }
      });
      doMove(g, g.turn, best);
    }, 800);
  }, 1100);
}

// حالة عامة للإرسال للعملاء
function publicState(g) {
  return {
    type: 'ludo',
    players: g.players.map((p) => ({ color: p.color, id: p.userId, name: p.name, grad: p.grad, seat: p.seat, bot: p.bot })),
    turn: g.turn,
    turnSeat: g.players[g.turn] ? g.players[g.turn].seat : null,
    dice: g.dice,
    phase: g.phase,
    tokens: g.tokens,
    homeCount: g.homeCount,
    legalMoves: g.legalMoves,
    winner: g.winner,
    lastEvent: g.lastEvent,
    turnDeadline: g.turnDeadline,
  };
}

// هندسة اللوحة للعميل (تُرسل كملف js)
const BOARD = { RING, STARTS, SAFE: [...SAFE], HOME_PATHS, BASES, COLORS, WIN_POS, ringPosFor: null };

module.exports = {
  RING, STARTS, SAFE, HOME_PATHS, BASES, COLORS, WIN_POS,
  createLudo, roll, doMove, publicState, scheduleBot, nextTurn, clearTimers, legalTokens, checkTimeout,
  BOARD,
};
