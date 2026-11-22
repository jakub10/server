/*
 * Lokální stav aplikace (localStorage). Slouží jako dočasná náhrada serveru
 * pro přihlášení, profil, vlastní události, členy a bug reporty.
 * Až přijde napojení na server, funkce v api.js tyto hodnoty nahradí / doplní.
 */

const SESSION_KEY = 'rodina.session.v1';
const DATA_KEY = 'rodina.data.v1';
const GROQ_KEY = 'rodina.groq.v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* plná paměť – ignorovat */ }
}

/* ------------------------------- Přihlášení -------------------------------- */

export function getSession() { return read(SESSION_KEY, null); }
export function setSession(session) { write(SESSION_KEY, session); }
export function clearSession() { localStorage.removeItem(SESSION_KEY); }
export function isLoggedIn() { return !!getSession(); }

export function saveProfile(patch) {
  const session = getSession() || {};
  const next = { ...session, ...patch };
  setSession(next);
  return next;
}

/* ------------------------------- Ostatní data ------------------------------ */

const EMPTY = { events: [], members: [], bugReports: [], photos: [], files: [], prefs: { notifications: true, notificationsSeen: false } };

export function getData() { return { ...EMPTY, ...read(DATA_KEY, {}) }; }
function setData(data) { write(DATA_KEY, data); }

export function addEvent(event) {
  const data = getData();
  data.events.push(event);
  setData(data);
  return event;
}

export function addMember(member) {
  const data = getData();
  data.members.push(member);
  setData(data);
  return member;
}

export function addBugReport(report) {
  const data = getData();
  data.bugReports.push(report);
  setData(data);
  return report;
}

export function getBugReports() { return getData().bugReports; }

export function savePrefs(patch) {
  const data = getData();
  data.prefs = { ...data.prefs, ...patch };
  setData(data);
  return data.prefs;
}

export function getPrefs() { return getData().prefs; }

/** Fotky přidané v prohlížeči, když není dostupný server. */
export function addPhoto(photo) {
  const data = getData();
  data.photos.push(photo);
  setData(data);
  return photo;
}
export function getPhotosLocal() { return getData().photos; }

/** Soubory uložené v prohlížeči, když není dostupný server. */
export function addFile(file) {
  const data = getData();
  data.files.push(file);
  setData(data);
  return file;
}
export function getFilesLocal() { return getData().files; }

/** Groq API klíč – lokální záloha, hlavní úložiště je save/ na serveru. */
export function saveGroqKey(key) { write(GROQ_KEY, { key }); }
export function getGroqKey() { return read(GROQ_KEY, {})?.key || ''; }
