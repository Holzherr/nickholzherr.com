import { ROOMS, ITEMS, FRIENDS, GAMES, MAX_LEVEL, ROUND_LEN, COINS_PER_ROUND, LEVEL_UP_BONUS, SPOTS, THINGS, GUESTS } from './data.js';
import { castleSVG, roomSVG, coinSVG, starSVG, novaSVG } from './art.js';

// ---------- helpers ----------
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const itemById = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const friendById = Object.fromEntries(FRIENDS.map(f => [f.id, f]));
const roomById = Object.fromEntries(ROOMS.map(r => [r.id, r]));
const defOf = id => itemById[id] || friendById[id];

const WORDS = {
  '💎': ['jewel', 'jewels'], '🍓': ['strawberry', 'strawberries'], '🌸': ['flower', 'flowers'], '🧁': ['cupcake', 'cupcakes'],
  '⭐': ['star', 'stars'], '🦋': ['butterfly', 'butterflies'], '🍎': ['apple', 'apples'], '🎀': ['bow', 'bows'], '🍰': ['cake', 'cakes'],
  '🧶': ['ball of wool', 'balls of wool'], '🔥': ['flame', 'flames'], '🥕': ['carrot', 'carrots'], '🌈': ['rainbow', 'rainbows'],
  '🪷': ['lily', 'lilies'], '✨': ['sparkle', 'sparkles'],
};
const word = (e, n) => (WORDS[e] || ['one', 'ones'])[n === 1 ? 0 : 1];

// ---------- saved state ----------
const KEY = 'maths-castle.v1';
const fresh = () => ({
  name: 'Tara', started: false, sound: true,
  coins: 0, earned: 0, spent: 0, stars: 0,
  levels: { count: 1, more: 1, fewer: 1, compare: 1 },
  good: { count: 0, more: 0, fewer: 0, compare: 0 },
  items: {}, friends: {}, wish: null, seenRooms: ['throne'],
  rounds: [], caught: 0, missed: 0,
});
let S = load();
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) return { ...fresh(), ...s }; } catch {}
  return fresh();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }
const owned = id => !!(S.items[id] || S.friends[id]);
const roomOpen = id => S.stars >= roomById[id].stars;

// ---------- sound ----------
let AC;
function tone(freq, dur = .12, type = 'sine', vol = .14, when = 0) {
  if (!S.sound) return;
  try {
    AC ||= new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .02);
  } catch {}
}
const sfx = {
  coin() { tone(1320, .08, 'triangle', .12); tone(1760, .16, 'triangle', .1, .06); },
  good() { [660, 880, 1100].forEach((f, i) => tone(f, .16, 'sine', .12, i * .08)); },
  soft() { tone(330, .2, 'sine', .1); },
  pop() { tone(560, .08, 'sine', .1); },
  fanfare() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .24, 'triangle', .12, i * .12)); },
};

let voice = null;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => /en-GB/i.test(v.lang) && /female|serena|kate|martha|libby|sonia|stephanie/i.test(v.name))
      || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  } catch {}
}
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch {}
function speak(text, { pitch = 1.1, rate = .95 } = {}) {
  if (!S.sound || !('speechSynthesis' in window)) return Promise.resolve();
  const plain = text.replace(/<[^>]+>/g, '');
  return new Promise(res => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(plain);
      if (voice) u.voice = voice;
      u.lang = 'en-GB'; u.pitch = pitch; u.rate = rate;
      u.onend = res; u.onerror = res;
      speechSynthesis.speak(u);
      setTimeout(res, 600 + plain.length * 75);
    } catch { res(); }
  });
}

// ---------- screens ----------
const SCREENS = ['s-gate', 's-castle', 's-room', 's-games', 's-play', 's-reward', 's-shop'];
let current = null;
function show(id) {
  SCREENS.forEach(s => { $('#' + s).hidden = s !== id; });
  current = id;
  $('#hud').hidden = id === 's-gate';
  $('#hud-home').hidden = id === 's-castle';
  closeModal();
  renderHud();
}

function renderHud() {
  $('#purse-n').textContent = S.coins;
  $('#stars-n').textContent = S.stars;
  $('#sound').textContent = S.sound ? '🔊' : '🔇';
  $('#sound').setAttribute('aria-label', S.sound ? 'Sound on' : 'Sound off');
  const w = $('#wish');
  if (S.wish && owned(S.wish)) { S.wish = null; save(); }
  const d = S.wish && defOf(S.wish);
  if (!d) { w.hidden = true; return; }
  const n = Math.min(S.coins, d.price);
  w.hidden = false;
  w.innerHTML = `<span class="we">${d.e}</span><span class="dots">${Array.from({ length: d.price }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span><span>${n}/${d.price}</span>`;
  w.setAttribute('aria-label', `Saving for ${d.name}: ${n} of ${d.price} coins`);
}
function bumpPurse() { const p = $('#purse'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }

function toast(text) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = text;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
}
function confetti(n = 40) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div'); box.className = 'confetti';
  const bits = ['✨', '⭐', '💖', '🌸', '🎀', '🪙'];
  for (let i = 0; i < n; i++) {
    const b = document.createElement('i'); b.textContent = pick(bits);
    b.style.left = Math.random() * 100 + '%'; b.style.animationDuration = 1.8 + Math.random() * 1.6 + 's'; b.style.animationDelay = Math.random() * .6 + 's';
    box.appendChild(b);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4200);
}
function fly(fromEl, toEl, html, size = 48) {
  const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'flying'; f.innerHTML = html;
  f.style.left = a.left + a.width / 2 - size / 2 + 'px'; f.style.top = a.top + a.height / 2 - size / 2 + 'px';
  document.body.appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    f.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.55)`;
  }));
  return wait(620).then(() => f.remove());
}

// ---------- modal ----------
function modal(html) {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  root.querySelectorAll('[data-close]').forEach(b => b.onclick = closeModal);
  return root.firstElementChild;
}
function closeModal() { $('#modal-root').innerHTML = ''; }
addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ---------- Nova ----------
let novaLine = '';
let novaTimer = 0;
function nova(html) {
  novaLine = html;
  const b = $('#nova-say');
  b.innerHTML = html; b.classList.remove('quiet');
  clearTimeout(novaTimer);
  const quiet = () => { novaTimer = setTimeout(() => b.classList.add('quiet'), 3500); };
  return speak(html, { pitch: 1.15 }).then(quiet);
}

// ---------- castle ----------
function peeks() {
  const p = {};
  for (const r of ROOMS) {
    const f = Object.keys(S.friends).map(id => friendById[id]).find(x => x.room === r.id);
    const it = Object.keys(S.items).map(id => itemById[id]).find(x => x.room === r.id);
    p[r.id] = (f || it)?.e || '';
  }
  return p;
}
function openCastle() {
  show('s-castle');
  const rooms = ROOMS.map(r => ({ ...r, open: roomOpen(r.id) }));
  $('#castle-wrap').innerHTML = castleSVG({ rooms, peeks: peeks() });
  $$('#castle-wrap .spot').forEach(g => {
    const go = () => tapRoom(g.dataset.room);
    g.addEventListener('click', go);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  castleHello();
}
function castleHello() {
  const fresh = ROOMS.filter(r => roomOpen(r.id) && !S.seenRooms.includes(r.id));
  if (fresh.length) {
    const r = fresh[0];
    S.seenRooms.push(r.id); save();
    $(`#castle-wrap .spot[data-room="${r.id}"]`)?.classList.add('fresh');
    sfx.fanfare(); confetti();
    return nova(`The <b>${r.name}</b> is open! Tap it to look inside.`);
  }
  const w = S.wish && defOf(S.wish);
  if (w && S.coins >= w.price) return nova(`You have enough coins for the <b>${w.name}</b>! Let's go to the Shop.`);
  const buyable = [...ITEMS, ...FRIENDS].filter(d => d.price > 0 && !owned(d.id) && roomOpen(d.room) && d.price <= S.coins);
  if (buyable.length) return nova(`You have <b>${S.coins}</b> coins. What will you buy?`);
  if (w) return nova(`You're saving for the <b>${w.name}</b>. Play maths to earn <b>${w.price - S.coins}</b> more coins!`);
  return nova(`Play maths to earn gold coins, ${esc(S.name)}!`);
}
function tapRoom(id) {
  if (!roomOpen(id)) {
    const r = roomById[id], need = r.stars - S.stars;
    sfx.soft();
    nova(`The <b>${r.name}</b> is locked. You need <b>${need}</b> more star${need > 1 ? 's' : ''}. Get better at a game to earn stars!`);
    return;
  }
  openRoom(id);
}

// ---------- rooms ----------
let roomId = null;
const ROOM_BG = {
  throne: ['#f9dce9', '#ffd9e8'], kitchen: ['#fff4e6', '#efb28c'], bedroom: ['#ecdfff', '#ffd3e4'],
  stables: ['#f2c38f', '#f6dc8a'], garden: ['#c9e4ff', '#9ee0b2'], tower: ['#3b2a5e', '#6b4a7e'],
};
const depth = y => .7 + clamp((y - 40) / 58, 0, 1) * .5;
function roomPieces(id) {
  return [
    ...Object.entries(S.items).filter(([k]) => itemById[k].room === id).map(([k, p]) => ({ id: k, kind: 'item', def: itemById[k], ...p })),
    ...Object.entries(S.friends).filter(([k]) => friendById[k].room === id).map(([k, p]) => ({ id: k, kind: 'friend', def: friendById[k], ...p })),
  ].sort((a, b) => a.y - b.y);
}
function openRoom(id, arriving) {
  roomId = id;
  show('s-room');
  const [wall, floor] = ROOM_BG[id];
  $('#s-room').style.setProperty('--wallc', wall); $('#s-room').style.setProperty('--floorc', floor);
  $('#room-title').textContent = roomById[id].name;
  const st = $('#room-stage');
  st.innerHTML = roomSVG(id);
  const pieces = roomPieces(id);
  pieces.forEach(p => st.appendChild(pieceEl(p, p.id === arriving)));
  if (!pieces.length) {
    const h = document.createElement('div'); h.className = 'room-hint';
    h.innerHTML = `This room is empty.<br>Buy things for it in the Shop!`;
    st.appendChild(h);
    speak(`The ${roomById[id].name} is empty. Buy things for it in the Shop!`, { pitch: 1.15 });
  } else if (!arriving) {
    speak(`Welcome to the ${roomById[id].name}! You can move things around.`, { pitch: 1.15 });
  }
}
function pieceEl(p, isNew) {
  const el = document.createElement('div');
  el.className = 'piece' + (p.kind === 'friend' ? ' friend' : '') + (isNew ? ' arrive' : '');
  place(el, p);
  el.innerHTML = `<span>${p.def.e}</span>${p.kind === 'friend' && p.taught ? '<span class="badge" aria-hidden="true">⭐</span>' : ''}`;
  el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', p.def.name);
  let start = null, moved = false;
  el.addEventListener('pointerdown', e => {
    start = { x: e.clientX, y: e.clientY, px: p.x, py: p.y }; moved = false;
    el.setPointerCapture(e.pointerId); el.classList.add('dragging'); el.classList.remove('arrive');
  });
  el.addEventListener('pointermove', e => {
    if (!start) return;
    const r = $('#room-stage').getBoundingClientRect();
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) moved = true;
    if (!moved) return;
    p.x = clamp(start.px + (e.clientX - start.x) / r.width * 100, 4, 96);
    p.y = clamp(start.py + (e.clientY - start.y) / r.height * 100, 24, 99);
    place(el, p);
  });
  const end = () => {
    if (!start) return;
    start = null; el.classList.remove('dragging');
    const store = p.kind === 'friend' ? S.friends : S.items;
    store[p.id] = { ...store[p.id], x: +p.x.toFixed(1), y: +p.y.toFixed(1) };
    save();
    if (!moved) tapPiece(p, el);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapPiece(p, el); } });
  return el;
}
function place(el, p) {
  el.style.left = p.x + '%'; el.style.top = p.y + '%';
  el.style.setProperty('--s', depth(p.y)); el.style.zIndex = Math.round(p.y);
}
function sayPop(p, text) {
  $$('.say-pop').forEach(x => x.remove());
  const b = document.createElement('div'); b.className = 'say-pop'; b.textContent = text;
  b.style.left = clamp(p.x, 18, 82) + '%'; b.style.top = Math.max(8, p.y - 18 * depth(p.y)) + '%';
  $('#room-stage').appendChild(b); setTimeout(() => b.remove(), 2600);
}
function tapPiece(p, el) {
  const span = el.firstElementChild;
  span.animate?.([{ transform: 'rotate(0)' }, { transform: 'rotate(-10deg) scale(1.1)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], { duration: 450 });
  if (p.kind === 'item') { sfx.pop(); sayPop(p, p.def.name); speak(p.def.name); return; }
  const f = p.def;
  if (!p.taught || Math.random() < .45) return teach(f);
  const lines = [`Hello ${S.name}!`, `I love the ${roomById[f.room].name}!`, `You're a great teacher, ${S.name}!`, `Shall we count something?`];
  const line = pick(lines);
  sayPop(p, line); speak(line, { pitch: f.pitch });
}
function nextSpot(room) {
  const taken = roomPieces(room);
  const free = SPOTS.find(([x, y]) => taken.every(t => Math.hypot(t.x - x, (t.y - y) * 1.6) > 22));
  return free ? { x: free[0], y: free[1] } : { x: rnd(15, 85), y: rnd(62, 94) };
}

// ---------- games ----------
function openGames() {
  show('s-games');
  $('#game-grid').innerHTML = GAMES.map(g => `
    <button class="game-tile" data-g="${g.id}">
      <span class="gi">${g.icon}</span><b>${g.name}</b><small>${g.about}</small>
      <span class="lvl" aria-label="Level ${S.levels[g.id]} of ${MAX_LEVEL}">${Array.from({ length: MAX_LEVEL }, (_, i) => starSVG(22).replace('<svg', `<svg class="${i < S.levels[g.id] ? 'on' : ''}"`)).join('')}</span>
    </button>`).join('');
  $$('.game-tile').forEach(b => b.onclick = () => startRound(b.dataset.g));
  speak('Pick a game!', { pitch: 1.15 });
}

let R = null;
function startRound(game) {
  R = { game, i: 0, results: [], level: S.levels[game], lastN: null };
  show('s-play');
  nextQ();
}
function choices(ans, min) {
  const out = new Set([ans]);
  const c = shuffle([ans - 1, ans + 1, ans - 2, ans + 2].filter(x => x >= min));
  while (out.size < 3 && c.length) out.add(c.shift());
  return shuffle([...out]);
}
function freshN(a, b) { let n, k = 0; do { n = rnd(a, b); } while (n === R.lastN && k++ < 8); R.lastN = n; return n; }
function makeQ(game, lv) {
  if (game === 'count') {
    const [a, b] = [[1, 5], [3, 10], [6, 12]][lv - 1];
    const n = freshN(a, b), t = pick(THINGS);
    return { game, n, t, ans: n, text: `How many ${word(t, 2)}?`, say: `How many ${word(t, 2)}? Count them!`, choices: choices(n, 1) };
  }
  if (game === 'more') {
    const add = lv === 3 ? 2 : 1, [a, b] = [[1, 4], [3, 8], [2, 7]][lv - 1];
    const n = freshN(a, b), t = pick(GUESTS);
    const come = add === 1 ? 'One more comes' : 'Two more come';
    return { game, n, add, t, ans: n + add, text: `${come}! How many now?`, say: `There are ${n} at the party. ${come}. How many now?`, choices: choices(n + add, 1) };
  }
  if (game === 'fewer') {
    const sub = lv === 3 ? 2 : 1, [a, b] = [[2, 5], [3, 9], [4, 10]][lv - 1];
    const n = freshN(a, b), t = pick(GUESTS);
    const go = sub === 1 ? 'One goes' : 'Two go';
    return { game, n, sub, t, ans: n - sub, text: `${go} to bed. How many left?`, say: `${n} friends are playing. ${go} to bed. How many are left?`, choices: choices(n - sub, 1) };
  }
  const t = pick(['🍰', '🧁', '🍓', '🍎', '💎']);
  let a, b;
  if (lv === 1) { a = rnd(1, 3); b = a + rnd(3, 4); } else { a = rnd(2, 7); b = a + rnd(1, 2); }
  if (Math.random() < .5) [a, b] = [b, a];
  const ans = a > b ? 0 : 1;
  return { game, a, b, t, ans, big: lv === 3 ? 1 - ans : null, text: 'Which plate has more?', say: `Which plate has more ${word(t, 2)}?` };
}
const objs = (e, n, cls = '') => Array.from({ length: n }, () => `<span class="o ${cls}">${e}</span>`).join('');

function renderProgress() {
  $('#progress').innerHTML = Array.from({ length: ROUND_LEN }, (_, i) => {
    const r = R.results[i];
    return `<i class="${r === true ? 'ok' : r === false ? 'miss' : i === R.i ? 'now' : ''}"></i>`;
  }).join('');
}
function nextQ() {
  if (R.i >= ROUND_LEN) return endRound();
  const q = makeQ(R.game, R.level);
  R.q = q; R.tries = 0; R.locked = false;
  renderProgress();
  renderQ(q);
}
async function renderQ(q) {
  $('#q-text').textContent = q.text;
  const st = $('#q-stage'), ans = $('#answers');
  ans.innerHTML = ''; st.innerHTML = '';
  const alive = () => R && R.q === q && current === 's-play';
  if (q.game === 'compare') {
    const size = i => q.big == null ? '' : q.big === i ? 'font-size:clamp(58px,10vw,88px)' : 'font-size:clamp(30px,5vw,42px)';
    st.innerHTML = `<div class="plates">${[q.a, q.b].map((n, i) => `<button class="plate" data-i="${i}" aria-label="Plate ${i + 1}"><div class="objs" style="${size(i)}">${objs(q.t, n)}</div></button>`).join('')}</div>`;
    $$('.plate').forEach(p => p.onclick = () => answer(+p.dataset.i, p));
    speak(q.say);
    return;
  }
  st.innerHTML = `<div class="objs" id="objs">${objs(q.t, q.n)}</div>`;
  const showAnswers = () => {
    ans.innerHTML = q.choices.map(c => `<button class="ans" data-v="${c}">${c}</button>`).join('');
    $$('.ans').forEach(b => b.onclick = () => answer(+b.dataset.v, b));
  };
  if (q.game === 'count') { showAnswers(); speak(q.say); return; }
  speak(q.say);
  await wait(q.game === 'more' ? 2300 : 2600);
  if (!alive()) return;
  const box = $('#objs');
  if (q.game === 'more') {
    for (let k = 0; k < q.add; k++) { box.insertAdjacentHTML('beforeend', `<span class="o in">${pick(GUESTS)}</span>`); sfx.pop(); await wait(450); }
  } else {
    const all = [...box.querySelectorAll('.o')];
    all.slice(-q.sub).forEach(o => { o.textContent = '💤'; o.classList.add('out'); });
    sfx.soft();
    await wait(900);
  }
  if (alive()) showAnswers();
}
async function countAlong(container, { skipOut = true, tag = true } = {}) {
  const items = [...container.querySelectorAll('.o')].filter(o => !(skipOut && o.classList.contains('out')));
  let t = null;
  if (tag) { t = document.createElement('div'); t.className = 'count-tag'; container.closest('.stagebox')?.appendChild(t); }
  for (let k = 0; k < items.length; k++) {
    items[k].classList.add('hl');
    if (t) t.textContent = k + 1;
    speak(String(k + 1), { rate: 1.05 });
    tone(500 + k * 40, .08, 'sine', .08);
    await wait(700);
  }
  await wait(300);
  items.forEach(o => o.classList.remove('hl'));
  return items.length;
}
async function answer(v, el) {
  if (R.locked) return;
  const q = R.q;
  if (v === q.ans) {
    R.locked = true;
    el.classList.add('right');
    R.results[R.i] = R.tries === 0;
    renderProgress();
    sfx.good();
    speak(pick(['Yes!', 'Well done!', "That's right!", 'Brilliant!', 'Super!']), { pitch: 1.2 });
    await wait(1200);
    if (R?.q !== q) return;
    R.i++;
    nextQ();
    return;
  }
  R.tries++;
  el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong');
  sfx.soft();
  if (R.tries > 1) return;
  R.locked = true;
  await speak("Not quite. Let's count together.", { pitch: 1.15 });
  if (R?.q !== q) return;
  if (q.game === 'compare') {
    const plates = $$('.plate');
    const na = await countAlong(plates[0].querySelector('.objs'), { tag: false });
    await wait(300);
    const nb = await countAlong(plates[1].querySelector('.objs'), { tag: false });
    if (R?.q !== q) return;
    const [hi, lo] = na > nb ? [na, nb] : [nb, na];
    plates[q.ans].classList.add('right');
    speak(`${hi} is more than ${lo}. Tap that plate.`);
  } else {
    await countAlong($('#objs'));
    if (R?.q !== q) return;
    $(`.ans[data-v="${q.ans}"]`)?.classList.add('right');
    speak(`It's ${q.ans}. Tap ${q.ans}.`);
  }
  R.locked = false;
}

function endRound() {
  const g = R.game, score = R.results.filter(Boolean).length;
  let levelUp = false, star = false;
  if (score === ROUND_LEN || (score >= 4 && S.good[g] >= 1)) {
    if (S.levels[g] < MAX_LEVEL) { S.levels[g]++; levelUp = true; star = true; }
    else if (score === ROUND_LEN) star = true;
    S.good[g] = 0;
  } else if (score >= 4) S.good[g]++;
  else S.good[g] = 0;
  if (star) S.stars++;
  const coins = COINS_PER_ROUND + (star ? LEVEL_UP_BONUS : 0);
  S.rounds.push({ g, score, level: R.level, at: Date.now() });
  save();
  showReward({ score, coins, levelUp, star, game: g });
}

// ---------- reward ----------
function showReward({ score, coins, levelUp, star, game }) {
  show('s-reward');
  $('#rw-buttons').hidden = true;
  $('#rw-star').innerHTML = '';
  $('#rw-title').textContent = score >= 4 ? `Amazing, ${S.name}!` : score >= 2 ? `Well done, ${S.name}!` : `Good trying, ${S.name}!`;
  $('#rw-sub').textContent = `You earned ${coins} coins. Tap each one to put it in your purse.`;
  const c = $('#cushion'); c.innerHTML = '';
  let left = coins, got = 0;
  for (let k = 0; k < coins; k++) {
    const row = Math.floor(k / 4), col = k % 4, perRow = Math.min(4, coins - row * 4);
    const b = document.createElement('button');
    b.className = 'loose-coin';
    b.style.left = 50 + (col - (perRow - 1) / 2) * 20 + '%';
    b.style.top = (coins > 4 ? 32 + row * 38 : 50) + '%';
    b.style.animationDelay = k * .09 + 's';
    b.innerHTML = coinSVG(64); b.setAttribute('aria-label', 'Gold coin');
    b.onclick = async () => {
      b.disabled = true; b.style.visibility = 'hidden';
      got++; S.coins++; S.earned++; save();
      sfx.coin(); speak(String(got), { rate: 1.05 });
      await fly(b, $('#purse'), coinSVG(48));
      renderHud(); bumpPurse();
      if (--left === 0) afterCoins({ levelUp, star, game });
    };
    c.appendChild(b);
  }
  speak(`${$('#rw-title').textContent} You earned ${coins} coins. Tap them to put them in your purse.`, { pitch: 1.15 });
}
async function afterCoins({ levelUp, star, game }) {
  await wait(500);
  let line = `You have ${S.coins} coins now.`;
  if (star) {
    $('#rw-star').innerHTML = `<div class="big-star">${starSVG(110)}</div>`;
    sfx.fanfare(); confetti();
    const g = GAMES.find(x => x.id === game);
    line = levelUp ? `You got a star! ${g.name} goes up to level ${S.levels[game]}. ` + line : `A perfect round! You got a star! ` + line;
    const opened = ROOMS.find(r => r.stars === S.stars);
    if (opened) line += ` And a new room is open in your castle!`;
  }
  $('#rw-sub').textContent = line;
  speak(line, { pitch: 1.15 });
  $('#rw-buttons').hidden = false;
}

// ---------- shop ----------
let shopTab = 'throne';
function openShop(tab, payId) {
  if (tab) shopTab = tab;
  if (shopTab !== 'friends' && !roomOpen(shopTab)) shopTab = 'throne';
  show('s-shop');
  renderShop();
  if (payId) openPay(payId);
  else speak(`Welcome to the Castle Market! You have ${S.coins} coins.`, { pitch: 1.15 });
}
function renderShop() {
  const tabs = [...ROOMS.map(r => ({ id: r.id, name: r.name, open: roomOpen(r.id), stars: r.stars })), { id: 'friends', name: 'Friends', open: true }];
  $('#tabs').innerHTML = tabs.map(t => `<button class="tab ${t.open ? '' : 'locked'}" data-t="${t.id}" aria-pressed="${t.id === shopTab}">${t.open ? '' : '🔒 '}${t.name}</button>`).join('');
  $$('.tab').forEach(b => b.onclick = () => {
    const t = tabs.find(x => x.id === b.dataset.t);
    if (!t.open) { sfx.soft(); toast(`The ${t.name} opens at ★ ${t.stars}`); return; }
    shopTab = t.id; sfx.pop(); renderShop();
  });
  const wares = shopTab === 'friends' ? FRIENDS.filter(f => f.price > 0) : ITEMS.filter(i => i.room === shopTab);
  $('#shelf').innerHTML = wares.map(d => {
    const have = owned(d.id), open = roomOpen(d.room);
    const cls = ['ware', have && 'owned', !open && 'shadow', S.wish === d.id && 'wished'].filter(Boolean).join(' ');
    const tag = have ? `✓ In castle` : !open ? `🔒 ${roomById[d.room].name}` : `${coinSVG(26)}${d.price}`;
    return `<button class="${cls}" data-id="${d.id}" aria-label="${d.name}${have ? ', in your castle' : `, ${d.price} coins`}"><span class="we">${d.e}</span><b>${d.name}</b><span class="price">${tag}</span></button>`;
  }).join('');
  $$('.ware').forEach(b => b.onclick = () => {
    const d = defOf(b.dataset.id);
    if (owned(d.id)) return openRoom(d.room);
    if (!roomOpen(d.room)) { sfx.soft(); toast(`${d.name} lives in the ${roomById[d.room].name}. It opens at ★ ${roomById[d.room].stars}`); return; }
    openPay(d.id);
  });
  const have = (shopTab === 'friends' ? FRIENDS.filter(f => f.price > 0) : wares).filter(d => owned(d.id)).length;
  $('#shop-note').textContent = `You have ${S.coins} coins. ${have} of ${wares.length} ${shopTab === 'friends' ? 'friends' : 'treasures'} collected here.`;
}

function openPay(id) {
  const d = defOf(id), price = d.price;
  let paid = 0, done = false;
  const pile = n => Array.from({ length: Math.min(n, 6) }, (_, i) => coinSVG(44, `style="left:${20 + (i % 3) * 8}px;top:${22 - i * 5}px"`)).join('');
  const m = modal(`<div class="sheet pay">
      <button class="round-btn close-x" data-close aria-label="Close">✕</button>
      <h3>${d.name}</h3>
      <div class="pay-grid">
        <div class="pay-item"><span class="we">${d.e}</span><span class="price">${coinSVG(26)}${price}</span></div>
        <div class="counter" id="counter">${Array.from({ length: price }, () => '<span class="slot"></span>').join('')}</div>
        <button class="purse-pile" id="pile"><span class="pile" id="pile-coins">${pile(S.coins)}</span><b id="pile-n">${S.coins}</b><small>Tap to pay</small></button>
      </div>
      <div class="pay-msg" id="pay-msg"></div>
      <div class="row" id="pay-actions"></div>
    </div>`);
  const msg = (html, sayIt = true) => { m.querySelector('#pay-msg').innerHTML = html; if (sayIt) speak(html, { pitch: 1.15 }); };
  msg(`It costs <b>${price}</b> coins. Tap your purse to pay, one coin at a time.`);
  const slots = [...m.querySelectorAll('.slot')];
  const pileBtn = m.querySelector('#pile');
  const notEnough = () => {
    const need = price - S.coins;
    slots.slice(paid).forEach(s => s.classList.add('need'));
    pileBtn.disabled = true;
    msg(`You have <b>${S.coins}</b>. It costs <b>${price}</b>. You need <b>${need}</b> more!`);
    m.querySelector('#pay-actions').innerHTML = `<button class="btn gold" id="save-for">⭐ Save up for it</button><button class="btn pink" id="earn">✏️ Play maths</button>`;
    m.querySelector('#save-for').onclick = () => { S.wish = id; save(); closeModal(); toast(`Saving up for the ${d.name}`); openCastle(); };
    m.querySelector('#earn').onclick = () => { closeModal(); openGames(); };
  };
  pileBtn.onclick = async () => {
    if (done || paid >= price) return;
    if (S.coins - paid <= 0) return notEnough();
    const slot = slots[paid];
    paid++;
    m.querySelector('#pile-n').textContent = S.coins - paid;
    m.querySelector('#pile-coins').innerHTML = pile(S.coins - paid);
    sfx.coin(); speak(String(paid), { rate: 1.1 });
    await fly(pileBtn, slot, coinSVG(44), 44);
    slot.classList.add('filled'); slot.innerHTML = coinSVG(40);
    if (paid === price) buy();
    else if (S.coins - paid === 0) setTimeout(notEnough, 500);
  };
  const buy = async () => {
    done = true;
    S.coins -= price; S.spent += price;
    const spot = nextSpot(d.room);
    if (friendById[id]) S.friends[id] = { ...spot, taught: false };
    else S.items[id] = spot;
    if (S.wish === id) S.wish = null;
    save(); renderHud(); bumpPurse();
    sfx.fanfare(); confetti(50);
    msg(`It's yours! Let's put it in the <b>${roomById[d.room].name}</b>.`);
    await wait(2300);
    closeModal();
    openRoom(d.room, id);
    if (friendById[id]) { await wait(1300); if (current === 's-room') teach(friendById[id]); }
  };
}

// ---------- teaching a friend ----------
async function teach(f) {
  const lv = S.levels.count;
  const n = rnd(2, lv === 1 ? 5 : 8);
  const rec = S.friends[f.id];
  const first = !rec.taught;
  const wrong = first || Math.random() < .6;
  const said = wrong ? (n > 2 && Math.random() < .5 ? n - 1 : n + 1) : n;
  const m = modal(`<div class="sheet teach">
      <button class="round-btn close-x" data-close aria-label="Close">✕</button>
      <div class="teach-face">${f.e}</div>
      <div class="teach-say" id="t-say"></div>
      <div class="stagebox" style="min-height:130px"><div class="objs" id="t-objs">${objs(f.thing, n)}</div></div>
      <div class="row" id="t-act"></div>
    </div>`);
  const say = html => { m.querySelector('#t-say').innerHTML = html; return speak(html, { pitch: f.pitch }); };
  const act = html => { m.querySelector('#t-act').innerHTML = html; };
  const alive = () => m.isConnected;
  const finish = async (html, taughtNow) => {
    if (taughtNow) { rec.taught = true; save(); }
    act(`<button class="btn pink" id="t-bye">👋 Bye, ${f.name.split(' ').pop()}!</button>`);
    m.querySelector('#t-bye').onclick = () => { closeModal(); if (current === 's-room') openRoom(roomId); };
    await say(html);
  };
  const countTogether = async () => {
    await say(`Let's count together!`);
    if (alive()) await countAlong(m.querySelector('#t-objs'), { tag: true });
  };

  await say(first ? `Hello ${esc(S.name)}! I'm ${f.name}. I'm still learning to count. Can you check for me?` : `Can you check my counting, ${esc(S.name)}?`);
  if (!alive()) return;
  await wait(300);
  say(`I think there are <b>${said}</b> ${word(f.thing, said)}. Am I right?`);
  act(`<button class="btn green" id="t-yes">✓ Yes</button><button class="btn pink" id="t-no">✗ No</button>`);
  m.querySelector('#t-yes').onclick = async () => {
    act('');
    if (!wrong) { sfx.good(); return finish(`Hooray! Thank you for checking, ${esc(S.name)}!`, true); }
    await countTogether(); if (!alive()) return;
    S.missed++; save();
    finish(`It's <b>${n}</b>! I said ${said}. ${f.quirk} We both learned something!`, true);
  };
  m.querySelector('#t-no').onclick = async () => {
    act('');
    if (!wrong) {
      await countTogether(); if (!alive()) return;
      return finish(`It's <b>${n}</b>. I was right this time! Good checking.`, true);
    }
    say(`Oh! How many are there? Show me!`);
    act(choices(n, 1).map(c => `<button class="ans" data-v="${c}">${c}</button>`).join(''));
    m.querySelectorAll('#t-act .ans').forEach(b => b.onclick = async () => {
      const v = +b.dataset.v;
      if (v === n) {
        b.classList.add('right'); sfx.good(); confetti(24);
        S.caught++; save();
        act('');
        return finish(`<b>${n}</b>! ${f.quirk} Thank you for teaching me, ${esc(S.name)}!`, true);
      }
      b.classList.add('wrong'); sfx.soft();
      act('');
      await countTogether(); if (!alive()) return;
      finish(`It's <b>${n}</b>! Counting together helps us both.`, true);
    });
  };
}

// ---------- grown-ups ----------
function openParent() {
  const rows = GAMES.map(g => {
    const rs = S.rounds.filter(r => r.g === g.id);
    return `<tr><td>${g.icon} ${g.name}</td><td>Level ${S.levels[g.id]} of ${MAX_LEVEL}</td><td>${rs.length} rounds</td></tr>`;
  }).join('');
  const m = modal(`<div class="sheet parent">
      <button class="round-btn close-x" data-close aria-label="Close">✕</button>
      <h3>Grown-ups</h3>
      <div class="field"><input id="p-name" value="${esc(S.name)}" maxlength="16" aria-label="Child's name"><button class="btn" id="p-save-name">Save name</button></div>
      <table><tbody>${rows}
        <tr><td>Coins earned / spent</td><td></td><td>${S.earned} / ${S.spent}</td></tr>
        <tr><td>Stars</td><td></td><td>${S.stars}</td></tr>
        <tr><td>Friends' mistakes caught / missed</td><td></td><td>${S.caught} / ${S.missed}</td></tr>
        <tr><td>Treasures and friends</td><td></td><td>${Object.keys(S.items).length + Object.keys(S.friends).length} of ${ITEMS.length + FRIENDS.length}</td></tr>
      </tbody></table>
      <p>Each round of 5 pays 4 coins, however it goes. A perfect round, or two good rounds in a row (4 out of 5), moves that game up a level and earns a star plus 3 bonus coins. Stars open new rooms. Friends she buys ask her to check their counting. Everything is saved on this device only.</p>
      <div class="row">
        <button class="btn" id="p-coins">+10 coins (testing)</button>
        <button class="btn" id="p-star">+1 star (testing)</button>
        <button class="btn pink" id="p-reset">Start again</button>
      </div>
    </div>`);
  m.querySelector('#p-save-name').onclick = () => { S.name = m.querySelector('#p-name').value.trim() || 'Tara'; save(); toast('Name saved'); };
  m.querySelector('#p-coins').onclick = () => { S.coins += 10; save(); renderHud(); bumpPurse(); toast('+10 coins'); };
  m.querySelector('#p-star').onclick = () => { S.stars++; save(); renderHud(); toast(`Stars: ${S.stars}`); };
  const reset = m.querySelector('#p-reset');
  reset.onclick = () => {
    if (reset.dataset.armed) { try { localStorage.removeItem(KEY); } catch {} S = fresh(); closeModal(); boot(); return; }
    reset.dataset.armed = '1'; reset.textContent = 'Tap again to wipe the castle';
  };
  m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  const back = m.querySelector('[data-close]');
  back.onclick = () => { closeModal(); if (current === 's-castle') openCastle(); else renderHud(); };
}
(function holdToOpen() {
  const b = $('#grownups');
  let timer = null, t0 = 0, raf = 0;
  const stop = () => { clearTimeout(timer); cancelAnimationFrame(raf); b.style.setProperty('--p', '0%'); };
  const tick = () => { b.style.setProperty('--p', Math.min(100, (performance.now() - t0) / 12) + '%'); raf = requestAnimationFrame(tick); };
  b.addEventListener('pointerdown', () => { t0 = performance.now(); tick(); timer = setTimeout(() => { stop(); openParent(); }, 1200); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
  b.addEventListener('click', e => { if (e.detail === 0) openParent(); else toast('Grown-ups: press and hold'); });
})();

// ---------- wiring ----------
$('#purse-coin').innerHTML = coinSVG(34);
$('#star-ico').innerHTML = starSVG(30);
$('#nova-btn').innerHTML = novaSVG(84);
$('#nova-btn').onclick = () => { sfx.pop(); if (novaLine) nova(novaLine); };
$('#hud-home').onclick = () => { R = null; window.speechSynthesis?.cancel(); openCastle(); };
$('#sound').onclick = () => { S.sound = !S.sound; save(); renderHud(); if (!S.sound) try { speechSynthesis.cancel(); } catch {} };
$('#wish').onclick = () => { const d = S.wish && defOf(S.wish); if (d) openShop(friendById[d.id] ? 'friends' : d.room, d.id); };
$('#go-play').onclick = openGames;
$('#go-shop').onclick = () => openShop();
$('#room-shop').onclick = () => openShop(roomId);
$('#rw-again').onclick = () => startRound(S.rounds.at(-1)?.g || 'count');
$('#rw-shop').onclick = () => openShop();
$('#rw-home').onclick = openCastle;
$('#q-again').onclick = () => R?.q && speak(R.q.say);

$('#open-gates').onclick = () => {
  S.name = $('#name-in').value.trim() || 'Tara';
  S.started = true;
  S.coins = 3; S.earned = 3;
  S.friends.princess = { x: 50, y: 82, taught: false };
  save();
  tone(1, .01, 'sine', 0);
  openCastle();
  nova(`Welcome to your castle, ${esc(S.name)}! Princess Rosie lives in the Throne Room. Here are <b>3</b> gold coins to start. Play maths to earn more, then visit the Shop!`);
  bumpPurse();
};

// iOS only allows speech after a tap: repeat Nova's line on the first tap of a returning visit.
let greeted = false;
addEventListener('pointerdown', () => {
  if (greeted) return; greeted = true;
  tone(1, .01, 'sine', 0);
  if (current === 's-castle' && novaLine) setTimeout(() => speak(novaLine, { pitch: 1.15 }), 50);
}, { capture: true });

function boot() {
  if (!S.started) { show('s-gate'); $('#name-in').value = S.name; return; }
  openCastle();
}
boot();
