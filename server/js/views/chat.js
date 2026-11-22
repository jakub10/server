import { icon } from '../icons.js';
import { getMessages, getMembers, sendMessage, uploadFile, getMyId } from '../api.js';
import { rerender } from '../app.js';
import { escapeHtml, timeLabel } from '../utils.js';
import { avatarHtml, renderText } from '../pixel.js';
import { attachmentHtml } from '../ui.js';

export const title = 'Rodinný chat';

export async function render() {
  const [messages, members] = await Promise.all([getMessages(), getMembers()]);
  return `
    <div class="view">
      <div class="chat-wrap">
        <div class="chat-scroll" id="chat-scroll">
          ${messages.map((m) => {
            const me = m.from === 'me' || m.from === getMyId();
            const person = members[m.from] || { name: 'Člen rodiny', avatar: 'px-person' };
            return `
              <div class="msg ${me ? 'me' : ''}">
                <div class="avatar">${avatarHtml(person.avatar)}</div>
                <div>
                  <div class="bubble">${renderText(m.text)}${attachmentHtml(m.attachment)}</div>
                  <div class="meta">${escapeHtml(me ? person.name + ' (vy)' : person.name)} · ${timeLabel(m.at)}</div>
                </div>
              </div>`;
          }).join('')}
        </div>
        <form class="chat-form" id="chat-form">
          <button type="button" class="chat-clip" id="chat-clip" aria-label="Přiložit soubor">${icon('upload')}</button>
          <input id="chat-input" type="text" placeholder="Napište zprávu…" autocomplete="off" maxlength="500">
          <button type="submit" aria-label="Odeslat">${icon('send')}</button>
        </form>
        <input type="file" id="chat-file" hidden>
      </div>
    </div>`;
}

export function mount() {
  const scroll = document.getElementById('chat-scroll');
  if (scroll) scroll.scrollTop = scroll.scrollHeight;

  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const fileInput = document.getElementById('chat-file');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    await sendMessage(text);
    rerender();
    requestAnimationFrame(() => document.getElementById('chat-input')?.focus());
  });

  document.getElementById('chat-clip').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const { file: saved } = await uploadFile({
        name: file.name,
        mime: file.type || 'application/octet-stream',
        dataUrl: reader.result
      });
      await sendMessage('Soubor: ' + file.name, {
        name: saved.name,
        url: saved.url,
        mime: saved.mime,
        ext: saved.ext
      });
      rerender();
      requestAnimationFrame(() => document.getElementById('chat-input')?.focus());
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });
}
