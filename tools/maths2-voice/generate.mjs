#!/usr/bin/env node
// Records the Maths Castle voice clips with ElevenLabs. Needs Node 18+ and ELEVENLABS_API_KEY.
//
//   node tools/maths2-voice/generate.mjs check              how many clips and credits are still to record
//   node tools/maths2-voice/generate.mjs design [speaker…]  make 3 voice previews per speaker (listen at /maths2/voice-previews/)
//   node tools/maths2-voice/generate.mjs pick <speaker> <1-3>   save a preview as that speaker's voice
//   node tools/maths2-voice/generate.mjs use <speaker> <voice_id>  use an existing ElevenLabs voice instead
//   node tools/maths2-voice/generate.mjs speak [speaker…] [--dry] [--force] [--limit N]   record missing or changed clips
//
// Clips land in maths2/audio/<speaker>/<key>.mp3 and are listed in maths2/audio/manifest.json,
// which the game reads. A clip is re-recorded when its text, voice or settings change.

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const MATHS2 = path.join(ROOT, 'maths2');
const AUDIO = path.join(MATHS2, 'audio');
const MANIFEST = path.join(AUDIO, 'manifest.json');
const PREVIEWS = path.join(MATHS2, 'voice-previews');
const VOICES = path.join(HERE, 'voices.json');
const API = 'https://api.elevenlabs.io';
const KEY = process.env.ELEVENLABS_API_KEY;

const { allLines } = await import(pathToFileURL(path.join(MATHS2, 'js/lines.js')).href);
const LINES = allLines();
const readJSON = async (f, fallback) => (existsSync(f) ? JSON.parse(await readFile(f, 'utf8')) : fallback);
const writeJSON = (f, v) => writeFile(f, JSON.stringify(v, null, 2) + '\n');
const cfg = await readJSON(VOICES);
const manifest = await readJSON(MANIFEST, { v: 0, clips: {} });

const [cmd = 'check', ...rest] = process.argv.slice(2);
const flags = new Set(rest.filter(a => a.startsWith('--')));
const limitArg = rest.indexOf('--limit');
const LIMIT = limitArg >= 0 ? +rest[limitArg + 1] : Infinity;
const args = rest.filter((a, i) => !a.startsWith('--') && rest[i - 1] !== '--limit');
const speakersFrom = list => {
  const all = Object.keys(LINES);
  const bad = list.filter(s => !all.includes(s));
  if (bad.length) die(`Unknown speaker: ${bad.join(', ')}. Speakers: ${all.join(', ')}`);
  return list.length ? list : all;
};

function die(msg) { console.error('\n✗ ' + msg + '\n'); process.exit(1); }
function needKey() { if (!KEY) die('Set ELEVENLABS_API_KEY first (in the environment settings, or `export ELEVENLABS_API_KEY=…` on your own machine).'); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(method, p, body, { binary = false } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(API + p, {
      method,
      headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json', Accept: binary ? 'audio/mpeg' : 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 && attempt < 5) { await sleep(2000 * (attempt + 1)); continue; }
    if (!res.ok) { const e = new Error(`${method} ${p} → ${res.status}: ${(await res.text()).slice(0, 400)}`); e.status = res.status; throw e; }
    return binary ? Buffer.from(await res.arrayBuffer()) : res.json();
  }
}
// Try each endpoint in turn; ElevenLabs has renamed some of these over time.
async function apiFirst(method, paths, body) {
  let last;
  for (const p of paths) {
    try { return await api(method, p, body); } catch (e) { last = e; if (e.status !== 404 && e.status !== 405) throw e; }
  }
  throw last;
}

const hashOf = (sp, text) => {
  const v = cfg.speakers[sp];
  return createHash('sha1').update(JSON.stringify([text, v.voice_id, cfg.model_id, v.settings, cfg.output_format])).digest('hex').slice(0, 10);
};
function todo(sp) {
  const have = manifest.clips[sp] || {};
  return Object.entries(LINES[sp]).filter(([k, t]) => flags.has('--force') || have[k] !== hashOf(sp, t) || !existsSync(path.join(AUDIO, sp, k + '.mp3')));
}

async function check() {
  let clips = 0, chars = 0;
  console.log('\nSpeaker     Voice   Clips   To record   Characters');
  for (const sp of Object.keys(LINES)) {
    const t = todo(sp), c = t.reduce((a, [, s]) => a + s.length, 0);
    clips += t.length; chars += c;
    console.log(`${sp.padEnd(11)} ${(cfg.speakers[sp]?.voice_id ? 'set' : '—').padEnd(7)} ${String(Object.keys(LINES[sp]).length).padEnd(7)} ${String(t.length).padEnd(11)} ${c}`);
  }
  console.log(`\nStill to record: ${clips} clips, about ${chars} credits with ${cfg.model_id}.`);
  if (KEY) {
    try {
      const s = await api('GET', '/v1/user/subscription');
      console.log(`Account: ${s.tier} plan, ${s.character_count} of ${s.character_limit} credits used this period (${s.character_limit - s.character_count} left).`);
    } catch (e) { console.log('Could not read the subscription: ' + e.message); }
  } else console.log('No ELEVENLABS_API_KEY set, so the account balance was not checked.');
  console.log('');
}

function sampleText(sp) {
  const L = LINES[sp];
  const pick = sp === 'rosie'
    ? ['intro_rosie', 'room_open_kitchen', 'q_count_jewels', 'brilliant', 'costs_5']
    : ['hello_tara', 'intro', 'think_5', 'quirk', 'thank_teach'];
  let t = pick.map(k => L[k]).filter(Boolean).join(' ');
  while (t.length < 110) t += ' ' + Object.values(L)[t.length % 20];
  return t.slice(0, 900);
}

async function design() {
  needKey();
  const previews = await readJSON(path.join(PREVIEWS, 'previews.json'), {});
  await mkdir(PREVIEWS, { recursive: true });
  for (const sp of speakersFrom(args)) {
    const v = cfg.speakers[sp];
    if (v.voice_id && !flags.has('--force')) { console.log(`• ${sp}: already has a voice (use --force to redesign)`); continue; }
    const text = sampleText(sp);
    console.log(`• ${sp}: designing…`);
    const r = await apiFirst('POST', ['/v1/text-to-voice/design', '/v1/text-to-voice/create-previews'],
      { voice_description: v.description, text, auto_generate_text: false });
    previews[sp] = { text, options: [] };
    for (const [i, p] of (r.previews || []).entries()) {
      const file = `${sp}-${i + 1}.mp3`;
      await writeFile(path.join(PREVIEWS, file), Buffer.from(p.audio_base_64, 'base64'));
      previews[sp].options.push({ n: i + 1, file, generated_voice_id: p.generated_voice_id });
    }
    console.log(`  saved ${previews[sp].options.length} previews`);
    await writeJSON(path.join(PREVIEWS, 'previews.json'), previews);
  }
  await writePreviewPage(previews);
  console.log('\nListen at maths2/voice-previews/index.html (or nickholzherr.com/maths2/voice-previews/ once pushed),');
  console.log('then run: node tools/maths2-voice/generate.mjs pick <speaker> <1-3>\n');
}

async function writePreviewPage(previews) {
  const rows = Object.entries(previews).map(([sp, p]) => `
    <section><h2>${cfg.speakers[sp].label} <code>${sp}</code></h2><p>${cfg.speakers[sp].description}</p>
    ${p.options.map(o => `<div class="opt"><b>${o.n}</b><audio controls preload="none" src="${o.file}"></audio></div>`).join('')}
    <p class="say">“${p.text}”</p></section>`).join('');
  await writeFile(path.join(PREVIEWS, 'index.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Castle voice previews</title>
<style>body{font-family:system-ui,sans-serif;max-width:760px;margin:0 auto;padding:24px 16px;background:#fff7fb;color:#4a1f40}h1{margin:0 0 8px}section{background:#fff;border-radius:16px;padding:16px;margin:16px 0;box-shadow:0 6px 20px -12px #6b2d5c}h2{margin:0;font-size:20px}code{font-size:13px;color:#b3205a}.opt{display:flex;align-items:center;gap:12px;margin:8px 0}.opt b{width:28px;height:28px;border-radius:50%;background:#e0326e;color:#fff;display:grid;place-items:center}audio{flex:1;max-width:100%}.say{font-size:14px;color:#7d5a74}</style>
<h1>Castle voice previews</h1><p>Pick one number per character, e.g. “rosie 2, cat 1…”.</p>${rows}`);
}

async function pickVoice() {
  needKey();
  const [sp, n] = args;
  if (!sp || !n) die('Usage: pick <speaker> <1-3>');
  const previews = await readJSON(path.join(PREVIEWS, 'previews.json'), {});
  const o = previews[sp]?.options?.find(x => x.n === +n);
  if (!o) die(`No preview ${n} for ${sp}. Run design first.`);
  const v = cfg.speakers[sp];
  const r = await apiFirst('POST', ['/v1/text-to-voice', '/v1/text-to-voice/create-voice-from-preview'],
    { voice_name: `Maths Castle – ${v.label}`, voice_description: v.description, generated_voice_id: o.generated_voice_id });
  v.voice_id = r.voice_id;
  await writeJSON(VOICES, cfg);
  console.log(`✓ ${sp} now uses voice ${r.voice_id}`);
}

async function useVoice() {
  const [sp, id] = args;
  if (!sp || !id || !cfg.speakers[sp]) die('Usage: use <speaker> <voice_id>');
  cfg.speakers[sp].voice_id = id;
  await writeJSON(VOICES, cfg);
  console.log(`✓ ${sp} now uses voice ${id}`);
}

async function speak() {
  const dry = flags.has('--dry');
  if (!dry) needKey();
  let done = 0, chars = 0;
  for (const sp of speakersFrom(args)) {
    const v = cfg.speakers[sp];
    if (!v?.voice_id) { console.log(`• ${sp}: no voice yet — skipped (run design + pick, or use)`); continue; }
    const list = todo(sp);
    console.log(`• ${sp}: ${list.length} clips to record`);
    await mkdir(path.join(AUDIO, sp), { recursive: true });
    manifest.clips[sp] ||= {};
    for (const [k, text] of list) {
      if (done >= LIMIT) break;
      chars += text.length; done++;
      if (dry) { console.log(`  ${k}: ${text}`); continue; }
      const mp3 = await api('POST', `/v1/text-to-speech/${v.voice_id}?output_format=${cfg.output_format}`,
        { text, model_id: cfg.model_id, voice_settings: v.settings }, { binary: true });
      await writeFile(path.join(AUDIO, sp, k + '.mp3'), mp3);
      manifest.clips[sp][k] = hashOf(sp, text);
      if (done % 10 === 0) { await saveManifest(); process.stdout.write(`  ${done} clips…\n`); }
    }
    // forget clips whose line no longer exists
    for (const k of Object.keys(manifest.clips[sp])) if (!(k in LINES[sp])) { delete manifest.clips[sp][k]; await rm(path.join(AUDIO, sp, k + '.mp3'), { force: true }); }
    if (!dry) await saveManifest();
    if (done >= LIMIT) break;
  }
  console.log(`\n${dry ? 'Would record' : 'Recorded'} ${done} clips (${chars} characters).\n`);
}
async function saveManifest() {
  manifest.v = Date.now();
  await mkdir(AUDIO, { recursive: true });
  await writeJSON(MANIFEST, manifest);
}

const run = { check, design, pick: pickVoice, use: useVoice, speak }[cmd];
if (!run) die(`Unknown command "${cmd}". Use check, design, pick, use or speak.`);
await run().catch(e => die(e.message));
