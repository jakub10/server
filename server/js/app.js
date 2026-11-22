import { icon } from './icons.js';
import { isLoggedIn, getPrefs, savePrefs } from './store.js';
import { openModal } from './ui.js';
import { getNotifications } from './api.js';
import { applyAppearance } from './appearance.js';
import { renderText } from './pixel.js';
import * as login from './views/login.js';
import * as ai from './views/ai.js';
import * as home from './views/home.js';
import * as calendar from './views/calendar.js';
import * as photos from './views/photos.js';
import * as chat from './views/chat.js';
import * as weather from './views/weather.js';
import * as files from './views/files.js';
import * as tv from './views/tv.js';
import * as settings from './views/settings.js';

const views = { login, home, calendar, photos, chat, weather, files, tv, ai, settings };

const tabs = [
  { id: 'home', label: 'Domů', glyph: 'home' },
  { id: 'calendar', label: 'Kalendář', glyph: 'calendar' },
  { id: 'chat', label: 'Chat', glyph: 'chat' },
  { id: 'weather', label: 'Počasí', glyph: 'sun' },
  { id: 'files', label: 'Soubory', glyph: 'file' },
  { id: 'tv', label: 'TV', glyph: 'tv' },
  { id: 'ai', label: 'AI', glyph: 'sparkles' }
];

const headerEl = document.getElementById('app-header');
const appEl = document.getElementById('app');
const tabbarEl = document.getElementById('tabbar');

let active = 'home';
let renderToken = 0;

function updateShell() {
  const logged = isLoggedIn();
  headerEl.hidden = !logged;
  tabbarEl.hidden = !logged;
  appEl.classList.toggle('full', !logged);
}

function renderHeader() {
  headerEl.innerHTML = `
    <div class="brand-mark">${icon('heart')}</div>
    <div class="header-titles">
      <div class="eyebrow">Rodina</div>
      <h1>${views[active].title}</h1>
    </div>
    <div class="header-actions">
      <button class="icon-btn" data-action="notifications" aria-label="Oznámení">${icon('bell')}${getPrefs().notificationsSeen ? '' : '<span class="badge"></span>'}</button>
      <button class="icon-btn" data-tab="settings" aria-label="Nastavení">${icon('settings')}</button>
    </div>`;
}

function renderTabs() {
  tabbarEl.innerHTML = tabs.map((t) => `
    <button class="tab ${t.id === active ? 'active' : ''}" data-tab="${t.id}">
      ${icon(t.glyph)}
      <span>${t.label}</span>
      ${t.id === 'chat' ? '<span class="dot"></span>' : ''}
    </button>`).join('');
}

async function renderView() {
  const token = ++renderToken;
  appEl.innerHTML = '<div class="loading"><span class="spinner"></span></div>';
  try {
    const html = await views[active].render();
    if (token !== renderToken) return; // mezitím uživatel přepnul – zrušit starý rendering
    appEl.innerHTML = html;
    views[active].mount?.();
    window.scrollTo({ top: 0 });
  } catch (err) {
    console.error(err);
    if (token === renderToken) {
      appEl.innerHTML = '<div class="empty">Obsah se nepodařilo načíst. Zkuste to znovu.</div>';
    }
  }
}

// Exportované funkce – používají je i jednotlivé obrazovky (data-tab, rerender).
export function navigate(id) {
  if (!views[id]) return;
  // Na začátku se vždy zobrazí přihlášení do správné rodiny.
  if (!isLoggedIn() && id !== 'login') id = 'login';
  if (isLoggedIn() && id === 'login') id = 'home';
  active = id;
  updateShell();
  renderHeader();
  renderTabs();
  renderView();
}

export function rerender() {
  renderView();
}

async function showNotifications() {
  const items = await getNotifications();
  savePrefs({ notificationsSeen: true });
  renderHeader();
  openModal('Oznámení', `
    <div class="notification-list">
      ${items.map((n) => `
        <div class="notification-row">
          <div class="setting-icon">${icon(n.icon)}</div>
          <div class="setting-text">
            <div class="s-label">${renderText(n.title)}</div>
            <div class="s-value">${renderText(n.text)}</div>
          </div>
          <span class="row-time">${n.at}</span>
        </div>`).join('')}
    </div>
    <div class="modal-actions"><button type="button" class="btn btn-primary" data-close>Rozumím</button></div>`);
}

// Kliknutí na jakýkoli prvek s data-tab (spodní lišta i rychlé odkazy) a na zvonec.
document.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (tab) navigate(tab.dataset.tab);
  const bell = event.target.closest('[data-action="notifications"]');
  if (bell) showNotifications();
});

// PWA – umožní přidat aplikaci na plochu telefonu.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('SW:', err));
  });
}

applyAppearance();
renderTabs();
navigate('home');
