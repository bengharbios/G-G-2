// السيرفر الرئيسي: Express + Socket.IO
// دخول، غرف، مقاعد، شات، هدايا واقتصاد، WebRTC signaling، ألعاب (سلم وثعبان + مسبحة)
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const S = require('./state');
const L = require('./ludo');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e6 });

// منع تخزين الملفات مؤقتاً في المتصفح: أي تحديث للكود يظهر فوراً بدون Ctrl+F5
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.static(path.join(__dirname, '..', 'client'), { extensions: ['html'] }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'client', 'index.html')));

const emitRoom = (roomId, event, payload) => io.to('room:' + roomId).emit(event, payload);
const roomSocketIds = (roomId) => {
  const set = new Set();
  for (const uid_ of S.roomUserIds(S.getRoom(roomId) || { id: roomId })) {
    for (const [sid, uid2] of S.sockets) if (uid2 === uid_) set.add(sid);
  }
  return [...set];
};

// إشعار مستخدم بكل مقابله (بوت أو لا)
function pushUserUpdate(user) {
  for (const [sid, uid_] of S.sockets) {
    if (uid_ === user.id) io.to(sid).emit('me', S.publicUser(user));
  }
}

// ============ الاتصال ============
io.on('connection', (socket) => {
  let me = null;

  // ----- الدخول -----
  socket.on('auth', ({ name }, cb) => {
    me = S.createUser({ name });
    S.sockets.set(socket.id, me.id);
    socket.emit('me', S.publicUser(me));
    cb && cb(S.publicUser(me));
  });

  socket.on('me:get', (cb) => cb && cb(me ? S.publicUser(me) : null));

  // ----- قائمة المتصلين (لسوشيال سكريين يلا لودو) -----
  socket.on('users:list', (cb) => {
    cb && cb([...S.users.values()]
      .filter((u) => u.id !== (me && me.id))
      .slice(0, 100)
      .map((u) => ({ id: u.id, name: u.name, flag: u.flag, grad: u.grad, level: u.level, inRoom: !!u.room })));
  });

  // ----- قائمة الغرف -----
  socket.on('rooms:list', (cb) => {
    const list = [...S.rooms.values()]
      .filter((r) => r.name)
      .sort((a, b) => b.lastActivity - a.lastActivity)
      .slice(0, 40)
      .map(S.publicRoom);
    cb && cb(list);
  });

  socket.on('room:create', ({ name, theme, password }, cb) => {
    if (!me) return;
    // لو داخل غرفة اخرجه أولاً
    if (me.room) leaveRoom(true);
    const room = S.createRoom({ name, theme, password, ownerId: me.id });
    cb && cb({ ok: true, roomId: room.id });
  });

  socket.on('room:join', ({ roomId, password }, cb) => {
    if (!me) return;
    const room = S.getRoom(roomId);
    if (!room) return cb && cb({ ok: false, error: 'الغرفة غير موجودة' });
    if (room.password && room.password !== password) return cb && cb({ ok: false, error: 'كلمة المرور غير صحيحة' });
    if (me.room === roomId) return cb && cb({ ok: true, roomId });

    if (me.room) leaveRoom(true);
    me.room = roomId;
    socket.join('room:' + roomId);
    addSystemMsg(room, `${me.name} دخل الغرفة 👋`);
    emitRoom(roomId, 'room:state', S.publicRoom(room));
    // آخر 30 رسالة للواصل
    cb && cb({ ok: true, roomId, room: S.publicRoom(room), messages: room.messages.slice(-30) });
    // فريق بوت خفيف داخل الغرف الفارغة حتى تشعر الغرفة بالحياة
    ensureBotLife(room);
  });

  function leaveRoom(silent = false) {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    const roomId = me.room;
    if (room) {
      if (me.seat) {
        room.seats[me.seat.seatIndex] = null;
        delete room.rtcUnmuted[me.seat.seatIndex];
        delete room.rtcSocketBySeat[me.seat.seatIndex];
        emitRoom(roomId, 'seat:update', S.publicRoom(room).seats);
        notifyRoomRTC(roomId);
      }
      if (!silent) addSystemMsg(room, `${me.name} خرج من الغرفة`);
      if (room.ownerId === me.id) {
        const humans = S.roomUserIds(room).filter((id) => id !== me.id && S.getUser(id) && !S.getUser(id).bot);
        if (humans.length) room.ownerId = humans[0];
        else S.rooms.delete(roomId);
      }
      // لاعب خرج أثناء لودو؟ حوّله لبوت تلقائي حتى تستمر اللعبة
      if (room.game && room.game.type === 'ludo') {
        const lp = room.game.players.find((p) => p.userId === me.id);
        if (lp) {
          lp.bot = true;
          L.scheduleBot(room.game);
          emitRoom(roomId, 'ludo:state', L.publicState(room.game));
        }
      }
    }
    me.room = null;
    me.seat = null;
    socket.leave('room:' + roomId);
    if (room && S.rooms.has(roomId)) emitRoom(roomId, 'room:state', S.publicRoom(S.getRoom(roomId)));
    socket.emit('room:left');
  }

  socket.on('room:leave', () => leaveRoom());

  // ----- المقاعد -----
  socket.on('seat:take', ({ index }, cb) => {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    if (!room) return;
    if (me.seat) room.seats[me.seat.seatIndex] = null;
    if (index < 0 || index >= room.seats.length || room.seats[index]) return cb && cb({ ok: false, error: 'المقعد محجوز' });
    room.seats[index] = me.id;
    me.seat = { seatIndex: index };
    emitRoom(me.room, 'seat:update', S.publicRoom(room).seats);
    cb && cb({ ok: true });
  });

  socket.on('seat:leave', () => {
    if (!me || !me.room || !me.seat) return;
    const room = S.getRoom(me.room);
    room.seats[me.seat.seatIndex] = null;
    delete room.rtcUnmuted[me.seat.seatIndex];
    delete room.rtcSocketBySeat[me.seat.seatIndex];
    me.seat = null;
    emitRoom(me.room, 'seat:update', S.publicRoom(room).seats);
    notifyRoomRTC(me.room);
  });

  // ----- الشات -----
  socket.on('chat:send', ({ text }) => {
    if (!me || !me.room || !text) return;
    const room = S.getRoom(me.room);
    const msg = { from: me.id, name: me.name, flag: me.flag, grad: me.grad, level: me.level, text: String(text).slice(0, 300), at: S.now(), system: false };
    room.messages.push(msg);
    if (room.messages.length > 60) room.messages.shift();
    emitRoom(me.room, 'chat:new', msg);
  });

  function addSystemMsg(room, text) {
    const msg = { from: null, text, at: S.now(), system: true };
    room.messages.push(msg);
    if (room.messages.length > 60) room.messages.shift();
    emitRoom(room.id, 'chat:new', msg);
  }

  // ----- الهدايا + الاقتصاد -----
  socket.on('gift:send', ({ giftId, toSeat }, cb) => {
    if (!me || !me.room) return cb && cb({ ok: false, error: 'لست داخل غرفة' });
    const room = S.getRoom(me.room);
    const gift = S.getGift(giftId);
    if (!gift) return cb && cb({ ok: false, error: 'هدية غير معروفة' });
    if (me.jewels < gift.price) return cb && cb({ ok: false, error: 'مجوهراتك غير كافية — افتح صفحة المحفظة للشحن أو التحويل من الذهب' });

    // تحويل مجوهرات -> ذهب مستلم (المستقبل ياخذ ذهب بقيمة الهدية)
    me.jewels -= gift.price;
    me.spentGold += gift.price;         // يرفع لقب الثروة
    S.addXp(me, Math.ceil(gift.price / 100) + 2);

    let receiver = null;
    if (typeof toSeat === 'number' && room.seats[toSeat]) {
      receiver = S.getUser(room.seats[toSeat]);
    } else {
      // هدية للغرفة: تتوزع على المقاعد المشغولة
      const onSeats = room.seats.map((id) => S.getUser(id)).filter(Boolean);
      if (onSeats.length) receiver = onSeats[Math.floor(Math.random() * onSeats.length)];
    }
    if (receiver && receiver.id !== me.id) {
      const goldOut = gift.price * (receiver.bot ? 0 : 1);
      receiver.gold += goldOut;
      receiver.receivedGold += goldOut;
      S.addXp(receiver, Math.ceil(gift.price / 200));
      pushUserUpdate(receiver);
    }

    pushUserUpdate(me);
    const event = {
      giftId, giftName: gift.name, anim: gift.anim, tier: gift.tier,
      from: { id: me.id, name: me.name, flag: me.flag, grad: me.grad, level: me.level },
      to: receiver ? { id: receiver.id, name: receiver.name, seat: receiver.seat ? receiver.seat.seatIndex : null } : null,
      at: S.now(),
    };
    emitRoom(me.room, 'gift:new', event);
    cb && cb({ ok: true, me: S.publicUser(me) });
  });

  // ----- المحفظة -----
  socket.on('wallet:exchange', ({ jewels }, cb) => {
    if (!me) return;
    const n = Math.max(0, Math.floor(jewels));
    const goldCost = n * S.JEWEL_TO_GOLD_RATE;
    if (me.gold < goldCost) return cb && cb({ ok: false, error: 'ذهبك لا يكفي للتحويل' });
    me.gold -= goldCost;
    me.jewels += n;
    pushUserUpdate(me);
    cb && cb({ ok: true, me: S.publicUser(me) });
  });

  socket.on('wallet:daily', (cb) => {
    if (!me) return;
    const DAY = 24 * 3600 * 1000;
    if (S.now() - me.lastDaily < DAY) return cb && cb({ ok: false, error: 'استلمت مكافأة اليوم بالفعل — ارجع غداً' });
    me.lastDaily = S.now();
    const gold = 20000 + Math.floor(Math.random() * 20000);
    const jewels = 200 + Math.floor(Math.random() * 300);
    me.gold += gold;
    me.jewels += jewels;
    S.addXp(me, 30);
    pushUserUpdate(me);
    cb && cb({ ok: true, gold, jewels, me: S.publicUser(me) });
  });

  // ----- الرسائل الخاصة -----
  socket.on('dm:send', ({ to, text }) => {
    if (!me || !to || !text) return;
    const target = S.getUser(to);
    if (!target) return;
    const arr = S.addDM(me.id, to, text);
    const last = arr[arr.length - 1];
    for (const [sid, uid_] of S.sockets) {
      if (uid_ === me.id || uid_ === to) io.to(sid).emit('dm:new', { key: S.dmKey(me.id, to), messages: arr.slice(-50) });
    }
  });

  socket.on('dm:history', ({ with: otherId }, cb) => {
    if (!me) return;
    cb && cb(S.getDMs(me.id, otherId).slice(-50));
  });

  // ----- لوحة الصدارة -----
  socket.on('leaderboard', (cb) => {
    cb && cb({ wealth: S.topWealth(10), levels: S.topLevels(10) });
  });

  // ============ WebRTC signaling ============
  socket.on('rtc:mute', ({ muted }) => {
    if (!me || !me.room || !me.seat) return;
    const room = S.getRoom(me.room);
    const i = me.seat.seatIndex;
    if (muted) { delete room.rtcUnmuted[i]; delete room.rtcSocketBySeat[i]; }
    else { room.rtcUnmuted[i] = true; room.rtcSocketBySeat[i] = socket.id; }
    emitRoom(me.room, 'seat:update', S.publicRoom(room).seats);
    notifyRoomRTC(me.room);
  });

  socket.on('rtc:ready', () => { if (me && me.room) notifyRoomRTC(me.room, socket.id); });

  function notifyRoomRTC(roomId, onlySocket = null) {
    const room = S.getRoom(roomId);
    if (!room) return;
    // قائمة معرفات الاتصال (socket ids) لمن فتح المايك — يحتاجها العميل لبناء اتصالات WebRTC
    const unmuted = Object.values(room.rtcSocketBySeat || {});
    const payload = { unmuted };
    if (onlySocket) io.to(onlySocket).emit('rtc:peers', payload);
    else emitRoom(roomId, 'rtc:peers', payload);
  }

  socket.on('rtc:signal', ({ to, data }) => {
    io.to(to).emit('rtc:signal', { from: socket.id, data });
  });

  // ============ الألعاب: سلم وثعبان ============
  // ===== اللودو =====
  socket.on('ludo:roll', () => {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    const g = room.game;
    if (!g || g.type !== 'ludo') return;
    const pi = g.players.findIndex((p) => p.userId === me.id);
    if (pi < 0) return;
    L.roll(g, pi); // الإشعارات تخرج عبر onChange
  });

  socket.on('ludo:move', ({ token }) => {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    const g = room.game;
    if (!g || g.type !== 'ludo') return;
    const pi = g.players.findIndex((p) => p.userId === me.id);
    if (pi < 0) return;
    L.doMove(g, pi, token); // الإشعارات تخرج عبر onChange
  });

  socket.on('game:start', ({ type }, cb) => {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    if (room.game) return cb && cb({ ok: false, error: 'توجد لعبة جارية' });
    if (type === 'ludo') {
      const players = room.seats.map((id, i) => {
        const u = S.getUser(id);
        return u ? { id: u.id, name: u.name, grad: u.grad, seat: i, bot: u.bot } : null;
      }).filter(Boolean);
      if (players.length < 2) return cb && cb({ ok: false, error: 'تحتاج لاعبَين على الأقل على المقاعد' });
      L.clearTimers(room.game);
      if (room._ludoWatchdog) clearInterval(room._ludoWatchdog);
      room.game = L.createLudo(room, players);
      // البث الموحد: كل تغيير حالة (بشراً كان أو بوتاً) يوصل للجميع
      room.game.onChange = (info) => {
        const g = room.game;
        if (!g) return;
        emitRoom(room.id, 'ludo:state', L.publicState(g));
        if (info.dice) emitRoom(room.id, 'ludo:dice', { color: info.dice.color, dice: info.dice.dice });
        if (info.toasts && info.toasts.length) info.toasts.forEach((t) => emitRoom(room.id, 'ludo:toast', { text: t }));
        if (typeof info.winner === 'number') {
          const wp = g.players[info.winner];
          const winner = wp ? S.getUser(wp.userId) : null;
          if (winner && !winner.bot) {
            winner.gold += 100000;
            winner.wins += 1;
            winner.gamesPlayed += 1;
            S.addXp(winner, 200);
            pushUserUpdate(winner);
          }
          emitRoom(room.id, 'ludo:over', { winner: wp ? wp.name : '', color: info.winner });
          if (room._ludoWatchdog) { clearInterval(room._ludoWatchdog); room._ludoWatchdog = null; }
        }
      };
      L.scheduleBot(room.game);
      // حارس التجمّد: لو علق أي دور أكثر من مهلة معقولة نصلحه تلقائياً
      room._ludoWatchdog = setInterval(() => {
        const r2 = S.getRoom(room.id);
        if (!r2 || !r2.game || r2.game.type !== 'ludo') { clearInterval(room._ludoWatchdog); room._ludoWatchdog = null; return; }
        const g = r2.game;
        if (g.phase === 'over') return;
        if (Date.now() > g.turnDeadline + 2500) {
          const cur = g.players[g.turn];
          if (cur && cur.bot) { L.clearTimers(g); L.scheduleBot(g); }
          else { L.clearTimers(g); L.checkTimeout(g); }
        }
      }, 2500);
      emitRoom(me.room, 'ludo:state', L.publicState(room.game));
      emitRoom(me.room, 'game:state', { type: 'ludo' });
      return cb && cb({ ok: true });
    }
    if (type === 'snake') {
      const players = room.seats.map((id, i) => ({ id, seat: i })).filter((p) => p.id);
      if (players.length < 2) return cb && cb({ ok: false, error: 'تحتاج لاعبَين على الأقل على المقاعد' });
      room.game = { type: 'snake', players, turn: 0, positions: Object.fromEntries(players.map((p) => [p.id, 0])), dice: null, rolling: false };
      emitRoom(me.room, 'game:state', publicGame(room.game));
      cb && cb({ ok: true });
    } else if (type === 'sebha') {
      room.game = { type: 'sebha', counts: {}, startedAt: S.now() };
      emitRoom(me.room, 'game:state', publicGame(room.game));
      cb && cb({ ok: true });
    }
  });

  socket.on('game:stop', () => {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    if (!room.game) return;
    if (room.game.type === 'ludo') L.clearTimers(room.game);
    if (room._ludoWatchdog) { clearInterval(room._ludoWatchdog); room._ludoWatchdog = null; }
    room.game = null;
    emitRoom(me.room, 'game:state', null);
    emitRoom(me.room, 'ludo:state', null);
  });

  socket.on('snake:roll', () => {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    const g = room.game;
    if (!g || g.type !== 'snake' || g.rolling) return;
    const cur = g.players[g.turn];
    if (cur.id !== me.id) return;

    g.rolling = true;
    const dice = 1 + Math.floor(Math.random() * 6);
    g.dice = dice;
    emitRoom(me.room, 'snake:dice', { seat: cur.seat, dice });
    setTimeout(() => {
      const pos = g.positions[cur.id] + dice;
      g.positions[cur.id] = SNAKE_TARGET(pos);
      emitRoom(me.room, 'snake:move', { seat: cur.seat, from: g.positions[cur.id] - dice, to: g.positions[cur.id] });

      if (g.positions[cur.id] >= 100) {
        const winner = S.getUser(cur.id);
        if (winner) {
          winner.wins += 1;
          winner.gold += 50000;
          S.addXp(winner, 120);
          pushUserUpdate(winner);
        }
        emitRoom(me.room, 'game:over', { winnerSeat: cur.seat, winnerName: winner ? winner.name : '' });
        setTimeout(() => { room.game = null; emitRoom(me.room, 'game:state', null); }, 4000);
        g.rolling = false;
        return;
      }
      setTimeout(() => {
        g.turn = (g.turn + 1) % g.players.length;
        g.rolling = false;
        emitRoom(me.room, 'game:state', publicGame(g));
      }, 700);
    }, 900);
  });

  // عند خروج أي لاعب من الغرفة أثناء لعبة لودو جارية: أعد الجدولة لو كان دوره
  socket.on('game:ludo:resync', () => {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    if (room && room.game && room.game.type === 'ludo') {
      emitRoom(me.room, 'ludo:state', L.publicState(room.game));
    }
  });

  function SNAKE_TARGET(pos) {
    const LADDERS = { 4: 25, 13: 46, 27: 5, 33: 49, 40: 3, 42: 63, 43: 18, 50: 69, 54: 31, 62: 81, 66: 45, 74: 92, 76: 58, 87: 24, 89: 68, 92: 98, 95: 56, 99: 80 };
    const SNK = { 26: 0, 20: 8, 29: 9, 34: 12, 47: 16, 55: 33, 61: 19, 72: 51, 79: 40, 83: 61, 87: 57, 91: 30, 96: 66, 98: 78 };
    if (LADDERS[pos] !== undefined) return LADDERS[pos];
    if (SNK[pos] !== undefined) return SNK[pos];
    return pos;
  }

  function publicGame(g) {
    if (!g) return null;
    if (g.type === 'snake') {
      return {
        type: 'snake',
        turnSeat: g.players[g.turn].seat,
        positions: Object.fromEntries(g.players.map((p) => [p.seat, g.positions[p.id]])),
        players: g.players.map((p) => { const u = S.getUser(p.id); return { seat: p.seat, name: u.name, grad: u.grad }; }),
      };
    }
    if (g.type === 'sebha') return { type: 'sebha', counts: g.counts, startedAt: g.startedAt };
    return null;
  }

  // المسبحة: كل ضغطة تسبيح
  socket.on('sebha:tap', () => {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    if (!room.game || room.game.type !== 'sebha') return;
    room.game.counts[me.id] = (room.game.counts[me.id] || 0) + 1;
    if (room.game.counts[me.id] % 33 === 0) {
      me.gold += 1000;
      S.addXp(me, 10);
      pushUserUpdate(me);
      emitRoom(me.room, 'sebha:milestone', { name: me.name, count: room.game.counts[me.id] });
    }
    emitRoom(me.room, 'sebha:count', { id: me.id, count: room.game.counts[me.id] });
  });

  // ============ بوتات ============
  socket.on('bots:add', (cb) => {
    if (!me || !me.room) return;
    const room = S.getRoom(me.room);
    const bot = S.makeBot();
    bot.room = room.id;
    // اجلس على أول مقعد فاضي
    const idx = room.seats.findIndex((s) => s === null);
    if (idx >= 0) { room.seats[idx] = bot.id; bot.seat = { seatIndex: idx }; }
    emitRoom(room.id, 'seat:update', S.publicRoom(room).seats);
    addSystemMsg(room, `${bot.name} دخل الغرفة 👋`);
    cb && cb({ ok: true });
  });

  // حياة بوتات خفيفة: رسائل عشوائية
  const botTimers = new Map();
  function ensureBotLife(room) {
    if (botTimers.has(room.id)) return;
    const t = setInterval(() => {
      const r = S.getRoom(room.id);
      if (!r) { clearInterval(t); botTimers.delete(room.id); return; }
      const bots = [...S.users.values()].filter((u) => u.bot && u.room === r.id);
      if (!bots.length || Math.random() > 0.55) return;
      const b = bots[Math.floor(Math.random() * bots.length)];
      const msg = { from: b.id, name: b.name, flag: b.flag, grad: b.grad, level: b.level, text: S.BOT_CHAT[Math.floor(Math.random() * S.BOT_CHAT.length)], at: S.now(), system: false };
      r.messages.push(msg);
      if (r.messages.length > 60) r.messages.shift();
      emitRoom(r.id, 'chat:new', msg);
    }, 12000);
    botTimers.set(room.id, t);
  }

  // ============ قطع الاتصال ============
  socket.on('disconnect', () => {
    if (!me) return;
    S.sockets.delete(socket.id);
    // لا نحذف فوراً — قد يكون إعادة اتصال؛ نحذف فقط لو ما له سوكتات
    const hasOther = [...S.sockets.values()].includes(me.id);
    if (!hasOther) {
      const { roomId } = S.removeUserFromEverything(me.id) || {};
      if (roomId && S.rooms.has(roomId)) {
        emitRoom(roomId, 'seat:update', S.publicRoom(S.getRoom(roomId)).seats);
        emitRoom(roomId, 'room:state', S.publicRoom(S.getRoom(roomId)));
      }
    }
  });
});

// حماية عامة: لا تدع خطأ غير متوقع يُسقط السيرفر
process.on('uncaughtException', (err) => console.error('⚠️ خطأ غير متوقع:', err.message));
process.on('unhandledRejection', (err) => console.error('⚠️ وعد مرفوض:', err));

const PORT = parseInt(process.env.PORT, 10) || 3000;
if (PORT <= 0) { console.error('❌ منفذ غير صالح: PORT=' + process.env.PORT); process.exit(1); }
server.listen(PORT, () => console.log(`✅ YallaLive يعمل على http://localhost:${PORT}`));
