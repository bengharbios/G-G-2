// ===== YallaLive — منطق الواجهة الرئيسي =====
(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];

  const socket = io();
  window.__socket = socket; // تشخيص/اختبار
  let me = null;               // بياناتي
  let currentRoom = null;      // غرفتي الحالية (publicRoom)
  let roomMessages = [];
  let selectedGift = null;
  let giftTarget = null;       // { id, name, seat } أو null (للغرفة)
  let dmPartner = null;
  let dmPartners = new Map();  // id -> {name, grad}
  let seatGrads = {};          // seatIndex -> grad (لسلم وثعبان الألوان)

  const GRADS = [
    ['#FF6B9D', '#C44569'], ['#FEC163', '#DE4313'], ['#A8E063', '#56AB2F'], ['#4DD0E1', '#0097A7'],
    ['#B39DDB', '#7E57C2'], ['#FFD54F', '#FF8F00'], ['#F06292', '#AD1457'], ['#80CBC4', '#00695C'],
  ];

  // أصول يلا لودو الحقيقية (مستخرجة من APK)
  const LVL_ICONS = [
    '/assets/levels/level_1_9_ic.png',
    '/assets/levels/level_10_19_ic.png',
    '/assets/levels/level_20_29_ic.png',
    '/assets/levels/level_30_39_ic.png',
    '/assets/levels/level_40_49_ic.png',
    '/assets/levels/level_50_60_ic.png',
  ];
  const LUDO_PIECE_ICONS = [
    '/assets/pieces/piece_red.png',
    '/assets/pieces/piece_green.png',
    '/assets/pieces/piece_yellow.png',
    '/assets/pieces/piece_bule.png',
  ];
  const lvlIcon = (lvl) => LVL_ICONS[Math.min(5, Math.max(0, Math.floor(((Number(lvl) || 1) - 1) / 10)))];

  // ===== أدوات =====
  function toast(text, ms = 2200) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), ms);
  }

  // ===== تشغيل ألعاب الغريب من خدمة G-G المحلية (3100) داخل iframe —
  //  هيدر يلا الأساسي يبقى مرئياً وتظهر فيه أيقونة الإدارة، بلا شريط علوي داخلي =====
  const GG_BASE = 'http://127.0.0.1:3100';
  const GG_SUB_CODE = 'GG-TJBS';
  let ggOpen = false;   // هل المشغل مفتوح؟
  let ggAdmin = false;  // هل يعرض الإطار لوحة التحكم الآن؟

  function setGGFrame(src) {
    const fr = $('#ggpFrame');
    if (fr && fr.src !== src) fr.src = src;
  }
  function openGGGame(gameId) {
    const wrap = $('#ggPlayer');
    if (!wrap) return;
    setGGFrame(GG_BASE + '/' + gameId);
    ggOpen = true; ggAdmin = false;
    wrap.classList.add('open');
    document.body.classList.add('gg-playing');
    $$('#hdAdmin').forEach((b) => b.style.display = '');  // أيقونة الإدارة في كل نسخ الهيدر
    const chip = $('#ggpCodeChip');
    if (chip) chip.style.display = '';
    toast('إن ظهر طلب كود الاشتراك: اضغط شريحة GG-TJBS لنسخه وأدخله — مرة واحدة فقط', 3600);
  }
  function closeGGPlayer() {
    const fr = $('#ggpFrame');
    if (fr) fr.src = 'about:blank';
    ggOpen = false; ggAdmin = false;
    const wrap = $('#ggPlayer');
    if (wrap) wrap.classList.remove('open');
    document.body.classList.remove('gg-playing');
    $$('#hdAdmin').forEach((b) => b.style.display = 'none');
    const chip = $('#ggpCodeChip');
    if (chip) chip.style.display = 'none';
  }
  function openGGAdmin() {
    if (!ggOpen) return;
    setGGFrame(GG_BASE + '/admin');
    ggAdmin = true;
  }
  (function initGGPlayer() {
    const wrap = $('#ggPlayer');
    if (!wrap) return;
    const back = $('#ggpBack');
    if (back) back.addEventListener('click', closeGGPlayer);
    const chip = $('#ggpCodeChip');
    if (chip) chip.addEventListener('click', () => {
      try { navigator.clipboard.writeText(GG_SUB_CODE); } catch (e) {}
      toast('تم نسخ الكود ' + GG_SUB_CODE + ' — الصقه في حقل الاشتراك', 3000);
    });
    // تفويض النقر — لأن أزرار الهيدر تُستنسخ من القالب بعد تشغيل هذا السكربت
    document.addEventListener('click', (e) => {
      if (e.target.closest('#hdAdmin')) openGGAdmin();
    });
    // مزامنة الجواهر من لعبة G-G (postMessage كل 3 ثوان: {type:'gg:gems', value})
    window.addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'gg:gems') return;
      const raw = Number(e.data.value);
      if (!Number.isFinite(raw)) return;  // تجاهل القيم الفارغة حتى لا نصفر عداد يلا
      $$('.gem-pill .jewel-val').forEach((el) => { el.textContent = fmt(raw); });
    });
  })();

  function fmt(n) {
    n = Number(n) || 0;
    if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.0', '') + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.0', '') + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace('.0', '') + 'K';
    return String(n);
  }

  function avatarHtml(u, size = 52) {
    const g = GRADS[(u.grad ?? 0) % GRADS.length];
    const letter = (u.name || '؟').trim().charAt(0);
    return `<div class="avatar" style="width:${size}px;height:${size}px;font-size:${size * 0.38}px;background:linear-gradient(135deg,${g[0]},${g[1]})">${letter}</div>`;
  }

  function showScreen(id) {
    const el = typeof id === 'string' ? $(id) : id;
    if (!el) return;
    $$('.screen').forEach((s) => s.classList.remove('active'));
    el.classList.add('active');
  }

  function openModal(title, bodyHtml) {
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = bodyHtml;
    $('#modal').classList.add('open');
  }
  function closeModal() { $('#modal').classList.remove('open'); }

  $$('#modal [data-close], #giftSheet [data-close]').forEach((el) => el.addEventListener('click', () => {
    closeModal(); closeGiftSheet();
  }));

  // ===== الدخول =====
  const savedName = localStorage.getItem('yl_name');
  if (savedName) $('#authName').value = savedName;
  $('#authBtn').addEventListener('click', doAuth);
  $('#authName').addEventListener('keydown', (e) => { if (e.key === 'Enter') doAuth(); });

  function doAuth() {
    const name = $('#authName').value.trim() || 'ضيف';
    localStorage.setItem('yl_name', name);
    socket.emit('auth', { name }, (u) => {
      me = u;
      RTC.setMyId(socket.id);
      showScreen('#screen-home');
      refreshRooms();
      refreshMe();
      toast(`أهلاً ${u.name}! 🎉`);
    });
  }

  socket.on('me', (u) => { me = u; refreshMe(); });

  function refreshMe() {
    if (!me) return;
    // تحديث كل نسخ التوب بار (كل تاب له شريط علوي خاص)
    $$('.coin-pill .gold-val').forEach((e) => { e.textContent = fmt(me.gold); });
    $$('.gem-pill .jewel-val').forEach((e) => { e.textContent = fmt(me.jewels); });
    const gj = $('#giftMyJewels');
    if (gj) gj.textContent = fmt(me.jewels);
    // البروفايل
    $('#pfName').textContent = `${me.flag} ${me.name}`;
    $('#pfAvatar').textContent = me.name.charAt(0);
    const g = GRADS[me.grad % GRADS.length];
    $('#pfAvatar').style.background = `linear-gradient(135deg,${g[0]},${g[1]})`;
    $('#pfLevel').textContent = me.level;
    $('#pfXp').textContent = `${me.xp}/${me.xpNext} خبرة`;
    $('#pfLevelFill').style.width = Math.min(100, (me.xp / me.xpNext) * 100) + '%';
    $('#pfGold').textContent = fmt(me.gold);
    $('#pfJewel').textContent = fmt(me.jewels);
    $('#pfGames').textContent = me.gamesPlayed || 0;
    $('#pfBadges').innerHTML = `
      <div class="badge wealth" style="color:${me.wealth.color}">${me.wealth.title}</div>
      <div class="badge">🏅 مستوى ${me.level}</div>
      <div class="badge">🏆 انتصارات: ${me.wins || 0}</div>`;
    $('#homeName').textContent = me.name;
  }

  // أفاتار الشريط العلوي (هيكل main_header) — كل نسخ التوب بار
  function refreshHeaderAvatar() {
    if (!me) return;
    const g = GRADS[me.grad % GRADS.length];
    // أفاتار بحرف الاسم على تدرج (SVG data-uri)
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='88' height='88'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${g[0]}'/><stop offset='100%' stop-color='${g[1]}'/></linearGradient></defs><rect width='88' height='88' fill='url(#g)'/><text x='44' y='58' font-size='38' font-family='sans-serif' font-weight='900' fill='white' text-anchor='middle'>${(me.name||'؟').charAt(0)}</text></svg>`;
    $$('.avatar-hd').forEach((img) => {
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      img.style.display = 'block';
    });
  }
  socket.on('me', refreshHeaderAvatar);

  // بطاقات أنماط اللعب الحقيقية (svg_ludo من APK)
  $$('#modeGrid .mode-card').forEach((b) => b.addEventListener('click', () => {
    const mode = b.dataset.mode;
    selectedTheme = 'ludo';
    renderThemes();
    showScreen('#screen-create');
    toast(mode === 'vip' ? 'غرف VIP قادمة — أنشئ غرفة عادية الآن' : mode === 'team' ? 'الفرق: أنشئ مجلساً والعب مع أصدقائك' : mode === 'tournament' ? 'البطولة: قريباً — استمتع باللودو العادي' : 'أنشئ غرفة وابدأ ' + (mode === '2ren' ? 'لودو لاعبين' : mode === '4ren' ? 'لودو 4 لاعبين' : 'اللعب'));
  }));
  // بطاقات ألعاب الغريب — تفتح اللعبة الحقيقية من خدمة G-G المحلية (3100) داخل شاشة التطبيق
  $$('.gg-card').forEach((b) => b.addEventListener('click', () => {
    openGGGame(b.dataset.game);
  }));

  // ===== التابات الأربعة الأصلية (table_game_hall.xml): الأحداث / المعركة / المجالس / الأصدقاء =====
  const TAB_SCREENS = { home: '#screen-home', battle: '#screen-battle', events: '#screen-events', dms: '#screen-dms' };
  const TAB_ICONS = {
    home:   ['/assets/tabs/room_select.png',    '/assets/tabs/room_unselect.png'],
    battle: ['/assets/tabs/battle_select.png',  '/assets/tabs/battle_unselect.png'],
    events: ['/assets/tabs/event_select.png',   '/assets/tabs/event_unselect.png'],
    dms:    ['/assets/tabs/friend_select.png',  '/assets/tabs/friend_unselect.png'],
  };
  const TAB_LABELS = { home: 'المجالس', battle: 'المعركة', events: 'الأحداث', dms: 'الأصدقاء' };
  // حقن الشريط السفلي في كل شاشة رئيسية (نفس هيكل main_bottom_item_view)
  function injectTabbar(screenEl, activeTab) {
    if (!screenEl || screenEl.querySelector('.tabbar')) return;
    const bar = document.createElement('div');
    bar.className = 'tabbar';
    bar.innerHTML = ['events', 'battle', 'home', 'dms'].map((t) => `
      <button data-tab="${t}" class="${t === activeTab ? 'active' : ''}">
        <span class="ic"><img class="tab-ic" src="${TAB_ICONS[t][t === activeTab ? 0 : 1]}" data-off="${TAB_ICONS[t][1]}" data-on="${TAB_ICONS[t][0]}" alt=""></span>
        <span class="tl">${TAB_LABELS[t]}</span>
      </button>`).join('');
    screenEl.appendChild(bar);
    bar.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  }
  function injectTopbars() {
    $$('.screen [data-topbar]').forEach((slot) => {
      slot.appendChild($('#tpl-topbar').content.cloneNode(true));
      slot.removeAttribute('data-topbar');
    });
    $$('.screen[data-has-tabbar]').forEach((el) => {
      const tab = el.dataset.hasTabbar;
      injectTabbar(el, tab);
      el.removeAttribute('data-has-tabbar');
    });
  }
  function setActiveTab(tab) {
    $$('.tabbar button').forEach((b) => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('active', on);
      const img = b.querySelector('.tab-ic');
      if (img) img.src = on ? img.dataset.on : img.dataset.off;
    });
  }
  function switchTab(tab) {
    setActiveTab(tab);
    const scr = $(TAB_SCREENS[tab] || '#screen-home');
    showScreen(scr);
    if (tab === 'home') refreshRooms();
    if (tab === 'dms') renderDmList();
    if (tab === 'profile') refreshMe();
  }
  injectTopbars();
  $$('.screen[data-has-tabbar]').forEach((el) => injectTabbar(el, el.dataset.hasTabbar));
  // حالة بداية الشريط السفلي (المجالس مفعّلة افتراضياً)
  setActiveTab('home');

  // ===== الغرف =====
  function refreshRooms() {
    socket.emit('rooms:list', (rooms) => {
      const grid = $('#roomsGrid');
      $('#roomsEmpty').style.display = rooms.length ? 'none' : 'block';
      grid.innerHTML = rooms.map((r) => `
        <button class="room-card" data-id="${r.id}">
          <div class="rc-theme" style="background:linear-gradient(135deg,${r.theme.from},${r.theme.to})">${r.theme.emoji}</div>
          <div class="rc-name">${r.locked ? '🔒 ' : ''}${r.name}</div>
          <div class="rc-meta"><span class="live-dot"></span> ${r.members} داخل <span style="margin-right:auto"></span>${r.hasGame ? '🎮' : ''}</div>
        </button>`).join('');
      grid.querySelectorAll('.room-card').forEach((c) => c.addEventListener('click', () => joinRoom(c.dataset.id)));
      // لوحة الصدارة المصغرة
      socket.emit('leaderboard', (lb) => {
        $('#homeLb').innerHTML = lb.wealth.slice(0, 3).map((u, i) => `
          <div class="lb-row"><span class="rank">${['🥇', '🥈', '🥉'][i]}</span>
          <span class="rn">${u.flag} ${u.name}</span><span class="rv"><img class="stat-ic" src="/assets/currency/base_icon_coin_s.png" alt=""> ${fmt(u.spentGold)}</span></div>`).join('') ||
          '<div class="empty-hint" style="padding:10px">لا تصنف بعد — أرسل هدايا لتظهر هنا!</div>';
      });
    });
  }
  $('#btnRefreshRooms').addEventListener('click', refreshRooms);

  // إنشاء غرفة
  let selectedTheme = 'talk';
  function renderThemes() {
    const THEMES = {
      talk: { emoji: '🎤', name: 'كلام وفله', from: '#FF6B9D', to: '#C2185B' },
      ludo: { emoji: '🎲', name: 'لودو وألعاب', from: '#7C4DFF', to: '#512DA8' },
      games: { emoji: '🎮', name: 'تحديات', from: '#00C9A7', to: '#00796B' },
      chill: { emoji: '☕', name: 'قهوة وسوالف', from: '#FFB75E', to: '#ED8F03' },
      music: { emoji: '🎵', name: 'طرب وأهازيج', from: '#F857A6', to: '#A4508B' },
      sport: { emoji: '⚽', name: 'رياضة', from: '#43C6AC', to: '#191654' },
    };
    const box = $('#crThemes');
    box.innerHTML = Object.entries(THEMES).map(([k, t]) => `
      <button class="gift-item ${k === selectedTheme ? 'selected' : ''}" data-theme="${k}">
        <div style="width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;background:linear-gradient(135deg,${t.from},${t.to})">${t.emoji}</div>
        <div class="gname">${t.name}</div>
      </button>`).join('');
    box.querySelectorAll('[data-theme]').forEach((b) => b.addEventListener('click', () => {
      selectedTheme = b.dataset.theme; renderThemes();
    }));
  }

  $('#crBtn').addEventListener('click', () => {
    const name = $('#crName').value.trim() || 'غرفة جديدة';
    const pass = $('#crPass').value.trim();
    socket.emit('room:create', { name, theme: selectedTheme, password: pass }, (res) => {
      if (res.ok) { $('#crName').value = ''; $('#crPass').value = ''; joinRoom(res.roomId); }
    });
  });

  function joinRoom(roomId, password) {
    socket.emit('room:join', { roomId, password }, (res) => {
      if (!res.ok) {
        if (res.error && res.error.includes('كلمة المرور')) {
          const p = prompt('هذه الغرفة مقفلة 🔒 — أدخل كلمة المرور:');
          if (p) joinRoom(roomId, p);
          return;
        }
        toast(res.error || 'تعذر الدخول'); return;
      }
      currentRoom = res.room;
      roomMessages = res.messages || [];
      showScreen('#screen-room');
      renderRoom();
      RTC.setMyId(socket.id);
      socket.emit('rtc:ready');
      // runway دخول العضو (float_item2)
      const rw = $('#enterRunway');
      if (rw) {
        rw.innerHTML = `<span class="er-pill">🎉 ${me.name} دخل المجلس</span>`;
        setTimeout(() => { rw.innerHTML = ''; }, 3000);
      }
    });
  }

  $('#roomClose').addEventListener('click', () => {
    RTC.leaveAll();
    $('#btnMic').classList.remove('active');
    if ($('#micImg')) $('#micImg').src = '/assets/ui/room_ic_input_mic_off.png';
    socket.emit('room:leave');
    showScreen('#screen-home');
    refreshRooms();
  });

  socket.on('room:left', () => {});

  function renderRoom() {
    if (!currentRoom) return;
    $('#roomName').textContent = `${currentRoom.theme.emoji} ${currentRoom.name}`;
    $('#roomId').textContent = currentRoom.id ? currentRoom.id.slice(-9) : '—';
    renderSeats();
    renderChat();
    Games.setState(currentRoom.hasGame === 'snake' ? { type: 'snake' } : null);
    if (currentRoom.gameType === 'snake') {} // الحالة تفصيلية تأتي من game:state
  }

  // ===== المقاعد =====
  socket.on('seat:update', (seats) => { if (currentRoom) { currentRoom.seats = seats; renderSeats(); } });
  socket.on('room:state', (room) => {
    currentRoom = room;
    renderRoom();
  });

  function renderSeats() {
    const grid = $('#seatsGrid');
    const seats = currentRoom.seats;
    seatGrads = {};
    seats.forEach((s, i) => { if (s) seatGrads[i] = s.grad; });
    // المضيف (أول مقعد) يظهر أعلى الوسط مثل الصور الحقيقية
    const host = $('#hostSeat');
    const hostIdx = seats.findIndex((s, i) => i === 0);
    const hs = seats[0];
    if (hs) {
      const isMeH = hs.id === me.id;
      host.innerHTML = `<button class="seat host ${isMeH ? 'me-seat' : ''}" data-seat="0" data-uid="${hs.id}" data-name="${hs.name}">
        <span class="crown">👑</span>
        ${avatarHtml(hs, 84)}
        <span class="sname">${hs.name}</span>
        <span class="slevel" style="color:${hs.wealth ? hs.wealth.color : '#fff'}">${hs.wealth ? hs.wealth.title : ''} · ${hs.level}</span>
        ${hs.muted ? '<div class="mic-badge"><img src="/assets/ui/room_ic_input_mic_off.png" alt="مكتوم"></div>' : '<div class="mic-badge on"><img src="/assets/ui/room_ic_input_mic.png" alt="مايك"></div>'}
      </button>`;
    } else {
      host.innerHTML = `<button class="seat host empty" data-seat="0">
        <img class="mic-emoji" src="/assets/ui/room_mic.png" alt="مايك"><span class="add-hint">المضيف</span>
      </button>`;
    }
    // بقية المقاعد 1..7
    grid.innerHTML = seats.slice(1).map((s, k) => {
      const i = k + 1;
      if (!s) {
        return `<button class="seat empty" data-seat="${i}">
          <span class="seat-num">${i + 1}</span>
          <img class="mic-emoji" src="/assets/ui/room_mic.png" alt="مايك">
        </button>`;
      }
      const isMe = s.id === me.id;
      const micBadge = s.muted
        ? '<div class="mic-badge"><img src="/assets/ui/room_ic_input_mic_off.png" alt="مكتوم"></div>'
        : '<div class="mic-badge on"><img src="/assets/ui/room_ic_input_mic.png" alt="مايك"></div>';
      return `<button class="seat ${isMe ? 'me-seat' : ''}" data-seat="${i}" data-uid="${s.id}" data-name="${s.name}">
        <span class="seat-num">${i + 1}</span>
        ${avatarHtml(s)}
        <span class="sname">${s.name}</span>
        <span class="slevel" style="color:${s.wealth ? s.wealth.color : '#fff'}">${s.wealth ? s.wealth.title : ''} · ${s.level}</span>
        ${micBadge}
      </button>`;
    }).join('');

    grid.querySelectorAll('.seat').forEach((el) => {
      el.addEventListener('click', () => onSeatTap(+el.dataset.seat, el.dataset.uid, el.dataset.name));
    });
    const hostBtn = host.querySelector('.seat');
    if (hostBtn) hostBtn.addEventListener('click', () => onSeatTap(0, hostBtn.dataset.uid, hostBtn.dataset.name));

    // شريط الثروة والمشاهدين (room_include_room_sofa)
    const tw = currentRoom.totalWealth || currentRoom.members * 100 || 0;
    $('#roomWealth').textContent = fmt(tw);
    $('#roomCount').textContent = currentRoom.members;
    $('#roomAud').innerHTML = avatarHtml({ name: 'م', grad: 3 }, 22);
  }

  function onSeatTap(index, uid, name) {
    const occupied = !!currentRoom.seats[index];
    if (!occupied) {
      socket.emit('seat:take', { index }, (res) => {
        if (res && res.ok === false) toast(res.error);
      });
      return;
    }
    if (uid === me.id) {
      // أنا: خيارات
      openModal('خياراتك', `
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn" id="optMic">🎙️ ${RTC.micOn ? 'إغلاق المايك' : 'افتح المايك'}</button>
          <button class="btn secondary" id="optLeaveSeat">النزول من المقعد</button>
        </div>`);
      $('#optMic').addEventListener('click', () => { closeModal(); toggleMic(); });
      $('#optLeaveSeat').addEventListener('click', () => {
        closeModal();
        RTC.leaveAll();
        $('#btnMic').classList.remove('active');
        socket.emit('seat:leave');
      });
      return;
    }
    // مستخدم آخر: ملف مصغر + إرسال هدية + رسالة
    giftTarget = { id: uid, name, seat: index };
    openModal(name, `
      <div class="modal-body">اختر ما تريد فعله مع ${name}</div>
      <button class="btn" id="optGift">🎁 أرسل هدية</button>
      <button class="btn secondary" id="optDm">💬 رسالة خاصة</button>`);
    $('#optGift').addEventListener('click', () => { closeModal(); openGiftSheet(); });
    $('#optDm').addEventListener('click', () => {
      closeModal();
      dmPartners.set(uid, { name, grad: seatGrads[index] ?? 0 });
      openDmChat(uid, name);
    });
  }

  // ===== المايك =====
  $('#btnMic').addEventListener('click', toggleMic);

  async function toggleMic() {
    if (!me || !currentRoom) return;
    if (!me.room) { toast('ادخل غرفة أولاً'); return; }
    // يجب الجلوس على مقعد أولاً
    const mySeatIdx = currentRoom.seats.findIndex((s) => s && s.id === me.id);
    if (mySeatIdx === -1) {
      const free = currentRoom.seats.findIndex((s) => !s);
      if (free === -1) { toast('كل المقاعد مشغولة'); return; }
      await new Promise((res) => socket.emit('seat:take', { index: free }, res));
    }
    if (!RTC.micOn) {
      try {
        await RTC.enableMic();
        socket.emit('rtc:mute', { muted: false });
        $('#btnMic').classList.add('active');
        $('#micImg').src = '/assets/ui/room_ic_input_mic.png';
        toast('المايك مفتوح 🎙️ — تحدث بوضوح');
        RTC.startTalkingIndicator((talking) => {
          const idx = currentRoom && currentRoom.seats.findIndex((s) => s && s.id === me.id);
          if (idx >= 0) {
            const el = $(`.seat[data-seat="${idx}"]`);
            if (el) el.classList.toggle('talking', talking);
          }
        });
      } catch (e) {
        toast('تعذر الوصول للمايك — تأكد من الإذن');
      }
    } else {
      RTC.disableMic();
      socket.emit('rtc:mute', { muted: true });
      $('#btnMic').classList.remove('active');
      $('#micImg').src = '/assets/ui/room_ic_input_mic_off.png';
      RTC.stopTalkingIndicator();
      toast('تم كتم المايك 🔇');
    }
  }

  // إشارة WebRTC الواردة
  socket.on('rtc:signal', () => {}); // يعالجها RTC داخلياً

  // ===== الشات =====
  socket.on('chat:new', (msg) => {
    if (!currentRoom) return;
    roomMessages.push(msg);
    renderChat();
  });

  function renderChat() {
    const box = $('#chatBox');
    box.innerHTML = roomMessages.slice(-40).map((m) => {
      if (m.system) return `<div class="cmsg system">${m.text}</div>`;
      const mine = m.from === me.id;
      return `<div class="cmsg ${mine ? 'mine' : ''}">
        <span class="cname">${m.flag || ''} ${m.name}</span>        <span class="lvl"><img src="${lvlIcon(m.level)}" alt="">${m.level}</span>
        <span>${escapeHtml(m.text)}</span>
      </div>`;
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  $('#chatInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat();
  });
  function sendChat() {
    const inp = $('#chatInput');
    const text = inp.value.trim();
    if (!text) return;
    socket.emit('chat:send', { text });
    inp.value = '';
  }

  // ===== الهدايا =====
  $('#btnGift').addEventListener('click', () => { giftTarget = null; openGiftSheet(); });

  function openGiftSheet() {
    $('#giftSheet').classList.add('open');
    renderGiftGrid();
    updateGiftTargetLabel();
  }
  function closeGiftSheet() {
    $('#giftSheet').classList.remove('open');
    selectedGift = null;
    giftTarget = null;
  }

  function renderGiftGrid() {
    const grid = $('#giftGrid');
    grid.innerHTML = window.GIFT_CATALOG.map((g) => `
      <button class="gift-item ${selectedGift === g.id ? 'selected' : ''}" data-gift="${g.id}">
        <div class="gsvg">${Gifts.svg(g.id)}</div>
        <div class="gname">${g.name}</div>
        <div class="gprice ${g.price > 500000 ? 'gold-price' : ''}"><img src="${g.price > 500000 ? '/assets/currency/base_icon_coin_s.png' : '/assets/currency/diamonds.png'}" alt=""> ${fmt(g.price)}</div>
      </button>`).join('');
    grid.querySelectorAll('[data-gift]').forEach((b) => b.addEventListener('click', () => {
      selectedGift = b.dataset.gift;
      renderGiftGrid();
    }));
  }

  function updateGiftTargetLabel() {
    $('#giftTargetLabel').textContent = giftTarget
      ? `الهدية ستُرسل إلى: ${giftTarget.name}`
      : 'اختر هدية لإرسالها للغرفة (أو اضغط على عضو لتحديده)';
  }

  $('#giftSend').addEventListener('click', () => {
    if (!selectedGift) { toast('اختر هدية أولاً'); return; }
    socket.emit('gift:send', { giftId: selectedGift, toSeat: giftTarget ? giftTarget.seat : null }, (res) => {
      if (res.ok) {
        closeGiftSheet();
      } else {
        toast(res.error);
      }
    });
  });

  // استقبال هدية: أنيميشن للجميع
  socket.on('gift:new', (ev) => playGiftEvent(ev));

  function playGiftEvent(ev) {
    const layer = $('#giftLayer');
    // بانر
    const banner = document.createElement('div');
    banner.className = 'gift-banner';
    banner.innerHTML = `<span>${ev.from.flag || ''} ${ev.from.name}</span> أهدى <b>${ev.to ? ev.to.name : 'الغرفة'}</b> ${ev.giftName}`;
    layer.appendChild(banner);
    setTimeout(() => banner.remove(), 3200);

    // رسم الهدية متحركاً
    const node = Gifts.el(ev.giftId, 'gift-fly');
    node.style.width = '90px'; node.style.height = '90px';
    const big = ev.tier >= 4;
    if (big) { node.style.width = '150px'; node.style.height = '150px'; }
    node.style.left = 'calc(50% - ' + parseInt(node.style.width) / 2 + 'px)';
    node.style.bottom = '120px';

    const animMap = { rise: 'riseFade 2.4s ease forwards', float: 'floatDrift 3s ease forwards', drop: 'dropIn 2.6s ease forwards', drive: 'driveAcross 3s ease forwards', flyby: 'flyby 3s ease forwards', burst: 'burst 2.6s ease forwards', rocket: 'rocketUp 2.8s ease forwards' };
    node.style.animation = animMap[ev.anim] || animMap.rise;
    layer.appendChild(node);
    setTimeout(() => node.remove(), 3200);

    // رسالة في الشات
    roomMessages.push({
      from: null, system: true,
      text: `${ev.from.flag || ''} ${ev.from.name} أهدى ${ev.to ? ev.to.name : 'الغرفة'} ${ev.giftName} ✨`,
      at: Date.now(),
    });
    renderChat();
  }

  // ===== المحفظة =====
  $$('.coin-pill, .gem-pill').forEach((p) => p.addEventListener('click', openWallet));
  $('#btnDaily').addEventListener('click', claimDaily);

  // ===== أزرار استلام صفحة الأحداث (بطاقات event_*.xml الحقيقية) =====
  $$('.ev-recv').forEach((b) => b.addEventListener('click', () => {
    const kind = b.dataset.recv;
    // المكافأة اليومية + المهام + الصندوق الذهبي + صندوق الوصول = مكافأة يومية حقيقية
    if (kind === 'signin' || kind === 'task' || kind === 'goldbox' || kind === 'arrival') return claimDaily();
    toast('أكمل شرط النشاط أولاً 🎯');
  }));
  // عداد الساعة للصندوق الذهبي: الوقت المتبقي حتى منتصف الليل (نفس مكان rl_time_count)
  const evTimer = $('#evTimer');
  if (evTimer) {
    const tick = () => {
      const now = new Date();
      const mid = new Date(now); mid.setHours(24, 0, 0, 0);
      const s = Math.floor((mid - now) / 1000);
      evTimer.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60]
        .map((n) => String(n).padStart(2, '0')).join(':');
    };
    tick(); setInterval(tick, 1000);
  }

  function openWallet() {
    openModal('💰 المحفظة', `
      <div class="wallet-row"><img class="stat-ic" src="/assets/currency/coin_big.png" alt=""><span>الذهب</span><span class="wr-num" style="color:var(--gold)">${fmt(me.gold)}</span></div>
      <div class="wallet-row"><img class="stat-ic" src="/assets/currency/diamond_big.png" alt=""><span>المجوهرات</span><span class="wr-num" style="color:var(--gem)">${fmt(me.jewels)}</span></div>
      <div class="rate-hint">سعر التحويل: 1 💎 = 10,000 🪙</div>
      <div class="field">
        <label>كم مجوهرة تريد تحويلها من الذهب؟</label>
        <input id="exAmount" type="number" min="1" value="100">
      </div>
      <button class="btn" id="exBtn">تحويل ${'💎'}</button>
      <button class="btn gold" id="dailyBtn2">🎁 استلام المكافأة اليومية</button>
      <div class="rate-hint">المكافأة: 20-40 ألف ذهب + 200-500 مجوهرات كل 24 ساعة</div>
    `);
    $('#exBtn').addEventListener('click', () => {
      const n = parseInt($('#exAmount').value || '0', 10);
      socket.emit('wallet:exchange', { jewels: n }, (res) => {
        if (res.ok) { toast(`تم التحويل: +${fmt(n)} 💎`); openWallet(); }
        else toast(res.error);
      });
    });
    $('#dailyBtn2').addEventListener('click', claimDaily);
  }

  function claimDaily() {
    socket.emit('wallet:daily', (res) => {
      if (res.ok) {
        closeModal();
        toast(`🎁 مكافأة اليوم: +${fmt(res.gold)} 🪙 و +${res.jewels} 💎`);
        refreshMe();
      } else toast(res.error);
    });
  }

  // ===== لوحة الصدارة =====
  $('#btnLbOpen').addEventListener('click', openLeaderboard);
  $('#pfLb').addEventListener('click', openLeaderboard);

  function openLeaderboard(tab = 'wealth') {
    socket.emit('leaderboard', (lb) => {
      const rows = tab === 'wealth' ? lb.wealth : lb.levels;
      openModal('🏆 لوحة الصدارة', `
        <div class="lb-tabs">
          <button class="lb-tab ${tab === 'wealth' ? 'active' : ''}" id="lbWealth">الأغنى 🪙</button>
          <button class="lb-tab ${tab === 'levels' ? 'active' : ''}" id="lbLevels">المستويات ⭐</button>
        </div>
        ${rows.map((u, i) => `
          <div class="lb-row">
            <span class="rank">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
            <span class="rn">${u.flag} ${u.name}</span>
            <span class="rv">${tab === 'wealth' ? '<img class="stat-ic" src="/assets/currency/base_icon_coin_s.png" alt=""> ' + fmt(u.spentGold) : 'مستوى ' + u.level}</span>
          </div>`).join('') || '<div class="empty-hint">لا بيانات بعد</div>'}
      `);
      $('#lbWealth').addEventListener('click', () => openLeaderboard('wealth'));
      $('#lbLevels').addEventListener('click', () => openLeaderboard('levels'));
    });
  }

  $('#pfAbout').addEventListener('click', () => {
    openModal('ℹ️ عن التطبيق', `
      <div class="modal-body">
        <b>Yalla Ludo</b> — مجالس صوتية وألعاب لودو.<br><br>
        🪙 <b>الذهب</b>: يُكسب من الألعاب والمكافأة اليومية<br>
        💎 <b>المجوهرات</b>: عملة الهدايا الفاخرة<br>
        ⭐ <b>المستوى</b>: يرتفع بالتفاعل والهدايا<br>
        👑 <b>ألقاب الثروة</b>: حسب مجموع ما أهديته<br><br>
        النسخة الأولى للتجربة — قريباً: المزيد من الألعاب والهدايا المتحركة.
      </div>`);
  });

  // ===== البوتات =====
  const botAdd = $('#btnBotAdd');
  if (botAdd) botAdd.addEventListener('click', () => socket.emit('bots:add'));

  // ===== الرسائل الخاصة =====
  socket.on('dm:new', ({ key, messages }) => {
    const parts = key.split('|');
    const other = parts.find((p) => p !== me.id);
    if (messages.length) {
      const last = messages[messages.length - 1];
      dmPartners.set(other, dmPartners.get(other) || { name: 'مستخدم', grad: 0 });
    }
    if (dmPartner === other) renderDmThread(messages);
    renderDmList();
  });

  function renderDmList() {
    const list = $('#dmList');
    const rows = [...dmPartners.entries()];
    $('#dmEmpty').style.display = rows.length ? 'none' : 'block';
    $('#socCount').textContent = `عدد الأصدقاء: ${rows.length}`;
    const badge = $('#sideMsgBadge');
    if (badge) { badge.style.display = 'none'; }
    list.innerHTML = rows.map(([id, p]) => `
      <button class="dm-row" data-uid="${id}">
        ${avatarHtml({ name: p.name, grad: p.grad }, 44)}
        <div><div class="dm-name">${p.name}</div><div class="dm-last">اضغط للفتح...</div></div>
        <span class="spacer" style="flex:1"></span>
        <button class="btn small secondary dm-msg-btn" data-msg="${id}">Message</button>
      </button>`).join('');
    list.querySelectorAll('[data-uid]').forEach((r) => r.addEventListener('click', (e) => {
      if (e.target.closest('[data-msg]')) return;
      openDmChat(r.dataset.uid, dmPartners.get(r.dataset.uid).name);
    }));
    list.querySelectorAll('[data-msg]').forEach((b) => b.addEventListener('click', () => {
      const p = dmPartners.get(b.dataset.msg);
      openDmChat(b.dataset.msg, p ? p.name : 'مستخدم');
    }));
  }

  function openDmChat(uid, name) {
    dmPartner = uid;
    $('#dmTitle').textContent = name;
    showScreen('#screen-dmchat');
    socket.emit('dm:history', { with: uid }, (msgs) => renderDmThread(msgs));
  }

  function renderDmThread(msgs) {
    $('#dmThread').innerHTML = msgs.map((m) => `
      <div class="dm-msg ${m.from === me.id ? 'mine' : ''}">${escapeHtml(m.text)}</div>`).join('');
    const t = $('#dmThread');
    t.scrollTop = t.scrollHeight;
  }

  $('#dmBack').addEventListener('click', () => { dmPartner = null; showScreen('#screen-dms'); });
  $('#dmSend').addEventListener('click', sendDm);
  $('#dmInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendDm(); });
  function sendDm() {
    const inp = $('#dmInput');
    const text = inp.value.trim();
    if (!text || !dmPartner) return;
    socket.emit('dm:send', { to: dmPartner, text });
    inp.value = '';
  }

  // ===== الألعاب =====
  $('#btnGames').addEventListener('click', openGamesModal);

  // رجوع من إنشاء غرفة + البروفايل + أزرار الشريط الجانبي
  $('#crBack').addEventListener('click', () => switchTab('battle'));
  $('#pfBack').addEventListener('click', () => switchTab('home'));
  $('#btnRoomMore').addEventListener('click', () => toast('قائمة الغرفة: قريباً'));
  $('#btnSpeaker').addEventListener('click', () => toast('الصوت مفتوح دائماً')); 
  $('#btnEmoji').addEventListener('click', () => { $('#chatInput').value += '😊'; $('#chatInput').focus(); });
  $('#btnSideMusic').addEventListener('click', () => toast('الموسيقى: قريباً'));
  $('#btnSideLucky').addEventListener('click', () => toast('عجلة الحظ: قريباً'));
  $('#btnSideMsgs').addEventListener('click', () => { switchTab('dms'); });
  $('#btnAddFriend').addEventListener('click', () => {
    socket.emit('users:list', (users) => {
      if (!users || !users.length) { toast('لا يوجد أعضاء متصلين الآن'); return; }
      openModal('أضف صديقاً للعبة', users.map((u) => `
        <button class="menu-row" data-add="${u.id}" style="width:100%">
          ${avatarHtml(u, 36)}<span style="margin-inline-start:8px">${u.flag} ${u.name}</span>
          <span class="spacer" style="flex:1"></span>${u.inRoom ? '🟢 داخل مجلس' : '⚪ متصل'}
        </button>`).join(''));
      $$('#modalBody [data-add]').forEach((b) => b.addEventListener('click', () => {
        const u = users.find((x) => x.id === b.dataset.add);
        closeModal(); openDmChat(u.id, u.name);
      }));
    });
  });

  function openGamesModal() {
    openModal('🎮 الألعاب', `
      <button class="btn" id="gLudo">🎲 لودو — لعبة يلا الشهيرة (2-4 لاعبين)</button>
      <button class="btn secondary" id="gSnake">🐍 سلم وثعبان (مع كل من على المقاعد)</button>
      <button class="btn gold" id="gSebha">📿 المسبحة — سبق وتسبيح جماعي</button>
      <button class="btn secondary" id="gStop">إنهاء اللعبة الحالية</button>`);
    $('#gLudo').addEventListener('click', () => {
      socket.emit('game:start', { type: 'ludo' }, (res) => {
        closeModal();
        if (!res.ok) toast(res.error);
      });
    });
    $('#gSnake').addEventListener('click', () => {
      socket.emit('game:start', { type: 'snake' }, (res) => {
        closeModal();
        if (!res.ok) toast(res.error);
      });
    });
    $('#gSebha').addEventListener('click', () => {
      socket.emit('game:start', { type: 'sebha' }, (res) => {
        closeModal();
        if (!res.ok) toast(res.error);
      });
    });
    $('#gStop').addEventListener('click', () => {
      socket.emit('game:stop');
      closeModal();
    });
  }

  socket.on('game:state', (g) => {
    if (!currentRoom) return;
    Games.setState(g);
    if (g && g.type === 'snake') {
      $('#gameStrip').classList.add('show');
      const myTurn = g.turnSeat === mySeatIndex();
      $('#btnDice').disabled = !myTurn;
      $('#btnDice').textContent = myTurn ? '🎲 دورك! ارمِ النرد' : '🎲 انتظر دورك...';
    } else {
      $('#gameStrip').classList.remove('show');
    }
  });

  function mySeatIndex() {
    if (!currentRoom || !me) return -1;
    const s = currentRoom.seats.findIndex((x) => x && x.id === me.id);
    return s;
  }

  socket.on('snake:dice', ({ seat, dice }) => Games.animateDice(seat, dice, () => {}));

  socket.on('snake:move', ({ seat, from, to }) => {
    // الحركة الكاملة تصل عبر game:state التالي؛ هنا فقط للتوثيق
  });

  socket.on('game:over', ({ winnerSeat, winnerName }) => {
    toast(`🏆 مبروك ${winnerName}! فاز بجولة سلم وثعبان (+50 ألف ذهب)`);
    if (currentRoom) setTimeout(() => Games.setState(null), 3000);
  });

  $('#btnDice').addEventListener('click', () => socket.emit('snake:roll'));
  $('#btnGameStop').addEventListener('click', () => socket.emit('game:stop'));

  // ===== اللودو (الواجهة) =====
  let ludoReady = false;
  socket.on('game:state', (g) => {
    if (g && g.type === 'ludo') {
      $('#ludoWrap').style.display = 'block';
      if (!ludoReady) { LudoUI.init((ti) => socket.emit('ludo:move', { token: ti })); ludoReady = true; }
      setTimeout(() => LudoUI.resize(), 50);
    } else if (!g) {
      $('#ludoWrap').style.display = 'none';
    }
  });

  socket.on('ludo:state', (g) => {
    window.__ludoState = g; // تشخيص/اختبار
    if (!g || !currentRoom) { $('#ludoWrap').style.display = 'none'; return; }
    $('#ludoWrap').style.display = 'block';
    if (!ludoReady) { LudoUI.init((ti) => socket.emit('ludo:move', { token: ti })); ludoReady = true; }
    // لوني = ترتيب مقعدي بين اللاعبين
    const myIdx = g.players.findIndex((p) => p.id === me.id);
    LudoUI.setState(g, myIdx);
    // شريط اللاعبين
    $('#ludoPlayers').innerHTML = g.players.map((p, i) => {
      const isTurn = g.turn === i;
      return `<div class="snake-player ${isTurn ? 'turn' : ''}">
        <img src="${LUDO_PIECE_ICONS[i] || LUDO_PIECE_ICONS[0]}" style="width:14px;height:14px;object-fit:contain;vertical-align:-2px;margin-left:4px" alt="">
        ${p.name}${p.bot ? ' 🤖' : ''}</div>`;
    }).join('');
    // زر النرد والتلميحات
    const myPi = g.players.findIndex((p) => p.id === me.id);
    const isMyTurn = myPi >= 0 && g.turn === myPi;
    $('#btnLudoRoll').disabled = !isMyTurn || g.phase !== 'roll';
    $('#btnLudoRoll').textContent = isMyTurn
      ? (g.phase === 'roll' ? '🎲 ارمِ النرد!' : '👆 اختر قطعة للتحريك')
      : '⏳ دور ' + (g.players[g.turn] ? g.players[g.turn].name : '');
    $('#ludoHint').textContent = g.phase === 'move' && isMyTurn
      ? 'اضغط على القطعة المضاءة بالذهبي لتحريكها'
      : (g.legalMoves && g.legalMoves.length && g.phase === 'move' ? '' : '');
  });

  socket.on('ludo:dice', ({ color, dice }) => {
    LudoUI.showDice(dice, color);
  });

  socket.on('ludo:toast', ({ text }) => toast(text));

  socket.on('ludo:over', ({ winner }) => {
    toast(`🏆 ${winner} فاز بلعبة اللودو! +100 ألف ذهب`);
    setTimeout(() => { $('#ludoWrap').style.display = 'none'; }, 4000);
  });

  $('#btnLudoRoll').addEventListener('click', () => socket.emit('ludo:roll'));
  $('#btnGameStop2').addEventListener('click', () => socket.emit('game:stop'));

  // المسبحة
  $('#btnSebhaTap').addEventListener('click', () => {
    socket.emit('sebha:tap');
    const el = $('#sebhaCount');
    el.textContent = String(parseInt(el.textContent || '0', 10) + 1);
  });
  $('#btnSebhaMinus').addEventListener('click', () => {
    const el = $('#sebhaCount');
    el.textContent = String(Math.max(0, parseInt(el.textContent || '0', 10) - 1));
  });
  socket.on('sebha:count', ({ id, count }) => {
    if (id === me.id) $('#sebhaCount').textContent = String(count);
  });
  socket.on('sebha:milestone', ({ name, count }) => {
    toast(`📿 ${name} أكمل ${count} تسبيحة — +1000 🪙`);
  });

  // ===== تحميل =====
  Games.init();
  RTC.init(socket, (count) => { /* عدد الأقران الصوتيين */ });
  socket.on('connect', () => { RTC.setMyId(socket.id); });
})();
