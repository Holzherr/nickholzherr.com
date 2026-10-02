// Watercolour look for the whole game.
// - Filters: wobbly wash edges, uneven pigment, darker drying edges, loose pencil, paper grain.
// - Big scenes (castle, rooms) are painted once into a bitmap and cached, so the filters
//   never run per frame on an iPad. Only small sprites (Rosie, coins) are filtered live.
// - UI surfaces (buttons, cards, pills) get painted backgrounds via CSS custom properties.

export const PAPER = '#fbf6ec';
const VERSION = 'wc2';

// ---------- filters ----------
// `units`: 'box' sizes the filter region to each layer (cheap), 'all' covers the whole scene
// (needed for strokes whose bounding box can be flat).
export function wash(id, { f = .02, d = 12, m = .035, e = 2.2, b = .7, k = 1, a = 1.8, a0 = -.2, ring = .6, region = 'box' } = {}) {
  const reg = region === 'box' ? 'x="-12%" y="-12%" width="124%" height="124%"' : region;
  return `<filter id="${id}" ${reg} color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="3" seed="${k}" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="${d}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="${b}" result="db"/>
    <feTurbulence type="fractalNoise" baseFrequency="${m}" numOctaves="4" seed="${k + 7}" result="m"/>
    <feColorMatrix in="m" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 ${a} ${a0}" result="mA"/>
    <feComposite in="db" in2="mA" operator="in" result="mot"/>
    <feMorphology in="db" operator="erode" radius="${e}" result="er"/>
    <feComposite in="db" in2="er" operator="out" result="ring"/>
    <feColorMatrix in="ring" type="matrix" values=".68 0 0 0 0 0 .68 0 0 0 0 0 .76 0 0 0 0 0 ${ring} 0" result="ringD"/>
    <feGaussianBlur in="ringD" stdDeviation="${b + .2}" result="ringB"/>
    <feMerge><feMergeNode in="mot"/><feMergeNode in="ringB"/></feMerge></filter>`;
}

export function pencil(id, { d = 7, k = 3, region = 'x="-5%" y="-5%" width="110%" height="110%"' } = {}) {
  return `<filter id="${id}" ${region} color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="2" seed="${k}" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="${d}" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="${k + 3}" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3.2 -0.8" result="gA"/>
    <feComposite in="d" in2="gA" operator="in"/></filter>`;
}

export function grain(id, x, y, w, h) {
  return `<filter id="${id}" filterUnits="userSpaceOnUse" x="${x}" y="${y}" width="${w}" height="${h}">
    <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" seed="11"/>
    <feDiffuseLighting lighting-color="#fff" surfaceScale="1.5"><feDistantLight azimuth="45" elevation="58"/></feDiffuseLighting></filter>`;
}

// Scene filters: six washes with different wobble so neighbouring layers don't move together.
export function sceneFilters(x, y, w, h) {
  const all = `filterUnits="userSpaceOnUse" x="${x - 100}" y="${y - 100}" width="${w + 200}" height="${h + 200}"`;
  return [
    wash('wet', { f: .006, d: 70, m: .012, e: 5, b: 11, k: 41, region: 'x="-20%" y="-20%" width="140%" height="140%"' }),
    wash('halo', { f: .01, d: 30, m: .02, e: 4, b: 9, k: 52, region: 'x="-30%" y="-30%" width="160%" height="160%"' }),
    ...[1, 2, 3, 4, 5, 6].map(i => wash('w' + i, { d: 9 + i, k: i * 13, a: 1.3, a0: .2 })),
    wash('dab', { f: .05, d: 6, m: .08, e: 1.2, b: .5, k: 77, region: 'x="-30%" y="-30%" width="160%" height="160%"' }),
    wash('wt', { f: .05, d: 3, m: .06, e: .8, b: .3, k: 88, a: 1.2, a0: .3, ring: .45 }),
    pencil('pencil', { region: all }),
    grain('grain', x, y, w, h),
  ].join('');
}

// ---------- sprites and emoji, filtered live (small, so cheap) ----------
const LIVE_DEFS = [
  // Rosie and other ~120-unit drawings
  wash('wc-sprite', { f: .05, d: 1.6, m: .09, e: .9, b: .25, k: 5, a: 1.1, a0: .45, ring: .55 }),
  // coins and stars (40-unit viewBox)
  wash('wc-small', { f: .12, d: .9, m: .22, e: .5, b: .15, k: 9, a: 1.1, a0: .45, ring: .55 }),
  // emoji in HTML (CSS px)
  wash('wc-emoji', { f: .07, d: 2.2, m: .09, e: .8, b: .2, k: 17, a: 1.2, a0: .4, ring: .4 }),
].join('');

// ---------- painted UI surfaces ----------
const svgURL = s => `url("data:image/svg+xml,${encodeURIComponent(s.replace(/\s+/g, ' '))}")`;

function surface(fill, { shape = 'rect', d = 4, k = 1 } = {}) {
  const body = shape === 'round'
    ? `<ellipse cx="50%" cy="50%" rx="46%" ry="46%" fill="${fill}"/>`
    : `<rect x="2%" y="5%" width="96%" height="90%" rx="22" fill="${fill}"/>`;
  return svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><defs>
    ${wash('f', { f: .025, d, m: .02, e: 2, b: .6, k, a: .9, a0: .45, ring: .7, region: 'x="-5%" y="-5%" width="110%" height="110%"' })}
    </defs><g filter="url(#f)">${body}</g></svg>`);
}

const SURFACES = {
  card: '#fffaf2', blush: '#ffd9e7', pink: '#ef6f9f', gold: '#ffd36b', goldlight: '#ffeab0',
  green: '#6cc48c', mint: '#d5f0de', grape: '#7b4a8e', blue: '#cfe4f8', wood: '#e6b98a', berry: '#d9467f',
};

// A soft wet-in-wet sky for screen backgrounds.
function skyWash(top, mid, low) {
  return svgURL(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice"><defs>
    ${wash('w', { f: .006, d: 70, m: .012, e: 5, b: 11, k: 41, region: 'x="-20%" y="-20%" width="140%" height="140%"' })}</defs>
    <rect width="1000" height="700" fill="${PAPER}"/>
    <g filter="url(#w)" opacity=".75"><ellipse cx="280" cy="80" rx="420" ry="170" fill="${top}"/><ellipse cx="800" cy="60" rx="380" ry="150" fill="${top}"/></g>
    <g filter="url(#w)" opacity=".55"><ellipse cx="500" cy="360" rx="620" ry="170" fill="${mid}"/></g>
    <g filter="url(#w)" opacity=".6"><ellipse cx="500" cy="640" rx="640" ry="150" fill="${low}"/></g></svg>`);
}

// Shop awning: painted stripes with scalloped edge.
function awning() {
  return svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="120"><defs>
    <pattern id="p" width="120" height="120" patternUnits="userSpaceOnUse"><rect width="60" height="120" fill="#e0558c"/><rect x="60" width="60" height="120" fill="#fff6f0"/></pattern>
    <pattern id="s" width="120" height="30" patternUnits="userSpaceOnUse" y="92"><circle cx="30" cy="0" r="29" fill="#e0558c"/><circle cx="90" cy="0" r="29" fill="#fff6f0"/></pattern>
    ${wash('f', { f: .02, d: 8, m: .025, e: 2.2, b: .6, k: 3, a: 1, a0: .4, region: 'x="-2%" y="-10%" width="104%" height="120%"' })}</defs>
    <g filter="url(#f)"><rect width="100%" height="92" fill="url(#p)"/><rect y="92" width="100%" height="30" fill="url(#s)"/></g></svg>`);
}

const PAPER_GRAIN = svgURL(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="g" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/>
  <feDiffuseLighting lighting-color="#fff" surfaceScale="1.2"><feDistantLight azimuth="45" elevation="60"/></feDiffuseLighting></filter>
  <rect width="256" height="256" filter="url(#g)" opacity=".5"/></svg>`);

export function installPaint() {
  if (document.getElementById('wc-defs')) return;
  const holder = document.createElement('div');
  holder.innerHTML = `<svg id="wc-defs" width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>${LIVE_DEFS}</defs></svg>`;
  document.body.prepend(holder.firstChild);
  const root = document.documentElement.style;
  let k = 1;
  for (const [name, fill] of Object.entries(SURFACES)) {
    root.setProperty(`--wc-${name}`, surface(fill, { k: k++ }));
    root.setProperty(`--wc-${name}-round`, surface(fill, { shape: 'round', k: k++ }));
  }
  root.setProperty('--wc-grain', PAPER_GRAIN);
  root.setProperty('--wc-sky', skyWash('#a9d0f0', '#d4c2f0', '#f8c5d9'));
  root.setProperty('--wc-blossom', skyWash('#f8c5d9', '#fde3c4', '#f3b6cf'));
  root.setProperty('--wc-awning', awning());
}

// ---------- painted scenes, cached as bitmaps ----------
const jobs = new Map(); // key -> { doc(), w, h } scene description
const done = new Map(); // key@px -> Promise<url>

export function registerScene(key, scene) { jobs.set(key, scene); }

async function rasterise(key, px) {
  const { doc, w, h } = jobs.get(key);
  const pxW = px, pxH = Math.round(px * h / w);
  const req = new Request(`${location.pathname}__paint/${VERSION}/${encodeURIComponent(key)}/${pxW}.jpg`);
  let cache = null;
  try {
    cache = await caches.open('maths-castle-paint');
    const hit = await cache.match(req);
    if (hit) return URL.createObjectURL(await hit.blob());
  } catch { cache = null; }
  const src = URL.createObjectURL(new Blob([doc(pxW, pxH)], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = src;
    await img.decode();
    await new Promise(r => setTimeout(r, 30)); // Safari can draw a blank SVG on the first frame
    const c = document.createElement('canvas');
    c.width = pxW; c.height = pxH;
    c.getContext('2d').drawImage(img, 0, 0, pxW, pxH);
    const blob = await new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('toBlob'))), 'image/jpeg', .9));
    cache?.put(req, new Response(blob)).catch(() => {});
    URL.revokeObjectURL(src);
    return URL.createObjectURL(blob);
  } catch {
    return src; // the SVG itself still looks right, just isn't cached
  }
}

export function sceneURL(key, px) {
  px = Math.min(3200, Math.max(512, Math.ceil(px / 256) * 256));
  const id = `${key}@${px}`;
  if (!done.has(id)) done.set(id, rasterise(key, px));
  return done.get(id);
}

// Fill every <image data-paint> under `root` once its painting is ready.
export function hydrate(root) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  root.querySelectorAll('image[data-paint]').forEach(async im => {
    const svg = im.ownerSVGElement, vb = svg.viewBox.baseVal, r = svg.getBoundingClientRect();
    const fit = svg.getAttribute('preserveAspectRatio')?.includes('slice') ? Math.max : Math.min;
    const scale = fit(r.width / vb.width, r.height / vb.height) || 1;
    const url = await sceneURL(im.dataset.paint, +im.getAttribute('width') * scale * dpr);
    im.setAttribute('href', url);
    im.addEventListener('load', () => im.classList.add('ready'), { once: true });
    if (im.complete) im.classList.add('ready');
    setTimeout(() => im.classList.add('ready'), 400);
  });
}

// Warm the cache while the child is elsewhere, so the castle appears instantly.
export function prepaint(key, px) {
  const idle = window.requestIdleCallback || (f => setTimeout(f, 300));
  idle(() => { if (jobs.has(key)) sceneURL(key, px); });
}

// ---------- turn flat SVG art into a painting ----------
// Groups runs of sibling shapes into wash layers, adds loose pencil to the bigger shapes,
// and moves anything animated (class="twinkle") to a live overlay.
export function watercolourise(markup, w, h) {
  const parsed = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml').documentElement;
  const ser = new XMLSerializer();
  const live = [...parsed.querySelectorAll('.twinkle')].map(n => { n.remove(); return ser.serializeToString(n); }).join('');
  const out = [], lines = [];
  let run = [], runKey = '', runTag = '', layer = 0;
  const isStroke = n => n.tagName === 'line' || n.getAttribute('fill') === 'none';
  const flush = () => {
    if (!run.length) return;
    const html = run.map(n => ser.serializeToString(n)).join('');
    if (isStroke(run[0])) out.push(`<g filter="url(#pencil)">${html}</g>`);
    else out.push(`<g filter="url(#${runTag === 'text' ? 'wt' : 'w' + (1 + layer++ % 6)})">${html}</g>`);
    if (run.length <= 3 && /^(path|circle|ellipse)$/.test(runTag) && !isStroke(run[0])) {
      run.forEach(n => {
        const c = n.cloneNode();
        ['fill', 'opacity', 'class', 'style'].forEach(a => c.removeAttribute(a));
        lines.push(ser.serializeToString(c));
      });
    }
    run = []; runKey = ''; runTag = '';
  };
  for (const n of [...parsed.children]) {
    if (n.tagName === 'defs') { flush(); out.push(ser.serializeToString(n)); continue; }
    const key = n.tagName + (isStroke(n) ? '-s' : '');
    if (key !== runKey) flush();
    runKey = key; runTag = n.tagName; run.push(n);
  }
  flush();
  const body = out.join('') + (lines.length
    ? `<g filter="url(#pencil)" fill="none" stroke="#5a4462" stroke-width="2.2" stroke-linejoin="round" opacity=".55">${lines.join('')}</g>` : '');
  const doc = (pxW, pxH) => `<svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" viewBox="0 0 ${w} ${h}"><defs>${sceneFilters(0, 0, w, h)}</defs>
    <rect width="${w}" height="${h}" fill="${PAPER}"/>${body.replace(/xmlns="[^"]*"/g, '')}
    <rect width="${w}" height="${h}" filter="url(#grain)" opacity=".32" style="mix-blend-mode:multiply"/></svg>`;
  return { doc, live };
}
