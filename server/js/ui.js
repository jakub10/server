import { icon } from './icons.js';
import { PIXEL_AVATARS, pixelData, PALETTE, customToken, rowsFromToken } from './pixel.js';
import { addCustomAvatar, getCustomAvatars } from './store.js';
import { addFamilyAvatar } from './api.js';
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

/* ---------------------------- Pixel avatar výběr ---------------------------- */

export function renderAvatarOptions(selected = 'px-boy') {
  const custom = getCustomAvatars();
  return `
    ${PIXEL_AVATARS.map((p) => `
      <button type="button" class="avatar-option pixel-option ${p.id === selected ? 'selected' : ''}" data-avatar="${p.id}" title="${p.label}">
        <img src="${pixelData(p.id)}" alt="${p.label}">
      </button>`).join('')}
    ${custom.map((a, i) => `
      <button type="button" class="avatar-option pixel-option ${a.token === selected ? 'selected' : ''}" data-avatar="${escapeHtml(a.token)}" title="Vlastní avatar ${i + 1}">
        <img src="${pixelData(a.token)}" alt="Vlastní avatar">
      </button>`).join('')}
    <button type="button" class="avatar-make-btn" data-action="make-avatar" title="Vytvořit vlastní pixel art">${icon('plus')}<span>Vytvořit</span></button>`;
}

/** Pole s výběrem pixel-art avataru. */
export function avatarPicker(selected = 'px-boy') {
  return `
    <div class="avatar-picker" data-avatar-picker>
      ${renderAvatarOptions(selected)}
    </div>
    <input type="hidden" name="avatar" value="${escapeHtml(selected)}">`;
}

/** Připojí obsluhu výběru avataru uvnitř daného kontejneru. */
export function bindAvatarPicker(root) {
  root.querySelectorAll('[data-avatar]').forEach((btn) => {
    btn.addEventListener('click', () => {
      root.querySelectorAll('[data-avatar]').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const picker = btn.closest('[data-avatar-picker]');
      const hidden = picker?.parentElement.querySelector('input[name="avatar"]') || root.querySelector('input[name="avatar"]');
      if (hidden) hidden.value = btn.dataset.avatar;
    });
  });
  root.querySelectorAll('[data-action="make-avatar"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const picker = btn.closest('[data-avatar-picker]');
      const hidden = picker?.parentElement.querySelector('input[name="avatar"]') || root.querySelector('input[name="avatar"]');
      openAvatarMaker(hidden?.value || 'px-boy', picker);
    });
  });
}

/**
 * Editor vlastního pixel-art avataru (12×12 bodů). Běží ve vlastní vrstvě,
 * aby nepřepsal případné modální okno (např. formulář profilu) pod ním.
 */
export function openAvatarMaker(current = 'px-boy', pickerEl = null, onSaved) {
  let rows = current.startsWith('pxc:')
    ? rowsFromToken(current)
    : Array.from({ length: 12 }, () => '.'.repeat(12));
  let color = 'x';

  const paletteKeys = Object.keys(PALETTE).filter((k) => PALETTE[k]);
  const cells = () => rows.map((row, y) => [...row].map((ch, x) =>
    `<button type="button" class="px-cell" data-x="${x}" data-y="${y}" style="background:${PALETTE[ch] || 'transparent'}"></button>`
  ).join('')).join('');

  const host = document.createElement('div');
  host.className = 'modal';
  host.id = 'avatar-maker-modal';
  host.innerHTML = `
    <div class="modal-backdrop" data-maker-close></div>
    <div class="modal-card" role="dialog" aria-modal="true" aria-label="Vytvořit pixel avatar">
      <div class="modal-head">
        <h2>Vytvořit pixel avatar</h2>
        <button class="modal-close" data-maker-close aria-label="Zavřít">${icon('close')}</button>
      </div>
      <div class="modal-body">
        <p class="modal-text">Klikáním malujte avatar. Vyberte barvu, pak jednotlivé čtverečky.</p>
        <div class="px-editor">
          <div class="px-grid">${cells()}</div>
          <div class="px-side">
            <div class="px-preview"><img class="px-preview-img" src="" alt="Náhled"></div>
            <div class="px-palette">
              ${paletteKeys.map((k) => `<button type="button" class="px-color ${k === color ? 'selected' : ''}" data-color="${k}" style="background:${PALETTE[k]}" title="${k}"></button>`).join('')}
              <button type="button" class="px-color px-empty" data-color="." title="Průhledné">×</button>
            </div>
            <div class="px-tools">
              <button type="button" class="btn btn-ghost btn-sm" id="px-clear">Vymazat</button>
              <button type="button" class="btn btn-ghost btn-sm" id="px-fill">Vyplnit</button>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-maker-close>Zrušit</button>
          <button type="button" class="btn btn-primary" id="px-save">${icon('check')} Uložit avatar</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(host);

  const close = () => host.remove();
  host.querySelectorAll('[data-maker-close]').forEach((el) => el.addEventListener('click', close));

  const grid = host.querySelector('.px-grid');
  const preview = host.querySelector('.px-preview-img');
  const refreshPreview = () => { preview.src = pixelData(customToken(rows)); };
  refreshPreview();

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.px-cell');
    if (!btn) return;
    const x = Number(btn.dataset.x);
    const y = Number(btn.dataset.y);
    rows[y] = rows[y].slice(0, x) + color + rows[y].slice(x + 1);
    btn.style.background = PALETTE[color] || 'transparent';
    refreshPreview();
  });

  host.querySelectorAll('[data-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      color = btn.dataset.color;
      host.querySelectorAll('[data-color]').forEach((b) => b.classList.toggle('selected', b === btn));
    });
  });

  host.querySelector('#px-clear').addEventListener('click', () => {
    rows = Array.from({ length: 12 }, () => '.'.repeat(12));
    grid.innerHTML = cells();
    refreshPreview();
  });
  host.querySelector('#px-fill').addEventListener('click', () => {
    rows = Array.from({ length: 12 }, () => color.repeat(12));
    grid.innerHTML = cells();
    refreshPreview();
  });

  host.querySelector('#px-save').addEventListener('click', () => {
    const token = customToken(rows);
    addCustomAvatar({ id: token, token, name: 'Vlastní avatar' });
    addFamilyAvatar({ token, name: 'Vlastní avatar' });
    if (pickerEl?.isConnected) {
      pickerEl.innerHTML = renderAvatarOptions(token);
      const hidden = pickerEl.parentElement.querySelector('input[name="avatar"]');
      if (hidden) hidden.value = token;
      bindAvatarPicker(document);
    }
    close();
    toast('Vlastní pixel avatar byl vytvořen.');
    onSaved?.(token);
  });
}
