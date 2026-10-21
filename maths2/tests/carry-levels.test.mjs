// A #carry= link can hold any number as a level: out-of-range levels must not reach the games, where they
// throw and leave every adventure stuck until the castle is wiped. Run: node --test tests/carry-levels.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

const errors = [], one = new Map();
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
const shown = { count: true, more: true, fewer: true, compare: true };
const carried = { started: true, name: 'Mia', shown, levels: { count: 9, more: 0, fewer: 2.5, compare: -3, sums: 4 }, gardenSeen: { count: 99, more: 2 } };
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
// Fixed so the adventure plays count, more, fewer, compare, peek, frog, each at the saved level.
Math.random = () => 0.999;
process.on('unhandledRejection', e => errors.push(String(e)));
const settle = async () => { for (let i = 0; i < 3000; i++) await new Promise(r => setImmediate(r)); };

await import('../js/app.js');
await settle();

test('a carried link keeps levels 1 to 5 and drops the rest', () => {
  const s = JSON.parse(store.get('maths-castle.v1'));
  assert.equal(s.levels.sums, 4);
  assert.deepEqual([s.levels.count, s.levels.more, s.levels.fewer, s.levels.compare], [1, 1, 1, 1]);
  assert.deepEqual(s.gardenSeen, { more: 2 });
});

test('an adventure after the carried link asks a question without errors', async () => {
  qs('#go-play').onclick();
  await settle();
  assert.deepEqual(errors, []);
  assert.match(qs('#q-text').textContent, /How many/);
});
