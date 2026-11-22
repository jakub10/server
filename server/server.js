/*
 * Jednoduchý vývojový server pro telefonní část aplikace.
 *  - statické soubory (index.html, css, js, ...)
 *  - POST /api/bugreport       -> složka bugreporty/
 *  - POST /api/save/groq-key   -> složka save/groq-api-key.json
 *  - POST /api/ai/chat         -> přeposílá na Groq API (klíč zůstává na serveru)
 *  - POST /api/fotky           -> složka fotky/ (fotky i videa)
 *
 * Spuštění: node server.js 8080   (vyžaduje Node 18+ kvůli fetch)
 * Bez externích závislostí.
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
const KEY_FILE = path.join(SAVE_DIR, 'groq-api-key.json');
const PHOTO_INDEX = path.join(PHOTO_DIR, 'index.json');
const FILE_INDEX = path.join(FILE_DIR, 'index.json');

[BUG_DIR, SAVE_DIR, PHOTO_DIR, FILE_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(PHOTO_INDEX)) fs.writeFileSync(PHOTO_INDEX, '[]');
if (!fs.existsSync(FILE_INDEX)) fs.writeFileSync(FILE_INDEX, '[]');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip'
};

const EXT = {
  jpeg: 'jpg', jpg: 'jpg', png: 'png', gif: 'gif', webp: 'webp', bmp: 'bmp', svg: 'svg',
  mp4: 'mp4', webm: 'webm', quicktime: 'mov', mpeg: 'mpg', x_matroska: 'mkv',
  pdf: 'pdf', plain: 'txt', 'msword': 'doc', 'vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'vnd.ms-excel': 'xls', 'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  zip: 'zip', 'x-7z-compressed': '7z', json: 'json', csv: 'csv',
  'vnd.ms-powerpoint': 'ppt', 'vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx'
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

function listBugReports(res) {
  fs.readdir(BUG_DIR, (err, files) => {
    if (err) { send(res, 500, { ok: false }); return; }
    send(res, 200, { ok: true, files: files.filter((f) => f.endsWith('.json')) });
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

async function handleAiChat(req, res) {
  const key = readKey();
  if (!key) {
    send(res, 400, { ok: false, error: 'Není nastaven Groq API klíč. Otevřete AI chat a klikněte na „Nastavit klíč".' });
    return;
  }
  readJson(req, 200_000, async (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const messages = Array.isArray(payload.messages) ? payload.messages.slice(-20) : [];
    const body = {
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Jsi vývojářský asistent mobilní aplikace Rodina (kalendář, fotky, rodinný chat, počasí, nastavení, AI chat). ' +
            'Uživatelé ti píší, co by chtěli do aplikace přidat. Odpovídej česky, stručně a konkrétně: ' +
            'navrhni řešení, popiš jakou funkci a kde v projektu (soubory js/views/, js/api.js, css/styles.css) upravit, ' +
            'a když je to vhodné, připoj i krátký kód. Nevnucuj zbytečné změny.'
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 900
    };
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        send(res, response.status, { ok: false, error: data?.error?.message || 'Groq API chyba' });
        return;
      }
      send(res, 200, { ok: true, text: data.choices?.[0]?.message?.content || '' });
    } catch (apiErr) {
      send(res, 502, { ok: false, error: 'Groq se nepodařilo zavolat: ' + apiErr.message });
    }
  });
}

/* --------------------------------- Fotky ----------------------------------- */

function readPhotoIndex() {
  try {
    const arr = JSON.parse(fs.readFileSync(PHOTO_INDEX, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function handlePhotos(req, res) {
  if (req.method === 'GET') {
    send(res, 200, { ok: true, photos: readPhotoIndex() });
    return;
  }
  readJson(req, 25_000_000, (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const match = /^data:(image|video)\/([a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(payload.dataUrl || '');
    if (!match) { send(res, 400, { ok: false, error: 'Neplatný soubor (očekává se data URL)' }); return; }

    const kind = match[1];
    const ext = EXT[match[2].toLowerCase().replace('x-', 'x_')] || (kind === 'video' ? 'mp4' : 'png');
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const filename = `${id}.${ext}`;
    const buffer = Buffer.from(match[3], 'base64');

    fs.writeFile(path.join(PHOTO_DIR, filename), buffer, (writeErr) => {
      if (writeErr) { send(res, 500, { ok: false, error: 'Soubor se nepodařilo uložit' }); return; }
      const photo = {
        id,
        url: `/fotky/${filename}`,
        caption: String(payload.caption || '').slice(0, 200),
        kind,
        at: new Date().toISOString()
      };
      const index = readPhotoIndex();
      index.push(photo);
      fs.writeFile(PHOTO_INDEX, JSON.stringify(index, null, 2), (indexErr) => {
        if (indexErr) { send(res, 500, { ok: false, error: 'Index se nepodařilo uložit' }); return; }
        console.log(`Fotka uložena: fotky/${filename}`);
        send(res, 200, { ok: true, photo });
      });
    });
  });
}

/* -------------------------------- Soubory ---------------------------------- */

function readFileIndex() {
  try {
    const arr = JSON.parse(fs.readFileSync(FILE_INDEX, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function handleFiles(req, res) {
  if (req.method === 'GET') {
    send(res, 200, { ok: true, files: readFileIndex() });
    return;
  }
  readJson(req, 25_000_000, (err, payload) => {
    if (err) { send(res, 400, { ok: false, error: 'Neplatné JSON' }); return; }
    const match = /^data:([^;,]+)?;base64,(.+)$/s.exec(payload.dataUrl || '');
    if (!match) { send(res, 400, { ok: false, error: 'Neplatný soubor (očekává se data URL)' }); return; }

    const mime = match[1] || payload.mime || 'application/octet-stream';
    const fromMime = mime.split('/')[1]?.split('+')[0] || '';
    let ext = EXT[fromMime.toLowerCase()] || '';
    const name = String(payload.name || 'soubor').replace(/[^\w.\- ]/g, '_').slice(0, 120);
    if (!ext) ext = (name.match(/\.([a-z0-9]{1,5})$/i) || [])[1]?.toLowerCase() || 'bin';

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const filename = `${id}.${ext}`;
    fs.writeFile(path.join(FILE_DIR, filename), Buffer.from(match[2], 'base64'), (writeErr) => {
      if (writeErr) { send(res, 500, { ok: false, error: 'Soubor se nepodařilo uložit' }); return; }
      const file = {
        id,
        name,
        url: `/soubory/${filename}`,
        mime,
        ext,
        at: new Date().toISOString()
      };
      const index = readFileIndex();
      index.push(file);
      fs.writeFile(FILE_INDEX, JSON.stringify(index, null, 2), (indexErr) => {
        if (indexErr) { send(res, 500, { ok: false, error: 'Index se nepodařilo uložit' }); return; }
        console.log(`Soubor uložen: soubory/${filename}`);
        send(res, 200, { ok: true, file });
      });
    });
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
      const fallback = path.join(ROOT, 'index.html');
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
      fs.createReadStream(fallback).pipe(res);
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

  if (pathname === '/api/bugreport' && req.method === 'POST') { saveBugReport(req, res); return; }
  if (pathname === '/api/bugreport' && req.method === 'GET') { listBugReports(res); return; }
  if (pathname === '/api/save/groq-key') { handleGroqKey(req, res); return; }
  if (pathname === '/api/ai/chat' && req.method === 'POST') { handleAiChat(req, res); return; }
  if (pathname === '/api/fotky') { handlePhotos(req, res); return; }
  if (pathname === '/api/soubory') { handleFiles(req, res); return; }
  if (req.method === 'GET' || req.method === 'HEAD') { serveStatic(req, res, pathname); return; }
  send(res, 405, { error: 'Method not allowed' });
});

server.listen(PORT, () => {
  console.log(`Rodina běží na http://localhost:${PORT}`);
  console.log('Složky: bugreporty/, save/, fotky/, soubory/');
});
