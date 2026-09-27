// Plays recorded voice clips (audio/<speaker>/<key>.mp3) listed in audio/manifest.json.
// Uses Web Audio so clips can play back-to-back after the first tap, including on iPad.

const BASE = new URL('../audio/', import.meta.url);
let manifest = null;
let ctx = null;
let sources = [];
let token = 0;
const cache = new Map();

export const loaded = fetch(new URL('manifest.json', BASE), { cache: 'no-cache' })
  .then(r => (r.ok ? r.json() : null))
  .then(m => { manifest = m; return m; })
  .catch(() => null);

export function useContext(ac) { ctx = ac; }
export const has = (sp, key) => !!(sp && key && manifest?.clips?.[sp]?.[key]);
export const clipCount = () => Object.values(manifest?.clips || {}).reduce((a, o) => a + Object.keys(o).length, 0);
export const canPlay = parts => !!ctx && parts.length > 0 && parts.every(([sp, key]) => has(sp, key));

function load(sp, key) {
  const id = sp + '/' + key;
  if (!cache.has(id)) {
    const p = fetch(new URL(`${sp}/${key}.mp3?v=${manifest.clips[sp][key]}`, BASE))
      .then(r => { if (!r.ok) throw new Error(id); return r.arrayBuffer(); })
      .then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej)));
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return cache.get(id);
}

export function stop() {
  token++;
  sources.forEach(s => { try { s.stop(); } catch {} });
  sources = [];
}

// Plays the clips in order. Resolves when they finish, or straight away if something newer interrupts.
export async function play(parts, gap = 0.05) {
  stop();
  const mine = token;
  const bufs = await Promise.all(parts.map(([sp, key]) => load(sp, key)));
  if (mine !== token) return;
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
  let t = ctx.currentTime + 0.02;
  for (const b of bufs) {
    const src = ctx.createBufferSource();
    src.buffer = b;
    src.connect(ctx.destination);
    src.start(t);
    sources.push(src);
    t += b.duration + gap;
  }
  await new Promise(r => setTimeout(r, Math.max(0, (t - ctx.currentTime) * 1000)));
}

// Warm the cache for clips we know are coming (numbers, praise).
export function preload(parts) { if (ctx && manifest) parts.filter(([sp, k]) => has(sp, k)).forEach(([sp, k]) => load(sp, k).catch(() => {})); }
