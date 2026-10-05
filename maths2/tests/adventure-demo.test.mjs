// Drives the real js/app.js through adventures on a stand-in DOM: no browser, instant timers, sound off
// (no speechSynthesis), Math.random fixed so the plan is count, more, fewer, compare, peek, frog and
// every first choice is the right answer. Run: node --test tests/adventure-demo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

const log = [], errors = [], one = new Map(), many = new Map();
const classes = () => {
  const s = new Set();
  return { add: (...c) => c.forEach(x => { s.add(x); log.push('+' + x); }), remove: (...c) => c.forEach(x => { if (s.delete(x)) log.push('-' + x); }),
    toggle: (c, on) => ((on ?? !s.has(c)) ? s.add(c) : s.delete(c)), contains: c => s.has(c) };
};
const qs = sel => one.get(sel) ?? one.set(sel, el()).get(sel);
const LISTS = ['.ans', '.plate', '.nl-n', '.nl-f'];
const qsa = sel => (LISTS.includes(sel) ? many.get(sel) ?? many.set(sel, [el(), el(), el()]).get(sel) : []);
function el() {
  const props = { classList: classes(), dataset: {}, querySelector: qs, querySelectorAll: qsa, closest: () => null,
    addEventListener: (ev, f) => { props['on' + ev] = f; } };
  return new Proxy(function () {}, {
    get: (_, k) => (k in props ? props[k] : k === Symbol.toPrimitive ? () => 0 : typeof k === 'symbol' || k === 'then' ? undefined : (props[k] = el())),
    set: (_, k, v) => { if (k === 'textContent' && v) log.push('text:' + v); props[k] = v; return true; },
    apply: () => el(),
  });
}
const store = new Map();
const globals = {
  document: el(), window: globalThis, location: { hash: '', pathname: '/maths2/', search: '', origin: '' }, history: { replaceState() {} },
  localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: i => [...store.keys()][i], get length() { return store.size; } },
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 2, matchMedia: () => ({ matches: true }), requestAnimationFrame: () => 0, cancelAnimationFrame() {}, addEventListener() {},
  DOMParser: class { parseFromString() { return { documentElement: { querySelectorAll: () => [], children: [] } }; } },
  XMLSerializer: class { serializeToString() { return ''; } }, Request: class { constructor(url) { this.url = url; } },
  setTimeout: f => setImmediate(f), clearTimeout() {},
};
for (const [k, v] of Object.entries(globals)) Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
Math.random = () => 0.999;
const realError = console.error;
console.error = (...a) => { errors.push(a.join(' ')); realError(...a); };
process.on('unhandledRejection', e => errors.push(String(e)));

const body = document.body;
const tick = () => new Promise(r => setImmediate(r));
const settle = async () => { for (let i = 0; i < 3000; i++) await tick(); };
const saved = () => JSON.parse(store.get('maths-castle.v1'));
const prizes = () => (qs('#progress').innerHTML.match(/class="prize/g) || []).length;
const demos = from => log.slice(from).filter(x => x === '+demo').length;
async function tapRightAnswer() {
  const stage = qs('#q-stage').innerHTML;
  let b;
  if (stage.includes('class="plates"')) { b = qsa('.plate')[0]; b.dataset.i = '1'; }
  else if (stage.includes('nl-n')) { const [, a, h] = stage.match(/(\d+) \+ (\d+) = \?/); b = qsa('.nl-n')[0]; b.dataset.v = String(+a + +h); }
  else { b = qsa('.ans')[0]; b.dataset.v = qs('#answers').innerHTML.match(/data-v="(\d+)"/)[1]; }
  b.onclick();
  await settle();
}

await import('../js/app.js');
await settle();

test('fresh save: the first adventure shows each demo game once, then asks 6 real questions and ends with a reward', async () => {
  assert.equal(body.dataset.screen, 's-gate');
  qs('#open-gates').onclick();
  await settle();
  const from = log.length;
  qs('#go-play').onclick();
  await settle();
  const seg = log.slice(from), on = seg.indexOf('+demo'), off = seg.indexOf('-demo');
  assert.ok(on >= 0 && seg.indexOf('text:How many jewels?') > on && off > on, 'count demo plays first');
  assert.ok(seg.slice(off).some(x => x.startsWith('text:')), 'then the real question');
  assert.equal(prizes(), 6, 'progress row shows 6 prizes after the demo');
  assert.equal(saved().shown.count, true);
  for (let i = 0; i < 6; i++) {
    assert.equal(body.dataset.screen, 's-play', `still playing before answer ${i + 1}`);
    assert.ok(!body.classList.contains('demo'));
    await tapRightAnswer();
  }
  assert.equal(body.dataset.screen, 's-reward');
  assert.equal(demos(from), 4, 'count, more, fewer and compare each demoed once');
  assert.deepEqual(saved().shown, { count: true, more: true, fewer: true, compare: true });
});

test('a second adventure plays no demo for games already shown', async () => {
  const from = log.length;
  qs('#rw-again').onclick();
  await settle();
  assert.equal(body.dataset.screen, 's-play');
  assert.equal(demos(from), 0);
  assert.equal(prizes(), 6);
});

test('castle button mid-demo returns home without errors and the demo plays next time', async () => {
  qs('#hud-home').onclick();
  qs('#grownups').onclick({ detail: 0 });
  qs('#p-demos').onclick();
  assert.deepEqual(saved().shown, {}, '"Show how to play again" clears shown games');
  qs('#go-play').onclick();
  for (let i = 0; i < 3000 && !body.classList.contains('demo'); i++) await tick();
  assert.ok(body.classList.contains('demo'), 'demo replays after "Show how to play again"');
  qs('#hud-home').onclick();
  await settle();
  assert.equal(body.dataset.screen, 's-castle');
  assert.equal(saved().shown.count, undefined, 'game left mid-demo is not marked shown');
  const from = log.length;
  qs('#go-play').onclick();
  await settle();
  assert.equal(demos(from), 1);
  assert.equal(saved().shown.count, true);
  assert.deepEqual(errors, []);
});
