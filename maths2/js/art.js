// Hand-built SVG art: the castle, the six room interiors, coins and Nova.

const FONT = `font-family="Fredoka, ui-rounded, system-ui, sans-serif"`;

export function coinSVG(size = 28, extra = '') {
  return `<svg class="coin-svg" ${extra} width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="21.5" r="17" fill="#d9941a"/>
    <circle cx="20" cy="19.5" r="17" fill="#ffc94d"/>
    <circle cx="20" cy="19.5" r="12.5" fill="none" stroke="#e8a92a" stroke-width="2.5"/>
    <path d="M20 11.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#fff3c4"/>
    <ellipse cx="13" cy="11" rx="4" ry="2" fill="#fff" opacity=".55" transform="rotate(-30 13 11)"/>
  </svg>`;
}

export function starSVG(size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20 3l5 10.6 11.6 1.5-8.5 8 2.2 11.5L20 29l-10.3 5.6 2.2-11.5-8.5-8L15 13.6z" fill="#ffc94d" stroke="#e8a92a" stroke-width="2" stroke-linejoin="round"/>
  </svg>`;
}

export function novaSVG(size = 84) {
  return `<svg class="nova-svg" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <defs><radialGradient id="novaG" cx="40%" cy="35%"><stop offset="0" stop-color="#fffbe6"/><stop offset=".55" stop-color="#ffd66b"/><stop offset="1" stop-color="#f0a020"/></radialGradient></defs>
    <path d="M50 4l12.5 26.5 29 3.6-21.3 20 5.6 28.7L50 68.6 24.2 82.8l5.6-28.7-21.3-20 29-3.6z" fill="url(#novaG)" stroke="#e8a92a" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="41" cy="46" rx="4" ry="5.5" fill="#4a1f40"/><ellipse cx="59" cy="46" rx="4" ry="5.5" fill="#4a1f40"/>
    <circle cx="42.5" cy="44" r="1.5" fill="#fff"/><circle cx="60.5" cy="44" r="1.5" fill="#fff"/>
    <path d="M43 56q7 7 14 0" stroke="#4a1f40" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="34" cy="55" r="4.5" fill="#ff7bac" opacity=".6"/><circle cx="66" cy="55" r="4.5" fill="#ff7bac" opacity=".6"/>
  </svg>`;
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

function flag(x, y, color) {
  return `<g class="flag"><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 46}" stroke="#6b2d5c" stroke-width="4" stroke-linecap="round"/>
    <path class="flag-cloth" d="M${x} ${y - 46} q18 -6 34 4 q-16 6 -34 10z" fill="${color}"/></g>`;
}

// A window that is a doorway into a room. Locked windows show a padlock and the stars needed.
function roomWindow(room, shape, open, peek, label, labelPos) {
  const [x, y, w, h] = shape;
  const d = windowArch(x, y, w, h);
  const cx = x + w / 2;
  const inner = open
    ? `<path d="${d}" fill="url(#glow)"/>
       <text x="${cx}" y="${y + h - 10}" text-anchor="middle" font-size="${Math.min(w * .52, 34)}" class="peek">${peek}</text>`
    : `<path d="${d}" fill="url(#locked)"/>
       <g transform="translate(${cx - 11} ${y + h / 2 - 16})"><rect x="2" y="12" width="18" height="15" rx="3" fill="#ffc94d"/><path d="M6 12V8a5 5 0 0 1 10 0v4" stroke="#ffc94d" stroke-width="3" fill="none"/></g>`;
  const [lx, ly] = labelPos;
  const lab = open
    ? `<g class="label"><rect x="${lx - 62}" y="${ly - 17}" width="124" height="30" rx="15" fill="#fff" opacity=".92"/><text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="17" font-weight="600" fill="#6b2d5c" ${FONT}>${label}</text></g>`
    : `<g class="label"><rect x="${lx - 44}" y="${ly - 17}" width="88" height="30" rx="15" fill="#6b2d5c" opacity=".85"/><text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="16" font-weight="600" fill="#fff3c4" ${FONT}>★ ${room.stars}</text></g>`;
  return `<g class="spot ${open ? 'open' : 'locked'}" data-room="${room.id}" tabindex="0" role="button" aria-label="${room.name}${open ? '' : ', locked'}">
    <path d="${d}" fill="none" stroke="#fff" stroke-width="7"/>
    ${inner}
    <path d="${d}" fill="none" stroke="#c98fb0" stroke-width="2.5"/>
    ${lab}
  </g>`;
}

export function castleSVG({ rooms, peeks, newRoom }) {
  const R = Object.fromEntries(rooms.map(r => [r.id, r]));
  const open = id => R[id].open;
  const win = (id, shape, labelPos) => roomWindow(R[id], shape, open(id), peeks[id] || '', R[id].name, labelPos);

  return `<svg class="castle" viewBox="0 0 1000 720" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Your castle">
  <defs>
    <linearGradient id="sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="720"><stop offset="0" stop-color="#c9e4ff"/><stop offset=".55" stop-color="#eee2ff"/><stop offset="1" stop-color="#ffe3ef"/></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7fb"/><stop offset="1" stop-color="#f6d6e5"/></linearGradient>
    <linearGradient id="wallSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f3cfe0"/><stop offset=".35" stop-color="#fff5fa"/><stop offset="1" stop-color="#f1cadb"/></linearGradient>
    <linearGradient id="roof" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff8db6"/><stop offset=".5" stop-color="#ff5d94"/><stop offset="1" stop-color="#d42a66"/></linearGradient>
    <linearGradient id="roof2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b38cf0"/><stop offset=".5" stop-color="#9168df"/><stop offset="1" stop-color="#6b44b8"/></linearGradient>
    <radialGradient id="glow" cx="50%" cy="65%" r="70%"><stop offset="0" stop-color="#fffbe0"/><stop offset=".6" stop-color="#ffe08a"/><stop offset="1" stop-color="#ffc24d"/></radialGradient>
    <linearGradient id="locked" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d6fa8"/><stop offset="1" stop-color="#553a72"/></linearGradient>
    <radialGradient id="sun" cx="50%" cy="50%"><stop offset="0" stop-color="#fffbe6"/><stop offset=".6" stop-color="#fff0b8"/><stop offset="1" stop-color="#fff0b8" stop-opacity="0"/></radialGradient>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2c38f"/><stop offset="1" stop-color="#dc9c62"/></linearGradient>
  </defs>

  <rect x="-1500" y="-1500" width="4000" height="2220" fill="url(#sky)"/>
  <circle cx="850" cy="110" r="95" fill="url(#sun)"/>
  <circle cx="850" cy="110" r="42" fill="#fff6cf"/>

  <g opacity=".33" fill="none" stroke-width="16" class="rainbow">
    <path d="M110 560 A390 390 0 0 1 890 560" stroke="#ff7bac"/>
    <path d="M126 560 A374 374 0 0 1 874 560" stroke="#ffc94d"/>
    <path d="M142 560 A358 358 0 0 1 858 560" stroke="#8fd6a5"/>
    <path d="M158 560 A342 342 0 0 1 842 560" stroke="#9fc8ff"/>
    <path d="M174 560 A326 326 0 0 1 826 560" stroke="#c7a6ff"/>
  </g>

  <g class="cloud c1" fill="#fff"><ellipse cx="150" cy="120" rx="62" ry="26"/><ellipse cx="190" cy="104" rx="42" ry="30"/><ellipse cx="118" cy="108" rx="30" ry="22"/></g>
  <g class="cloud c2" fill="#fff" opacity=".9"><ellipse cx="640" cy="70" rx="50" ry="20"/><ellipse cx="672" cy="58" rx="32" ry="22"/></g>
  <g class="cloud c3" fill="#fff" opacity=".85"><ellipse cx="420" cy="150" rx="38" ry="15"/><ellipse cx="444" cy="140" rx="24" ry="16"/></g>

  <path d="M-1500 540 L0 520 Q180 430 400 490 T820 450 T1000 470 L2500 490 V720 H-1500Z" fill="#c3ebcf"/>
  <path d="M0 470 Q90 430 170 470 V720 H0Z" fill="#b3e2c2"/>

  <!-- stables -->
  <g>
    <rect x="812" y="480" width="150" height="100" rx="6" fill="url(#wood)"/>
    ${[0,1,2,3,4,5].map(i => `<line x1="${830 + i*24}" y1="484" x2="${830 + i*24}" y2="578" stroke="#c98a55" stroke-width="2" opacity=".6"/>`).join('')}
    <path d="M798 486 L887 420 L976 486Z" fill="#c96a3a"/>
    <path d="M815 474 L887 428 L959 474" stroke="#e0895a" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${win('stables', [852, 500, 70, 80], [887, 612])}
  </g>

  <!-- right tower -->
  <rect x="680" y="175" width="124" height="400" fill="url(#wallSide)"/>
  ${stones(680, 175, 124, 400, 3)}
  <path d="M662 182 L742 58 L822 182Z" fill="url(#roof2)"/>
  <path d="M662 182 Q742 196 822 182" stroke="#5a3a9c" stroke-width="5" fill="none"/>
  ${flag(742, 60, '#ffc94d')}
  ${win('tower', [714, 225, 56, 78], [742, 330])}

  <!-- left tower -->
  <rect x="196" y="215" width="134" height="360" fill="url(#wallSide)"/>
  ${stones(196, 215, 134, 360, 7)}
  <path d="M178 222 L263 78 L348 222Z" fill="url(#roof)"/>
  <path d="M178 222 Q263 236 348 222" stroke="#b3205a" stroke-width="5" fill="none"/>
  ${flag(263, 80, '#9fc8ff')}
  ${win('bedroom', [234, 262, 58, 80], [263, 368])}
  ${win('kitchen', [234, 420, 58, 80], [263, 526])}

  <!-- keep -->
  <rect x="330" y="300" width="350" height="275" fill="url(#wall)"/>
  ${stones(330, 300, 350, 275, 11)}
  ${merlons(332, 302, 346)}
  <!-- centre turret -->
  <rect x="452" y="185" width="96" height="118" fill="url(#wallSide)"/>
  <path d="M436 192 L500 80 L564 192Z" fill="url(#roof)"/>
  <path d="M436 192 Q500 204 564 192" stroke="#b3205a" stroke-width="5" fill="none"/>
  ${flag(500, 82, '#ff7bac')}
  <circle cx="500" cy="245" r="24" fill="#fff" stroke="#e9bfd3" stroke-width="3"/>
  ${[0,1,2,3,4,5].map(i => `<ellipse cx="500" cy="232" rx="7" ry="12" fill="#ff9ec2" transform="rotate(${i*60} 500 245)"/>`).join('')}
  <circle cx="500" cy="245" r="7" fill="#ffc94d"/>

  <!-- bunting -->
  <path d="M330 318 Q505 360 680 318" stroke="#c98fb0" stroke-width="2" fill="none"/>
  ${Array.from({length: 11}, (_, i) => {
    const t = (i + .5) / 11, x = 330 + t * 350, y = 318 + Math.sin(t * Math.PI) * 21;
    const c = ['#ff7bac', '#ffc94d', '#8fd6a5', '#9fc8ff', '#c7a6ff'][i % 5];
    return `<path d="M${x - 11} ${y} L${x + 11} ${y} L${x} ${y + 20}Z" fill="${c}"/>`;
  }).join('')}

  <!-- keep windows (decor) -->
  ${[[372, 382], [602, 382]].map(([x, y]) => `<path d="${windowArch(x, y, 36, 56)}" fill="#cfe4ff" stroke="#fff" stroke-width="5"/><line x1="${x + 18}" y1="${y + 4}" x2="${x + 18}" y2="${y + 56}" stroke="#fff" stroke-width="3"/>`).join('')}

  <!-- door: throne room -->
  <g>
    <path d="M438 575 V488 A62 62 0 0 1 562 488 V575Z" fill="#e9bfd3"/>
    ${win('throne', [448, 440, 104, 135], [500, 612])}
  </g>

  <!-- path and front hill -->
  <path d="M-1500 612 L0 610 Q260 560 470 590 L530 590 Q760 560 1000 600 L2500 604 V720 H-1500Z" fill="#96d9ab"/>
  <path d="M455 578 L545 578 L640 720 L360 720Z" fill="#ffe9c9"/>
  <path d="M470 600 h60 M455 630 h90 M438 664 h124 M418 700 h164" stroke="#f6d3a4" stroke-width="4" stroke-linecap="round"/>

  <!-- garden -->
  <g>
    <ellipse cx="140" cy="655" rx="130" ry="44" fill="#7fcf98"/>
    ${[[60, 640, '#ff7bac'], [95, 668, '#ffc94d'], [135, 646, '#fff'], [175, 670, '#c7a6ff'], [212, 648, '#ff7bac'], [245, 668, '#ffc94d']].map(([x, y, c]) =>
      `<g class="sway"><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 18}" stroke="#3d9967" stroke-width="3"/>${[0,1,2,3,4].map(i => `<circle cx="${x + Math.cos(i*1.256)*6}" cy="${y + Math.sin(i*1.256)*6}" r="5" fill="${c}"/>`).join('')}<circle cx="${x}" cy="${y}" r="4" fill="#ffc94d"/></g>`).join('')}
    ${win('garden', [110, 560, 64, 70], [142, 704])}
  </g>

  <!-- right front bushes -->
  <g fill="#6fc48c"><circle cx="760" cy="660" r="34"/><circle cx="800" cy="650" r="40"/><circle cx="846" cy="664" r="30"/></g>
  <g fill="#ff9ec2"><circle cx="772" cy="645" r="5"/><circle cx="806" cy="630" r="5"/><circle cx="840" cy="652" r="5"/><circle cx="792" cy="664" r="5"/></g>

  ${newRoom ? `<g class="sparkle-burst" pointer-events="none">${[0,1,2,3,4,5,6,7].map(i => `<text class="spk" style="--a:${i*45}deg" x="0" y="0" font-size="26">✨</text>`).join('')}</g>` : ''}
</svg>`;
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

export function roomSVG(id) {
  return `<svg class="room-bg" viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${ROOM_ART[id]()}</svg>`;
}
