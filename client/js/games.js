// ===== الألعاب: سلم وثعبان (لوحة canvas) + المسبحة =====
window.Games = (() => {
  // مواقع السلالم والثعابين (يجب أن تطابق السيرفر)
  const LADDERS = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92, 92: 98, 89: 68 };
  const SNK = { 29: 9, 34: 12, 47: 16, 55: 33, 61: 19, 72: 51, 79: 40, 83: 61, 87: 57, 91: 30, 96: 66, 98: 78 };

  let canvas, ctx;
  let state = null; // { positions, turnSeat, players }
  let animating = false;

  // نرد يلا لودو الذهبي الحقيقي (من APK)
  const DICE_IMG = (() => { const im = new Image(); im.src = '/assets/misc/gold_dice.png'; return im; })();

  const COLORS = ['#ff5e9c', '#4dd8ff', '#ffc93c', '#35d07f', '#c86bff', '#ff8a5c', '#5c9dff', '#ff6b6b'];

  function init() {
    canvas = document.getElementById('snakeBoard');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    draw();
  }

  function cellCenter(n) {
    // لوحة 10×10، الخلية 1 أسفل اليمين (اتجاه عربي)
    const size = canvas.width / 10;
    const row = Math.floor((n - 1) / 10);          // 0 أسفل
    const col = (n - 1) % 10;
    const fromRight = row % 2 === 0;
    const x = fromRight ? (9 - col) : col;
    const y = 9 - row;
    return { x: x * size + size / 2, y: y * size + size / 2, size };
  }

  function draw() {
    if (!ctx) return;
    const W = canvas.width, H = canvas.height, s = W / 10;
    ctx.clearRect(0, 0, W, H);

    // خلفية الرقعة
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const n = cellNumberAt(r, c);
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)';
        ctx.fillRect(c * s, r * s, s, s);
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        ctx.font = '8px sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(String(n), c * s + 3, r * s + 2);
      }
    }

    // السلالم
    ctx.lineWidth = 3;
    Object.entries(LADDERS).forEach(([from, to]) => {
      const a = cellCenter(+from), b = cellCenter(to);
      ctx.strokeStyle = 'rgba(80, 200, 120, .65)';
      ctx.beginPath();
      ctx.moveTo(a.x - a.size * 0.22, a.y); ctx.lineTo(b.x - b.size * 0.22, b.y);
      ctx.moveTo(a.x + a.size * 0.22, a.y); ctx.lineTo(b.x + b.size * 0.22, b.y);
      ctx.stroke();
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const x1 = a.x - a.size * 0.22 + ((b.x - a.x) * i) / steps;
        const y1 = a.y + ((b.y - a.y) * i) / steps;
        ctx.beginPath();
        ctx.moveTo(x1 - a.size * 0.22, y1); ctx.lineTo(x1 + a.size * 0.22, y1);
        ctx.strokeStyle = 'rgba(120, 220, 150, .5)'; ctx.stroke();
      }
    });

    // الثعابين (خطوط متعرجة)
    Object.entries(SNK).forEach(([from, to]) => {
      const a = cellCenter(+from), b = cellCenter(to);
      ctx.strokeStyle = 'rgba(255, 90, 90, .55)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.3;
      const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.3;
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.stroke();
    });

    // اللاعبون
    if (state) {
      const byCell = {};
      Object.entries(state.positions).forEach(([seat, pos]) => {
        if (pos <= 0) return;
        (byCell[pos] = byCell[pos] || []).push(+seat);
      });
      Object.entries(state.positions).forEach(([seat, pos]) => {
        const p = state.players.find((pl) => pl.seat === +seat);
        if (!p) return;
        const color = COLORS[+seat % COLORS.length];
        let x, y;
        if (pos <= 0) { x = W - 14; y = H - 14; }
        else {
          const cc = cellCenter(pos);
          const group = byCell[pos] || [+seat];
          const idx = group.indexOf(+seat);
          const off = (idx - (group.length - 1) / 2) * 10;
          x = cc.x + off; y = cc.y;
        }
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        if (state.turnSeat === +seat) {
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffc93c'; ctx.lineWidth = 2; ctx.stroke();
        }
      });
    }
  }

  function cellNumberAt(r, c) {
    const row = 9 - r;
    const col = row % 2 === 0 ? 9 - c : c;
    return row * 10 + col + 1;
  }

  function setState(s) {
    state = s;
    const wrap = document.getElementById('snakeWrap');
    if (s && s.type === 'snake') {
      wrap.style.display = 'block';
      document.getElementById('sebhaWrap').style.display = 'none';
      renderPlayers(s);
      draw();
    } else if (s && s.type === 'sebha') {
      document.getElementById('sebhaWrap').style.display = 'block';
      wrap.style.display = 'none';
    } else {
      wrap.style.display = 'none';
      document.getElementById('sebhaWrap').style.display = 'none';
    }
  }

  function renderPlayers(s) {
    const box = document.getElementById('snakePlayers');
    box.innerHTML = s.players.map((p) => {
      const color = COLORS[p.seat % COLORS.length];
      const isTurn = s.turnSeat === p.seat;
      return `<div class="snake-player ${isTurn ? 'turn' : ''}" style="color:${color}">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-left:4px"></span>
        ${p.name}${isTurn ? ' 🎲' : ''}</div>`;
    }).join('');
  }

  function animateDice(seat, dice, cb) {
    if (!canvas) return cb();
    animating = true;
    let ticks = 0;
    const drawDiceFace = (n) => {
      const d = Math.max(24, cc.size * 0.95);
      if (DICE_IMG.complete && DICE_IMG.naturalWidth) {
        ctx.drawImage(DICE_IMG, cc.x - d / 2, cc.y - 40 - d / 2, d, d);
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(27,37,55,.7)';
        ctx.strokeText(String(n), cc.x, cc.y - 6);
        ctx.fillStyle = '#ffc93c';
        ctx.fillText(String(n), cc.x, cc.y - 6);
      } else {
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText('🎲' + n, cc.x, cc.y - 30);
      }
    };
    const iv = setInterval(() => {
      draw();
      drawDiceFace(1 + Math.floor(Math.random() * 6));
      if (++ticks > 8) {
        clearInterval(iv);
        draw();
        drawDiceFace(dice);
        animating = false;
        setTimeout(cb, 500);
      }
    }, 90);
  }

  return { init, setState, animateDice, draw, get animating() { return animating; } };
})();
