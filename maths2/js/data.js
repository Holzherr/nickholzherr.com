// Static content for the castle: rooms, shop items, friends and games.

export const ROOMS = [
  { id: 'throne',  name: 'Throne Room',  stars: 0,  sky: false },
  { id: 'kitchen', name: 'Kitchen',      stars: 1,  sky: false },
  { id: 'bedroom', name: 'Bedroom',      stars: 3,  sky: false },
  { id: 'stables', name: 'Stables',      stars: 5,  sky: false },
  { id: 'garden',  name: 'Garden',       stars: 7,  sky: true  },
  { id: 'tower',   name: 'Star Tower',   stars: 10, sky: false },
];

// Decorations. Each can be bought once, so the shop doubles as a collection.
export const ITEMS = [
  // throne room
  { id: 'chair',    room: 'throne',  e: '🪑', name: 'Royal chair', price: 3 },
  { id: 'candles',  room: 'throne',  e: '🕯️', name: 'Candles',     price: 2 },
  { id: 'mirror',   room: 'throne',  e: '🪞', name: 'Magic mirror', price: 4 },
  { id: 'vase',     room: 'throne',  e: '🏺', name: 'Golden vase', price: 3 },
  { id: 'painting', room: 'throne',  e: '🖼️', name: 'Painting',    price: 5 },
  { id: 'bouquet',  room: 'throne',  e: '💐', name: 'Flowers',     price: 2 },
  { id: 'crown',    room: 'throne',  e: '👑', name: 'Crown',       price: 6 },
  { id: 'sofa',     room: 'throne',  e: '🛋️', name: 'Royal sofa',  price: 8 },
  { id: 'clock',    room: 'throne',  e: '🕰️', name: 'Grand clock', price: 7 },
  { id: 'piano',    room: 'throne',  e: '🎹', name: 'Piano',       price: 10 },
  { id: 'trophy', room: 'throne', e: '🏆', name: 'Golden trophy', price: 8 },
  { id: 'violin', room: 'throne', e: '🎻', name: 'Violin', price: 6 },
  { id: 'bell', room: 'throne', e: '🔔', name: 'Castle bell', price: 4 },
  { id: 'key', room: 'throne', e: '🗝️', name: 'Golden key', price: 5 },
  // kitchen
  { id: 'cake',     room: 'kitchen', e: '🍉', name: 'Watermelon',  price: 4 },
  { id: 'cupcake',  room: 'kitchen', e: '🍇', name: 'Grapes',      price: 2 },
  { id: 'teapot',   room: 'kitchen', e: '🫖', name: 'Teapot',      price: 3 },
  { id: 'berries',  room: 'kitchen', e: '🍓', name: 'Strawberries', price: 2 },
  { id: 'croissant',room: 'kitchen', e: '🍐', name: 'Pear',        price: 2 },
  { id: 'pie',      room: 'kitchen', e: '🍍', name: 'Pineapple',   price: 3 },
  { id: 'cupboard', room: 'kitchen', e: '🗄️', name: 'Cupboard',    price: 8 },
  { id: 'basket',   room: 'kitchen', e: '🧺', name: 'Fruit basket', price: 4 },
  { id: 'plant',    room: 'kitchen', e: '🪴', name: 'Pot plant',   price: 4 },
  { id: 'pan', room: 'kitchen', e: '🍳', name: 'Frying pan', price: 4 },
  { id: 'pot', room: 'kitchen', e: '🫕', name: 'Cooking pot', price: 5 },
  { id: 'plates', room: 'kitchen', e: '🍽️', name: 'Dinner plates', price: 4 },
  { id: 'honey', room: 'kitchen', e: '🍯', name: 'Honey pot', price: 3 },
  { id: 'broom', room: 'kitchen', e: '🧹', name: 'Broom', price: 3 },
  // bedroom
  { id: 'bed',      room: 'bedroom', e: '🛏️', name: 'Bed',         price: 6 },
  { id: 'teddy',    room: 'bedroom', e: '🧸', name: 'Teddy',       price: 3 },
  { id: 'books',    room: 'bedroom', e: '📚', name: 'Books',       price: 3 },
  { id: 'bow',      room: 'bedroom', e: '🎀', name: 'Big bow',     price: 2 },
  { id: 'wand',     room: 'bedroom', e: '🪄', name: 'Magic wand',  price: 5 },
  { id: 'lamp',     room: 'bedroom', e: '🪔', name: 'Night light', price: 4 },
  { id: 'wardrobe', room: 'bedroom', e: '🚪', name: 'Wardrobe',    price: 8 },
  { id: 'chest',    room: 'bedroom', e: '🧰', name: 'Treasure chest', price: 9 },
  { id: 'bath',     room: 'bedroom', e: '🛁', name: 'Bubble bath', price: 7 },
  { id: 'dolls', room: 'bedroom', e: '🪆', name: 'Dolls', price: 5 },
  { id: 'dress', room: 'bedroom', e: '👗', name: 'Party dress', price: 6 },
  { id: 'shoes', room: 'bedroom', e: '👠', name: 'Sparkly shoes', price: 5 },
  { id: 'suitcase', room: 'bedroom', e: '🧳', name: 'Suitcase', price: 6 },
  { id: 'fan', room: 'bedroom', e: '🪭', name: 'Fan', price: 4 },
  // stables
  { id: 'carrots',  room: 'stables', e: '🥕', name: 'Carrots',     price: 2 },
  { id: 'apples',   room: 'stables', e: '🍎', name: 'Apples',      price: 2 },
  { id: 'hay',      room: 'stables', e: '🌾', name: 'Hay',         price: 3 },
  { id: 'bucket',   room: 'stables', e: '🪣', name: 'Bucket',      price: 3 },
  { id: 'rosette',  room: 'stables', e: '🏵️', name: 'Prize rosette', price: 7 },
  { id: 'carousel', room: 'stables', e: '🎠', name: 'Carousel horse', price: 10 },
  { id: 'logs', room: 'stables', e: '🪵', name: 'Logs', price: 3 },
  // garden
  { id: 'tulips',   room: 'garden',  e: '🌷', name: 'Tulips',      price: 2 },
  { id: 'sunflower',room: 'garden',  e: '🌻', name: 'Sunflower',   price: 3 },
  { id: 'mushroom', room: 'garden',  e: '🍄', name: 'Mushroom',    price: 2 },
  { id: 'butterfly',room: 'garden',  e: '🦋', name: 'Butterfly',   price: 4 },
  { id: 'fountain', room: 'garden',  e: '⛲', name: 'Fountain',    price: 9 },
  { id: 'tree',     room: 'garden',  e: '🌳', name: 'Tree',        price: 5 },
  { id: 'bench',    room: 'garden',  e: '🪑', name: 'Garden bench', price: 6 },
  { id: 'slide', room: 'garden', e: '🛝', name: 'Slide', price: 9 },
  { id: 'tent', room: 'garden', e: '⛺', name: 'Tent', price: 8 },
  { id: 'wheel', room: 'garden', e: '🎡', name: 'Big wheel', price: 12 },
  { id: 'lantern', room: 'garden', e: '🏮', name: 'Lantern', price: 4 },
  // star tower
  { id: 'telescope',room: 'tower',   e: '🔭', name: 'Telescope',   price: 8 },
  { id: 'globe',    room: 'tower',   e: '🪐', name: 'Planet',      price: 6 },
  { id: 'crystal',  room: 'tower',   e: '🔮', name: 'Crystal ball', price: 7 },
  { id: 'comet',    room: 'tower',   e: '☄️', name: 'Comet',       price: 5 },
  { id: 'disco', room: 'tower', e: '🪩', name: 'Disco ball', price: 8 },
  { id: 'map', room: 'tower', e: '🗺️', name: 'Treasure map', price: 5 },
  { id: 'hourglass', room: 'tower', e: '⏳', name: 'Hourglass', price: 5 },
  { id: 'scroll', room: 'tower', e: '📜', name: 'Magic scroll', price: 4 },
  { id: 'compass', room: 'tower', e: '🧭', name: 'Compass', price: 4 },
];

// Friends arrive needing to be taught. `thing` is what they try (and fail) to count.
export const FRIENDS = [
  { id: 'princess', room: 'throne',  e: '👸', name: 'Princess Rosie', price: 0,  pitch: 1.3, thing: '💎',
    quirk: 'Oh! I was so busy waving I lost count.' },
  { id: 'cat',      room: 'throne',  e: '🐱', name: 'Whiskers',  price: 5,  pitch: 1.6, thing: '🧶',
    quirk: 'Mew! I was chasing my tail and forgot one.' },
  { id: 'cook',     room: 'kitchen', e: '🧑‍🍳', name: 'Cook Crumble', price: 7,  pitch: 1.0, thing: '🍊',
    quirk: 'Oops! I ate one while I was counting.' },
  { id: 'owl',      room: 'bedroom', e: '🦉', name: 'Hoot',      price: 6,  pitch: 1.2, thing: '⭐',
    quirk: 'Twit-twoo! I looked very wise, but I counted one twice.' },
  { id: 'dragon',   room: 'bedroom', e: '🐉', name: 'Sparky',    price: 9,  pitch: 0.8, thing: '🔥',
    quirk: 'My big claws squashed my counting!' },
  { id: 'pony',     room: 'stables', e: '🐴', name: 'Buttercup', price: 8,  pitch: 1.1, thing: '🥕',
    quirk: 'Neigh! I munched one before I counted it.' },
  { id: 'unicorn',  room: 'stables', e: '🦄', name: 'Moonbeam',  price: 12, pitch: 1.5, thing: '🌈',
    quirk: 'My sparkles got in my eyes!' },
  { id: 'frog',     room: 'garden',  e: '🐸', name: 'Prince Ribbit', price: 6, pitch: 0.9, thing: '🪷',
    quirk: 'Ribbit! I hopped over one.' },
  { id: 'fairy',    room: 'garden',  e: '🧚', name: 'Twinkle',   price: 10, pitch: 1.7, thing: '🌸',
    quirk: 'I flew too fast and missed one!' },
  { id: 'wizard',   room: 'tower',   e: '🧙', name: 'Wizard Wobble', price: 11, pitch: 0.9, thing: '✨',
    quirk: 'My spell book said a different number!' },
];

export const GAMES = [
  { id: 'count',   name: 'Count the Jewels', icon: '💎', about: 'Count them all' },
  { id: 'more',    name: 'One More Guest',   icon: '🎈', about: 'Someone arrives' },
  { id: 'fewer',   name: 'Off to Bed',       icon: '🌙', about: 'Someone leaves' },
  { id: 'compare', name: 'Which Has More?',  icon: '🍎', about: 'Pick the bigger pile' },
  { id: 'sums',    name: 'Magic Sums',       icon: '➕', about: '2 + 3 = ?' },
  { id: 'peek',    name: 'Quick Peek',       icon: '👀', about: 'Look fast, then say how many' },
  { id: 'missing', name: 'Missing Number',   icon: '🔍', about: '3 + ? = 7' },
  { id: 'next',    name: 'What Comes Next?', icon: '🪜', about: '2, 4, 6, ?' },
];

export const MAX_LEVEL = 5;
export const ROUND_LEN = 5;
export const COINS_PER_ROUND = 4;
export const LEVEL_UP_BONUS = 3;

// Good resting spots in each room (percent of the room stage), used for new items.
export const SPOTS = [
  [50, 70], [25, 78], [75, 78], [15, 62], [85, 62], [38, 88], [62, 88], [32, 66], [68, 66], [50, 84], [10, 86], [90, 86],
];

export const THINGS = ['💎', '🍓', '🌸', '🍊', '⭐', '🦋', '🍎', '🎀'];
export const GUESTS = ['👸', '🤴', '🧚', '🐱', '🐶', '🦄', '🐸', '🐰'];
