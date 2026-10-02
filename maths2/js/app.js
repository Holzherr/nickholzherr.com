import { ROOMS, ITEMS, FRIENDS, GAMES, MAX_LEVEL, ROUND_LEN, COINS_PER_ROUND, LEVEL_UP_BONUS, SPOTS, THINGS, GUESTS } from './data.js?v=1002i';
import { castleSVG, roomSVG, coinSVG, starSVG, rosieSVG } from './art.js?v=1002i';
import { HOST, word, thingKey, slug, speakerOf } from './lines.js?v=1002i';
import * as clips from './voice.js?v=1002i';

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


// ---------- saved state ----------
const KEY = 'maths-castle.v1';
const fresh = () => ({
  name: 'Tara', started: false, sound: true,
  coins: 0, earned: 0, spent: 0, stars: 0,
  levels: { count: 1, more: 1, fewer: 1, compare: 1, sums: 3, peek: 3, missing: 2, next: 2 },
  good: { count: 0, more: 0, fewer: 0, compare: 0, sums: 0, peek: 0, missing: 0, next: 0 },
  items: {}, friends: {}, wish: null, seenRooms: ['throne'],
  rounds: [], caught: 0, missed: 0,
  shown: {}, levelFrom: null, gardenSeen: {},
});
let S = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) { const f = fresh(); return { ...f, ...s, levels: { ...f.levels, ...s.levels }, good: { ...f.good, ...s.good } }; }
  } catch {}
  return fresh();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} }

// ---------- levels carried over from Maths Garden ----------
// Maths Garden lives on the same site (/maths), so its saved progress and sign-in are readable here.
// Its levels count from 0, so Garden level 0 is castle level 1.
// A Garden level is only taken when it has gone up since last time, so a level set by hand on the
// grown-ups screen stays put until she moves on in Maths Garden.
const GARDEN_GAME = { count: 'count', more: 'add', fewer: 'fewer', compare: 'more' };
const GARDEN_DB = { url: 'https://gzdfoptvdocauvgxltjk.supabase.co', key: 'sb_publishable_b7V7vEv3xUtEZf3uFPrQAg_BX1uAqCH' };
function gardenOnDevice() {
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith('maths-garden:progress:')) continue;
    try { const lv = JSON.parse(localStorage.getItem(k))?.levels; if (lv) out.push(lv); } catch {}
  }
  return out;
}
// Only uses a sign-in that is still valid: refreshing it here would rotate the token under Maths Garden.
async function gardenAccount() {
  const sess = JSON.parse(localStorage.getItem('sb-gzdfoptvdocauvgxltjk-auth-token') || 'null');
  if (!sess?.access_token || sess.expires_at * 1000 < Date.now()) return [];
  const get = path => fetch(`${GARDEN_DB.url}/rest/v1/${path}`, { headers: { apikey: GARDEN_DB.key, Authorization: `Bearer ${sess.access_token}` } })
    .then(r => (r.ok ? r.json() : []));
  const [kids, rows] = await Promise.all([get('children?select=id,name'), get('maths_levels?select=child_id,game,level')]);
  const child = kids.find(c => c.name?.trim().toLowerCase() === S.name.trim().toLowerCase());
  const byChild = {};
  for (const r of rows) if (!child || r.child_id === child.id) (byChild[r.child_id] ||= {})[r.game] = r.level;
  return Object.values(byChild);
}
function takeGardenLevels(list, from) {
  let raised = false;
  for (const [g, gg] of Object.entries(GARDEN_GAME)) {
    const lv = Math.max(0, ...list.map(l => (typeof l[gg] === 'number' ? Math.min(MAX_LEVEL, l[gg] + 1) : 0)));
    if (lv <= (S.gardenSeen[g] || 0)) continue;
    S.gardenSeen[g] = lv;
    if (lv > S.levels[g]) { S.levels[g] = lv; S.good[g] = 0; raised = true; }
  }
  if (raised) S.levelFrom = from;
  save();
}
// Tara's Maths Garden account on 25 Sep (agent-team reports), until the castle has its own sign-in.
const TARA_GARDEN = { count: 3, add: 3, fewer: 4, more: 4 };
async function syncGarden() {
  if (S.name.trim().toLowerCase() === 'tara') takeGardenLevels([TARA_GARDEN], 'Maths Garden (25 Sep)');
  try { takeGardenLevels(gardenOnDevice(), 'Maths Garden on this device'); } catch {}
  try { takeGardenLevels(await gardenAccount(), 'the Maths Garden account'); } catch {}
}
const owned = id => !!(S.items[id] || S.friends[id]);
const roomOpen = id => S.stars >= roomById[id].stars;

// ---------- sound ----------
let AC;
function audio() {
  if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); clips.useContext(AC); }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(freq, dur = .12, type = 'sine', vol = .14, when = 0) {
  if (!S.sound) return;
  try {
    audio();
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
  clips.stop();
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

// Say a line: recorded clips when every part has one, otherwise the device voice reads `text`.
// parts: [speaker, key] pairs; falsy entries (e.g. a name with no clip) are skipped.
let talkId = 0;
function say(parts, text, opts) {
  if (!S.sound) return Promise.resolve();
  const list = (parts || []).filter(Boolean);
  const id = ++talkId;
  const host = !list.length || list[0][0] === HOST;
  document.body.classList.toggle('rosie-talking', host);
  if (host && !opts?.noBubble && !/^\d+$/.test(text)) guide(esc(text), list);
  return sayNow(list, text, opts).finally(() => { if (id === talkId) document.body.classList.remove('rosie-talking'); });
}
function sayNow(list, text, opts) {
  try { audio(); } catch {}
  if (list.length && clips.clipCount() && !clips.canPlay(list)) console.warn('voice: no clip for', list.filter(([sp, k]) => !clips.has(sp, k)).map(x => x.join('/')).join(', '));
  if (clips.canPlay(list)) {
    try { speechSynthesis.cancel(); } catch {}
    return clips.play(list).catch(() => speak(text, opts));
  }
  return speak(text, opts);
}
const H = key => [HOST, key];
const nameClip = sp => { const k = `name_${slug(S.name)}`; return clips.has(sp, k) ? [sp, k] : null; };
const num = (n, sp = HOST) => [sp, `n_${n}`];
function stopVoice() { clips.stop(); try { speechSynthesis.cancel(); } catch {} }

// ---------- screens ----------
const SCREENS = ['s-gate', 's-castle', 's-room', 's-games', 's-play', 's-reward', 's-shop'];
let current = null;
function show(id) {
  SCREENS.forEach(s => { $('#' + s).hidden = s !== id; });
  current = id;
  document.body.dataset.screen = id;
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
function wave(svg) { if (!svg) return; svg.classList.remove('waving'); void svg.getBoundingClientRect(); svg.classList.add('waving'); }
let novaLine = '', novaParts = null;
let novaTimer = 0;
// Rosie's speech bubble; it fades a few seconds after she stops talking. Tapping her repeats the line.
function guide(html, parts) {
  novaLine = html; novaParts = parts;
  const b = $('#nova-say');
  if (b.innerHTML !== html) wave($('#nova-btn .rosie-svg'));
  b.innerHTML = html; b.classList.remove('quiet');
  clearTimeout(novaTimer);
  novaTimer = setTimeout(() => b.classList.add('quiet'), 3500 + html.length * 60);
}
function nova(html, parts) {
  guide(html, parts);
  return say(parts, html, { pitch: 1.15, noBubble: true });
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
    return nova(`The <b>${r.name}</b> is open! Tap it to look inside.`, [H(`room_open_${r.id}`)]);
  }
  const w = S.wish && defOf(S.wish);
  if (w && S.coins >= w.price) return nova(`You have enough coins for the <b>${w.name}</b>! Let's go to the Shop.`, [H('enough_for'), H(`item_${w.id}`), H('go_shop')]);
  const buyable = [...ITEMS, ...FRIENDS].filter(d => d.price > 0 && !owned(d.id) && roomOpen(d.room) && d.price <= S.coins);
  if (buyable.length) return nova(`You have <b>${S.coins}</b> coins. What will you buy?`, [H(`have_coins_${S.coins}`), H('what_buy')]);
  if (w) return nova(`You're saving for the <b>${w.name}</b>. Play maths to earn <b>${w.price - S.coins}</b> more coins!`, [H('saving_for'), H(`item_${w.id}`), H(`earn_more_${w.price - S.coins}`)]);
  return nova(`Play maths to earn gold coins, ${esc(S.name)}!`, [H('play_earn_gold'), nameClip(HOST)]);
}
function tapRoom(id) {
  if (!roomOpen(id)) {
    const r = roomById[id], need = r.stars - S.stars;
    sfx.soft();
    nova(`The <b>${r.name}</b> is locked. You need <b>${need}</b> more star${need > 1 ? 's' : ''}. Get better at a game to earn stars!`, [H(`room_locked_${id}`), H(`need_stars_${need}`), H('get_better')]);
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
    say([H(`room_empty_${id}`)], `The ${roomById[id].name} is empty. Buy things for it in the Shop!`, { pitch: 1.15 });
  } else if (!arriving) {
    say([H(`room_welcome_${id}`)], `Welcome to the ${roomById[id].name}! You can move things around.`, { pitch: 1.15 });
  }
}
function pieceEl(p, isNew) {
  const el = document.createElement('div');
  el.className = 'piece' + (p.kind === 'friend' ? ' friend' : '') + (isNew ? ' arrive' : '');
  place(el, p);
  el.innerHTML = `<span>${p.id === 'princess' ? rosieSVG('1em', '1.2em') : p.def.e}</span>${p.kind === 'friend' && p.taught ? '<span class="badge" aria-hidden="true">⭐</span>' : ''}`;
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
  if (p.kind === 'item') { sfx.pop(); sayPop(p, p.def.name); say([H(`item_${p.id}`)], p.def.name); return; }
  const f = p.def, sp = speakerOf(f);
  if (!p.taught || Math.random() < .45) return teach(f);
  const hello = clips.has(sp, `hello_${slug(S.name)}`) ? `hello_${slug(S.name)}` : 'hello';
  const [key, line] = pick([[hello, `Hello, ${S.name}!`], ['love_it_here', 'I love it here!'], ['great_teacher', "You're a great teacher!"], ['count_something', 'Shall we count something?']]);
  sayPop(p, line); say([[sp, key]], line, { pitch: f.pitch });
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
  say([H('pick_game')], 'Pick a game!', { pitch: 1.15 });
}

let R = null;
async function startRound(game) {
  R = { game, i: 0, results: [], level: S.levels[game], lastN: null };
  show('s-play');
  if (!S.shown[game] && DEMO[game]) {
    const r = R;
    await demo(game);
    if (R !== r || current !== 's-play') return;
    S.shown[game] = true; save();
    R.results = []; R.lastN = null;
  }
  nextQ();
}

// ---------- first go at a game: Rosie plays one question herself ----------
const DEMO = {
  count:   { game: 'count', n: 3, t: '💎', ans: 3, choices: [2, 3, 4], text: 'How many jewels?', say: 'How many jewels? Count them!', parts: [H('q_count_jewels')] },
  more:    { game: 'more', n: 2, add: 1, t: '🐰', ans: 3, choices: [2, 3, 4], text: 'One more comes! How many now?', say: 'There are two at the party. One more comes. How many now?', parts: [H('party_2'), H('one_more_comes'), H('how_many_now')] },
  fewer:   { game: 'fewer', n: 4, sub: 1, t: '🐱', ans: 3, choices: [2, 3, 4], text: 'One goes to bed. How many left?', say: 'Four friends are playing. One goes to bed. How many are left?', parts: [H('playing_4'), H('one_goes_bed'), H('how_many_left')] },
  compare: { game: 'compare', a: 2, b: 5, t: '🍎', ans: 1, big: null, text: 'Which plate has more?', say: 'Which plate has more apples?', parts: [H('q_compare_apples')] },
};
async function demo(game) {
  const q = DEMO[game], r = R;
  const alive = () => R === r && current === 's-play';
  R.q = q; R.locked = true; R.demo = true;
  $('#progress').innerHTML = '';
  $('#play-hint').hidden = false;
  document.body.classList.add('demo'); wave($('#nova-btn .rosie-svg'));
  try {
    const shown = renderQ(q, { quiet: true });
    await say([H('watch_me')], 'Watch me first!', { pitch: 1.15 });
    if (!alive()) return;
    await say(q.parts, q.say);
    await shown;
    if (!alive()) return;
    await wait(400);
    if (game === 'compare') {
      const plates = $$('.plate');
      await countAlong(plates[0].querySelector('.objs'), { tag: false });
      await wait(300);
      if (!alive()) return;
      await countAlong(plates[1].querySelector('.objs'), { tag: false });
      if (!alive()) return;
      plates[1].classList.add('right');
      await say([H('more_than_5_2'), H('demo_plate')], 'Five is more than two. So I tap the plate with more.', { pitch: 1.15 });
    } else {
      await countAlong($('#objs'));
      if (!alive()) return;
      $(`.ans[data-v="${q.ans}"]`)?.classList.add('right');
      sfx.good();
      await say([H(`demo_tap_${q.ans}`)], `${q.ans}! So I tap ${q.ans}.`, { pitch: 1.15 });
    }
    if (!alive()) return;
    await wait(500);
    await say([H('now_you')], 'Now you try!', { pitch: 1.2 });
    await wait(300);
  } finally {
    $('#play-hint').hidden = true; document.body.classList.remove('demo');
    if (R === r) { R.locked = false; R.demo = false; }
  }
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
    const [a, b] = [[1, 5], [3, 10], [6, 12], [8, 16], [11, 20]][lv - 1];
    const n = freshN(a, b), t = pick(THINGS);
    return { game, n, t, ans: n, text: `How many ${word(t, 2)}?`, say: `How many ${word(t, 2)}? Count them!`, parts: [H(`q_count_${thingKey(t)}`)], choices: choices(n, 1) };
  }
  if (game === 'more') {
    const add = [1, 1, 2, 2, 3][lv - 1], [a, b] = [[1, 4], [3, 8], [2, 7], [5, 12], [6, 12]][lv - 1];
    const n = freshN(a, b), t = pick(GUESTS);
    const come = ['One more comes', 'Two more come', 'Three more come'][add - 1];
    return { game, n, add, t, ans: n + add, text: `${come}! How many now?`, say: `There are ${n} at the party. ${come}. How many now?`, parts: [H(`party_${n}`), H(['one_more_comes', 'two_more_come', 'three_more_come'][add - 1]), H('how_many_now')], choices: choices(n + add, 1) };
  }
  if (game === 'fewer') {
    const sub = [1, 1, 2, 2, 3][lv - 1], [a, b] = [[2, 5], [3, 9], [4, 10], [8, 15], [10, 20]][lv - 1];
    const n = freshN(a, b), t = pick(GUESTS);
    const go = ['One goes', 'Two go', 'Three go'][sub - 1];
    return { game, n, sub, t, ans: n - sub, text: `${go} to bed. How many left?`, say: `${n} friends are playing. ${go} to bed. How many are left?`, parts: [H(`playing_${n}`), H(['one_goes_bed', 'two_go_bed', 'three_go_bed'][sub - 1]), H('how_many_left')], choices: choices(n - sub, 1) };
  }
  if (game === 'peek') {
    const [a, b] = [[2, 4], [3, 6], [4, 8], [5, 10], [6, 12]][lv - 1];
    const n = freshN(a, b), t = pick(THINGS);
    return { game, n, t, ans: n, ms: [2500, 2000, 1600, 1300, 1000][lv - 1], text: 'Look quickly! How many?', say: 'Look quickly! How many did you see?', parts: [H('q_peek')], choices: choices(n, 1) };
  }
  if (game === 'missing') {
    const top = [5, 10, 10, 15, 20][lv - 1], minus = lv >= 4 && Math.random() < .4;
    let a, b, c, eq, ans;
    if (minus) { c = rnd(4, top); b = rnd(1, Math.min(6, c - 1)); ans = b; eq = `${c} − ? = ${c - b}`; }
    else {
      a = rnd(1, top - 1); b = rnd(1, Math.min(lv >= 4 ? 7 : 5, top - a)); c = a + b;
      if (lv >= 3 && Math.random() < .5) { ans = a; eq = `? + ${b} = ${c}`; } else { ans = b; eq = `${a} + ? = ${c}`; }
    }
    return { game, ans, eq, text: 'Which number is hiding?', say: `Which number is hiding? ${eq.replace('?', 'something').replace('−', 'take away').replace('=', 'makes')}`, parts: [H('q_missing')], choices: choices(ans, 0) };
  }
  if (game === 'next') {
    const step = pick([[1], [1, -1], [2, 1], [2, 5, 10, -1], [2, 5, 10, -2, 3]][lv - 1]);
    const len = 4, maxStart = step > 0 ? Math.max(0, [10, 16, 12, 20, 20][lv - 1] - step * len) : 0;
    let start = step > 0 ? rnd(step >= 5 ? 0 : 1, Math.max(1, maxStart)) : rnd(-step * len + 1, [10, 20, 20, 20, 20][lv - 1]);
    if (step >= 5) start = step * rnd(0, 3);
    const seq = Array.from({ length: len }, (_, i) => start + step * i), ans = start + step * len;
    return { game, ans, eq: `${seq.join(', ')}, ?`, text: 'What comes next?', say: `${seq.join(', ')}. What number comes next?`, parts: [H('q_next')], choices: choices(ans, 0) };
  }
  if (game === 'sums') {
    const top = [5, 10, 10, 15, 20][lv - 1], minus = lv >= 3 && Math.random() < .5;
    const t = pick(THINGS);
    let a, b;
    if (minus) { a = rnd(3, top); b = rnd(1, Math.min(lv >= 4 ? 6 : 3, a - 1)); }
    else { a = rnd(1, top - 1); b = rnd(1, Math.min(lv >= 4 ? 6 : 5, top - a)); }
    const ans = minus ? a - b : a + b, sign = minus ? '−' : '+';
    return { game, a, b, minus, t, n: a, sub: minus ? b : 0, ans, eq: `${a} ${sign} ${b} = ?`, text: 'Magic sum!',
      say: `What is ${a} ${minus ? 'take away' : 'plus'} ${b}?`, parts: [H('what_is'), H(`n_${a}`), H(minus ? 'take_away' : 'plus'), H(`n_${b}`)], choices: choices(ans, 0) };
  }
  const t = pick(['🍌', '🍊', '🍓', '🍎', '🍐']);
  let a, b;
  if (lv === 1) { a = rnd(1, 3); b = a + rnd(3, 4); } else if (lv <= 3) { a = rnd(2, 7); b = a + rnd(1, 2); } else if (lv === 4) { a = rnd(5, 13); b = a + rnd(1, 2); } else { a = rnd(8, 19); b = a + 1; }
  if (Math.random() < .5) [a, b] = [b, a];
  const ans = a > b ? 0 : 1;
  return { game, a, b, t, ans, big: lv >= 3 ? 1 - ans : null, text: 'Which plate has more?', say: `Which plate has more ${word(t, 2)}?`, parts: [H(`q_compare_${thingKey(t)}`)] };
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
async function renderQ(q, { quiet = false } = {}) {
  const talk = (parts, text) => { if (!quiet) say(parts, text); };
  $('#q-text').textContent = q.text;
  const st = $('#q-stage'), ans = $('#answers');
  ans.innerHTML = ''; st.innerHTML = '';
  const alive = () => R && R.q === q && current === 's-play';
  if (q.game === 'compare') {
    const size = i => q.big == null ? '' : q.big === i ? 'font-size:clamp(58px,10vw,88px)' : 'font-size:clamp(30px,5vw,42px)';
    st.innerHTML = `<div class="plates">${[q.a, q.b].map((n, i) => `<button class="plate" data-i="${i}" aria-label="Plate ${i + 1}"><div class="objs" style="${size(i)}">${objs(q.t, n)}</div></button>`).join('')}</div>`;
    $$('.plate').forEach(p => p.onclick = () => answer(+p.dataset.i, p));
    talk(q.parts, q.say);
    return;
  }
  if (q.game === 'missing' || q.game === 'next') {
    st.innerHTML = `<div class="eq${q.game === 'next' ? ' seq' : ''}">${q.eq}</div>`;
    ans.innerHTML = q.choices.map(c => `<button class="ans" data-v="${c}">${c}</button>`).join('');
    $$('.ans').forEach(b => b.onclick = () => answer(+b.dataset.v, b));
    talk(q.parts, q.say);
    return;
  }
  if (q.game === 'peek') {
    st.innerHTML = `<div class="objs" id="objs">${objs(q.t, q.n)}</div>`;
    talk(q.parts, q.say);
    await wait(q.ms);
    if (!alive()) return;
    $('#objs').classList.add('peeked');
    ans.innerHTML = q.choices.map(c => `<button class="ans" data-v="${c}">${c}</button>`).join('');
    $$('.ans').forEach(b => b.onclick = () => answer(+b.dataset.v, b));
    return;
  }
  if (q.game === 'sums') {
    const help = q.minus ? objs(q.t, q.a - q.b) + objs(q.t, q.b, 'out') : objs(q.t, q.a) + `<span class="plus">+</span>` + objs(q.t, q.b);
    st.innerHTML = `<div class="eq">${q.eq}</div><div class="objs small" id="objs">${help}</div>`;
  } else if (q.game === 'more' || q.game === 'fewer') {
    st.innerHTML = `<div class="eq mini" id="eq">${q.n}</div><div class="objs" id="objs">${objs(q.t, q.n)}</div>`;
  } else st.innerHTML = `<div class="objs" id="objs">${objs(q.t, q.n)}</div>`;
  const showAnswers = () => {
    ans.innerHTML = q.choices.map(c => `<button class="ans" data-v="${c}">${c}</button>`).join('');
    $$('.ans').forEach(b => b.onclick = () => answer(+b.dataset.v, b));
  };
  if (q.game === 'count' || q.game === 'sums') { showAnswers(); talk(q.parts, q.say); return; }
  talk(q.parts, q.say);
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
  if (!alive()) return;
  if ($('#eq')) $('#eq').textContent = q.game === 'more' ? `${q.n} + ${q.add} = ?` : `${q.n} − ${q.sub} = ?`;
  showAnswers();
}
async function countAlong(container, { skipOut = true, tag = true, sp = HOST } = {}) {
  const items = [...container.querySelectorAll('.o')].filter(o => !(skipOut && o.classList.contains('out')));
  let t = null;
  if (tag) { t = document.createElement('div'); t.className = 'count-tag'; container.closest('.stagebox')?.appendChild(t); }
  for (let k = 0; k < items.length; k++) {
    items[k].classList.add('hl');
    if (t) t.textContent = k + 1;
    say([num(k + 1, sp)], String(k + 1), { rate: 1.05 });
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
    const [pk, pt] = pick([['yes', 'Yes!'], ['well_done', 'Well done!'], ['thats_right', "That's right!"], ['brilliant', 'Brilliant!'], ['super', 'Super!']]);
    say([H(pk)], pt, { pitch: 1.2 });
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
  await say([H('not_quite')], "Not quite. Let's count together.", { pitch: 1.15 });
  if (R?.q !== q) return;
  if (q.game === 'compare') {
    const plates = $$('.plate');
    const na = await countAlong(plates[0].querySelector('.objs'), { tag: false });
    await wait(300);
    const nb = await countAlong(plates[1].querySelector('.objs'), { tag: false });
    if (R?.q !== q) return;
    const [hi, lo] = na > nb ? [na, nb] : [nb, na];
    plates[q.ans].classList.add('right');
    say([H(`more_than_${hi}_${lo}`)], `${hi} is more than ${lo}. Tap that plate.`);
  } else if (!$('#objs')) {
    $(`.ans[data-v="${q.ans}"]`)?.classList.add('right');
    say([H(`its_tap_${q.ans}`)], `It's ${q.ans}. Tap ${q.ans}.`);
  } else {
    $('#objs').classList.remove('peeked');
    await countAlong($('#objs'));
    if (R?.q !== q) return;
    $(`.ans[data-v="${q.ans}"]`)?.classList.add('right');
    say([H(`its_tap_${q.ans}`)], `It's ${q.ans}. Tap ${q.ans}.`);
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
  const coins = Math.min(12, Math.max(2, score) + rnd(0, 3) + (star ? LEVEL_UP_BONUS : 0));
  S.rounds.push({ g, score, level: R.level, at: Date.now() });
  save();
  showReward({ score, coins, levelUp, star, game: g });
}

// ---------- reward ----------
function showReward({ score, coins, levelUp, star, game }) {
  clips.preload([1, 2, 3, 4, 5, 6, 7].map(n => num(n)));
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
    b.style.top = 50 + (row - (Math.ceil(coins / 4) - 1) / 2) * 30 + '%';
    b.style.animationDelay = k * .09 + 's';
    b.innerHTML = coinSVG(64); b.setAttribute('aria-label', 'Gold coin');
    b.onclick = async () => {
      b.disabled = true; b.style.visibility = 'hidden';
      got++; S.coins++; S.earned++; save();
      sfx.coin(); say([num(got)], String(got), { rate: 1.05 });
      await fly(b, $('#purse'), coinSVG(48));
      renderHud(); bumpPurse();
      if (--left === 0) afterCoins({ levelUp, star, game });
    };
    c.appendChild(b);
  }
  const praise = score >= 4 ? 'amazing' : score >= 2 ? 'well_done_name' : 'good_trying';
  say([H(praise), nameClip(HOST), ...(clips.has(HOST, `earned_${coins}`) ? [H(`earned_${coins}`)] : [])], `${$('#rw-title').textContent} You earned ${coins} coins. Tap them to put them in your purse.`, { pitch: 1.15 });
}
async function afterCoins({ levelUp, star, game }) {
  await wait(500);
  let line = `You have ${S.coins} coins now.`;
  let parts = [H(`have_coins_${S.coins}`)];
  if (star) {
    $('#rw-star').innerHTML = `<div class="big-star">${starSVG(110)}</div>`;
    sfx.fanfare(); confetti();
    const g = GAMES.find(x => x.id === game);
    line = levelUp ? `You got a star! ${g.name} goes up to level ${S.levels[game]}. ` + line : `A perfect round! You got a star! ` + line;
    parts = levelUp ? [H('got_star'), H(`level_up_${game}`), ...parts] : [H('perfect_star'), ...parts];
    const opened = ROOMS.find(r => r.stars === S.stars);
    if (opened) {
      line += ` And the ${opened.name} is open in your castle!`; parts.push(H('new_room_open'));
      $('#rw-star').insertAdjacentHTML('beforeend', `<button class="room-unlock" id="rw-room"><span class="em">🔓</span><span>New room!<b>${esc(opened.name)}</b></span><span class="go">Go and see ➜</span></button>`);
      $('#rw-room').onclick = () => { S.seenRooms.includes(opened.id) || S.seenRooms.push(opened.id); save(); openRoom(opened.id); };
    }
  }
  $('#rw-sub').textContent = line;
  say(parts, line, { pitch: 1.15 });
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
  else say([H('welcome_market'), H(`have_coins_${S.coins}`)], `Welcome to the Castle Market! You have ${S.coins} coins.`, { pitch: 1.15 });
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
  const msg = (html, parts) => { m.querySelector('#pay-msg').innerHTML = html; if (parts !== false) say(parts, html, { pitch: 1.15 }); };
  clips.preload(Array.from({ length: price }, (_, i) => num(i + 1)));
  msg(`It costs <b>${price}</b> coins. Tap your purse to pay, one coin at a time.`, [H(`costs_${price}`)]);
  const slots = [...m.querySelectorAll('.slot')];
  const pileBtn = m.querySelector('#pile');
  const notEnough = () => {
    const need = price - S.coins;
    slots.slice(paid).forEach(s => s.classList.add('need'));
    pileBtn.disabled = true;
    msg(`You have <b>${S.coins}</b>. It costs <b>${price}</b>. You need <b>${need}</b> more!`, [H(`have_coins_${S.coins}`), H(`short_${price}`), H(`need_more_${need}`)]);
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
    sfx.coin(); say([num(paid)], String(paid), { rate: 1.1 });
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
    msg(`It's yours! Let's put it in the <b>${roomById[d.room].name}</b>.`, [H('its_yours'), H(`put_in_${d.room}`)]);
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
      <div class="teach-face">${f.id === 'princess' ? rosieSVG(110) : f.e}</div>
      <div class="teach-say" id="t-say"></div>
      <div class="stagebox" style="min-height:130px"><div class="objs" id="t-objs">${objs(f.thing, n)}</div></div>
      <div class="row" id="t-act"></div>
    </div>`);
  const sp = speakerOf(f), F = key => [sp, key];
  const hello = clips.has(sp, `hello_${slug(S.name)}`) ? F(`hello_${slug(S.name)}`) : F('hello');
  const talk = (html, parts) => { m.querySelector('#t-say').innerHTML = html; return say(parts, html, { pitch: f.pitch }); };
  const act = html => { m.querySelector('#t-act').innerHTML = html; };
  const alive = () => m.isConnected;
  const finish = async (html, taughtNow) => {
    if (taughtNow) { rec.taught = true; save(); }
    act(`<button class="btn pink" id="t-bye">👋 Bye, ${f.name.split(' ').pop()}!</button>`);
    m.querySelector('#t-bye').onclick = () => { closeModal(); if (current === 's-room') openRoom(roomId); };
    await talk(...html);
  };
  const countTogether = async () => {
    await talk(`Let's count together!`, [F('count_together')]);
    if (alive()) await countAlong(m.querySelector('#t-objs'), { tag: true, sp });
  };

  await (first
    ? talk(`Hello ${esc(S.name)}! I'm ${f.name}. I'm still learning to count. Can you check for me?`, [hello, F('intro')])
    : talk(`Can you check my counting, ${esc(S.name)}?`, [F('check_again')]));
  if (!alive()) return;
  await wait(300);
  talk(`I think there ${said === 1 ? 'is' : 'are'} <b>${said}</b> ${word(f.thing, said)}. Am I right?`, [F(`think_${said}`)]);
  act(`<button class="btn green" id="t-yes">✓ Yes</button><button class="btn pink" id="t-no">✗ No</button>`);
  m.querySelector('#t-yes').onclick = async () => {
    act('');
    if (!wrong) { sfx.good(); return finish([`Hooray! Thank you for checking, ${esc(S.name)}!`, [F('hooray')]], true); }
    await countTogether(); if (!alive()) return;
    S.missed++; save();
    finish([`It's <b>${n}</b>! I said ${said}. ${f.quirk} We both learned something!`, [F(`its_${n}`), F(`i_said_${said}`), F('quirk'), F('both_learned')]], true);
  };
  m.querySelector('#t-no').onclick = async () => {
    act('');
    if (!wrong) {
      await countTogether(); if (!alive()) return;
      return finish([`It's <b>${n}</b>. I was right this time! Good checking.`, [F(`its_${n}`), F('right_this_time')]], true);
    }
    talk(`Oh! How many are there? Show me!`, [F('show_me')]);
    act(choices(n, 1).map(c => `<button class="ans" data-v="${c}">${c}</button>`).join(''));
    m.querySelectorAll('#t-act .ans').forEach(b => b.onclick = async () => {
      const v = +b.dataset.v;
      if (v === n) {
        b.classList.add('right'); sfx.good(); confetti(24);
        S.caught++; save();
        act('');
        return finish([`<b>${n}</b>! ${f.quirk} Thank you for teaching me, ${esc(S.name)}!`, [F(`its_${n}`), F('quirk'), F('thank_teach')]], true);
      }
      b.classList.add('wrong'); sfx.soft();
      act('');
      await countTogether(); if (!alive()) return;
      finish([`It's <b>${n}</b>! Counting together helps us both.`, [F(`its_${n}`), F('counting_helps')]], true);
    });
  };
}

// ---------- grown-ups ----------
function openParent() {
  const rows = GAMES.map(g => {
    const rs = S.rounds.filter(r => r.g === g.id);
    const lv = S.levels[g.id];
    return `<tr><td>${g.icon} ${g.name}</td><td class="lv-set"><button class="round-btn" data-lv="${g.id}" data-d="-1" aria-label="Easier" ${lv <= 1 ? 'disabled' : ''}>−</button> Level ${lv} of ${MAX_LEVEL} <button class="round-btn" data-lv="${g.id}" data-d="1" aria-label="Harder" ${lv >= MAX_LEVEL ? 'disabled' : ''}>+</button></td><td>${rs.length} rounds</td></tr>`;
  }).join('');
  const m = modal(`<div class="sheet parent">
      <button class="round-btn close-x" data-close aria-label="Close">✕</button>
      <h3>Grown-ups</h3>
      <div class="field"><input id="p-name" value="${esc(S.name)}" maxlength="16" aria-label="Child's name"><button class="btn" id="p-save-name">Save name</button></div>
      <table><tbody>${rows}
        <tr><td>Coins earned / spent</td><td></td><td>${S.earned} / ${S.spent}</td></tr>
        <tr><td>Stars</td><td></td><td>${S.stars}</td></tr>
        <tr><td>Friends' mistakes caught / missed</td><td></td><td>${S.caught} / ${S.missed}</td></tr>
        <tr><td>Voice</td><td></td><td>${clips.clipCount() ? `${clips.clipCount()} recorded clips` : 'device voice'}</td></tr>
        <tr><td>Treasures and friends</td><td></td><td>${Object.keys(S.items).length + Object.keys(S.friends).length} of ${ITEMS.length + FRIENDS.length}</td></tr>
      </tbody></table>
      <p>Each round of 5 pays 4 coins, however it goes. A perfect round, or two good rounds in a row (4 out of 5), moves that game up a level and earns a star plus 3 bonus coins. Stars open new rooms. Friends she buys ask her to check their counting. Everything is saved on this device only.</p>
      <p>Levels start from where she is in Maths Garden (when it was played in this browser, or you're signed in to it here)${S.levelFrom ? `; last taken from ${S.levelFrom}` : ''}. The first time she opens each game, Princess Rosie plays one question to show her how.</p>
      <div class="row">
        <button class="btn" id="p-coins">+10 coins (testing)</button>
        <button class="btn" id="p-star">+1 star (testing)</button>
        <button class="btn" id="p-demos">Show how to play again</button>
        <button class="btn" id="p-carry">Move progress to another tab</button>
        <button class="btn pink" id="p-reset">Start again</button>
      </div>
    </div>`);
  m.querySelector('#p-save-name').onclick = () => { S.name = m.querySelector('#p-name').value.trim() || 'Tara'; save(); toast('Name saved'); };
  m.querySelector('#p-coins').onclick = () => { S.coins += 10; save(); renderHud(); bumpPurse(); toast('+10 coins'); };
  m.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => {
    const g = b.dataset.lv;
    S.levels[g] = Math.min(MAX_LEVEL, Math.max(1, S.levels[g] + +b.dataset.d)); S.good[g] = 0; save();
    openParent();
  });
  m.querySelector('#p-carry').onclick = async () => {
    const link = `${location.origin}${location.pathname}#carry=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(S)))))}`;
    try { await navigator.clipboard.writeText(link); toast('Link copied: paste it into a normal Safari tab'); }
    catch { m.querySelector('#p-carry').insertAdjacentHTML('afterend', `<input readonly value="${esc(link)}" onfocus="this.select()" style="width:100%">`); }
  };
  m.querySelector('#p-demos').onclick = () => { S.shown = {}; save(); toast('Rosie will show each game again'); };
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
$('#nova-btn').innerHTML = `<span class="rosie" aria-hidden="true">${rosieSVG(100)}</span>`;
$('#nova-btn').setAttribute('aria-label', 'Princess Rosie, tap to hear again');
$('#nova-btn').onclick = () => { sfx.pop(); if (novaLine) nova(novaLine, novaParts); };
$('#hud-home').onclick = () => { R = null; stopVoice(); openCastle(); };
$('#sound').onclick = () => { S.sound = !S.sound; save(); renderHud(); if (!S.sound) stopVoice(); };
$('#wish').onclick = () => { const d = S.wish && defOf(S.wish); if (d) openShop(friendById[d.id] ? 'friends' : d.room, d.id); };
$('#go-play').onclick = openGames;
$('#go-shop').onclick = () => openShop();
$('#room-shop').onclick = () => openShop(roomId);
$('#rw-again').onclick = () => startRound(S.rounds.at(-1)?.g || 'count');
$('#rw-shop').onclick = () => openShop();
$('#shop-play').onclick = openGames;
$('#rw-home').onclick = openCastle;
$('#q-again').onclick = () => R?.q && !R.demo && say(R.q.parts, R.q.say);

$('#open-gates').onclick = () => {
  S.name = $('#name-in').value.trim() || 'Tara';
  S.started = true;
  S.coins = 3; S.earned = 3;
  S.friends.princess = { x: 50, y: 82, taught: false };
  save();
  tone(1, .01, 'sine', 0);
  openCastle();
  nova(`Welcome to your castle, ${esc(S.name)}! I'm Princess Rosie. Here are <b>3</b> gold coins to start. Play maths to earn more, then visit the Shop!`,
    [H('welcome_castle'), nameClip(HOST), H('intro_rosie')]);
  bumpPurse();
};

// iOS only allows speech after a tap: repeat Nova's line on the first tap of a returning visit.
let greeted = false;
addEventListener('pointerdown', () => {
  if (greeted) return; greeted = true;
  tone(1, .01, 'sine', 0);
  try { audio(); } catch {}
  if (current === 's-castle' && novaLine) setTimeout(() => say(novaParts, novaLine, { pitch: 1.15 }), 50);
}, { capture: true });

// A progress link from "Move progress to another tab" (e.g. out of a Private tab) replaces this tab's progress.
function takeCarried() {
  if (!location.hash.startsWith('#carry=')) return;
  try { S = { ...fresh(), ...JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(location.hash.slice(7)))))) }; save(); } catch {}
  history.replaceState(null, '', location.pathname + location.search);
}
function boot() {
  takeCarried();
  syncGarden();
  if (!S.started) { show('s-gate'); $('#name-in').value = S.name; return; }
  openCastle();
}
boot();
