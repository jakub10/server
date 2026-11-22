import { icon } from '../icons.js';
import { getEvents, addEvent } from '../api.js';
import { rerender } from '../app.js';
import { openModal, closeModal, toast } from '../ui.js';
import { escapeHtml, MONTHS, DAYS_SHORT, mondayIndex, dateKey, sameDay } from '../utils.js';

export const title = 'Kalendář';

const today = new Date();
const state = {
  year: today.getFullYear(),
  month: today.getMonth(),
  selected: dateKey(today),
  events: []
};

export async function render() {
  state.events = await getEvents();
  const first = new Date(state.year, state.month, 1);
  const offset = mondayIndex(first);
  const daysInMonth = new Date(state.year, state.month + 1, 0).getDate();
  const daysPrev = new Date(state.year, state.month, 0).getDate();

  const cells = [];
  for (let i = 0; i < 42; i++) {
    let day, month = state.month, year = state.year, other = false;
    if (i < offset) { day = daysPrev - offset + 1 + i; month--; other = true; }
    else if (i >= offset + daysInMonth) { day = i - offset - daysInMonth + 1; month++; other = true; }
    else { day = i - offset + 1; }

    const d = new Date(year, month, day);
    const key = dateKey(d);
    const hasEvent = state.events.some((e) => e.date === key);
    const cls = [
      'cal-cell', other ? 'other' : '',
      sameDay(d, today) ? 'today' : '',
      state.selected === key ? 'selected' : ''
    ].filter(Boolean).join(' ');
    cells.push(`<button class="${cls}" data-date="${key}">${day}${hasEvent ? '<span class="dot"></span>' : ''}</button>`);
  }

  const selectedEvents = state.events
    .filter((e) => e.date === state.selected)
    .sort((a, b) => a.time.localeCompare(b.time));

  const selDate = new Date(state.selected + 'T00:00:00');
  const dayLabel = `${selDate.getDate()}. ${MONTHS[selDate.getMonth()]} ${selDate.getFullYear()}`;

  return `
    <div class="view">
      <div class="cal-head">
        <h2>${MONTHS[state.month]} ${state.year}</h2>
        <div class="cal-actions">
          <button class="btn-add-event" data-action="add-event">${icon('plus')} Přidat</button>
          <div class="cal-nav">
            <button data-nav="-1" aria-label="Předchozí měsíc">${icon('chevronLeft')}</button>
            <button data-nav="1" aria-label="Další měsíc">${icon('chevronRight')}</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="weekdays">${DAYS_SHORT.map((d) => `<span>${d}</span>`).join('')}</div>
        <div class="cal-grid">${cells.join('')}</div>
      </div>

      <div class="cal-detail">
        <div class="section-head" style="margin-top:6px">
          <h2>Události</h2>
          <span class="pill">${dayLabel}</span>
        </div>
        <div class="card">
          ${selectedEvents.length ? selectedEvents.map((e) => `
            <div class="event-chip">
              <div class="event-date" style="min-width:52px"><b>${escapeHtml(e.time)}</b></div>
              <div class="row-body">
                <div class="r-title">${escapeHtml(e.title)}</div>
                <div class="r-sub">${escapeHtml(e.place || 'Bez místa')}</div>
              </div>
            </div>`).join('') : '<div class="empty">Tento den nemáte žádné události.</div>'}
        </div>
      </div>
    </div>`;
}

export function mount() {
  document.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.month += Number(btn.dataset.nav);
      if (state.month < 0) { state.month = 11; state.year--; }
      if (state.month > 11) { state.month = 0; state.year++; }
      rerender();
    });
  });
  document.querySelectorAll('[data-date]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selected = btn.dataset.date;
      rerender();
    });
  });

  document.querySelector('[data-action="add-event"]').addEventListener('click', () => {
    openModal('Nová událost', `
      <form id="event-form" class="form">
        <div class="field"><label for="ev-title">Název události</label>
          <input id="ev-title" name="title" type="text" placeholder="např. Rodinná oslava" required></div>
        <div class="form-row">
          <div class="field"><label for="ev-date">Datum</label>
            <input id="ev-date" name="date" type="date" value="${state.selected}" required></div>
          <div class="field"><label for="ev-time">Čas</label>
            <input id="ev-time" name="time" type="time" value="18:00" required></div>
        </div>
        <div class="field"><label for="ev-place">Místo (nepovinné)</label>
          <input id="ev-place" name="place" type="text" placeholder="např. Doma"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>Zrušit</button>
          <button type="submit" class="btn btn-primary">${icon('plus')} Přidat událost</button>
        </div>
      </form>`, (box) => {
      box.querySelector('#event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.currentTarget.elements;
        const date = f.date.value;
        if (!date || !f.title.value.trim()) return;
        await addEvent({
          date,
          time: f.time.value || '00:00',
          title: f.title.value.trim(),
          place: f.place.value.trim()
        });
        const d = new Date(date + 'T00:00:00');
        state.month = d.getMonth();
        state.year = d.getFullYear();
        state.selected = date;
        closeModal();
        rerender();
        toast('Událost byla přidána do kalendáře.');
      });
    });
  });
}
