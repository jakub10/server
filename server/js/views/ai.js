import { icon } from '../icons.js';
import { askAI, getGroqKeyStatus, saveGroqKey, getProfile } from '../api.js';
import { openModal, closeModal, toast } from '../ui.js';
import { rerender } from '../app.js';
import { escapeHtml } from '../utils.js';
import { avatarHtml, renderText, glyphHtml } from '../pixel.js';

export const title = 'AI asistent';

let messages = [
  { role: 'assistant', text: 'Ahoj! 👋 Napiš mi, co bys chtěl do aplikace Rodina přidát nebo změnit – rád ti navrhnu řešení i konkrétní postup.' }
];

function messageHtml(m) {
  const me = m.role === 'user';
  const avatar = me ? avatarHtml(getProfile().avatar) : glyphHtml('bot');
  return `
    <div class="msg ${me ? 'me' : 'bot'}">
      <div class="avatar">${avatar}</div>
      <div>
        <div class="bubble">${renderText(m.text)}</div>
        <div class="meta">${me ? 'Vy' : 'AI asistent'}</div>
      </div>
    </div>`;
}

function refreshList() {
  const list = document.getElementById('ai-scroll');
  if (!list) return;
  list.innerHTML = messages.map(messageHtml).join('');
  list.scrollTop = list.scrollHeight;
}

export async function render() {
  const status = await getGroqKeyStatus();
  return `
    <div class="view">
      <div class="card ai-status">
        <div class="card-title">${icon('sparkles')} AI asistent <span class="pill" style="margin-left:auto">Groq</span></div>
        <p class="muted" style="font-size:12px;margin-bottom:12px">
          Napište, co byste chtěli doprogramovat. Klíč se ukládá do složky <b>save/</b> na serveru.
        </p>
        <div class="ai-status-row">
          <span class="pill ${status.configured ? '' : 'pill-warn'}">${icon(status.configured ? 'check' : 'info')} ${status.configured ? 'Klíč nastaven' + (status.masked ? ' · ' + escapeHtml(status.masked) : '') : 'Klíč není nastaven'}</span>
          <button class="btn btn-soft btn-sm" data-action="groq-key">${icon('settings')} Nastavit klíč</button>
        </div>
      </div>

      <div class="chat-wrap">
        <div class="chat-scroll" id="ai-scroll">${messages.map(messageHtml).join('')}</div>
        <form class="chat-form" id="ai-form">
          <input id="ai-input" type="text" placeholder="Např. Přidej tmavý režim…" autocomplete="off" maxlength="1000" required>
          <button type="submit" aria-label="Odeslat">${icon('send')}</button>
        </form>
      </div>
    </div>`;
}

export function mount() {
  document.querySelector('[data-action="groq-key"]').addEventListener('click', () => {
    openModal('Groq API klíč', `
      <form id="groq-form" class="form">
        <p class="modal-text">Klíč se uloží do souboru <b>save/groq-api-key.json</b> na serveru. Odtud ho AI chat použije – prohlížeč ho nikam neodesílá přímo.</p>
        <div class="field"><label for="groq-input">API klíč (gsk_…)</label>
          <input id="groq-input" name="key" type="password" placeholder="gsk_..." autocomplete="off" required></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>Zrušit</button>
          <button type="submit" class="btn btn-primary">${icon('check')} Uložit</button>
        </div>
      </form>`, (box) => {
      box.querySelector('#groq-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const key = e.currentTarget.elements.key.value.trim();
        if (!key) return;
        const result = await saveGroqKey(key);
        closeModal();
        rerender();
        toast(result.local
          ? 'Klíč uložen lokálně v zařízení (server není dostupný).'
          : 'Klíč uložen do složky save/ na serveru.');
      });
    });
  });

  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const list = document.getElementById('ai-scroll');
  list.scrollTop = list.scrollHeight;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    messages.push({ role: 'user', text });
    const pending = { role: 'assistant', text: 'AI přemýšlí…' };
    messages.push(pending);
    refreshList();

    try {
      const history = messages.filter((m) => m !== pending).map((m) => ({ role: m.role, content: m.text }));
      const answer = await askAI(history);
      pending.text = answer || '(bez odpovědi)';
    } catch (err) {
      pending.text = '⚠️ ' + err.message;
    }
    refreshList();
    input.focus();
  });
}
