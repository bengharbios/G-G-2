// إدارة حالة السيرفر: المستخدمون، الغرف، الاقتصاد، الرسائل الخاصة
// تخزين في الذاكرة (In-Memory) — كافٍ للتشغيل والتجربة، وقابل للاستبدال بقاعدة بيانات لاحقاً

const crypto = require('crypto');

const now = () => Date.now();
const uid = (prefix) => `${prefix}_${crypto.randomBytes(6).toString('hex')}`;

// ============ الاقتصاد ============
// عملتان: ذهب (تُكسب من الألعاب والمكافأة اليومية) ومجوهرات (عملة الهدايا والغرف)
// التحويل: 1 مجوهرات = 10000 ذهب
const JEWEL_TO_GOLD_RATE = 10000;

// منحنى الخبرة لكل مستوى (50 مستوى)
const LEVELS = Array.from({ length: 50 }, (_, i) => Math.floor(100 * Math.pow(i + 1, 1.6)));

function xpForLevel(lv) {
  const idx = Math.min(Math.max(lv, 1), LEVELS.length) - 1;
  return LEVELS[idx];
}

// ألقاب الثروة حسب مجموع الذهب المُهدر (مثل مستويات يلا)
function wealthTitle(spentGold) {
  if (spentGold >= 50000000) return { title: 'أسطورة', color: '#FF1744', level: 8 };
  if (spentGold >= 10000000) return { title: 'ملياردير', color: '#FF5722', level: 7 };
  if (spentGold >= 2000000) return { title: 'مليونير', color: '#FF9800', level: 6 };
  if (spentGold >= 500000) return { title: 'بلاتيني', color: '#00BCD4', level: 5 };
  if (spentGold >= 100000) return { title: 'ذهبي', color: '#FFC107', level: 4 };
  if (spentGold >= 20000) return { title: 'فاعل خير', color: '#2196F3', level: 3 };
  if (spentGold >= 5000) return { title: 'ناشئ', color: '#4CAF50', level: 2 };
  return { title: 'جديد', color: '#9E9E9E', level: 1 };
}

// ============ المستخدمون ============
const users = new Map(); // userId -> user
const sockets = new Map(); // socketId -> userId

const FLAGS = ['🇸🇦', '🇦🇪', '🇪🇬', '🇰🇼', '🇶🇦', '🇧🇭', '🇴🇲', '🇯🇴', '🇲🇦', '🇩🇿', '🇮🇶', '🇱🇾', '🇸🇩', '🇾🇪', '🇱🇧', '🇸🇾', '🇹🇳'];

function createUser({ id, name, bot = false } = {}) {
  const user = {
    id: id || uid('u'),
    name: (name || 'ضيف').toString().slice(0, 14),
    flag: FLAGS[Math.floor(Math.random() * FLAGS.length)],
    grad: Math.floor(Math.random() * 8),
    gold: 150000,          // الذهب
    jewels: 5000,          // المجوهرات
    xp: 0,                 // خبرة المستوى
    level: 1,
    spentGold: 0,          // إجمالي ما أُنفق (يحدد لقب الثروة)
    receivedGold: 0,       // إجمالي ما استلم (يحدد لقب الاستقبال)
    bot,
    seat: null,            // { seatIndex }
    room: null,            // roomId
    lastDaily: 0,          // آخر استلام مكافأة يومية
    wins: 0,
    gamesPlayed: 0,
    createdAt: now(),
  };
  users.set(user.id, user);
  return user;
}

function getUser(id) { return users.get(id) || null; }

// إضافة خبرة وترقية المستوى
function addXp(user, amount) {
  user.xp += amount;
  let leveled = false;
  while (user.level < LEVELS.length && user.xp >= xpForLevel(user.level)) {
    user.xp -= xpForLevel(user.level);
    user.level += 1;
    leveled = true;
  }
  return leveled;
}

function publicUser(u) {
  if (!u) return null;
  const w = wealthTitle(u.spentGold);
  return {
    id: u.id, name: u.name, flag: u.flag, grad: u.grad, bot: u.bot,
    gold: u.gold, jewels: u.jewels, xp: u.xp, level: u.level,
    xpNext: xpForLevel(u.level),
    wealth: w,
    receivedGold: u.receivedGold,
    wins: u.wins, gamesPlayed: u.gamesPlayed,
    roomId: u.room,
  };
}

// ============ الغرف ============
const rooms = new Map(); // roomId -> room

const ROOM_THEMES = {
  ludo:  { emoji: '🎲', name: 'لودو وألعاب', from: '#7C4DFF', to: '#512DA8' },
  talk:  { emoji: '🎤', name: 'كلام وفله',   from: '#FF6B9D', to: '#C2185B' },
  games: { emoji: '🎮', name: 'تحديات',      from: '#00C9A7', to: '#00796B' },
  chill: { emoji: '☕', name: 'قهوة وسوالف', from: '#FFB75E', to: '#ED8F03' },
  music: { emoji: '🎵', name: 'طرب وأهازيج', from: '#F857A6', to: '#A4508B' },
  sport: { emoji: '⚽', name: 'رياضة',       from: '#43C6AC', to: '#191654' },
};

const SEATS_COUNT = 8;

function createRoom({ name, theme = 'talk', password = '', ownerId } = {}) {
  const room = {
    id: uid('r'),
    name: (name || 'غرفة جديدة').toString().slice(0, 24),
    theme: ROOM_THEMES[theme] ? theme : 'talk',
    password: password || '',
    ownerId,
    createdAt: now(),
    seats: Array.from({ length: SEATS_COUNT }, () => null),
    messages: [],       // آخر رسائل الغرفة
    rtcUnmuted: {},      // seatIndex -> true
    rtcSocketBySeat: {}, // seatIndex -> socketId (لإشارة WebRTC)
    game: null,
    lastActivity: now(),
  };
  rooms.set(room.id, room);
  return room;
}

function getRoom(id) { return rooms.get(id) || null; }

function publicRoom(room) {
  const seatUsers = room.seats.map((uidOnSeat, i) => {
    if (!uidOnSeat) return null;
    const u = users.get(uidOnSeat);
    if (!u) return null;
    const w = wealthTitle(u.spentGold);
    return {
      id: u.id, name: u.name, flag: u.flag, grad: u.grad, bot: u.bot,
      muted: !room.rtcUnmuted[i] && !u.bot,
      level: u.level, wealth: w,
    };
  });
  const members = [...users.values()].filter((u) => u.room === room.id).length;
  const totalWealth = [...users.values()]
    .filter((u) => u.room === room.id)
    .reduce((sum, u) => sum + (u.spentGold || 0), 0);
  const theme = ROOM_THEMES[room.theme];
  const owner = users.get(room.ownerId);
  return {
    id: room.id, name: room.name, theme, locked: !!room.password,
    members, seats: seatUsers, totalWealth,
    ownerId: room.ownerId,
    ownerName: owner ? owner.name : '',
    hasGame: !!room.game,
    gameType: room.game ? room.game.type : null,
  };
}

function roomUserIds(room) {
  return [...users.values()].filter((u) => u.room === room.id).map((u) => u.id);
}

// ============ الرسائل الخاصة ============
const dms = new Map(); // key -> messages

function dmKey(a, b) { return [a, b].sort().join('|'); }

function addDM(fromId, toId, text) {
  const key = dmKey(fromId, toId);
  if (!dms.has(key)) dms.set(key, []);
  const arr = dms.get(key);
  arr.push({ from: fromId, text: String(text).slice(0, 300), at: now() });
  if (arr.length > 80) arr.shift();
  return arr;
}

function getDMs(a, b) { return dms.get(dmKey(a, b)) || []; }

// ============ قائمة الهدايا ============
// كل هدية لها رسم SVG حقيقي في العميل (client/js/gifts.js) — المعرف هنا يحدد الرسم
const GIFTS = [
  { id: 'rose',      name: 'وردة',        price: 100,     tier: 1, anim: 'rise' },
  { id: 'heart',     name: 'قلب',         price: 500,     tier: 1, anim: 'rise' },
  { id: 'teddy',     name: 'دبدوب',       price: 1000,    tier: 1, anim: 'rise' },
  { id: 'kiss',      name: 'قبلة',        price: 2000,    tier: 1, anim: 'rise' },
  { id: 'moon',      name: 'قمر',         price: 5000,    tier: 2, anim: 'float' },
  { id: 'perfume',   name: 'عطر',         price: 8000,    tier: 2, anim: 'float' },
  { id: 'box',       name: 'صندوق هدايا', price: 10000,   tier: 2, anim: 'float' },
  { id: 'crown',     name: 'تاج',         price: 20000,   tier: 3, anim: 'float' },
  { id: 'ring',      name: 'خاتم ألماس',  price: 50000,   tier: 3, anim: 'drop' },
  { id: 'car',       name: 'سيارة فخمة',  price: 100000,  tier: 3, anim: 'drive' },
  { id: 'cup',       name: 'كأس ذهبي',    price: 100000,  tier: 3, anim: 'drop' },
  { id: 'yacht',     name: 'يخت',         price: 500000,  tier: 4, anim: 'drive' },
  { id: 'diamond',   name: 'ألماسة',      price: 500000,  tier: 4, anim: 'burst' },
  { id: 'jet',       name: 'طائرة خاصة',  price: 1000000, tier: 4, anim: 'flyby' },
  { id: 'palace',    name: 'قصر',         price: 2000000, tier: 4, anim: 'burst' },
  { id: 'rocket',    name: 'صاروخ',       price: 5000000, tier: 5, anim: 'rocket' },
  { id: 'castle',    name: 'قصر الأحلام', price: 10000000,tier: 5, anim: 'burst' },
];

function getGift(id) { return GIFTS.find((g) => g.id === id) || null; }

// ============ لوحة الصدارة ============
function topWealth(n = 10) {
  return [...users.values()]
    .filter((u) => u.spentGold > 0)
    .sort((a, b) => b.spentGold - a.spentGold)
    .slice(0, n)
    .map((u) => ({ id: u.id, name: u.name, flag: u.flag, grad: u.grad, spentGold: u.spentGold, level: u.level }));
}

function topLevels(n = 10) {
  return [...users.values()]
    .sort((a, b) => b.level - a.level || b.xp - a.xp)
    .slice(0, n)
    .map((u) => ({ id: u.id, name: u.name, flag: u.flag, grad: u.grad, level: u.level, xp: u.xp }));
}

// ============ البوتات ============
const BOT_NAMES = ['أبو فهد', 'نور العين', 'سلطان', 'ريم', 'بو خالد', 'سارة', 'عبدالله', 'ليان', 'مشعل', 'هدى', 'طارق', 'أم يزن'];
const BOT_CHAT = [
  'هلا والله 😍', 'يا سلام على الصوت', 'منورين الغرفة', 'شخباركم؟', 'لا تخلون الغرفة تبرد 🔥',
  'من وين حبايبي؟', 'ونستايل؟ 🤣', 'ثيقيلين ✨', 'حيا الله الجميع', 'مين يتحديني بسلم وثعبان؟',
];

function makeBot() {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  return createUser({ name: `${name} ${Math.floor(Math.random() * 90 + 10)}`, bot: true });
}

// تنظيف المستخدم عند الخروج
function removeUserFromEverything(userId) {
  const u = users.get(userId);
  if (!u) return null;
  const room = u.room ? rooms.get(u.room) : null;
  if (room) {
    if (u.seat) {
      room.seats[u.seat.seatIndex] = null;
      delete room.rtcUnmuted[u.seat.seatIndex];
    }
    const anyHuman = roomUserIds(room).filter((id2) => {
      const other = users.get(id2);
      return id2 !== userId && other && !other.bot;
    });
    if (room.ownerId === userId) {
      if (anyHuman.length) room.ownerId = anyHuman[0];
      else rooms.delete(room.id);
    }
    room.game = null;
  }
  u.room = null;
  u.seat = null;
  users.delete(userId);
  return { roomId: room ? room.id : null };
}

module.exports = {
  now, uid,
  JEWEL_TO_GOLD_RATE, LEVELS, xpForLevel, wealthTitle,
  users, sockets, FLAGS,
  createUser, getUser, addXp, publicUser,
  rooms, ROOM_THEMES, SEATS_COUNT,
  createRoom, getRoom, publicRoom, roomUserIds,
  dms, dmKey, addDM, getDMs,
  GIFTS, getGift,
  topWealth, topLevels,
  makeBot, BOT_CHAT,
  removeUserFromEverything,
};
