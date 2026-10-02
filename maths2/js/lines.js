// Every line the castle can say, keyed by speaker. The game plays a recorded clip when
// audio/manifest.json lists it, and falls back to the device voice when it doesn't.
// tools/maths2-voice/generate.mjs reads this file to record the clips.

import { ROOMS, ITEMS, FRIENDS, GAMES, THINGS } from './data.js?v=1002i';

export const HOST = 'rosie';
export const NAMES = ['Tara'];

export const WORDS = {
  '💎': ['jewel', 'jewels'], '🍓': ['strawberry', 'strawberries'], '🌸': ['flower', 'flowers'], '🍊': ['orange', 'oranges'], '🍌': ['banana', 'bananas'], '🍐': ['pear', 'pears'],
  '⭐': ['star', 'stars'], '🦋': ['butterfly', 'butterflies'], '🍎': ['apple', 'apples'], '🎀': ['bow', 'bows'],
  '🧶': ['ball of wool', 'balls of wool'], '🔥': ['flame', 'flames'], '🥕': ['carrot', 'carrots'], '🌈': ['rainbow', 'rainbows'],
  '🪷': ['lily', 'lilies'], '✨': ['sparkle', 'sparkles'], '💤': ['one', 'ones'],
};
export const word = (e, n) => (WORDS[e] || ['one', 'ones'])[n === 1 ? 0 : 1];
export const thingKey = e => (WORDS[e] || ['thing', 'things'])[1].replace(/\s+/g, '_');
export const slug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export const numWord = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
const Cap = s => s[0].toUpperCase() + s.slice(1);
const coins = n => `${numWord(n)} coin${n === 1 ? '' : 's'}`;
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

// "The Kitchen" / "the Stables" read naturally with these.
const ROOM_PHRASE = { throne: 'the Throne Room', kitchen: 'the Kitchen', bedroom: 'the Bedroom', stables: 'the Stables', garden: 'the Garden', tower: 'the Star Tower' };
const ROOM_IS = { stables: 'are' };

function hostLines() {
  const L = {};
  for (const n of range(1, 20)) L[`n_${n}`] = `${Cap(numWord(n))}.`;
  for (const name of NAMES) L[`name_${slug(name)}`] = `${name}!`;

  // castle
  L.welcome_castle = 'Welcome to your castle,';
  L.intro_rosie = "I'm Princess Rosie. Here are three gold coins to start. Play maths to earn more, then visit the shop!";
  L.play_earn_gold = 'Play maths to earn gold coins,';
  L.enough_for = 'You have enough coins for the';
  L.go_shop = "Let's go to the shop!";
  L.what_buy = 'What will you buy?';
  L.saving_for = "You're saving up for the";
  L.get_better = 'Get better at a game to earn stars!';
  for (const r of ROOMS) {
    const P = ROOM_PHRASE[r.id], is = ROOM_IS[r.id] || 'is';
    L[`room_open_${r.id}`] = `${Cap(P)} ${is} open! Tap it to look inside.`;
    L[`room_locked_${r.id}`] = `${Cap(P)} ${is} locked.`;
    L[`room_empty_${r.id}`] = `${Cap(P)} ${is} empty. Buy things for it in the shop!`;
    L[`room_welcome_${r.id}`] = `Welcome to ${P}! You can move things around.`;
    L[`put_in_${r.id}`] = `Let's put it in ${P}.`;
  }
  for (const n of range(1, 10)) L[`need_stars_${n}`] = `You need ${numWord(n)} more star${n === 1 ? '' : 's'}.`;
  for (const n of range(1, 20)) L[`earn_more_${n}`] = `Play maths to earn ${coins(n)} more!`;
  for (const n of range(0, 60)) L[`have_coins_${n}`] = `You have ${coins(n)}.`;
  for (const d of [...ITEMS, ...FRIENDS]) L[`item_${d.id}`] = `${d.name}.`;

  // games
  L.pick_game = 'Pick a game!';
  for (const t of THINGS) L[`q_count_${thingKey(t)}`] = `How many ${word(t, 2)}? Count them!`;
  for (const t of ['🍌', '🍊', '🍓', '🍎', '🍐']) L[`q_compare_${thingKey(t)}`] = `Which plate has more ${word(t, 2)}?`;
  for (const n of range(1, 15)) L[`party_${n}`] = `There ${n === 1 ? 'is one' : 'are ' + numWord(n)} at the party.`;
  L.one_more_comes = 'One more comes.';
  L.two_more_come = 'Two more come.';
  L.three_more_come = 'Three more come.';
  L.what_is = 'What is';
  L.plus = 'plus';
  L.take_away = 'take away';
  L.q_peek = 'Look quickly! How many did you see?';
  L.q_missing = 'Which number is hiding?';
  L.q_next = 'What number comes next?';
  L.how_many_now = 'How many now?';
  for (const n of range(2, 20)) L[`playing_${n}`] = `${Cap(numWord(n))} friends are playing.`;
  L.one_goes_bed = 'One goes to bed.';
  L.two_go_bed = 'Two go to bed.';
  L.three_go_bed = 'Three go to bed.';
  L.how_many_left = 'How many are left?';
  Object.assign(L, { yes: 'Yes!', well_done: 'Well done!', thats_right: "That's right!", brilliant: 'Brilliant!', super: 'Super!' });
  L.not_quite = "Not quite. Let's count together.";
  L.watch_me = 'Watch me first!';
  for (const n of range(1, 10)) L[`demo_tap_${n}`] = `${Cap(numWord(n))}! So I tap ${numWord(n)}.`;
  L.demo_plate = 'So I tap the plate with more.';
  L.now_you = 'Now you try!';
  for (const n of range(0, 20)) L[`its_tap_${n}`] = `It's ${numWord(n)}. Tap ${numWord(n)}.`;
  for (const hi of range(2, 11)) for (const lo of range(Math.max(1, hi - 4), hi - 1)) L[`more_than_${hi}_${lo}`] = `${Cap(numWord(hi))} is more than ${numWord(lo)}. Tap that plate.`;

  // rewards
  L.amazing = 'Amazing,';
  L.well_done_name = 'Well done,';
  L.good_trying = 'Good trying,';
  for (const n of range(2, 12)) L[`earned_${n}`] = `You earned ${coins(n)}. Tap them to put them in your purse.`;
  L.got_star = 'You got a star!';
  L.perfect_star = 'A perfect round! You got a star!';
  for (const g of GAMES) L[`level_up_${g.id}`] = `${g.name} goes up a level!`;
  L.new_room_open = 'And a new room is open in your castle!';

  // shop
  L.welcome_market = 'Welcome to the Castle Market!';
  for (const n of range(1, 15)) L[`costs_${n}`] = `It costs ${coins(n)}. Tap your purse to pay, one coin at a time.`;
  for (const n of range(1, 15)) L[`short_${n}`] = `It costs ${coins(n)}.`;
  for (const n of range(1, 15)) L[`need_more_${n}`] = `You need ${numWord(n)} more!`;
  L.its_yours = "It's yours!";
  return L;
}

function friendLines(f) {
  const L = {};
  const t = f.thing;
  for (const n of range(1, 10)) L[`n_${n}`] = `${Cap(numWord(n))}.`;
  L.hello = 'Hello!';
  for (const name of NAMES) L[`hello_${slug(name)}`] = `Hello, ${name}!`;
  L.intro = `I'm ${f.name}. I'm still learning to count. Can you check for me?`;
  L.check_again = 'Can you check my counting?';
  for (const n of range(1, 9)) L[`think_${n}`] = `I think there ${n === 1 ? 'is one' : 'are ' + numWord(n)} ${word(t, n)}. Am I right?`;
  for (const n of range(1, 9)) L[`its_${n}`] = `It's ${numWord(n)}!`;
  for (const n of range(1, 9)) L[`i_said_${n}`] = `I said ${numWord(n)}.`;
  L.quirk = f.quirk;
  L.hooray = 'Hooray! Thank you for checking!';
  L.show_me = 'Oh! How many are there? Show me!';
  L.count_together = "Let's count together!";
  L.thank_teach = 'Thank you for teaching me!';
  L.both_learned = 'We both learned something!';
  L.right_this_time = 'I was right this time! Good checking.';
  L.counting_helps = 'Counting together helps us both.';
  L.love_it_here = 'I love it here!';
  L.great_teacher = "You're a great teacher!";
  L.count_something = 'Shall we count something?';
  return L;
}

// Princess Rosie is both the host and a friend in the Throne Room, so she shares one voice.
export const speakerOf = f => (f.id === 'princess' ? HOST : f.id);

export function allLines() {
  const out = { [HOST]: hostLines() };
  for (const f of FRIENDS) { const sp = speakerOf(f); out[sp] = { ...(out[sp] || {}), ...friendLines(f) }; }
  return out;
}
