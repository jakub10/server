import { icon } from '../icons.js';
import { getDashboard } from '../api.js';
import { escapeHtml, greeting, longDate, timeLabel, MONTHS_SHORT } from '../utils.js';
import { avatarHtml, renderText, glyphHtml } from '../pixel.js';

export const title = 'Přehled';

function eventDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return { day: d.getDate(), month: MONTHS_SHORT[d.getMonth()] };
}

export async function render() {
  const data = await getDashboard();
  const ev = data.nextEvent;
  const ed = ev ? eventDate(ev.date) : null;
  const msg = data.lastMessage;
  const sender = msg && data.members[msg.from];

  return `
    <div class="view">
      <section class="hero">
        <div class="date">${longDate()}</div>
        <h2>${greeting()}, ${renderText(data.profile.name)}! ${glyphHtml('wave')}</h2>
        <p>Vše, co potřebujete, na jednom místě.</p>
        <div class="weather-mini">${icon(data.weather.icon)} ${data.weather.temp}° · ${escapeHtml(data.weather.cond)} · ${escapeHtml(data.weather.city)}</div>
      </section>

      <div class="quick-grid">
        <button class="quick" data-tab="calendar">
          <div class="q-icon q-blue">${icon('calendar')}</div>
          <h3>Kalendář</h3>
          <p>Události a plány</p>
        </button>
        <button class="quick" data-tab="photos">
          <div class="q-icon q-orange">${icon('image')}</div>
          <h3>Fotky</h3>
          <p>Společné vzpomínky</p>
        </button>
        <button class="quick" data-tab="chat">
          <div class="q-icon q-green">${icon('chat')}</div>
          <h3>Rodinný chat</h3>
          <p>Napište si navzájem</p>
        </button>
        <button class="quick" data-tab="weather">
          <div class="q-icon q-yellow">${icon('sun')}</div>
          <h3>Počasí</h3>
          <p>Předpověď na dny</p>
        </button>
      </div>

      <div class="section-head"><h2>Nejbližší událost</h2><span class="link" data-tab="calendar">Vše ›</span></div>
      <div class="card">
        ${ev ? `
          <div class="event-chip">
            <div class="event-date"><b>${ed.day}</b><span>${ed.month}</span></div>
            <div class="row-body">
              <div class="r-title">${escapeHtml(ev.title)}</div>
              <div class="r-sub">${escapeHtml(ev.time)}${ev.place ? ' · ' + escapeHtml(ev.place) : ''}</div>
            </div>
          </div>` : '<div class="empty">Žádné naplánované události.</div>'}
      </div>

      <div class="section-head"><h2>Poslední zpráva</h2><span class="link" data-tab="chat">Otevřít ›</span></div>
      <div class="card">
        ${msg ? `
          <div class="list-row">
            <div class="avatar">${sender ? avatarHtml(sender.avatar) : glyphHtml('chat')}</div>
            <div class="row-body">
              <div class="r-title">${renderText(sender ? sender.name : 'Člen rodiny')}</div>
              <div class="r-sub">${renderText(msg.text)}</div>
            </div>
            <div class="row-time">${timeLabel(msg.at)}</div>
          </div>` : '<div class="empty">Zatím žádné zprávy.</div>'}
      </div>

      <div class="section-head"><h2>Členové rodiny</h2></div>
      <div class="card">
        <div style="display:flex;justify-content:space-around;flex-wrap:wrap;gap:8px">
          ${Object.values(data.members).map((m) => `
            <div style="text-align:center">
              <div class="avatar" style="margin:0 auto 4px">${avatarHtml(m.avatar)}</div>
              <div style="font-size:11px;color:var(--muted)">${escapeHtml(m.name)}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}

export function mount() {}
