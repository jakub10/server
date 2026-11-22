/*
 * Jednoduchý server pro telefonní část aplikace (Node 18+, bez závislostí).
 *  - statické soubory
 *  - sdílená rodina podle kódu (členové + zprávy na serveru -> 2 zařízení se uvidí)
 *  - AI chat přes Groq (klíč zůstává na serveru)
 *  - fotky, soubory, bug reporty, TV
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || process.env.PORT || 8080);
const ROOT = __dirname;
const BUG_DIR = path.join(ROOT, 'bugreporty');
const SAVE_DIR = path.join(ROOT, 'save');
const PHOTO_DIR = path.join(ROOT, 'fotky');
const FILE_DIR = path.join(ROOT, 'soubory');
const DATA_DIR = path.join(ROOT, 'data');
const KEY_FILE = path.join(SAVE_DIR, 'groq-api-key.json');
const PHOTO_INDEX = path.join(PHOTO_DIR, 'index.json');
const FILE_INDEX = path.join(FILE_DIR, 'index.json');
const FAMILY_FILE = path.join(DATA_DIR, 'rodiny.json');
const TV_FILE = path.join(DATA_DIR, 'tv.json');

[BUG_DIR, SAVE_DIR, PHOTO_DIR, FILE_DIR, DATA_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
[[PHOTO_INDEX, '[]'], [FILE_INDEX, '[]'], [FAMILY_FILE, '{}'], [TV_FILE, '[]']].forEach(([file, initial]) => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, initial);
});

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip'
};

const EXT = {
  jpeg: 'jpg', jpg: 'jpg', png: 'png', gif: 'gif', webp: 'webp', bmp: 'bmp', svg: 'svg',
  mp4: 'mp4', webm: 'webm', quicktime: 'mov', mpeg: 'mpg', x_matroska: 'mkv',
  pdf: 'pdf', plain: 'txt', msword: 'doc',
  'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'vnd.ms-excel': 'xls', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  zip: 'zip', 'x-7z-compressed': '7z', json: 'json', csv: 'csv'
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function readJson(req, limit, callback) {
  let raw = '';
  let done = false;
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > limit && !done) { done = true; req.destroy(); }
  });
  req.on('end', () => {
    if (done) return;
    try { callback(null, JSON.parse(raw || '{}')); }
    catch (err) { callback(err); }
  });
}

function readStore(file, fallback) {
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    return value ?? fallback;
  } catch { return fallback; }
}

function writeStore(file, value, res, okBody) {
  fs.writeFile(file, JSON.stringify(value, null, 2), (err) => {
    if (err) { send(res, 500, { ok: false, error: 'Zápis se nepodařil' }); return; }
    send(res, 200, okBody(value));
  });
}

/* ------------------------------ Bug reporty ------------------------------- */

function saveBugReport(req, res) {
  readJson(req, 1_000_000, (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const id = `${stamp}-${Math.random().toString(36).slice(2, 7)}`;
    const record = { id, receivedAt: new Date().toISOString(), ...payload };
    fs.writeFile(path.join(BUG_DIR, `${id}.json`), JSON.stringify(record, null, 2), (writeErr) => {
      if (writeErr) { send(res, 500, { ok: false, error: 'Zápis se nepodařil' }); return; }
      console.log(`Bug report uložen: bugreporty/${id}.json`);
      send(res, 200, { ok: true, id, file: `bugreporty/${id}.json` });
    });
  });
}

/* ------------------------------ Groq API klíč ----------------------------- */

function readKey() {
  try { return (JSON.parse(fs.readFileSync(KEY_FILE, 'utf8')).key || '').trim(); }
  catch { return ''; }
}

function handleGroqKey(req, res) {
  if (req.method === 'GET') {
    const key = readKey();
    const masked = key ? key.slice(0, 6) + '••••' + key.slice(-4) : '';
    send(res, 200, { ok: true, configured: !!key, masked });
    return;
  }
  readJson(req, 10_000, (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const key = String(payload.key || '').trim();
    if (!key) { send(res, 400, { ok: false, error: 'Klíč je prázdný' }); return; }
    fs.writeFile(KEY_FILE, JSON.stringify({ key, updatedAt: new Date().toISOString() }, null, 2), (writeErr) => {
      if (writeErr) { send(res, 500, { ok: false, error: 'Klíč se nepodařilo uložit' }); return; }
      console.log('Groq API klíč uložen do save/groq-api-key.json');
      send(res, 200, { ok: true, configured: true, masked: key.slice(0, 6) + '••••' + key.slice(-4) });
    });
  });
}

/* -------------------------------- AI chat --------------------------------- */

async function callGroq(key, model, messages) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'system',
        content: 'Jsi vývojářský asistent mobilní aplikace Rodina (kalendář, fotky, chat, počasí, soubory, TV, nastavení). ' +
          'Uživatelé píší, co by chtěli přidat. Odpovídej česky, stručně a konkrétně: navrhni řešení, ' +
          'uveď soubory (js/views/, js/api.js, css/styles.css), které by se změnily, a případně připoj krátký kód.'
      }, ...messages],
      temperature: 0.7,
      max_tokens: 900
    })
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data, text: data.choices?.[0]?.message?.content || '' };
}

async function handleAiChat(req, res) {
  const key = readKey();
  if (!key) {
    send(res, 400, { ok: false, error: 'Není nastaven Groq API klíč. Otevřete AI chat a klikněte na „Nastavit klíč".' });
    return;
  }
  readJson(req, 200_000, async (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const messages = Array.isArray(payload.messages) ? payload.messages.slice(-20) : [];
    // Staré llama modely byly v srpnu 2026 vyřazeny -> Groq vracel 404.
    const models = [process.env.GROQ_MODEL, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'].filter(Boolean);
    let last;
    for (const model of models) {
      try {
        const result = await callGroq(key, model, messages);
        last = result;
        if (result.status === 200 && result.text) {
          send(res, 200, { ok: true, text: result.text, model });
          return;
        }
        if (result.status !== 404 && result.status !== 400) break;
      } catch (apiErr) {
        last = { status: 502, data: { error: { message: apiErr.message } } };
        break;
      }
    }
    const detail = last?.data?.error?.message || last?.data?.error || 'neznámá chyba';
    send(res, (last?.status && last.status >= 400 ? last.status : 502), {
      ok: false,
      error: `Groq (${last?.status || '?'}): ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`
    });
  });
}

/* --------------------------------- Fotky ----------------------------------- */

function readIndex(file) {
  try {
    const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function handlePhotosUpload(req, res) {
  readJson(req, 25_000_000, (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const match = /^data:(image|video)\/([a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(payload.dataUrl || '');
    if (!match) { send(res, 400, { ok: false, error: 'Neplatný soubor' }); return; }
    const kind = match[1];
    const subtype = match[2].toLowerCase();
    const ext = EXT[subtype] || (kind === 'video' ? 'mp4' : 'png');
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const filename = `${id}.${ext}`;
    fs.writeFile(path.join(PHOTO_DIR, filename), Buffer.from(match[3], 'base64'), (writeErr) => {
      if (writeErr) { send(res, 500, { ok: false, error: 'Zápis se nepodařil' }); return; }
      const photo = { id, url: `/fotky/${filename}`, caption: String(payload.caption || '').slice(0, 200), kind, at: new Date().toISOString() };
      const index = readIndex(PHOTO_INDEX);
      index.push(photo);
      writeStore(PHOTO_INDEX, index, res, () => ({ ok: true, photo }));
    });
  });
}

function handleFilesUpload(req, res) {
  readJson(req, 25_000_000, (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const match = /^data:([^;,]+)?;base64,(.+)$/s.exec(payload.dataUrl || '');
    if (!match) { send(res, 400, { ok: false, error: 'Neplatný soubor' }); return; }
    const mime = match[1] || payload.mime || 'application/octet-stream';
    const subtype = mime.split('/')[1]?.split('+')[0]?.toLowerCase() || '';
    const name = String(payload.name || 'soubor').replace(/[^\w.\- ]/g, '_').slice(0, 120);
    const ext = EXT[subtype] || (name.match(/\.([a-z0-9]{1,5})$/i) || [])[1]?.toLowerCase() || 'bin';
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const filename = `${id}.${ext}`;
    fs.writeFile(path.join(FILE_DIR, filename), Buffer.from(match[2], 'base64'), (writeErr) => {
      if (writeErr) { send(res, 500, { ok: false, error: 'Zápis se nepodařil' }); return; }
      const file = { id, name, url: `/soubory/${filename}`, mime, ext, at: new Date().toISOString() };
      const index = readIndex(FILE_INDEX);
      index.push(file);
      writeStore(FILE_INDEX, index, res, () => ({ ok: true, file }));
    });
  });
}

/* --------------------------- Sdílená rodina -------------------------------- */

function readFamilies() { return readStore(FAMILY_FILE, {}); }

function seedMembers() {
  return [
    { id: 'mamka', name: 'Mamka', avatar: 'px-woman' },
    { id: 'tata', name: 'Táta', avatar: 'px-man' },
    { id: 'eliska', name: 'Eliška', avatar: 'px-girl' },
    { id: 'jirka', name: 'Jirka', avatar: 'px-boy' },
    { id: 'babicka', name: 'Babička', avatar: 'px-grandma' }
  ];
}

function seedMessages() {
  const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
  return [
    { id: 'm1', from: 'mamka', text: 'Dobrý den všichni! Dnes večer máme doma večeři 🍝', at: ago(52) },
    { id: 'm2', from: 'eliska', text: 'Jdu domů ze školy, může mi někdo otevřít?', at: ago(41) },
    { id: 'm3', from: 'tata', text: 'V sobotu jedeme na výlet, nezapomeňte na pláštěnky 🌦️', at: ago(12) }
  ];
}

function handleFamily(req, res, action) {
  const url = new URL(req.url, 'http://localhost');
  const queryCode = url.searchParams.get('code') || '';
  readJson(req, 1_000_000, (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const code = String(payload.code || queryCode || '').trim().toUpperCase();
    if (!code) { send(res, 400, { ok: false, error: 'Chybí kód rodiny' }); return; }
    const families = readFamilies();
    const fam = families[code];

    if (action === 'join') {
      if (!fam) {
        families[code] = {
          name: String(payload.familyName || code).slice(0, 80),
          location: String(payload.location || 'Praha').slice(0, 80),
          members: seedMembers(),
          messages: seedMessages(),
          createdAt: new Date().toISOString()
        };
      } else {
        fam.name = String(payload.familyName || fam.name).slice(0, 80);
        if (payload.location) fam.location = String(payload.location).slice(0, 80);
      }
      const f = families[code];
      const wanted = String(payload.memberId || '').trim();
      let member = f.members.find((m) => m.id === wanted);
      if (!member) {
        member = { id: `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: String(payload.userName || 'Já').slice(0, 60), avatar: payload.userAvatar || 'px-boy' };
        f.members.push(member);
      } else {
        member.name = String(payload.userName || member.name).slice(0, 60);
        member.avatar = payload.userAvatar || member.avatar;
      }
      writeStore(FAMILY_FILE, families, res, () => ({
        ok: true, familyId: code, familyName: f.name, location: f.location,
        memberId: member.id, members: f.members, messages: f.messages
      }));
      return;
    }

    if (!fam) { send(res, 404, { ok: false, error: 'Rodina s tímto kódem neexistuje' }); return; }

    if (action === 'state') {
      send(res, 200, { ok: true, familyId: code, familyName: fam.name, location: fam.location, members: fam.members, messages: fam.messages });
      return;
    }
    if (action === 'member') {
      const m = { id: `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: String(payload.name || 'Člen').slice(0, 60), avatar: payload.avatar || 'px-person' };
      fam.members.push(m);
      writeStore(FAMILY_FILE, families, res, () => ({ ok: true, member: m, members: fam.members }));
      return;
    }
    if (action === 'message') {
      const msg = {
        id: `msg_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        from: String(payload.memberId || 'me'),
        text: String(payload.text || '').slice(0, 1000),
        attachment: payload.attachment || null,
        at: new Date().toISOString()
      };
      fam.messages.push(msg);
      writeStore(FAMILY_FILE, families, res, () => ({ ok: true, message: msg }));
      return;
    }
    if (action === 'profile') {
      const member = fam.members.find((m) => m.id === payload.memberId);
      if (!member) { send(res, 404, { ok: false, error: 'Člen nenalezen' }); return; }
      member.name = String(payload.name || member.name).slice(0, 60);
      member.avatar = payload.avatar || member.avatar;
      writeStore(FAMILY_FILE, families, res, () => ({ ok: true, members: fam.members }));
      return;
    }
    if (action === 'location') {
      fam.location = String(payload.location || 'Praha').slice(0, 80);
      writeStore(FAMILY_FILE, families, res, () => ({ ok: true, location: fam.location }));
      return;
    }
    send(res, 405, { ok: false, error: 'Neznámá akce' });
  });
}

/* ---------------------------------- TV ------------------------------------- */

function handleTv(req, res) {
  if (req.method === 'GET') {
    send(res, 200, { ok: true, items: readStore(TV_FILE, []) });
    return;
  }
  readJson(req, 10_000, (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const type = ['notification', 'photo', 'video', 'screen'].includes(payload.type) ? payload.type : 'notification';
    const item = {
      id: `tv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      type,
      text: String(payload.text || '').slice(0, 500),
      priority: String(payload.priority || 'normal').slice(0, 20),
      url: payload.url || null,
      name: payload.name ? String(payload.name).slice(0, 120) : null,
      at: new Date().toISOString()
    };
    const items = readStore(TV_FILE, []);
    items.unshift(item);
    writeStore(TV_FILE, items.slice(0, 50), res, () => ({ ok: true, item }));
  });
}

/* ------------------------------ Statické soubory --------------------------- */

function serveStatic(req, res, pathname) {
  const rel = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const file = path.resolve(ROOT, '.' + rel);
  if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, 'index.html')) {
    send(res, 403, { error: 'Forbidden' });
    return;
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
      fs.createReadStream(path.join(ROOT, 'index.html')).pipe(res);
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname; }
  catch { send(res, 400, { error: 'Bad request' }); return; }

  if (pathname === '/api/bugreport' && req.method === 'GET') {
    fs.readdir(BUG_DIR, (err, files) => send(res, 200, { ok: true, files: err ? [] : files.filter((f) => f.endsWith('.json')) }));
    return;
  }
  if (pathname === '/api/bugreport' && req.method === 'POST') { saveBugReport(req, res); return; }
  if (pathname === '/api/save/groq-key') { handleGroqKey(req, res); return; }
  if (pathname === '/api/ai/chat' && req.method === 'POST') { handleAiChat(req, res); return; }
  if (pathname === '/api/fotky') {
    if (req.method === 'GET') send(res, 200, { ok: true, photos: readIndex(PHOTO_INDEX) });
    else if (req.method === 'POST') handlePhotosUpload(req, res);
    else send(res, 405, { error: 'Method not allowed' });
    return;
  }
  if (pathname === '/api/soubory') {
    if (req.method === 'GET') send(res, 200, { ok: true, files: readIndex(FILE_INDEX) });
    else if (req.method === 'POST') handleFilesUpload(req, res);
    else send(res, 405, { error: 'Method not allowed' });
    return;
  }
  if (pathname.startsWith('/api/rodina/')) {
    const action = pathname.split('/')[3];
    const map = { join: 'join', state: 'state', clen: 'member', zprava: 'message', profil: 'profile', lokace: 'location' };
    if (map[action]) handleFamily(req, res, map[action]);
    else send(res, 404, { ok: false, error: 'Neznámý endpoint rodiny' });
    return;
  }
  if (pathname === '/api/tv') { handleTv(req, res); return; }
  if (req.method === 'GET' || req.method === 'HEAD') { serveStatic(req, res, pathname); return; }
  send(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`Rodina běží na http://localhost:${PORT}`);
  console.log('Složky: bugreporty/, save/, fotky/, soubory/, data/');
});
