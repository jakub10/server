import { icon } from './icons.js';
import { PIXEL_AVATARS, pixelData } from './pixel.js';
import { escapeHtml } from './utils.js';

/** Otevře modální okno. onMount dostane prvek okna pro připojení vlastních listenerů. */
export function openModal(title, body, onMount) {
  const box = document.getElementById('modal');
  box.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal-head">
        <h2>${title}</h2>
        <button class="modal-close" aria-label="Zavřít">${icon('close')}</button>
      </div>
      <div class="modal-body">${body}</div>
    </div>`;
  box.hidden = false;
  box.querySelector('.modal-close').addEventListener('click', closeModal);
  box.querySelector('.modal-backdrop').addEventListener('click', closeModal);
  box.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', closeModal));
  onMount?.(box);
  const first = box.querySelector('input, textarea, select');
  if (first) setTimeout(() => first.focus(), 60);
  return box;
}

export function closeModal() {
  const box = document.getElementById('modal');
  box.hidden = true;
  box.innerHTML = '';
}

export function toast(message) {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

/** Odkaz na přiložený soubor v chatu. */
export function attachmentHtml(att) {
  if (!att) return '';
  const name = att.name || 'Soubor';
  const url = att.url || '#';
  const ext = String(att.ext || name.split('.').pop() || 'file').toLowerCase();
  const glyph = ['pdf'].includes(ext) ? 'flag'
    : ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image'
    : ['mp4', 'webm', 'mov'].includes(ext) ? 'video' : 'upload';
  return `<a class="chat-attach" href="${escapeHtml(url)}" target="_blank" rel="noopener">${icon(glyph)} ${escapeHtml(name)}</a>`;
}

/** Pole s výběrem pixel-art avataru. Vrátí HTML; hodnota se čte z input[name=avatar]. */
export function avatarPicker(selected = 'px-boy') {
  return `
    <div class="avatar-picker" data-avatar-picker>
      ${PIXEL_AVATARS.map((p) => `
        <button type="button" class="avatar-option pixel-option ${p.id === selected ? 'selected' : ''}" data-avatar="${p.id}" title="${p.label}">
          <img src="${pixelData(p.id)}" alt="${p.label}">
        </button>`).join('')}
    </div>
    <input type="hidden" name="avatar" value="${selected}">`;
}

/** Připojí obsluhu výběru avataru uvnitř daného kontejneru. */
export function bindAvatarPicker(root) {
  root.querySelectorAll('[data-avatar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-avatar]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const hidden = root.querySelector('input[name="avatar"]');
      if (hidden) hidden.value = btn.dataset.avatar;
    });
  });
}
