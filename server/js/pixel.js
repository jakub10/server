/*
 * Pixel art pro celou aplikaci – avatary i drobné obrázky v textu.
 * Vše je generované jako malé SVG (bloky), bez externích souborů.
 */

const C = {
  x: '#2b2b45', '.': null,
  w: '#f4f6ff', s: '#f2c49b', y: '#ffcc4d', o: '#e08b3e', r: '#e04b3f',
  g: '#27ae60', b: '#5b67f0', p: '#ff7a9c', v: '#9b6bdf', k: '#8b5a3c'
};

/* 8×8 vzory pro drobné obrázky (smajlíky nahradí pixel artem). */
const PATTERNS = {
  person: ['..ssss..', '.ssssss.', '.s.xx.s.', '.ssssss.', '..ssss..', '.bbbbbb.', 'bbbbbbbb', '.bb..bb.'],
  wave:   ['..ssss..', '.ssssss.', 'ssssssss', 'ssssssss', '.sssss..', '..sss...', '..ss....', '..s.....'],
  camera: ['........', '.xxxxxx.', 'xwwwwwwx', 'xw.ww.wx', 'xwwwwwwx', 'x.rrrr.x', 'x.rrrr.x', '.xxxxxx.'],
  pin:    ['..xxxx..', '.xwwwwx.', 'xwwrrwwx', 'xwrrrrwx', 'xwwrrwwx', '.xwwwwx.', '..xwwx..', '...xx...'],
  chat:   ['.xxxxxx.', 'xwwwwwwx', 'xwwwwwwx', 'xwwwxxx.', 'xwwx....', 'xwwwwwwx', '.xxxxxx.', '........'],
  bot:    ['..xxxx..', '.xwwwwx.', 'xwxwwxwx', 'xwwwwwwx', 'xwxxxxwx', '.xwwwwx.', '..xwwx..', '.x....x.'],
  warn:   ['...yy...', '..yyyy..', '.yxxxyy.', 'yxxx.xxx', 'yxxxxxxy', '.yyyyyy.', '..yyyy..', '...yy...'],
  pasta:  ['..yyyy..', '.yrrryy.', 'yrrrrryy', '.yrrryy.', '..yyyy..', '.wwwwww.', 'wwwwwwww', '.wwwwww.'],
  thumb:  ['..ss....', '.sss....', '.ssssss.', '.ssssssx', '.ssssssx', '..ssssx.', '..xxxx..', '........'],
  rain:   ['..wwww..', '.wwwwww.', 'wwwwwwww', '.wwwwww.', '........', '.b..b..b', 'b..b..b.', '........'],
  castle: ['x.x..x.x', 'xwxxxxwx', 'xwwwwwwx', 'xwwxxwwx', 'xwwwwwwx', 'xw.ww.wx', 'xwwwwwwx', '.xxxxxx.'],
  tree:   ['...yy...', '..yggy..', '.yggggy.', 'yggggggy', '..yggy..', '.yggggy.', 'yggggggy', '..kkkk..'],
  sea:    ['........', '..bb..bb', '.bbbbbb.', 'bbbbbbbb', '..bb..bb', '.bbbbbb.', 'bbbbbbbb', '........'],
  flower: ['..p..p..', '.pp.pp..', '..ppp...', '.pypyp..', '..ppp...', '..yppy..', '...gg...', '...gg...'],
  balloon:['..yyyy..', '.yyyyyy.', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '...yy...', '...xx...', '...xx...'],
  heart:  ['.pp..pp.', 'pppppppp', 'pppppppp', '.pppppp.', '..pppp..', '...pp...', '........', '........']
};

/* Avatary: buď postavička (skin/hair/body), nebo jeden z vzorů výše. */
const TYPES = {
  'px-boy':      { label: 'Pixel kluk',     skin: '#f2c49b', hair: '#4b3a2f', body: '#5b67f0' },
  'px-girl':     { label: 'Pixel holka',    skin: '#f7c8a8', hair: '#7b4a2d', body: '#ff7a9c' },
  'px-man':      { label: 'Pixel muž',      skin: '#eab98f', hair: '#2b2b45', body: '#3d7bd6' },
  'px-woman':    { label: 'Pixel žena',     skin: '#f2c49b', hair: '#8b4a2d', body: '#e0559a' },
  'px-old':      { label: 'Pixel děda',     skin: '#e8b98f', hair: '#d7dbe8', body: '#9b6bdf' },
  'px-grandma':  { label: 'Pixel babička',  skin: '#e8b98f', hair: '#d7dbe8', body: '#7a8fd6' },
  'px-person':   { label: 'Pixel osoba',    skin: '#f2c49b', hair: '#5b4a3a', body: '#27ae60' },
  'px-cat':      { label: 'Pixel kočka',    skin: '#e08b3e', hair: '#b4662a', body: '#e08b3e', ears: true },
  'px-dog':      { label: 'Pixel pes',      skin: '#c98654', hair: '#8b5a3c', body: '#a86e42', ears: true },
  'px-flower':   { label: 'Pixel květina',  glyph: 'flower' },
  'px-star':     { label: 'Pixel hvězda',   glyph: 'star' },
  'px-balloon':  { label: 'Pixel balon',    glyph: 'balloon' },
  'px-heart':    { label: 'Pixel srdce',    glyph: 'heart' }
};

export const PIXEL_AVATARS = Object.entries(TYPES).map(([id, v]) => ({ id, label: v.label }));

function rect(x, y, w, h, color) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
}

function patternSvg(name) {
  const rows = name === 'star'
    ? ['...yy...', '...yy...', 'yyyyyyyy', '.yyyyyy.', '..yyyy..', '.yy..yy.', 'yy....yy', '........']
    : PATTERNS[name];
  if (!rows) return '';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" shape-rendering="crispEdges">';
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = C[ch];
      if (color) s += rect(x, y, 1, 1, color);
    });
  });
  return s + '</svg>';
}

function buildSvg(id) {
  const v = TYPES[id];
  if (!v) return '';
  if (v.glyph) return patternSvg(v.glyph);

  const dark = '#2b2b45';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" shape-rendering="crispEdges">';
  if (v.ears) {
    s += rect(2, 1, 2, 3, v.hair) + rect(8, 1, 2, 3, v.hair);
  }
  s += rect(3, 2, 6, 5, v.skin);
  if (!v.ears) s += rect(3, 1, 6, 2, v.hair) + rect(2, 2, 1, 3, v.hair) + rect(9, 2, 1, 3, v.hair);
  s += rect(4, 4, 1, 1, dark) + rect(7, 4, 1, 1, dark);
  s += rect(5, 6, 2, 1, '#c2685c');
  s += rect(5, 7, 2, 1, v.skin);
  s += rect(2, 8, 8, 4, v.body);
  s += rect(4, 8, 4, 1, 'rgba(255,255,255,.22)');
  return s + '</svg>';
}

const cache = {};
function svgData(key, svg) {
  if (!cache[key]) cache[key] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  return cache[key];
}

export function pixelData(id) {
  if (!TYPES[id]) return '';
  return svgData('avatar:' + id, buildSvg(id));
}

export function pixelGlyph(name) {
  const svg = patternSvg(name);
  return svg ? svgData('glyph:' + name, svg) : '';
}

export function glyphHtml(name) {
  const src = pixelGlyph(name);
  return src ? `<img class="pixel-inline" src="${src}" alt="">` : '';
}

/* Všechny smajlíky v textu se převedou na pixel art (i když přijdou ze serveru). */
const EMOJI_GLYPH = {
  '👋': 'wave', '📸': 'camera', '📷': 'camera', '📍': 'pin', '💬': 'chat',
  '🤖': 'bot', '⚠️': 'warn', '⚠': 'warn', '🍝': 'pasta', '👍': 'thumb',
  '🌦️': 'rain', '🌦': 'rain', '🏰': 'castle', '🎄': 'tree', '🌊': 'sea',
  '🌻': 'flower', '🎈': 'balloon', '⭐': 'star', '🙂': 'person', '👤': 'person'
};

export function renderText(value) {
  let text = String(value ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  Object.entries(EMOJI_GLYPH).forEach(([emoji, name]) => {
    if (text.includes(emoji)) text = text.split(emoji).join(glyphHtml(name));
  });
  return text.replace(/\n/g, '<br>');
}

/** Vnitřek prvku .avatar – vždy pixel art. */
export function avatarHtml(value) {
  const v = String(value || 'px-person');
  if (v.startsWith('px-')) {
    const src = pixelData(v);
    if (src) return `<img class="pixel-avatar" src="${src}" alt="">`;
  }
  if (v.startsWith('data:')) return `<img class="pixel-avatar" src="${v}" alt="">`;
  return avatarHtml('px-person');
}
