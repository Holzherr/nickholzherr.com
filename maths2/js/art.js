// Hand-built SVG art: the castle, the six room interiors, coins and Nova, all in watercolour. Rules for new art: STYLE.md.

import { PAPER, registerScene, prepaint, watercolourise } from './paint.js?v=1002wc';
import { castlePainting, WINDOWS, SHEET, arch } from './castle-paint.js?v=1002wc';

const FONT = `font-family="Fredoka, ui-rounded, system-ui, sans-serif"`;

export function coinSVG(size = 28, extra = '') {
  return `<svg class="coin-svg" ${extra} width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><g filter="url(#wc-small)">
    <circle cx="20" cy="21.5" r="17" fill="#d9941a"/>
    <circle cx="20" cy="19.5" r="17" fill="#ffc94d"/>
    <circle cx="20" cy="19.5" r="12.5" fill="none" stroke="#e8a92a" stroke-width="2.5"/>
    <path d="M20 11.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#fff3c4"/>
    <ellipse cx="13" cy="11" rx="4" ry="2" fill="#fff" opacity=".55" transform="rotate(-30 13 11)"/>
  </g></svg>`;
}

export function starSVG(size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
    <path filter="url(#wc-small)" d="M20 3l5 10.6 11.6 1.5-8.5 8 2.2 11.5L20 29l-10.3 5.6 2.2-11.5-8.5-8L15 13.6z" fill="#ffc94d" stroke="#e8a92a" stroke-width="2" stroke-linejoin="round"/>
  </svg>`;
}

// Princess Rosie, drawn from options so several looks can share one rig. The default is the
// look Nick picked (2 Oct 2026): big eyes, tall ice crown, side braid, white sticker outline.
// Classes r-body / r-head / r-eyes / r-open / r-closed / r-arm are what the CSS animates.
const HAIR = {
  platinum: { h: '#f4e8c6', e: '#b8955a', s: '#dcc78f' },
  silver:   { h: '#eef2f7', e: '#8f9db3', s: '#cfd8e6' },
  gold:     { h: '#f6dc8a', e: '#b88a2e', s: '#e5c062' },
  lilac:    { h: '#efe6fb', e: '#9a86c0', s: '#d6c8f0' },
};
const SKIN = {
  fair:       { s: '#ffe2d3', e: '#e9b49b' },
  warm:       { s: '#f6cfae', e: '#d29d78' },
  lightbrown: { s: '#e2ab83', e: '#b98057' },
  brown:      { s: '#c98d64', e: '#9e6a46' },
};
const DRESS = {
  ice:   { m: '#6cc3ee', l: '#c4ebff', d: '#3d9fd6' },
  lilac: { m: '#b9a2f2', l: '#e6dcff', d: '#8a6fd6' },
  aqua:  { m: '#5fd3c8', l: '#c7f4ef', d: '#2fa89d' },
  navy:  { m: '#3f5fb8', l: '#bcd0ff', d: '#2a3f85' },
  white: { m: '#eaf6ff', l: '#ffffff', d: '#8fc0e3' },
  deep:  { m: '#2f7fd0', l: '#a9d8ff', d: '#1d5aa0' },
};

const flake = (x, y, r, color, w = 1.2) =>
  `<g stroke="${color}" stroke-width="${w}" stroke-linecap="round"><path d="M${x} ${y - r}v${2 * r}M${x - r} ${y}h${2 * r}M${x - r * .7} ${y - r * .7}l${r * 1.4} ${r * 1.4}M${x + r * .7} ${y - r * .7}l${-r * 1.4} ${r * 1.4}"/></g>`;

export function rosieSVG(w = 100, h = Math.round(w * 1.2), o = {}) {
  const {
    hair: hk = 'platinum', skin: sk = 'fair', dress: dk = 'ice',
    style = 'braid', fringe = 'swept', eyes = 'sparkle', crown = 'crystal',
    head = 1.2, cape = false, sticker = true,
  } = { eyes: 'big', crown: 'tall', ...o };
  const H = HAIR[hk], S = SKIN[sk], D = DRESS[dk];
  const T = `transform="translate(60 88) scale(${head}) translate(-60 -88)"`;
  const hairAttrs = `fill="${H.h}" stroke="${H.e}" stroke-width="1.4" stroke-linejoin="round"`;

  // behind the body
  const backs = {
    braid: `<path d="M34 60C28 26 92 26 86 60C87 68 84 74 78 78Q60 84 42 78C36 74 33 68 34 60Z" ${hairAttrs}/>`,
    long: `<path d="M32 60C26 24 94 24 88 60C94 84 96 110 90 132L30 132C24 110 26 84 32 60Z" ${hairAttrs}/>
      <path d="M40 96C42 110 40 122 36 130M80 96C78 110 80 122 84 130" stroke="${H.s}" stroke-width="1.6" fill="none"/>`,
    wavy: `<path d="M32 60C26 24 94 24 88 60C96 72 90 84 96 96C100 108 90 118 94 130L26 130C30 118 20 108 24 96C30 84 24 72 32 60Z" ${hairAttrs}/>
      <path d="M36 92Q32 104 38 116M84 92Q88 104 82 116" stroke="${H.s}" stroke-width="1.6" fill="none"/>`,
    bun: `<circle cx="60" cy="25" r="12" ${hairAttrs}/><path d="M52 21Q60 15 68 21" stroke="${H.s}" stroke-width="1.4" fill="none"/>
      <path d="M34 60C28 26 92 26 86 60C87 68 84 74 78 78Q60 84 42 78C36 74 33 68 34 60Z" ${hairAttrs}/>`,
    twin: `<circle cx="37" cy="36" r="10" ${hairAttrs}/><circle cx="83" cy="36" r="10" ${hairAttrs}/>
      <path d="M34 60C28 26 92 26 86 60C87 68 84 74 78 78Q60 84 42 78C36 74 33 68 34 60Z" ${hairAttrs}/>`,
    pony: `<path d="M72 30C92 30 102 52 98 74C96 92 100 106 92 118C90 104 86 92 86 78C86 60 82 44 72 38Z" ${hairAttrs}/>
      <path d="M34 60C28 26 92 26 86 60C87 68 84 74 78 78Q60 84 42 78C36 74 33 68 34 60Z" ${hairAttrs}/>`,
  };
  // over the shoulders, in front of the dress
  const braidLinks = [[86, 84, 6.2], [85, 94, 6], [84, 103.5, 5.6], [83, 112.5, 5.2], [82.2, 121, 4.7]]
    .map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.15}"/><path d="M${x - r + 1.5} ${y - 2}Q${x} ${y + 3} ${x + r - 1.5} ${y - 2}" fill="none" stroke="${H.s}"/>`).join('');
  const fronts = {
    braid: `<g fill="${H.h}" stroke="${H.e}" stroke-width="1.1"><path d="M82 52C91 60 92 70 89 79L83 79C85 71 84 62 79 56Z"/>${braidLinks}<path d="M82.2 126L78 135L86 134Z"/></g>
      <circle cx="82.2" cy="126" r="2" fill="${D.l}" stroke="${D.d}" stroke-width=".7"/>`,
    long: `<path d="M38 56C31 80 33 100 38 116C41 100 40 80 41 62Z M82 56C89 80 87 100 82 116C79 100 80 80 79 62Z" ${hairAttrs}/>`,
    wavy: `<path d="M38 56C30 72 36 84 32 96C30 106 36 112 38 118C42 106 38 98 41 88C43 78 40 68 41 62Z M82 56C90 72 84 84 88 96C90 106 84 112 82 118C78 106 82 98 79 88C77 78 80 68 79 62Z" ${hairAttrs}/>`,
    bun: '', twin: '', pony: '',
  };
  const fringes = {
    swept: `<path d="M38 58C33 32 56 22 72 27C85 31 89 45 84 58C81 47 72 40 60 41.5C49 42.5 42 48 38 58Z" ${hairAttrs}/>
      <path d="M46 44C52 36 64 33 74 37M44 50C50 42 60 39 70 40" stroke="${H.s}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    parted: `<path d="M38 60C33 32 87 32 82 60C79 48 70 41 60 40C50 41 41 48 38 60Z" ${hairAttrs}/>
      <path d="M60 33V40M52 37Q45 44 42 54M68 37Q75 44 78 54" stroke="${H.s}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    bangs: `<path d="M38 58C35 30 85 30 82 58C77 53 72 51 67 53C63 49 57 49 53 53C48 51 43 53 38 58Z" ${hairAttrs}/>
      <path d="M53 53L55 44M67 53L65 44M46 52L48 44M74 52L72 44" stroke="${H.s}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  };
  const eyeSets = {
    sparkle: `<ellipse cx="51" cy="61" rx="5.2" ry="5.6" fill="#fff"/><ellipse cx="69" cy="61" rx="5.2" ry="5.6" fill="#fff"/>
      <circle cx="51.4" cy="61.6" r="3.9" fill="#3aa3e6"/><circle cx="68.6" cy="61.6" r="3.9" fill="#3aa3e6"/>
      <circle cx="51.4" cy="61.8" r="2" fill="#1d2b4a"/><circle cx="68.6" cy="61.8" r="2" fill="#1d2b4a"/>
      <circle cx="52.8" cy="60" r="1.3" fill="#fff"/><circle cx="70" cy="60" r="1.3" fill="#fff"/>
      <path d="M45.4 59.6Q51 54.6 56.6 59.2M63.4 59.2Q69 54.6 74.6 59.6" stroke="#2a1f33" stroke-width="1.9" fill="none" stroke-linecap="round"/>
      <path d="M45.6 59.4L43.6 58M74.4 59.4L76.4 58" stroke="#2a1f33" stroke-width="1.4" stroke-linecap="round"/>`,
    big: `<ellipse cx="50.5" cy="62" rx="6.4" ry="7.4" fill="#fff"/><ellipse cx="69.5" cy="62" rx="6.4" ry="7.4" fill="#fff"/>
      <ellipse cx="51" cy="63" rx="5" ry="5.8" fill="#4ab0ec"/><ellipse cx="69" cy="63" rx="5" ry="5.8" fill="#4ab0ec"/>
      <ellipse cx="51" cy="64" rx="3.2" ry="3.8" fill="#1d3a66"/><ellipse cx="69" cy="64" rx="3.2" ry="3.8" fill="#1d3a66"/>
      <circle cx="53" cy="60.6" r="1.8" fill="#fff"/><circle cx="71" cy="60.6" r="1.8" fill="#fff"/><circle cx="49.4" cy="66" r=".9" fill="#fff"/><circle cx="67.4" cy="66" r=".9" fill="#fff"/>
      <path d="M44 59Q50.5 53 57 58.4M63 58.4Q69.5 53 76 59" stroke="#2a1f33" stroke-width="2.1" fill="none" stroke-linecap="round"/>
      <path d="M44.2 58.8L42 57.2M75.8 58.8L78 57.2" stroke="#2a1f33" stroke-width="1.5" stroke-linecap="round"/>`,
    dot: `<ellipse cx="51" cy="62" rx="3.4" ry="4.4" fill="#22304f"/><ellipse cx="69" cy="62" rx="3.4" ry="4.4" fill="#22304f"/>
      <circle cx="52.2" cy="60.4" r="1.3" fill="#fff"/><circle cx="70.2" cy="60.4" r="1.3" fill="#fff"/>
      <path d="M47 57.6L45.6 56M73 57.6L74.4 56" stroke="#22304f" stroke-width="1.3" stroke-linecap="round"/>`,
  };
  const crowns = {
    crystal: `<g fill="#e4f7ff" stroke="#6cbde8" stroke-width="1.1" stroke-linejoin="round">
        <path d="M43 36Q60 28 77 36L76 39Q60 32 44 39Z"/>
        <path d="M60 17L64 27L60 33L56 27Z"/><path d="M50.5 23L53.5 30L50 34L47.5 29Z"/><path d="M69.5 23L72.5 29L70 34L66.5 30Z"/>
        <path d="M43 29L45.5 34L43 37L41 33Z"/><path d="M77 29L79 33L77 37L74.5 34Z"/></g>
      <circle cx="60" cy="27" r="1.6" fill="#3aa3e6"/>`,
    snow: `<path d="M42 37Q60 29 78 37" stroke="#e4f7ff" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <path d="M42 37Q60 29 78 37" stroke="#6cbde8" stroke-width="1" fill="none" stroke-linecap="round"/>
      <circle cx="60" cy="27" r="7" fill="#e4f7ff" stroke="#6cbde8" stroke-width="1"/>${flake(60, 27, 5, '#3aa3e6', 1.3)}
      <circle cx="48" cy="33" r="1.8" fill="#9fd8f5"/><circle cx="72" cy="33" r="1.8" fill="#9fd8f5"/>`,
    tall: `<g fill="#e4f7ff" stroke="#6cbde8" stroke-width="1.1" stroke-linejoin="round">
        <path d="M44 38L46 22L52 31L60 10L68 31L74 22L76 38Q60 33 44 38Z"/></g>
      <path d="M60 16L62.5 26L60 30L57.5 26Z" fill="#9fd8f5"/><circle cx="46.5" cy="25" r="1.4" fill="#3aa3e6"/><circle cx="73.5" cy="25" r="1.4" fill="#3aa3e6"/>`,
    mini: `<g fill="#e4f7ff" stroke="#6cbde8" stroke-width="1" stroke-linejoin="round"><path d="M50 36L52 30L56 34L60 26L64 34L68 30L70 36Q60 33 50 36Z"/></g>
      <circle cx="60" cy="30.5" r="1.4" fill="#ff8fc0"/>`,
  };
  const blush = sk === 'brown' || sk === 'lightbrown' ? 'opacity=".3" fill="#e0707f"' : 'opacity=".35" fill="#ff9fb0"';

  return `<svg class="rosie-svg${sticker ? ' sticker' : ''}" width="${w}" height="${h}" viewBox="0 0 120 144" aria-hidden="true"><g filter="url(#wc-sprite)">
  <g class="r-body">
    ${cape ? `<path d="M34 104L16 144L104 144L86 104Z" fill="${D.l}" opacity=".65"/>${flake(26, 136, 3, '#ffffff', 1)}${flake(96, 130, 2.5, '#ffffff', 1)}` : ''}
    <g ${T}>${backs[style]}</g>
    <path d="M28 144C28 114 42 102 60 102C78 102 92 114 92 144Z" fill="${S.s}"/>
    <path d="M26 144L29 118Q31 110 38 110L40 144Z M94 144L91 118Q89 110 82 110L80 144Z" fill="${D.l}" opacity=".9"/>
    <path d="M36 144L38 116Q48 111 60 118Q72 111 82 116L84 144Z" fill="${D.m}"/>
    <path d="M38 116Q48 111 60 118Q72 111 82 116" stroke="${D.l}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M60 118L56 124L60 130L64 124Z" fill="${D.l}" stroke="${D.d}" stroke-width=".8"/>
    ${flake(60, 137.5, 4.5, '#ffffff', 1.3)}
    <rect x="54" y="82" width="12" height="22" rx="5" fill="${S.s}"/>
    <path d="M54 88Q60 92 66 88" stroke="${S.e}" stroke-width="1" fill="none" opacity=".6"/>
    <path d="M50 101Q60 110 70 101" stroke="${D.l}" stroke-width="1" fill="none"/>
    ${flake(60, 109, 2.5, D.d, 1)}
    <g ${T}><g class="r-head">
      <ellipse cx="60" cy="60" rx="21" ry="23" fill="${S.s}" stroke="${S.e}" stroke-width=".8"/>
      <path d="M38.6 71l1.8 4.5 1.8-4.5-1.8-2z M81.4 71l-1.8 4.5-1.8-4.5 1.8-2z" fill="${D.l}" stroke="${D.d}" stroke-width=".7"/>
      <g class="r-eyes">${eyeSets[eyes]}</g>
      <path d="M45.5 52.5Q51 50 56 52M64 52Q69 50 74.5 52.5" stroke="${H.e}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      <circle cx="45" cy="70" r="4.4" ${blush}/><circle cx="75" cy="70" r="4.4" ${blush}/>
      <path d="M59 66.5Q60 68.5 61.4 67.2" stroke="${S.e}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      <path class="r-closed" d="M55 73Q60 77 65 73" stroke="#d4547a" stroke-width="2.3" fill="none" stroke-linecap="round"/>
      <path class="r-open" d="M55.4 72.6Q60 82 64.6 72.6Q60 74 55.4 72.6Z" fill="#c2416d"/>
      ${fringes[fringe]}
      ${crowns[crown]}
    </g></g>
    <g ${T}>${fronts[style]}</g>
    <g class="r-arm">
      <path d="M85 112Q97 102 99 88" stroke="${D.l}" stroke-width="9" fill="none" stroke-linecap="round"/>
      <circle cx="99.5" cy="83.5" r="5.4" fill="${S.s}" stroke="${S.e}" stroke-width=".8"/>
    </g>
  </g></g>
</svg>`;
}

export function novaSVG(size = 84) {
  return `<svg class="nova-svg" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><g filter="url(#wc-sprite)">
    <defs><radialGradient id="novaG" cx="40%" cy="35%"><stop offset="0" stop-color="#fffbe6"/><stop offset=".55" stop-color="#ffd66b"/><stop offset="1" stop-color="#f0a020"/></radialGradient></defs>
    <path d="M50 4l12.5 26.5 29 3.6-21.3 20 5.6 28.7L50 68.6 24.2 82.8l5.6-28.7-21.3-20 29-3.6z" fill="url(#novaG)" stroke="#e8a92a" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="41" cy="46" rx="4" ry="5.5" fill="#4a1f40"/><ellipse cx="59" cy="46" rx="4" ry="5.5" fill="#4a1f40"/>
    <circle cx="42.5" cy="44" r="1.5" fill="#fff"/><circle cx="60.5" cy="44" r="1.5" fill="#fff"/>
    <path d="M43 56q7 7 14 0" stroke="#4a1f40" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="34" cy="55" r="4.5" fill="#ff7bac" opacity=".6"/><circle cx="66" cy="55" r="4.5" fill="#ff7bac" opacity=".6"/>
  </g></svg>`;
}

function stones(x, y, w, h, seed = 1) {
  // soft stone blocks, drawn as a few offset rounded rects
  let s = '', r = seed;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  for (let yy = y + 14; yy < y + h - 10; yy += 26) {
    const off = ((yy - y) / 26) % 2 ? 0 : 20;
    for (let xx = x + 6 + off; xx < x + w - 30; xx += 44) {
      if (rnd() < .45) s += `<rect x="${xx}" y="${yy}" width="${30 + rnd() * 8}" height="14" rx="6" fill="#e9bfd3" opacity=".45"/>`;
    }
  }
  return s;
}

function merlons(x, y, w, size = 26, gap = 14, fill = 'url(#wall)') {
  let s = '';
  for (let xx = x; xx + size <= x + w + 1; xx += size + gap) s += `<rect x="${xx}" y="${y - size}" width="${size}" height="${size + 2}" rx="4" fill="${fill}"/>`;
  return s;
}

function windowArch(x, y, w, h) {
  const r = w / 2;
  return `M${x} ${y + h} V${y + r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h} Z`;
}

// Rosie standing in a castle window: bottom-centred on (cx, bottom), `h` tall.
const rosieIn = (cx, bottom, h) => rosieSVG(h / 1.2, h).replace('<svg ', `<svg x="${cx - h / 2.4}" y="${bottom - h}" `);

// A window that is a doorway into a room, drawn live over the painting so it stays tappable.
// Locked windows show a padlock and the stars needed.
function roomWindow(room, [x, y, w, h], open, peek, label, [lx, ly]) {
  const d = arch(x, y, w, h);
  const cx = x + w / 2;
  const inner = open
    ? (peek === '👸' ? rosieIn(cx, y + h - 2, Math.min(w * .52, 34) * 1.5) : `<text x="${cx}" y="${y + h - 10}" text-anchor="middle" font-size="${Math.min(w * .52, 34)}" class="peek" filter="url(#wc-emoji)">${peek}</text>`)
    : `<g transform="translate(${cx - 11} ${y + h / 2 - 16})" filter="url(#wc-small)"><rect x="2" y="12" width="18" height="15" rx="3" fill="#ffc94d"/><path d="M6 12V8a5 5 0 0 1 10 0v4" stroke="#ffc94d" stroke-width="3" fill="none"/></g>`;
  const lab = open
    ? `<g class="label"><rect x="${lx - 62}" y="${ly - 17}" width="124" height="30" rx="15" fill="${PAPER}" opacity=".92" stroke="#5a4462" stroke-opacity=".35" stroke-width="1.5"/><text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="17" font-weight="600" fill="#6b2d5c" ${FONT}>${label}</text></g>`
    : `<g class="label"><rect x="${lx - 44}" y="${ly - 17}" width="88" height="30" rx="15" fill="#6b4a7e" opacity=".85"/><text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="16" font-weight="600" fill="#fff3c4" ${FONT}>★ ${room.stars}</text></g>`;
  return `<g class="spot ${open ? 'open' : 'locked'}" data-room="${room.id}" tabindex="0" role="button" aria-label="${room.name}${open ? '' : ', locked'}">
    <path d="${d}" fill="#fff" fill-opacity="0" stroke="transparent" stroke-width="6"/>
    ${inner}
    ${lab}
  </g>`;
}

const castleKey = rooms => 'castle-' + rooms.map(r => (r.open ? 1 : 0)).join('');
function castleScene(rooms) {
  const key = castleKey(rooms);
  registerScene(key, castlePainting(Object.fromEntries(rooms.map(r => [r.id, r.open]))));
  return key;
}

export function castleSVG({ rooms, peeks, newRoom }) {
  const key = castleScene(rooms);
  const { x, y, w, h } = SHEET;
  return `<svg class="castle" viewBox="0 0 1000 720" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Your castle">
  <image class="paint" data-paint="${key}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none"/>
  ${rooms.map(r => roomWindow(r, WINDOWS[r.id].box, r.open, peeks[r.id] || '', r.name, WINDOWS[r.id].label)).join('')}
  ${newRoom ? `<g class="sparkle-burst" pointer-events="none">${[0,1,2,3,4,5,6,7].map(i => `<text class="spk" style="--a:${i*45}deg" x="0" y="0" font-size="26">✨</text>`).join('')}</g>` : ''}
</svg>`;
}

// Paint the castle in the background so it is ready when she gets there.
export function prepaintCastle(rooms) {
  const scale = Math.min(innerWidth / 1000, innerHeight / 720) * Math.min(2, devicePixelRatio || 1);
  prepaint(castleScene(rooms), SHEET.w * scale);
}

// ---------- room interiors ----------
function archWindow(x, y, w, h, sky = '#cfe4ff') {
  return `<path d="${windowArch(x, y, w, h)}" fill="${sky}" stroke="#fff" stroke-width="10"/>
    <line x1="${x + w / 2}" y1="${y + 6}" x2="${x + w / 2}" y2="${y + h}" stroke="#fff" stroke-width="6"/>
    <line x1="${x}" y1="${y + h * .6}" x2="${x + w}" y2="${y + h * .6}" stroke="#fff" stroke-width="6"/>`;
}

function checker(y0, y1, a, b, size = 70) {
  let s = `<rect x="0" y="${y0}" width="1000" height="${y1 - y0}" fill="${a}"/>`;
  let row = 0;
  for (let y = y0; y < y1; y += size * .6, row++) for (let x = (row % 2) * size; x < 1000; x += size * 2) s += `<rect x="${x}" y="${y}" width="${size}" height="${size * .6}" fill="${b}"/>`;
  return s;
}

const ROOM_ART = {
  throne: () => `
    <rect width="1000" height="620" fill="#f9dce9"/>
    ${stones(0, 0, 1000, 430, 5)}
    ${archWindow(90, 70, 130, 220)}${archWindow(780, 70, 130, 220)}
    ${[330, 670].map(x => `<g><rect x="${x - 34}" y="30" width="68" height="190" fill="#e0326e"/><path d="M${x - 34} 220 L${x} 250 L${x + 34} 220Z" fill="#e0326e"/><path d="M${x} 90 l9 18 20 3-14 14 3 20-18-9-18 9 3-20-14-14 20-3z" fill="#ffc94d"/></g>`).join('')}
    <path d="M400 430 L600 430 L600 250 A100 100 0 0 0 400 250Z" fill="#f3c6da"/>
    <rect x="370" y="404" width="260" height="28" rx="8" fill="#f3c6da"/><rect x="396" y="384" width="208" height="24" rx="8" fill="#ffd9e8"/><path d="M372 406 H628 M398 386 H602" stroke="#ffc94d" stroke-width="4" stroke-linecap="round"/>
    ${checker(430, 620, '#fff3f8', '#ffd9e8')}
    <path d="M430 430 L570 430 L700 620 L300 620Z" fill="#e0326e"/>
    <path d="M445 430 L555 430 L668 620 L332 620Z" fill="none" stroke="#ffc94d" stroke-width="5"/>`,
  kitchen: () => `
    <rect width="1000" height="620" fill="#fff4e6"/>
    ${Array.from({length: 12}, (_, r) => Array.from({length: 22}, (_, c) => `<rect x="${c*46 + (r%2)*23 - 20}" y="${r*36}" width="42" height="32" rx="5" fill="${(r+c)%3 ? '#dff4ea' : '#ffe1ec'}"/>`).join('')).join('')}
    <path d="M70 430 V240 A120 120 0 0 1 310 240 V430Z" fill="#c9a28d"/>
    <path d="M110 430 V270 A80 80 0 0 1 270 270 V430Z" fill="#5c3446"/>
    <path d="M150 430 q20 -60 40 -20 q20 -50 40 0 q10 -30 20 20z" fill="#ff9a3c"/><path d="M170 430 q15 -35 30 -10 q15 -30 30 10z" fill="#ffc94d"/>
    <rect x="560" y="150" width="340" height="16" rx="6" fill="#c98a55"/>
    <text x="600" y="145" font-size="48">🍯</text><text x="690" y="145" font-size="48">🫙</text><text x="780" y="145" font-size="48">🥛</text>
    ${archWindow(430, 90, 110, 170)}
    ${checker(430, 620, '#f7c9a8', '#efb28c')}
    <rect x="480" y="360" width="420" height="30" rx="10" fill="#dc9c62"/>`,
  bedroom: () => `
    <rect width="1000" height="620" fill="#ecdfff"/>
    ${Array.from({length: 30}, (_, i) => `<text x="${(i*137) % 1000}" y="${40 + ((i*71) % 380)}" font-size="18" fill="#c7a6ff" opacity=".7">★</text>`).join('')}
    <circle cx="500" cy="170" r="110" fill="#26204a" stroke="#fff" stroke-width="12"/>
    <path d="M530 110 a60 60 0 1 0 30 110 a48 48 0 1 1 -30 -110z" fill="#fff3c4"/>
    <text x="440" y="140" font-size="16" fill="#fff">✦</text><text x="455" y="225" font-size="12" fill="#fff">✦</text>
    <path d="M0 0 Q120 90 240 0 Q360 90 480 0 Q600 90 720 0 Q840 90 1000 0 V-10 H0Z" fill="#ff9ec2"/>
    <path d="M0 0 Q120 70 240 0 Q360 70 480 0 Q600 70 720 0 Q840 70 1000 0" fill="none" stroke="#ffc94d" stroke-width="5"/>
    <rect x="0" y="430" width="1000" height="190" fill="#ffd3e4"/>
    <ellipse cx="500" cy="530" rx="300" ry="60" fill="#ffb3cf"/>
    <ellipse cx="500" cy="530" rx="250" ry="42" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="12 10"/>`,
  stables: () => `
    <rect width="1000" height="620" fill="#f2c38f"/>
    ${Array.from({length: 26}, (_, i) => `<line x1="${i*40}" y1="0" x2="${i*40}" y2="430" stroke="#dc9c62" stroke-width="3"/>`).join('')}
    <rect x="360" y="80" width="280" height="350" fill="#b8e3ff"/>
    <path d="M360 330 Q500 280 640 330 V430 H360Z" fill="#8fd6a5"/>
    <text x="560" y="200" font-size="44">☁️</text>
    <path d="M340 80 H660 V430 H640 V100 H360 V430 H340Z" fill="#b3541e"/>
    <path d="M360 100 L640 430 M640 100 L360 430" stroke="#c96a3a" stroke-width="10" opacity=".35"/>
    ${[120, 880].map(x => `<rect x="${x - 70}" y="250" width="140" height="180" fill="#dc9c62" stroke="#b3541e" stroke-width="8"/><path d="M${x-70} 250 L${x+70} 430 M${x+70} 250 L${x-70} 430" stroke="#b3541e" stroke-width="7"/>`).join('')}
    <rect x="0" y="430" width="1000" height="190" fill="#f6dc8a"/>
    ${Array.from({length: 60}, (_, i) => `<line x1="${(i*97) % 1000}" y1="${445 + (i*37) % 170}" x2="${(i*97) % 1000 + 26}" y2="${440 + (i*37) % 170}" stroke="#e6bf55" stroke-width="4" stroke-linecap="round"/>`).join('')}`,
  garden: () => `
    <defs><linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9e4ff"/><stop offset="1" stop-color="#ffe3ef"/></linearGradient></defs>
    <rect width="1000" height="620" fill="url(#gsky)"/>
    <rect x="0" y="170" width="1000" height="200" fill="#f6d6e5"/>
    ${merlons(0, 172, 1000, 34, 20, '#f6d6e5')}
    ${stones(0, 170, 1000, 200, 13)}
    <g fill="#5fbf8a">${Array.from({length: 13}, (_, i) => `<circle cx="${i*84}" cy="370" r="56"/>`).join('')}</g>
    <g fill="#3d9967" opacity=".35">${Array.from({length: 13}, (_, i) => `<circle cx="${i*84 + 20}" cy="400" r="40"/>`).join('')}</g>
    <rect x="0" y="410" width="1000" height="210" fill="#9ee0b2"/>
    <path d="M420 410 L580 410 L760 620 L240 620Z" fill="#ffe9c9"/>
    ${Array.from({length: 40}, (_, i) => `<path d="M${(i*53) % 1000} ${470 + (i*29) % 140} l5 -14 l5 14" stroke="#5fbf8a" stroke-width="3" fill="none"/>`).join('')}`,
  tower: () => `
    <rect width="1000" height="620" fill="#3b2a5e"/>
    ${stones(0, 0, 1000, 430, 17).replaceAll('#e9bfd3', '#5a4485')}
    <circle cx="500" cy="200" r="170" fill="#1b1638" stroke="#c7a6ff" stroke-width="14"/>
    ${Array.from({length: 40}, (_, i) => { const a = i * 2.4, r = 20 + (i * 37) % 145; return `<circle class="twinkle" style="animation-delay:${(i%7)*.4}s" cx="${500 + Math.cos(a)*r}" cy="${200 + Math.sin(a)*r}" r="${1.5 + (i%3)}" fill="#fff"/>`; }).join('')}
    <path d="M560 110 a52 52 0 1 0 26 96 a42 42 0 1 1 -26 -96z" fill="#fff3c4"/>
    <line x1="330" y1="200" x2="670" y2="200" stroke="#c7a6ff" stroke-width="8"/><line x1="500" y1="30" x2="500" y2="370" stroke="#c7a6ff" stroke-width="8"/>
    <rect x="0" y="430" width="1000" height="190" fill="#6b4a7e"/>
    ${Array.from({length: 8}, (_, i) => `<line x1="0" y1="${452 + i*24}" x2="1000" y2="${452 + i*24}" stroke="#5a3c6c" stroke-width="3"/>`).join('')}
    <ellipse cx="500" cy="540" rx="260" ry="50" fill="#8d6fb8" opacity=".6"/>`,
};

const roomLive = {};
export function roomSVG(id) {
  const key = 'room-' + id;
  if (!(id in roomLive)) {
    const { doc, live } = watercolourise(ROOM_ART[id](), 1000, 620);
    registerScene(key, { w: 1000, h: 620, doc });
    roomLive[id] = live;
  }
  return `<svg class="room-bg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image class="paint" data-paint="${key}" width="1000" height="620" preserveAspectRatio="none"/>${roomLive[id]}</svg>`;
}
