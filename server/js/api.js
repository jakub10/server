/*
 * ============================================================================
 *  DATOVÁ VRSTVA – JEDINÉ MÍSTO, KAM SE BUDE PŘIPOJOVAT SERVER
 * ============================================================================
 *
 *  Teď aplikace zobrazuje DEMO data a část změn ukládá lokálně (js/store.js).
 *  Až bude server hotový, stačí v každé funkci nahradit "demo" část voláním API.
 *  Příklad (odkomentuj a uprav cestu) :
 *
 *      return fetch(`${API_BASE}/kalendar/udalosti`, {
 *        headers: { Authorization: `Bearer ${token}` }
 *      }).then(r => {
 *        if (!r.ok) throw new Error('Server vrátil ' + r.status);
 *        return r.json();
 *      });
 *
 *  Gratuluji – zbytek aplikace (views) už není třeba měnit, protože všechny
 *  komponenty volají právě tyto funkce a pracují s vrácenými daty.
 */

import * as store from './store.js';

export const API_BASE = '/api'; // např. 'https://server.example.com/api' (vždy včetně /api)

// Nastavení autentizace (až bude potřeba). Token sem může uložit jiná AI.
let authToken = null;
export function setToken(token) { authToken = token; }
export function authHeaders() {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

// Simulace latence sítě, aby se chování podobalo reálnému serveru.
const wait = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms));

const pad = (n) => String(n).padStart(2, '0');

function isoDay(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* --------------------------------- DEMO DATA -------------------------------- */

const FAMILY = {
  mamka: { name: 'Mamka', avatar: 'px-woman' },
  tata: { name: 'Táta', avatar: 'px-man' },
  eliska: { name: 'Eliška', avatar: 'px-girl' },
  jirka: { name: 'Jirka', avatar: 'px-boy' },
  babicka: { name: 'Babička', avatar: 'px-grandma' }
};

export const DEMO_FAMILIES = [
  { id: 'RODINA-2026', name: 'Rodina Novákových' },
  { id: 'SVOBODOVI', name: 'Rodina Svobodových' },
  { id: 'BABICKA', name: 'U Babičky' }
];

let demoMessages = [
  { id: 1, from: 'mamka', text: 'Dobrý den všichni! Dnes večer máme doma večeři 🍝', at: new Date(Date.now() - 1000 * 60 * 52).toISOString() },
  { id: 2, from: 'eliska', text: 'Jdu domů ze školy, může mi někdo otevřít?', at: new Date(Date.now() - 1000 * 60 * 41).toISOString() },
  { id: 3, from: 'me', text: 'Jo, hned jsem tam 👍', at: new Date(Date.now() - 1000 * 60 * 39).toISOString() },
  { id: 4, from: 'tata', text: 'V sobotu jedeme na výlet, nezapomeňte na pláštěnky 🌦️', at: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: 5, from: 'babicka', text: 'Posílám fotky z včerejška, byli jsme na zámku 📸', at: new Date(Date.now() - 1000 * 60 * 4).toISOString() }
];

/* ----------------------------- Přihlášení / profil ---------------------------- */

/** Připojení k rodině přes kód – data jsou na serveru, takže se vidí z více zařízení. */
export async function joinFamily({ familyId, familyName, userName, userAvatar, location }) {
  await wait(100);
  const previous = store.getSession();
  const payload = {
    code: familyId,
    familyName: familyName || familyId,
    location: location || 'Praha',
    userName: userName || 'Já',
    userAvatar: userAvatar || 'px-boy',
    memberId: previous?.familyId === familyId ? previous.memberId : null
  };
  try {
    const res = await fetch(`${API_BASE}/rodina/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const session = {
      familyId: data.familyId,
      familyName: data.familyName,
      memberId: data.memberId,
      userName: payload.userName,
      userAvatar: payload.userAvatar,
      location: data.location
    };
    store.setSession(session);
    return session;
  } catch {
    // offline fallback – data zůstanou jen v tomto zařízení
    const session = {
      familyId,
      familyName: familyName || familyId,
      memberId: previous?.familyId === familyId ? previous.memberId : `local_${Date.now()}`,
      userName: payload.userName,
      userAvatar: payload.userAvatar,
      location: payload.location
    };
    store.setSession(session);
    return session;
  }
}

/** ID aktuálního člena (pro rozlišení vlastních zpráv). */
export function getMyId() { return store.getSession()?.memberId || 'me'; }

export function getSession() { return store.getSession(); }

/** Odhlášení – odejde zpět na přihlašovací obrazovku. */
export function leaveFamily() {
  // TODO: fetch(`${API_BASE}/auth/odhlasit`, { method:'POST', headers: authHeaders() });
  store.clearSession();
}

export function getProfile() {
  const s = store.getSession();
  return { name: s?.userName || 'Já', avatar: s?.userAvatar || 'px-boy', location: s?.location || 'Praha' };
}

/** Město/obec rodiny – použije se pro počasí. */
export function getLocation() { return store.getSession()?.location || 'Praha'; }

export async function updateLocation(location) {
  const s = store.getSession();
  fetch(`${API_BASE}/rodina/lokace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code: s?.familyId, location })
  }).catch(() => {});
  return store.saveProfile({ location });
}

export async function updateProfile({ name, avatar }) {
  const s = store.getSession();
  fetch(`${API_BASE}/rodina/profil`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ code: s?.familyId, memberId: s?.memberId, name, avatar })
  }).catch(() => {});
  return store.saveProfile({ userName: name, userAvatar: avatar });
}

/* --------------------------------- API FUNKCE -------------------------------- */

/** Přehled na domovské stránce. */
export async function getDashboard() {
  await wait(120);
  // TODO: return fetch(`${API_BASE}/prehled`, { headers: authHeaders() }).then(r => r.json());
  const events = await getEvents();
  const messages = await getMessages();
  return {
    members: await getMembers(),
    profile: getProfile(),
    nextEvent: events[0],
    lastMessage: messages[messages.length - 1],
    recentPhoto: DEMO_PHOTOS[0],
    weather: { temp: 19, icon: 'cloudSun', cond: 'Polojasno', city: getLocation() }
  };
}

/** Členové rodiny (id -> jméno, avatar) – sdílení ze serveru. */
export async function getMembers() {
  const s = store.getSession();
  try {
    const res = await fetch(`${API_BASE}/rodina/state?code=${encodeURIComponent(s?.familyId || '')}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const map = Object.fromEntries(data.members.map((m) => [m.id, m]));
    map.me = { ...getProfile(), id: s?.memberId };
    return map;
  } catch {
    const custom = Object.fromEntries(store.getData().members.map((m) => [m.id, m]));
    return { ...FAMILY, ...custom, me: getProfile() };
  }
}

/** Přidat člena rodiny (sdílené na serveru). */
export async function addMember({ name, avatar }) {
  const s = store.getSession();
  try {
    const res = await fetch(`${API_BASE}/rodina/clen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ code: s?.familyId, name, avatar: avatar || 'px-person' })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.json()).member;
  } catch {
    return store.addMember({ id: `c${Date.now()}`, name, avatar: avatar || 'px-person' });
  }
}

/** Události kalendáře – pole { id, date:'RRRR-MM-DD', time, title, place? }. */
export async function getEvents() {
  await wait();
  // TODO: return fetch(`${API_BASE}/kalendar/udalosti`, { headers: authHeaders() }).then(r => r.json());
  return [...DEMO_EVENTS, ...store.getData().events].sort(
    (a, b) => (a.date + a.time).localeCompare(b.date + b.time)
  );
}

/** Přidat událost do kalendáře. */
export async function addEvent({ date, time, title, place }) {
  await wait(100);
  // TODO: return fetch(`${API_BASE}/kalendar/udalosti`, { method:'POST', ... }).then(r => r.json());
  return store.addEvent({ id: `e${Date.now()}`, date, time, title, place: place || '' });
}

/** Fotky – pole { id, url, caption }. */
export async function getPhotos() {
  await wait(160);
  // TODO: return fetch(`${API_BASE}/fotky`, { headers: authHeaders() }).then(r => r.json());
  return DEMO_PHOTOS;
}

/** Zprávy rodinného chatu – sdílené ze serveru podle kódu rodiny. */
export async function getMessages() {
  const s = store.getSession();
  try {
    const res = await fetch(`${API_BASE}/rodina/state?code=${encodeURIComponent(s?.familyId || '')}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.json()).messages;
  } catch {
    return demoMessages;
  }
}

/** Odeslat zprávu do sdíleného chatu rodiny. */
export async function sendMessage(text, attachment = null) {
  const s = store.getSession();
  const local = { id: Date.now(), from: getMyId(), text, at: new Date().toISOString(), attachment };
  try {
    const res = await fetch(`${API_BASE}/rodina/zprava`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ code: s?.familyId, memberId: s?.memberId, text, attachment })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.json()).message;
  } catch {
    demoMessages.push(local);
    return local;
  }
}

/** Aktuální počasí + předpověď. */
export async function getWeather() {
  await wait(140);
  // TODO: return fetch(`${API_BASE}/pocasi?city=${encodeURIComponent(getLocation())}`).then(r => r.json());
  return {
    city: getLocation(),
    temp: 19,
    feels: 18,
    cond: 'Polojasno',
    icon: 'cloudSun',
    high: 22,
    low: 12,
    wind: 12,
    humidity: 58,
    rain: 10,
    forecast: [
      { day: 'Dnes', icon: 'cloudSun', high: 22, low: 12 },
      { day: 'Ne', icon: 'sun', high: 24, low: 13 },
      { day: 'Po', icon: 'cloud', high: 20, low: 11 },
      { day: 'Út', icon: 'rain', high: 17, low: 9 },
      { day: 'St', icon: 'cloudSun', high: 19, low: 10 }
    ]
  };
}

/**
 * Odeslat bug report.
 * Když běží součástí tohoto projektu `server.js`, hlášení se uloží do složky
 * bugreporty/ jako .json soubor. Jinak se aspoň uloží lokálně do prohlížeče.
 */
export async function submitBugReport(report) {
  const payload = {
    ...report,
    at: new Date().toISOString(),
    family: store.getSession()?.familyId || null,
    user: store.getSession()?.userName || null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  };
  try {
    const res = await fetch(`${API_BASE}/bugreport`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return { ok: true, ...(await res.json()) };
  } catch {
    const saved = store.addBugReport(payload);
    return { ok: true, local: true, id: saved.at };
  }
}

/**
 * Uložit Groq API klíč. Server ho zapíše do složky save/groq-api-key.json.
 * Když server neběží, použije se lokální záloha v prohlížeči.
 */
export async function saveGroqKey(key) {
  try {
    const res = await fetch(`${API_BASE}/save/groq-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch {
    store.saveGroqKey(key);
    return { ok: true, local: true, configured: true, masked: maskKey(key) };
  }
}

function maskKey(key) {
  if (!key) return '';
  return key.length > 10 ? key.slice(0, 6) + '••••' + key.slice(-4) : '••••';
}

/** Zjistit, zda je klíč nastavený (samotný klíč se nevrací). */
export async function getGroqKeyStatus() {
  try {
    const res = await fetch(`${API_BASE}/save/groq-key`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch {
    const key = store.getGroqKey();
    return { ok: true, local: true, configured: !!key, masked: maskKey(key) };
  }
}

/** Poslat konverzaci AI asistentovi (přes server, klíč neopouští server). */
export async function askAI(messages) {
  let res;
  try {
    res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ messages })
    });
  } catch {
    throw new Error('AI server není dostupný – spusťte node server.js (ne Python) a zkontrolujte API_BASE.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const detail = data.error || (typeof data === 'string' ? data : '');
    throw new Error(detail ? String(detail) : `Server vrátil ${res.status}. Zkontrolujte, že běží node server.js a API_BASE končí na /api.`);
  }
  return data.text;
}

/** Nahrát fotku/video (data URL). Server uloží soubor do složky fotky/. */
export async function uploadPhoto({ dataUrl, caption }) {
  try {
    const res = await fetch(`${API_BASE}/fotky`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ dataUrl, caption })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return { photo: data.photo, local: false };
  } catch {
    const kind = dataUrl.startsWith('data:video/') ? 'video' : 'image';
    const photo = store.addPhoto({ id: `l${Date.now()}`, url: dataUrl, caption: caption || '', kind });
    return { photo, local: true };
  }
}

/** Seznam fotek/videí nahraných na server. */
export async function listUploadedPhotos() {
  try {
    const res = await fetch(`${API_BASE}/fotky`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.ok ? data.photos : [];
  } catch {
    return [];
  }
}

/** Seznam souborů (PDF, TXT, …) nahraných na server. */
export async function listFiles() {
  try {
    const res = await fetch(`${API_BASE}/soubory`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.ok ? data.files : [];
  } catch { return []; }
}

/** Nahrát libovolný soubor. */
export async function uploadFile({ name, mime, dataUrl }) {
  try {
    const res = await fetch(`${API_BASE}/soubory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name, mime, dataUrl })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return { file: data.file, local: false };
  } catch {
    const file = store.addFile({ id: `f${Date.now()}`, name, mime, ext: name.split('.').pop() || 'bin', url: dataUrl, at: new Date().toISOString() });
    return { file, local: true };
  }
}

/** Oznámení pro zvonkové tlačítko. */
export async function getNotifications() {
  await wait(60);
  // TODO: return fetch(`${API_BASE}/oznameni`, { headers: authHeaders() }).then(r => r.json());
  return [
    { id: 'n1', icon: 'chat', title: 'Nová zpráva', text: 'Babička: Posílám fotky z včerejška 📸', at: 'před 4 min' },
    { id: 'n2', icon: 'calendar', title: 'Událost dnes', text: '18:30 – Rodinná večeře', at: 'dnes' },
    { id: 'n3', icon: 'image', title: 'Nová fotka', text: 'Eliška přidala fotku do galerie', at: 'včera' }
  ];
}

/* ---------------------------------- TV -------------------------------------- */

/** Historie příkazů odeslaných na televizi. */
export async function getTvItems() {
  try {
    const res = await fetch(`${API_BASE}/tv`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return (await res.json()).items;
  } catch { return []; }
}

/** Odeslat na televizi: oznámení, fotku, video nebo požadavek na sdílení obrazovky. */
export async function sendToTv(payload) {
  try {
    const res = await fetch(`${API_BASE}/tv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return { item: (await res.json()).item, local: false };
  } catch {
    const item = { id: `tv_local_${Date.now()}`, ...payload, at: new Date().toISOString() };
    store.addTvItem(item);
    return { item, local: true };
  }
}

/* ------------------------------- Demo zdroje -------------------------------- */

const DEMO_EVENTS = [
  { id: 'e1', date: isoDay(0), time: '18:30', title: 'Rodinná večeře', place: 'Doma' },
  { id: 'e2', date: isoDay(1), time: '09:00', title: 'Návštěva babičky', place: 'Vinohrady' },
  { id: 'e3', date: isoDay(3), time: '15:00', title: 'Zápas Jirky', place: 'Stadion' },
  { id: 'e4', date: isoDay(5), time: '08:00', title: 'Výlet na hrad', place: 'Karlštejn' },
  { id: 'e5', date: isoDay(9), time: '17:00', title: 'Eliščiny narozeniny', place: 'Doma' }
];

function photoUrl(seed) {
  return `https://picsum.photos/seed/${seed}/600/600`;
}

const DEMO_PHOTOS = [
  { id: 'p1', url: photoUrl('rodina1'), caption: 'Výlet na zámku 🏰' },
  { id: 'p2', url: photoUrl('rodina2'), caption: 'Eliška a Jirka' },
  { id: 'p3', url: photoUrl('rodina3'), caption: 'Grilování na zahradě' },
  { id: 'p4', url: photoUrl('rodina4'), caption: 'Vánoce 2025 🎄' },
  { id: 'p5', url: photoUrl('rodina5'), caption: 'První sníh' },
  { id: 'p6', url: photoUrl('rodina6'), caption: 'Babička a vnoučata' },
  { id: 'p7', url: photoUrl('rodina7'), caption: 'Plážová dovolená 🌊' },
  { id: 'p8', url: photoUrl('rodina8'), caption: 'Rodinná oslava' }
];
