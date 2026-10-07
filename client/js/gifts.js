// ===== الهدايا: رسوم SVG حقيقية مرسومة لكل هدية (ليست إيموجي) =====
// كل هدية مرسومة بتدرجات لونية وإضاءات لتشبه هدايا تطبيقات الغرف الفاخرة
window.Gifts = (() => {
  // أدوات مساعدة
  let gid = 0;
  const uid = () => 'g' + (++gid);
  function lin(id, stops, rot = 90) {
    return `<linearGradient id="${id}" gradientTransform="rotate(${rot} .5 .5)">${stops.map(([o, c]) => `<stop offset="${o}%" stop-color="${c}"/>`).join('')}</linearGradient>`;
  }
  function rad(id, stops) {
    return `<radialGradient id="${id}">${stops.map(([o, c]) => `<stop offset="${o}%" stop-color="${c}"/>`).join('')}</radialGradient>`;
  }
  const svgWrap = (defs, body) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${defs}${body}</svg>`;

  // ===== رسوم الهدايا =====
  const ART = {
    rose: () => {
      const a = uid(), b = uid(), c = uid();
      return svgWrap(
        lin(a, [[0, '#ff8fb3'], [50, '#ff2e63'], [100, '#b3123f']]) + lin(b, [[0, '#2e7d32'], [100, '#14521a']]) + rad(c, [[0, '#ff97b8'], [100, '#d81b50']]),
        `<g>
          <path d="M50 55 C48 70 46 82 44 92 L56 92 C54 82 52 70 50 55 Z" fill="url(#${b})"/>
          <path d="M50 58 C60 62 68 60 74 54 C66 52 58 52 50 58 Z" fill="url(#${b})" opacity=".9"/>
          <path d="M50 62 C42 68 34 68 27 63 C35 60 43 60 50 62 Z" fill="url(#${b})" opacity=".9"/>
          <circle cx="50" cy="38" r="20" fill="url(#${c})"/>
          <path d="M50 20 C58 24 62 32 60 42 C57 34 52 30 50 20 Z" fill="#ff6b95" opacity=".85"/>
          <path d="M32 30 C36 22 46 18 54 20 C46 24 40 28 38 38 C34 36 32 34 32 30 Z" fill="#ff6b95" opacity=".7"/>
          <path d="M66 28 C70 34 70 44 64 50 C66 42 64 36 60 32 Z" fill="#ffb3c8" opacity=".8"/>
          <circle cx="44" cy="34" r="8" fill="url(#${a})" opacity=".55"/>
        </g>`
      );
    },
    heart: () => {
      const a = uid(), b = uid();
      return svgWrap(
        rad(a, [[0, '#ff9db8'], [60, '#ff2e63'], [100, '#c2185b']]) + lin(b, [[0, '#ffffff'], [100, '#ffc1d4']]),
        `<g>
          <path d="M50 88 C20 66 8 48 8 32 C8 18 19 8 32 8 C40 8 46 12 50 18 C54 12 60 8 68 8 C81 8 92 18 92 32 C92 48 80 66 50 88 Z" fill="url(#${a})"/>
          <ellipse cx="32" cy="26" rx="10" ry="6" fill="url(#${b})" opacity=".55" transform="rotate(-25 32 26)"/>
          <circle cx="70" cy="20" r="3" fill="#fff" opacity=".9"/>
          <circle cx="78" cy="30" r="2" fill="#fff" opacity=".7"/>
        </g>`
      );
    },
    teddy: () => {
      const a = uid(), b = uid();
      return svgWrap(
        lin(a, [[0, '#d9a066'], [100, '#8d5a2b']]) + rad(b, [[0, '#f3c892'], [100, '#c68a4a']]),
        `<g>
          <circle cx="28" cy="30" r="10" fill="url(#${a})"/>
          <circle cx="72" cy="30" r="10" fill="url(#${a})"/>
          <circle cx="28" cy="30" r="5" fill="url(#${b})"/>
          <circle cx="72" cy="30" r="5" fill="url(#${b})"/>
          <circle cx="50" cy="42" r="26" fill="url(#${a})"/>
          <ellipse cx="50" cy="78" rx="22" ry="18" fill="url(#${a})"/>
          <ellipse cx="50" cy="76" rx="13" ry="11" fill="url(#${b})"/>
          <circle cx="41" cy="38" r="3.4" fill="#2d1b0e"/>
          <circle cx="59" cy="38" r="3.4" fill="#2d1b0e"/>
          <circle cx="42.2" cy="36.8" r="1.2" fill="#fff"/>
          <circle cx="60.2" cy="36.8" r="1.2" fill="#fff"/>
          <ellipse cx="50" cy="50" rx="6" ry="4.5" fill="url(#${b})"/>
          <path d="M50 50 L50 55 M50 55 C47 58 44 57 43 55 M50 55 C53 58 56 57 57 55" stroke="#2d1b0e" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        </g>`
      );
    },
    kiss: () => {
      const a = uid(), b = uid();
      return svgWrap(
        lin(a, [[0, '#ff5e9c'], [100, '#e91e63']]) + lin(b, [[0, '#fff0f5'], [100, '#ff9db8']]),
        `<g>
          <path d="M62 84 C36 84 20 66 22 46 C23 30 36 18 52 18 C68 18 80 30 80 46 C80 66 76 84 62 84 Z" fill="url(#${a})"/>
          <path d="M50 30 C46 34 44 38 46 42 C49 39 52 37 55 38 C53 34 52 32 50 30 Z" fill="url(#${b})"/>
          <path d="M56 48 C52 52 50 56 52 60 C55 57 58 55 61 56 C59 52 58 50 56 48 Z" fill="url(#${b})"/>
          <text x="66" y="34" font-size="18" fill="#ff5e9c" font-weight="bold">✦</text>
        </g>`
      );
    },
    moon: () => {
      const a = uid(), b = uid();
      return svgWrap(
        rad(a, [[0, '#fff8d6'], [70, '#ffd54f'], [100, '#ffb300']]) + lin(b, [[0, '#fffde7'], [100, '#ffca28']]),
        `<g>
          <path d="M62 10 C40 14 26 32 28 52 C30 72 46 88 66 90 C48 84 38 68 38 50 C38 32 48 16 62 10 Z" fill="url(#${a})"/>
          <circle cx="52" cy="38" r="6" fill="url(#${b})" opacity=".8"/>
          <circle cx="46" cy="58" r="4" fill="url(#${b})" opacity=".7"/>
          <circle cx="58" cy="72" r="3" fill="url(#${b})" opacity=".7"/>
          <circle cx="78" cy="24" r="2.5" fill="#fff8d6"/>
          <circle cx="86" cy="44" r="2" fill="#fff8d6" opacity=".8"/>
          <circle cx="82" cy="66" r="1.8" fill="#fff8d6" opacity=".7"/>
        </g>`
      );
    },
    perfume: () => {
      const a = uid(), b = uid(), c = uid();
      return svgWrap(
        lin(a, [[0, '#b388ff'], [100, '#651fff']]) + lin(b, [[0, '#ffd54f'], [100, '#ff8f00']]) + rad(c, [[0, '#e1bee7'], [100, '#9575cd']]),
        `<g>
          <rect x="44" y="8" width="12" height="10" rx="2" fill="url(#${b})"/>
          <rect x="40" y="16" width="20" height="8" rx="3" fill="#7e57c2"/>
          <path d="M34 30 C30 38 30 50 34 58 L34 78 C34 84 38 88 44 88 L56 88 C62 88 66 84 66 78 L66 58 C70 50 70 38 66 30 Z" fill="url(#${c})"/>
          <ellipse cx="50" cy="44" rx="14" ry="10" fill="url(#${a})" opacity=".85"/>
          <circle cx="30" cy="24" r="3" fill="#e1bee7" opacity=".8"/>
          <circle cx="24" cy="36" r="2" fill="#e1bee7" opacity=".6"/>
          <circle cx="72" cy="20" r="2.5" fill="#e1bee7" opacity=".7"/>
        </g>`
      );
    },
    box: () => {
      const a = uid(), b = uid(), c = uid();
      return svgWrap(
        lin(a, [[0, '#ff5e9c'], [100, '#d81b60']]) + lin(b, [[0, '#ff8fb3'], [100, '#ff2e63']]) + lin(c, [[0, '#ffe082'], [100, '#ffb300']]),
        `<g>
          <rect x="14" y="40" width="72" height="46" rx="6" fill="url(#${a})"/>
          <rect x="8" y="28" width="84" height="18" rx="5" fill="url(#${b})"/>
          <rect x="44" y="28" width="12" height="58" fill="url(#${c})"/>
          <path d="M50 28 C42 16 28 14 26 22 C24 30 38 30 50 28 Z" fill="none" stroke="url(#${c})" stroke-width="5"/>
          <path d="M50 28 C58 16 72 14 74 22 C76 30 62 30 50 28 Z" fill="none" stroke="url(#${c})" stroke-width="5"/>
        </g>`
      );
    },
    crown: () => {
      const a = uid(), b = uid(), c = uid();
      return svgWrap(
        lin(a, [[0, '#ffe082'], [50, '#ffb300'], [100, '#ff8f00']]) + lin(b, [[0, '#fff59d'], [100, '#ffc107']]) + rad(c, [[0, '#e91e63'], [100, '#ad1457']]),
        `<g>
          <path d="M14 74 L10 30 L32 48 L50 18 L68 48 L90 30 L86 74 Z" fill="url(#${a})"/>
          <rect x="14" y="72" width="72" height="12" rx="5" fill="url(#${b})"/>
          <circle cx="10" cy="28" r="5" fill="url(#${b})"/>
          <circle cx="50" cy="16" r="6" fill="url(#${b})"/>
          <circle cx="90" cy="28" r="5" fill="url(#${b})"/>
          <circle cx="50" cy="52" r="7" fill="url(#${c})"/>
          <circle cx="32" cy="60" r="4" fill="#4dd0e1"/>
          <circle cx="68" cy="60" r="4" fill="#4dd0e1"/>
        </g>`
      );
    },
    ring: () => {
      const a = uid(), b = uid(), c = uid();
      return svgWrap(
        lin(a, [[0, '#fff59d'], [50, '#ffd54f'], [100, '#ff8f00']]) + rad(b, [[0, '#e0f7fa'], [60, '#4dd0e1'], [100, '#00acc1']]) + lin(c, [[0, '#ffffff'], [100, '#b2ebf2']]),
        `<g>
          <circle cx="50" cy="58" r="26" fill="none" stroke="url(#${a})" stroke-width="9"/>
          <path d="M38 30 L50 12 L62 30 L50 38 Z" fill="url(#${a})"/>
          <path d="M50 14 L58 20 L54 32 L46 32 L42 20 Z" fill="url(#${b})"/>
          <path d="M46 20 L50 16 L54 20 L50 28 Z" fill="url(#${c})" opacity=".85"/>
        </g>`
      );
    },
    car: () => {
      const a = uid(), b = uid(), c = uid(), d = uid();
      return svgWrap(
        lin(a, [[0, '#ff6b6b'], [100, '#c62828']]) + lin(b, [[0, '#ffcdd2'], [100, '#ef9a9a']]) + rad(c, [[0, '#37474f'], [100, '#111']]) + lin(d, [[0, '#fff9c4'], [100, '#ffd54f']]),
        `<g>
          <path d="M10 66 L14 52 C16 46 20 42 28 42 L62 42 C72 42 80 48 84 56 L88 62 L88 70 L10 70 Z" fill="url(#${a})"/>
          <path d="M28 46 L58 46 C66 46 72 50 76 56 L30 56 Z" fill="url(#${b})" opacity=".9"/>
          <circle cx="28" cy="72" r="9" fill="url(#${c})"/>
          <circle cx="28" cy="72" r="4" fill="#90a4ae"/>
          <circle cx="74" cy="72" r="9" fill="url(#${c})"/>
          <circle cx="74" cy="72" r="4" fill="#90a4ae"/>
          <rect x="84" y="58" width="8" height="5" rx="2" fill="url(#${d})"/>
          <rect x="10" y="60" width="6" height="4" rx="2" fill="#ff8a80"/>
          <path d="M12 66 L88 66" stroke="#8e0000" stroke-width="1.5" opacity=".5"/>
        </g>`
      );
    },
    cup: () => {
      const a = uid(), b = uid(), c = uid();
      return svgWrap(
        lin(a, [[0, '#ffe082'], [50, '#ffc107'], [100, '#ff8f00']]) + lin(b, [[0, '#fff59d'], [100, '#ffd54f']]) + lin(c, [[0, '#b388ff'], [100, '#7c4dff']]),
        `<g>
          <path d="M22 24 L78 24 L74 60 C72 72 62 80 50 80 C38 80 28 72 26 60 Z" fill="url(#${a})"/>
          <path d="M22 24 L78 24 L76 40 L24 40 Z" fill="url(#${b})"/>
          <path d="M26 46 C14 46 12 62 24 66 C28 67 32 66 34 64" fill="none" stroke="url(#${b})" stroke-width="6"/>
          <path d="M74 46 C86 46 88 62 76 66 C72 67 68 66 66 64" fill="none" stroke="url(#${b})" stroke-width="6"/>
          <rect x="42" y="80" width="16" height="8" fill="url(#${b})"/>
          <rect x="34" y="88" width="32" height="6" rx="3" fill="url(#${b})"/>
          <path d="M50 32 L53 42 L63 42 L55 48 L58 58 L50 52 L42 58 L45 48 L37 42 L47 42 Z" fill="url(#${c})"/>
        </g>`
      );
    },
    yacht: () => {
      const a = uid(), b = uid(), c = uid(), d = uid();
      return svgWrap(
        lin(a, [[0, '#ffffff'], [100, '#b0bec5']]) + lin(b, [[0, '#4dd0e1'], [100, '#00838f']]) + lin(c, [[0, '#81d4fa'], [40, '#29b6f6'], [100, '#0277bd']]) + lin(d, [[0, '#fff59d'], [100, '#ffb300']]),
        `<g>
          <path d="M12 58 L82 58 L72 74 L24 74 Z" fill="url(#${a})"/>
          <rect x="34" y="40" width="30" height="18" rx="4" fill="url(#${b})"/>
          <rect x="40" y="44" width="7" height="6" rx="1" fill="#e0f7fa"/>
          <rect x="51" y="44" width="7" height="6" rx="1" fill="#e0f7fa"/>
          <path d="M18 76 L86 76 C84 82 78 86 70 86 L32 86 C24 86 19 82 18 76 Z" fill="url(#${c})" opacity=".9"/>
          <path d="M49 18 L49 40 M49 18 C58 22 60 30 58 38 L49 38 Z" stroke="url(#${d})" stroke-width="3" fill="url(#${d})" opacity=".9"/>
          <circle cx="24" cy="64" r="2.5" fill="#ff8a80"/>
        </g>`
      );
    },
    diamond: () => {
      const a = uid(), b = uid(), c = uid();
      return svgWrap(
        lin(a, [[0, '#e0f7fa'], [50, '#4dd0e1'], [100, '#00838f']]) + lin(b, [[0, '#ffffff'], [100, '#80deea']]) + rad(c, [[0, '#b2ebf2'], [100, '#26c6da']]),
        `<g>
          <path d="M50 10 L82 38 L50 90 L18 38 Z" fill="url(#${a})"/>
          <path d="M50 10 L64 38 L50 90 L36 38 Z" fill="url(#${b})" opacity=".75"/>
          <path d="M18 38 L82 38" stroke="#ffffff" stroke-width="2" opacity=".6"/>
          <path d="M36 38 L50 10 L64 38" fill="none" stroke="#ffffff" stroke-width="1.6" opacity=".7"/>
          <path d="M30 30 L26 38 M70 30 L74 38" stroke="#fff" stroke-width="1.4" opacity=".8"/>
          <circle cx="68" cy="22" r="2" fill="#fff"/>
          <circle cx="28" cy="18" r="1.6" fill="#fff" opacity=".9"/>
        </g>`
      );
    },
    jet: () => {
      const a = uid(), b = uid(), c = uid();
      return svgWrap(
        lin(a, [[0, '#ffffff'], [100, '#b0bec5']]) + lin(b, [[0, '#4dd0e1'], [100, '#01579b']]) + lin(c, [[0, '#ffcdd2'], [100, '#ef5350']]),
        `<g transform="rotate(35 50 50)">
          <path d="M50 6 C56 16 58 30 58 44 L58 70 C58 78 54 84 50 86 C46 84 42 78 42 70 L42 44 C42 30 44 16 50 6 Z" fill="url(#${a})"/>
          <path d="M42 48 L14 66 L14 72 L42 62 Z" fill="url(#${a})"/>
          <path d="M58 48 L86 66 L86 72 L58 62 Z" fill="url(#${a})"/>
          <path d="M50 62 L50 84 L42 74 L42 64 Z" fill="url(#${a})"/>
          <path d="M46 20 C48 26 48 34 48 44 L52 44 C52 34 52 26 54 20 C52 16 48 16 46 20 Z" fill="url(#${b})"/>
          <circle cx="50" cy="12" r="3" fill="url(#${c})"/>
        </g>`
      );
    },
    palace: () => {
      const a = uid(), b = uid(), c = uid(), d = uid();
      return svgWrap(
        lin(a, [[0, '#fff8e1'], [50, '#ffe082'], [100, '#ffb300']]) + lin(b, [[0, '#ffe57f'], [100, '#ffc107']]) + rad(c, [[0, '#ce93d8'], [100, '#8e24aa']]) + lin(d, [[0, '#ff8fb3'], [100, '#e91e63']]),
        `<g>
          <rect x="10" y="58" width="80" height="30" rx="3" fill="url(#${a})"/>
          <path d="M22 58 L22 30 L34 30 L34 58 Z" fill="url(#${b})"/>
          <path d="M66 58 L66 30 L78 30 L78 58 Z" fill="url(#${b})"/>
          <path d="M20 30 C20 20 28 14 28 14 C28 14 36 20 36 30 Z" fill="url(#${d})"/>
          <path d="M64 30 C64 20 72 14 72 14 C72 14 80 20 80 30 Z" fill="url(#${d})"/>
          <path d="M38 58 L38 36 L50 24 L62 36 L62 58 Z" fill="url(#${b})"/>
          <path d="M36 36 C36 24 50 12 50 12 C50 12 64 24 64 36 Z" fill="url(#${d})"/>
          <path d="M44 88 L44 72 C44 66 47 63 50 63 C53 63 56 66 56 72 L56 88 Z" fill="url(#${c})"/>
          <rect x="26" y="66" width="7" height="10" rx="3" fill="url(#${c})"/>
          <rect x="67" y="66" width="7" height="10" rx="3" fill="url(#${c})"/>
          <circle cx="50" cy="8" r="2.5" fill="#fff59d"/>
        </g>`
      );
    },
    rocket: () => {
      const a = uid(), b = uid(), c = uid(), d = uid();
      return svgWrap(
        lin(a, [[0, '#ffffff'], [100, '#cfd8dc']]) + lin(b, [[0, '#ff5252'], [100, '#c62828']]) + rad(c, [[0, '#4dd0e1'], [100, '#006064']]) + lin(d, [[0, '#ffd54f'], [60, '#ff9800'], [100, '#ff5722']]),
        `<g>
          <path d="M50 6 C60 18 64 34 64 50 L64 66 L36 66 L36 50 C36 34 40 18 50 6 Z" fill="url(#${a})"/>
          <circle cx="50" cy="36" r="10" fill="url(#${c})"/>
          <circle cx="50" cy="36" r="10" fill="none" stroke="url(#${b})" stroke-width="3"/>
          <path d="M36 52 L22 70 L36 66 Z" fill="url(#${b})"/>
          <path d="M64 52 L78 70 L64 66 Z" fill="url(#${b})"/>
          <path d="M42 66 C44 76 48 84 50 92 C52 84 56 76 58 66 Z" fill="url(#${d})"/>
          <path d="M46 66 C47 72 49 78 50 84 C51 78 53 72 54 66 Z" fill="#fff59d"/>
        </g>`
      );
    },
    castle: () => {
      const a = uid(), b = uid(), c = uid(), d = uid(), e = uid();
      return svgWrap(
        lin(a, [[0, '#e1bee7'], [50, '#ba68c8'], [100, '#7b1fa2']]) + lin(b, [[0, '#f3e5f5'], [100, '#ce93d8']]) + rad(c, [[0, '#4dd0e1'], [100, '#01579b']]) + lin(d, [[0, '#ffd54f'], [100, '#ff8f00']]) + rad(e, [[0, '#fff59d'], [100, '#ffb300']]),
        `<g>
          <circle cx="50" cy="50" r="46" fill="url(#${e})" opacity=".25"/>
          <rect x="14" y="52" width="72" height="34" rx="3" fill="url(#${a})"/>
          <rect x="8" y="40" width="18" height="46" rx="2" fill="url(#${b})"/>
          <rect x="74" y="40" width="18" height="46" rx="2" fill="url(#${b})"/>
          <path d="M8 40 L17 26 L26 40 Z" fill="url(#${d})"/>
          <path d="M74 40 L83 26 L92 40 Z" fill="url(#${d})"/>
          <path d="M36 52 L36 30 L50 16 L64 30 L64 52 Z" fill="url(#${b})"/>
          <path d="M34 30 C34 18 50 6 50 6 C50 6 66 18 66 30 L64 32 L36 32 Z" fill="url(#${d})"/>
          <path d="M44 86 L44 70 C44 62 47 58 50 58 C53 58 56 62 56 70 L56 86 Z" fill="url(#${c})"/>
          <rect x="20" y="60" width="8" height="12" rx="4" fill="url(#${c})"/>
          <rect x="72" y="60" width="8" height="12" rx="4" fill="url(#${c})"/>
          <path d="M50 6 L50 0 M50 0 L58 3 L50 6" stroke="#fff" stroke-width="1.5" fill="#ef5350"/>
        </g>`
      );
    },
  };

  function svg(giftId) {
    const art = ART[giftId];
    return art ? art() : svgWrap('', '<circle cx="50" cy="50" r="30" fill="#888"/>');
  }

  // عنصر جاهز للإدراج
  function el(giftId, cssClass = '') {
    const div = document.createElement('div');
    div.className = cssClass;
    div.innerHTML = svg(giftId);
    const s = div.querySelector('svg');
    s.style.width = '100%'; s.style.height = '100%';
    return div;
  }

  return { svg, el, CATALOG: window.GIFT_CATALOG || [] };
})();
