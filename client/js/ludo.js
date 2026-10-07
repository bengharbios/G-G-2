// ===== لوحة اللودو — رسم Canvas بأسلوب يلا لودو =====
window.LudoUI = (() => {
  // هندسة مشتركة من السيرفر (نفس الإحداثيات)
  const RING = [
    [1,6],[2,6],[3,6],[4,6],[5,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0],[7,0],[8,0],
    [8,1],[8,2],[8,3],[8,4],[8,5],[9,6],[10,6],[11,6],[12,6],[13,6],[14,6],[14,7],[14,8],
    [13,8],[12,8],[11,8],[10,8],[9,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[7,14],[6,14],
    [6,13],[6,12],[6,11],[6,10],[6,9],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8],[0,7],[0,6],
  ];
  const STARTS = [0, 13, 26, 39];
  const SAFE = new Set([0, 13, 26, 39, 8, 21, 34, 47]);
  const HOME_PATHS = [
    [[1,7],[2,7],[3,7],[4,7],[5,7]],
    [[7,1],[7,2],[7,3],[7,4],[7,5]],
    [[13,7],[12,7],[11,7],[10,7],[9,7]],
    [[7,13],[7,12],[7,11],[7,10],[7,9]],
  ];
  // ترتيب القواعد في رقعة يلا 13001 الحقيقية: أحمر أسفل-يسار، أخضر أعلى-يسار، أصفر أسفل-يمين، أزرق أعلى-يمين
  const BASES = [{x:0,y:9},{x:0,y:0},{x:9,y:9},{x:9,y:0}];
  const COLORS = [
    { name:'red',    i:0, main:'#FF4D5E', dark:'#C6202F', light:'#FFD5D9' },
    { name:'green',  i:1, main:'#2EDB74', dark:'#0FA34D', light:'#D3FBE4' },
    { name:'yellow', i:2, main:'#FFC53D', dark:'#D89400', light:'#FFF0C7' },
    { name:'blue',   i:3, main:'#2E9BFF', dark:'#0F5FC6', light:'#D6E9FF' },
  ];
  const WIN_POS = 56;

  let canvas, ctx, cell;
  let state = null;
  let myColor = -1;
  let onSelect = null;
  let anims = [];       // أنيميشنات القطع
  let lastTokens = null;

  // قطع يلا لودو الحقيقية (من APK) — تُحمّل مسبقاً
  const PIECE_IMGS = [
    'assets/pieces/piece_red.png', 'assets/pieces/piece_green.png',
    'assets/pieces/piece_yellow.png', 'assets/pieces/piece_bule.png',
  ].map((src) => { const im = new Image(); im.src = src; return im; });
  // الرقعة الحقيقية من CDN يلا (سكن 13001 الكلاسيكي)
  const BOARD_IMG = (() => { const im = new Image(); im.src = 'assets/board/Checkerboard_13001.png'; return im; })();

  function drawAnims() { /* محجوز لحركة انتقالية مستقبلية */ }

  // رقعة احتياطية مرسومة (تُستخدم فقط قبل تحميل صورة الرقعة الحقيقية)
  function drawFallbackBoard() {
    BASES.forEach((b, ci) => {
      const c = COLORS[ci];
      const x = b.x * cell, y = b.y * cell, w = 6 * cell;
      ctx.fillStyle = c.light;
      roundRect(x + 2, y + 2, w - 4, w - 4, cell * 0.9);
      ctx.fill();
      ctx.fillStyle = '#fff';
      roundRect(x + cell * 0.9, y + cell * 0.9, w - cell * 1.8, w - cell * 1.8, cell * 0.6);
      ctx.fill();
      [[0,0],[1,0],[0,1],[1,1]].forEach(([dx, dy]) => {
        const px = x + cell * (1.7 + dx * 2.1), py = y + cell * (1.7 + dy * 2.1);
        ctx.beginPath();
        ctx.arc(px + cell * 0.5, py + cell * 0.5, cell * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = c.main + '33';
        ctx.fill();
        ctx.strokeStyle = c.main; ctx.lineWidth = 1.5; ctx.stroke();
      });
    });
    RING.forEach(([gx, gy], i) => {
      ctx.fillStyle = SAFE.has(i) ? '#F2F5FA' : '#fff';
      ctx.strokeStyle = SAFE.has(i) ? '#c9d4e3' : '#dde4ee';
      ctx.lineWidth = 1;
      roundRect(gx * cell + 1, gy * cell + 1, cell - 2, cell - 2, cell * 0.22);
      ctx.fill(); ctx.stroke();
    });
    for (let ci = 0; ci < 4; ci++) {
      const c = COLORS[ci];
      const [sx, sy] = RING[STARTS[ci]];
      ctx.fillStyle = c.main;
      roundRect(sx * cell + 1, sy * cell + 1, cell - 2, cell - 2, cell * 0.22);
      ctx.fill();
      HOME_PATHS[ci].forEach(([hx, hy], hi) => {
        ctx.fillStyle = c.main;
        ctx.globalAlpha = 0.45 + hi * 0.11;
        roundRect(hx * cell + 1, hy * cell + 1, cell - 2, cell - 2, cell * 0.22);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }
    const cxx = cx(7), cyy = cy(7);
    const r = cell * 1.5;
    for (let ci = 0; ci < 4; ci++) {
      const ang = [[-1,0],[0,-1],[1,0],[0,1]][ci];
      ctx.beginPath();
      ctx.moveTo(cxx, cyy);
      ctx.lineTo(cxx + ang[0] * r - ang[1] * r * 0.7, cyy + ang[1] * r - ang[0] * r * 0.7);
      ctx.lineTo(cxx + ang[0] * r + ang[1] * r * 0.7, cyy + ang[1] * r + ang[0] * r * 0.7);
      ctx.closePath();
      ctx.fillStyle = COLORS[ci].main;
      ctx.fill();
    }
  }

  function init(onTokenClick) {
    canvas = document.getElementById('ludoBoard');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    onSelect = onTokenClick || null;
    canvas.addEventListener('click', onTap);
    resize();
  }

  function resize() {
    if (!canvas) return;
    const w = canvas.parentElement.clientWidth;
    canvas.width = w; canvas.height = w;
    cell = w / 15;
    draw();
  }

  function cx(gx) { return gx * cell + cell / 2; }
  function cy(gy) { return gy * cell + cell / 2; }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // خلفية اللوحة
    ctx.fillStyle = '#ffffff';
    roundRect(0, 0, canvas.width, canvas.height, cell);
    ctx.fill();

    // ===== رقعة يلا لودو الحقيقية (Checkerboard من CDN) =====
    if (BOARD_IMG.complete && BOARD_IMG.naturalWidth) {
      ctx.drawImage(BOARD_IMG, 0, 0, canvas.width, canvas.height);
    } else {
      drawFallbackBoard();
    }

    // القطع
    if (state) {
      // تجميع القطع على نفس الخلية
      const at = {}; // key -> [{pi,ti}]
      for (let pi = 0; pi < 4; pi++) {
        if (!state.tokens[pi]) continue;
        state.tokens[pi].forEach((rel, ti) => {
          if (rel === -1) return;
          let gx, gy;
          if (rel <= 50) { [gx, gy] = RING[(STARTS[pi] + rel) % 52]; }
          else if (rel <= 55) { [gx, gy] = HOME_PATHS[pi][rel - 51]; }
          else { gx = 7; gy = 7; }
          const key = rel <= 55 ? `${gx},${gy}` : 'c';
          (at[key] = at[key] || []).push({ pi, ti, gx, gy });
        });
      }
      Object.values(at).forEach((group) => {
        group.forEach((tok, k) => {
          const c = COLORS[tok.pi];
          const off = group.length > 1 ? (k - (group.length - 1) / 2) * cell * 0.3 : 0;
          const px = cx(tok.gx) + off, py = cy(tok.gy) - Math.abs(off) * 0.3;
          drawToken(px, py, c, tok.pi === myColor, state.legalMoves && state.turn === tok.pi && state.legalMoves.includes(tok.ti) && tok.pi === state.turn);
        });
      });
      // قطع القواعد
      for (let pi = 0; pi < 4; pi++) {
        if (!state.tokens[pi]) continue;
        const b = BASES[pi], c = COLORS[pi];
        let k = 0;
        state.tokens[pi].forEach((rel) => {
          if (rel !== -1) return;
          const dx = k % 2, dy = Math.floor(k / 2);
          k++;
          const px = (b.x + 1.7 + dx * 2.1) * cell + cell * 0.5;
          const py = (b.y + 1.7 + dy * 2.1) * cell + cell * 0.5;
          drawToken(px, py, c, pi === myColor, false);
        });
      }
    }

    drawAnims();
  }

  function drawToken(x, y, c, isMine, selectable) {
    const r = cell * 0.36;
    const img = PIECE_IMGS[c.i];
    // ظل
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.75, r * 0.8, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(27,37,55,.18)';
    ctx.fill();
    if (img && img.complete && img.naturalWidth) {
      // القطعة الحقيقية من يلا لودو
      const s = r * 2.5;
      ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
    } else {
      // بديل احتياطي: بون دائري
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = c.main;
      ctx.fill();
      ctx.lineWidth = isMine ? 2.5 : 1.5;
      ctx.strokeStyle = isMine ? '#fff' : c.dark;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fill();
    }
    if (selectable) {
      ctx.beginPath();
      ctx.arc(x, y, r * 1.35, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFC53D';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawStar(x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // أنيميشن النرد
  let diceAnim = null; // {dice, color, until}
  function showDice(dice, color) {
    diceAnim = { dice, color, until: Date.now() + 1600 };
    drawDice();
  }
  function drawDice() {
    if (!diceAnim || !ctx) return;
    const c = COLORS[diceAnim.color];
    const x = canvas.width / 2, y = canvas.height / 2, s = cell * 2.2;
    ctx.save();
    ctx.globalAlpha = 0.97;
    ctx.shadowColor = 'rgba(27,37,55,.35)'; ctx.shadowBlur = 22;
    // نرد ذهبي بتدرج كنرد يلا لودو
    const grad = ctx.createLinearGradient(x - s / 2, y - s / 2, x + s / 2, y + s / 2);
    grad.addColorStop(0, '#FFE082');
    grad.addColorStop(0.5, '#FFC53D');
    grad.addColorStop(1, '#F59E00');
    ctx.fillStyle = grad;
    roundRect(x - s / 2, y - s / 2, s, s, s * 0.24);
    ctx.fill();
    ctx.shadowBlur = 0;
    // إطار داخلي
    ctx.strokeStyle = 'rgba(255,255,255,.65)';
    ctx.lineWidth = 2;
    roundRect(x - s / 2 + 3, y - s / 2 + 3, s - 6, s - 6, s * 0.2);
    ctx.stroke();
    const pips = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[diceAnim.dice];
    pips.forEach((p) => {
      const px = x - s / 2 + ((p % 3) + 1) * (s / 4);
      const py = y - s / 2 + (Math.floor(p / 3) + 1) * (s / 4);
      ctx.beginPath();
      ctx.arc(px, py, s * 0.085, 0, Math.PI * 2);
      ctx.fillStyle = '#7A4A00';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px - s * 0.02, py - s * 0.02, s * 0.055, 0, Math.PI * 2);
      ctx.fillStyle = '#FFF3D6';
      ctx.fill();
    });
    ctx.restore();
    if (Date.now() < diceAnim.until) setTimeout(drawDice, 60);
    else { diceAnim = null; draw(); }
  }

  // نقر على قطعة
  function onTap(e) {
    if (!state || !onSelect) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    if (state.turn !== myColor || state.phase !== 'move') return;
    // القطع القابلة للتحريك
    for (const ti of (state.legalMoves || [])) {
      const rel = state.tokens[myColor][ti];
      let gx, gy;
      if (rel === -1) continue;
      if (rel <= 50) { [gx, gy] = RING[(STARTS[myColor] + rel) % 52]; }
      else if (rel <= 55) { [gx, gy] = HOME_PATHS[myColor][rel - 51]; }
      else continue;
      if (Math.hypot(x - cx(gx), y - cy(gy)) < cell * 0.75) {
        onSelect(ti);
        return;
      }
    }
    // قطعة في القاعدة (فتح بستة)
    if (state.dice === 6) {
      for (let ti = 0; ti < 4; ti++) {
        if (state.tokens[myColor][ti] === -1 && state.legalMoves.includes(ti)) {
          const b = BASES[myColor];
          // منطقة القاعدة كاملة قابلة للنقر
          if (x > b.x * cell && x < (b.x + 6) * cell && y > b.y * cell && y < (b.y + 6) * cell) {
            onSelect(ti);
            return;
          }
        }
      }
    }
  }

  function setState(s, myCol) {
    state = s;
    if (typeof myCol === 'number') myColor = myCol;
    try { draw(); } catch (e) { console.error('ludo draw error', e); }
  }

  window.addEventListener('resize', resize);

  return { init, setState, showDice, draw, resize };
})();
