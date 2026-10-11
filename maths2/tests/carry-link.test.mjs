// A #carry= link is attacker-controlled: it must not put markup into the page or unknown fields into the save.
// Run: node --test tests/carry-link.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

const one = new Map();
const qs = sel => one.get(sel) ?? one.set(sel, el()).get(sel);
function el() {
  const s = new Set();
  const props = { classList: { add: (...c) => c.forEach(x => s.add(x)), remove: (...c) => c.forEach(x => s.delete(x)), toggle() {}, contains: c => s.has(c) },
    dataset: {}, querySelector: qs, querySelectorAll: () => [], closest: () => null, addEventListener: (ev, f) => { props['on' + ev] = f; } };
  return new Proxy(function () {}, {
    get: (_, k) => (k in props ? props[k] : k === Symbol.toPrimitive ? () => 0 : typeof k === 'symbol' || k === 'then' ? undefined : (props[k] = el())),
    set: (_, k, v) => { props[k] = v; return true; },
    apply: () => el(),
  });
}
const bad = '<img src=x onerror=alert(1)>';
const carried = { started: true, name: 'Tara', coins: bad, earned: bad, stars: 2, levelFrom: bad, levels: { count: bad, sums: 4 },
  items: { nope: { x: 1, y: 1 } }, wish: bad, rounds: [{ g: bad, score: 1 }], extra: bad };
const store = new Map();
const globals = {
  document: el(), window: globalThis, history: { replaceState() {} },
  location: { hash: '#carry=' + encodeURIComponent(Buffer.from(JSON.stringify(carried)).toString('base64')), pathname: '/maths2/', search: '', origin: '' },
  localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } },
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 2, matchMedia: () => ({ matches: true }), requestAnimationFrame: () => 0, cancelAnimationFrame() {}, addEventListener() {},
  DOMParser: class { parseFromString() { return { documentElement: { querySelectorAll: () => [], children: [] } }; } },
  XMLSerializer: class { serializeToString() { return ''; } }, Request: class { constructor(url) { this.url = url; } },
  setTimeout: f => setImmediate(f), clearTimeout() {},
};
for (const [k, v] of Object.entries(globals)) Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });

await import('../js/app.js');
for (let i = 0; i < 500; i++) await new Promise(r => setImmediate(r));

test('a carried link keeps valid progress and drops markup and unknown fields', () => {
  const s = JSON.parse(store.get('maths-castle.v1'));
  assert.equal(s.started, true);
  assert.equal(s.stars, 2);
  assert.equal(s.levels.sums, 4);
  assert.equal(typeof s.levels.count, 'number');
  assert.equal(s.coins, 0);
  assert.equal(s.earned, 0);
  assert.deepEqual(s.items, {});
  assert.equal(s.wish, null);
  assert.deepEqual(s.rounds, []);
  assert.equal('extra' in s, false);
});

test('the grown-ups screen renders no carried markup', () => {
  qs('#grownups').onclick({ detail: 0 });
  assert.ok(qs('#modal-root').innerHTML.includes('Coins earned'), 'grown-ups sheet rendered');
  assert.ok(!qs('#modal-root').innerHTML.includes('<img'), 'no injected markup');
});
