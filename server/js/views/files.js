import { icon } from '../icons.js';
import { listFiles, uploadFile, listUploadedPhotos, sendMessage } from '../api.js';
import { getFilesLocal, getPhotosLocal } from '../store.js';
import { navigate } from '../app.js';
import { openModal, closeModal, toast } from '../ui.js';
import { escapeHtml, timeLabel } from '../utils.js';
import { renderText } from '../pixel.js';

export const title = 'Soubory';

const FILTERS = [
  { id: 'all', label: 'Vše' },
  { id: 'image', label: 'Fotky' },
  { id: 'video', label: 'Videa' },
  { id: 'pdf', label: 'PDF' },
  { id: 'text', label: 'Text' },
  { id: 'other', label: 'Ostatní' }
];

let items = [];
let query = '';
let activeFilter = 'all';

function category(item) {
  const ext = String(item.ext || (item.name || '').split('.').pop() || item.kind || '').toLowerCase();
  if (item.kind === 'video' || ['mp4', 'webm', 'mov', 'mkv', 'mpg'].includes(ext)) return 'video';
  if (item.kind === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['txt', 'md', 'csv', 'json'].includes(ext)) return 'text';
  return 'other';
}

const GLYPH = { image: 'image', video: 'video', pdf: 'flag', text: 'file', other: 'file' };

function rowHtml(item) {
  const cat = category(item);
  const name = item.name || item.caption || 'Soubor';
  return `
    <div class="file-row">
      <div class="file-icon">${icon(GLYPH[cat])}</div>
      <div class="file-meta">
        <div class="file-name">${renderText(name)}</div>
        <div class="file-sub">${FILTERS.find((f) => f.id === cat)?.label} · ${item.at ? timeLabel(item.at) : ''}</div>
      </div>
      <button class="file-send" data-send="${escapeHtml(item.id)}" title="Poslat do chatu">${icon('send')}</button>
    </div>`;
}

function renderList() {
  const host = document.getElementById('file-list');
  if (!host) return;
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const list = items.filter((f) => {
    const name = String(f.name || f.caption || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return (!q || name.includes(q)) && (activeFilter === 'all' || category(f) === activeFilter);
  });
  host.innerHTML = list.length ? list.map(rowHtml).join('') : '<div class="empty">Žádné soubory neodpovídají vzoru.</div>';
  const count = document.getElementById('file-count');
  if (count) count.textContent = `${items.length} souborů`;
}

export async function render() {
  const [serverFiles, localFiles, serverPhotos] = await Promise.all([listFiles(), Promise.resolve(getFilesLocal()), listUploadedPhotos()]);
  items = [
    ...serverFiles,
    ...localFiles,
    ...serverPhotos.map((p) => ({ id: p.id, name: p.caption || 'Fotka', url: p.url, kind: p.kind, ext: p.url.split('.').pop(), at: p.at })),
    ...getPhotosLocal().map((p) => ({ id: p.id, name: p.caption || 'Fotka', url: p.url, kind: p.kind, ext: 'jpg', at: p.at }))
  ];

  return `
    <div class="view">
      <div class="photos-toolbar">
        <div class="search-bar">${icon('search')}
          <input id="file-search" type="search" placeholder="Hledat v souborech…" value="${escapeHtml(query)}">
        </div>
        <button class="btn-add-photo" data-action="add-file" aria-label="Přidat soubor">${icon('filePlus')}</button>
      </div>
      <div class="file-filter">
        ${FILTERS.map((f) => `<button class="filter-chip ${f.id === activeFilter ? 'active' : ''}" data-filter="${f.id}">${f.label}</button>`).join('')}
      </div>
      <div class="section-head" style="margin-top:4px">
        <h2>Všechny soubory</h2>
        <span class="pill" id="file-count">${items.length} souborů</span>
      </div>
      <div class="card">
        <div id="file-list">${items.length ? items.map(rowHtml).join('') : '<div class="empty">Zatím žádné soubory.</div>'}</div>
      </div>
      <p class="version">Soubory se ukládají do složky soubory/ · fotky do složky fotky/</p>
    </div>`;
}

export function mount() {
  document.getElementById('file-search').addEventListener('input', (e) => {
    query = e.target.value;
    renderList();
  });
  document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === btn));
      renderList();
    });
  });

  document.getElementById('file-list').addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-send]');
    if (!btn) return;
    const item = items.find((f) => f.id === btn.dataset.send);
    if (!item) return;
    const name = item.name || item.caption || 'Soubor';
    await sendMessage('Soubor: ' + name, {
      name,
      url: item.url,
      mime: item.mime || '',
      ext: item.ext || ''
    });
    toast(`„${name}" odeslán do rodinného chatu.`);
    navigate('chat');
  });

  document.querySelector('[data-action="add-file"]').addEventListener('click', () => {
    openModal('Přidat soubor', `
      <form id="file-form" class="form">
        <p class="modal-text">Libovolný soubor – PDF, TXT, DOCX, ZIP, obrázek i video.</p>
        <div class="field"><label for="file-input">Soubor</label>
          <input id="file-input" name="file" type="file" required></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>Zrušit</button>
          <button type="submit" class="btn btn-primary">${icon('upload')} Nahrát</button>
        </div>
      </form>`, (box) => {
      const input = box.querySelector('#file-input');
      box.querySelector('#file-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          const { file: saved, local } = await uploadFile({
            name: file.name,
            mime: file.type || 'application/octet-stream',
            dataUrl: reader.result
          });
          items.push({
            id: saved.id,
            name: saved.name,
            url: saved.url,
            mime: saved.mime,
            ext: saved.ext,
            at: saved.at
          });
          query = '';
          activeFilter = 'all';
          const search = document.getElementById('file-search');
          if (search) search.value = '';
          document.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all'));
          renderList();
          closeModal();
          toast(local ? 'Soubor uložen v tomto zařízení.' : 'Soubor uložen do složky soubory/.');
        };
        reader.readAsDataURL(file);
      });
    });
  });
}
