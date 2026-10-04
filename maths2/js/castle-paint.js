// The castle as a watercolour: pigment layers (washes and glazes) under loose pencil.
// Painted on a wider sheet than the 1000×720 castle so wide and tall screens stay covered.
import { PAPER, sceneFilters } from './paint.js?v=1005demo';

export const SHEET = { x: -300, y: -400, w: 1600, h: 1120 };

// Room windows: [x, y, w, h] and where the name label sits.
export const WINDOWS = {
  stables: { box: [852, 500, 70, 80], label: [887, 612] },
  tower:   { box: [714, 225, 56, 78], label: [742, 330] },
  bedroom: { box: [234, 262, 58, 80], label: [263, 368] },
  kitchen: { box: [234, 420, 58, 80], label: [263, 526] },
  throne:  { box: [448, 440, 104, 135], label: [500, 612] },
  garden:  { box: [110, 560, 64, 70], label: [142, 704] },
};
const KEEP_WINDOWS = [[372, 382, 36, 56], [602, 382, 36, 56]];

export const arch = (x, y, w, h) => `M${x} ${y + h} V${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + h} Z`;
const ell = (cx, cy, rx, ry = rx) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const rect = (x, y, w, h) => `M${x} ${y} H${x + w} V${y + h} H${x} Z`;
const flagCloth = (x, y) => `M${x} ${y - 46} q18 -6 34 4 q-16 6 -34 10 z`;

const C = {
  pencil: '#5a4462',
  wall: '#f6c7d9', keep: '#fad6e3', wallG: '#e29abb', stone: '#d98fb2',
  roof: '#f0679a', roofG: '#bf3770', purple: '#a283e0', purpleG: '#6f4fbd',
  wood: '#e8ae72', woodG: '#c98446', barn: '#d06a3c',
  glow: '#ffd35c', glowG: '#f3a03a', locked: '#8d6fa8', lockedG: '#553a72',
  sky: '#9fcbee', lav: '#cbb7ec', blush: '#f7bdd2', sun: '#ffd65a',
  hill: '#a8d89d', front: '#87c98c', grassG: '#5dab70', path: '#f2d2a0', pathG: '#dfae74',
};

const S = {
  stables: rect(812, 480, 150, 100), barnRoof: 'M798 486 L887 420 L976 486 Z',
  rTower: rect(680, 175, 124, 400), rRoof: 'M662 182 L742 58 L822 182 Q742 196 662 182 Z',
  lTower: rect(196, 215, 134, 360), lRoof: 'M178 222 L263 78 L348 222 Q263 236 178 222 Z',
  keep: rect(330, 300, 350, 275),
  turret: rect(452, 185, 96, 118), tRoof: 'M436 192 L500 80 L564 192 Q500 204 436 192 Z',
  doorway: 'M438 575 V488 A62 62 0 0 1 562 488 V575 Z',
  merlons: Array.from({ length: 8 }, (_, i) => rect(332 + i * 46.6, 278, 26, 24)).join(' '),
  hillBack: 'M-290 560 Q-150 515 0 520 Q180 430 400 490 T820 450 T1000 470 Q1150 470 1290 505 L1290 650 L-290 650 Z',
  hillFront: 'M-290 618 Q-100 600 14 612 Q260 560 470 590 L530 590 Q760 560 1000 600 Q1150 610 1290 600 L1290 740 L-290 740 Z',
  road: 'M455 578 L545 578 L640 740 L360 740 Z',
};

function scene(open) {
  let s = 7;
  const R = (a, b) => a + ((s = (s * 16807) % 2147483647) - 1) / 2147483646 * (b - a);
  const o = [];
  const F = (c, d, x = {}) => o.push({ t: 'f', c, d: [].concat(d), role: 'base', op: .95, ...x });
  const K = d => o.push({ t: 'f', d: [].concat(d), role: 'knock', op: 1 });
  const Ln = (d, x = {}) => o.push({ t: 'l', d: [].concat(d), ...x });
  const side = (x, y, w, h) => rect(x + w * .62, y, w * .38, h);
  const band = (x, y, w) => rect(x, y, w, 26);
  const dabs = (x, y, w, h, n) => Array.from({ length: n }, () => {
    const dw = R(12, 22), dh = R(6, 10);
    return rect(+R(x + 4, x + w - dw - 4).toFixed(1), +R(y + 10, y + h - dh - 6).toFixed(1), +dw.toFixed(1), +dh.toFixed(1));
  });
  const wins = Object.entries(WINDOWS);
  const lit = wins.filter(([id]) => open[id]).map(([, w]) => w.box);
  const shut = wins.filter(([id]) => !open[id]).map(([, w]) => w.box);

  // sky, wet in wet
  F(C.sky, [ell(0, -120, 520, 300), ell(820, -140, 620, 300), ell(300, 110, 420, 140), ell(860, 90, 320, 120)], { role: 'sky', op: .85 });
  F(C.lav, ell(500, 300, 900, 160), { role: 'sky', op: .6 });
  F(C.blush, ell(500, 470, 900, 110), { role: 'sky', op: .6 });
  F('#fff0a8', ell(850, 110, 96), { role: 'halo', op: .8 });
  F(C.sun, ell(850, 110, 44));
  F(null, [ell(150, 120, 64, 26), ell(190, 102, 44, 30), ell(116, 106, 30, 22), ell(640, 72, 52, 20), ell(672, 58, 32, 22),
    ell(420, 152, 40, 15), ell(444, 140, 24, 16), ell(1120, 40, 70, 24), ell(1160, 26, 40, 22), ell(-140, 60, 60, 22)], { role: 'knock', op: .95 });
  F('#c6bde6', [ell(160, 138, 60, 8), ell(652, 84, 44, 6), ell(1130, 58, 60, 7)], { role: 'glaze', op: .45 });
  ['#ff7bac', '#ffc94d', '#8fd6a5', '#9fc8ff', '#c7a6ff'].forEach((c, i) =>
    F(c, `M${110 + i * 16} 560 A${390 - i * 16} ${390 - i * 16} 0 0 1 ${890 - i * 16} 560`, { stroke: 15, op: .42 }));
  Ln([[300, 205], [330, 190], [600, 150], [1040, 180]].map(([x, y]) => `M${x - 10} ${y} q5 -6 10 0 q5 -6 10 0`), { w: 1.6 });

  // hills and stables
  F(C.hill, S.hillBack, { op: .9 });
  F(C.grassG, ['M-290 570 Q-150 525 0 528 Q100 470 170 476 Q120 520 -290 600 Z', 'M1000 478 Q1150 476 1290 510 L1290 560 Q1150 520 1000 500 Z'], { role: 'glaze', op: .25 });
  F(C.wood, S.stables);
  F(C.woodG, [side(812, 480, 150, 100), band(812, 486, 150)], { role: 'glaze', op: .45 });
  F(C.barn, S.barnRoof);
  F('#9c4424', 'M887 420 L976 486 L887 486 Z', { role: 'glaze', op: .35 });

  // walls, on paper reserved from the sky and rainbow
  K([S.rTower, S.lTower, S.turret, S.keep, S.merlons, S.rRoof, S.lRoof, S.tRoof]);
  F(C.wall, [S.rTower, S.lTower, S.turret]);
  F(C.keep, [S.keep, S.merlons]);
  F(C.wallG, [side(680, 175, 124, 400), side(196, 215, 134, 360), side(452, 185, 96, 118), band(680, 186, 124), band(196, 226, 134), band(452, 196, 96), rect(330, 300, 350, 18)], { role: 'glaze', op: .5 });
  F(C.wallG, rect(600, 300, 80, 275), { role: 'glaze', op: .28 });
  F(C.stone, [...dabs(680, 175, 124, 400, 16), ...dabs(196, 215, 134, 360, 15), ...dabs(330, 300, 350, 275, 22)], { role: 'dab', op: .45 });

  // roofs and flags
  F(C.purple, S.rRoof);
  F(C.purpleG, 'M742 58 L822 182 Q782 192 742 192 Z', { role: 'glaze', op: .5 });
  F(C.roof, [S.lRoof, S.tRoof]);
  F(C.roofG, ['M263 78 L348 222 Q305 232 263 232 Z', 'M500 80 L564 192 Q532 200 500 200 Z'], { role: 'glaze', op: .5 });
  F('#ffc94d', flagCloth(742, 60)); F('#9fc8ff', flagCloth(263, 80)); F('#ff7bac', flagCloth(500, 82));

  // turret rose window and bunting
  K(ell(500, 245, 24));
  F('#ff9ec2', [0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return ell(500 + Math.sin(a) * 13, 245 - Math.cos(a) * 13, 7.5); }), { role: 'dab', op: .9 });
  F('#ffc94d', ell(500, 245, 7), { role: 'dab' });
  Array.from({ length: 11 }, (_, i) => {
    const t = (i + .5) / 11, x = 330 + t * 350, y = 318 + Math.sin(t * Math.PI) * 21;
    F(['#ff7bac', '#ffc94d', '#8fd6a5', '#9fc8ff', '#c7a6ff'][i % 5], `M${x - 11} ${y} L${x + 11} ${y} L${x} ${y + 20} Z`, { role: 'dab', op: .9 });
  });

  // front hill, path, garden
  F('#eab0c9', S.doorway, { op: .9 });
  F(C.front, S.hillFront, { op: .92 });
  F(C.grassG, ['M-290 690 Q0 660 300 670 Q400 690 500 690 T1000 676 Q1150 670 1290 680 L1290 740 L-290 740 Z', 'M640 640 Q800 610 1000 630 L1000 660 Q800 650 660 666 Z'], { role: 'glaze', op: .4 });
  F(C.path, S.road);
  F(C.pathG, ['M470 600 h60 v5 h-60z', 'M455 630 h90 v5 h-90z', 'M438 664 h124 v6 h-124z', 'M455 578 L470 578 L370 740 L360 740 Z'], { role: 'glaze', op: .45 });
  F('#79c48a', ell(140, 655, 130, 44), { op: .9 });
  F(C.grassG, 'M100 632 V594 A42 42 0 0 1 184 594 V632 h-10 V594 A32 32 0 0 0 110 594 V632 Z', { op: .9 });
  F('#ff8fb8', [[104, 600], [112, 576], [128, 558], [156, 558], [172, 576], [180, 600], [104, 624], [180, 624]].map(([x, y]) => ell(x, y, R(4, 6))), { role: 'dab', op: .9 });
  const fl = [[50, 650, '#ff7bac'], [85, 674, '#ffc94d'], [40, 676, '#ff9f6b'], [205, 646, '#ff7bac'], [240, 668, '#ffc94d'], [222, 686, '#b79bff'], [150, 686, '#f4a6ff']];
  fl.forEach(([x, y, c]) => F(c, [0, 1, 2, 3, 4].map(i => ell(x + Math.cos(i * 1.256) * 6, y + Math.sin(i * 1.256) * 6, R(4.5, 6.5))), { role: 'dab', op: .9 }));
  F('#f5b52e', fl.map(([x, y]) => ell(x, y, 3.5)), { role: 'dab' });
  F('#6fc48c', [ell(760, 660, 34), ell(800, 650, 40), ell(846, 664, 30)], { op: .9 });
  F(C.grassG, [ell(780, 676, 30, 14), ell(836, 680, 24, 10)], { role: 'glaze', op: .4 });
  F('#ff9ec2', [[772, 645], [806, 630], [840, 652], [792, 664]].map(([x, y]) => ell(x, y, 5)), { role: 'dab', op: .9 });

  // windows: lit rooms glow, locked rooms are dusk purple
  K([...Object.values(WINDOWS).map(w => arch(...w.box)), ...KEEP_WINDOWS.map(a => arch(...a))]);
  if (lit.length) {
    F(C.glow, lit.map(a => arch(...a)));
    F(C.glowG, lit.map(([x, y, w, h]) => rect(x, y + h * .62, w, h * .38)), { role: 'glaze', op: .45 });
  }
  if (shut.length) {
    F(C.locked, shut.map(a => arch(...a)));
    F(C.lockedG, shut.map(([x, y, w, h]) => rect(x, y, w, h * .45)), { role: 'glaze', op: .4 });
  }
  F('#b9d7f5', KEEP_WINDOWS.map(a => arch(...a)), { op: .85 });

  Ln(Array.from({ length: 110 }, () => {
    const x = R(-280, 1280), y = R(624, 712);
    return x > 360 && x < 640 ? '' : `M${x.toFixed(0)} ${y.toFixed(0)} q${R(-2, 2).toFixed(1)} -6 ${R(-4, 4).toFixed(1)} -${R(8, 14).toFixed(0)}`;
  }).filter(Boolean).join(' '), { c: '#3f8a55', w: 1.5, o: .55 });

  // pencil
  Ln([S.rTower, S.lTower, S.keep, S.turret, S.rRoof, S.lRoof, S.tRoof, S.stables, S.barnRoof, S.doorway, S.merlons,
      ...Object.values(WINDOWS).map(w => arch(...w.box)), ...KEEP_WINDOWS.map(a => arch(...a)),
      ...[[742, 60], [263, 80], [500, 82]].map(([x, y]) => flagCloth(x, y)), ell(500, 245, 24)], { jit: 3 });
  Ln([[742, 60], [263, 80], [500, 82]].map(([x, y]) => `M${x} ${y} V${y - 46}`), { c: '#6b2d5c', w: 2.4 });
  Ln(KEEP_WINDOWS.map(([x, y, w, h]) => `M${x + w / 2} ${y + 4} V${y + h}`));
  Ln([0, 1, 2, 3, 4, 5].map(i => `M${830 + i * 24} 486 V576`), { c: '#9c5a2c', o: .45 });
  Ln('M330 318 Q505 360 680 318', { w: 1.3 });
  Ln(['M14 612 Q260 560 470 590 L530 590 Q760 560 1000 600', 'M455 578 L370 740 M545 578 L630 740'], { w: 1.2, o: .45 });
  return { o, R };
}

export function castlePainting(open) {
  const { o, R } = scene(open);
  const paths = op => op.d.map(d => `<path d="${d}"/>`).join('');
  let layer = 0;
  const body = o.map(op => {
    if (op.t === 'l') {
      const t = op.jit ? ` transform="translate(${R(-op.jit, op.jit).toFixed(1)} ${R(-op.jit, op.jit).toFixed(1)})"` : '';
      return `<g filter="url(#pencil)" fill="none" stroke="${op.c || C.pencil}" stroke-width="${op.w || 1.8}" stroke-linecap="round" stroke-linejoin="round" opacity="${op.o ?? .72}"${t}>${paths(op)}</g>`;
    }
    const f = { sky: 'wet', halo: 'halo', dab: 'dab' }[op.role] || 'w' + (1 + layer++ % 6);
    const white = op.role === 'knock';
    const blend = op.role === 'glaze' || op.role === 'sky' ? 'multiply' : 'normal';
    const paint = op.stroke ? `fill="none" stroke="${op.c}" stroke-width="${op.stroke}" stroke-linecap="round"` : `fill="${white ? PAPER : op.c}"`;
    return `<g filter="url(#${f})" ${paint} opacity="${op.op}" style="mix-blend-mode:${blend}">${paths(op)}</g>`;
  }).join('');
  const { x, y, w, h } = SHEET;
  return {
    w, h,
    doc: (pxW, pxH) => `<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" viewBox="${x} ${y} ${w} ${h}">
      <defs>${sceneFilters(x, y, w, h)}</defs>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${PAPER}"/>${body}
      <rect x="${x}" y="${y}" width="${w}" height="${h}" filter="url(#grain)" opacity=".36" style="mix-blend-mode:multiply"/></svg>`,
  };
}
