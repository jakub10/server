import { icon } from '../icons.js';
import { getPhotos, listUploadedPhotos, uploadPhoto } from '../api.js';
import { getPhotosLocal } from '../store.js';
import { openModal, closeModal, toast } from '../ui.js';
import { escapeHtml } from '../utils.js';
import { renderText } from '../pixel.js';

export const title = 'Fotky';

let allPhotos = [];
let filterText = '';
let pendingDataUrl = '';

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" shape-rendering="crispEdges"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a9b4ff"/><stop offset="1" stop-color="#ffd0b0"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><g transform="translate(110 120)"><rect x="0" y="40" width="180" height="120" fill="#2b2b45"/><rect x="25" y="15" width="60" height="28" fill="#2b2b45"/><rect x="14" y="55" width="152" height="90" fill="#f4f6ff"/><rect x="60" y="70" width="60" height="60" fill="#e04b3f"/><rect x="75" y="85" width="30" height="30" fill="#ff9a7a"/></g></svg>');

const normalize = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const isVideo = (p) => p.kind === 'video' || /\.(mp4|webm|mov|mkv|mpg)$/i.test(p.url || '');

function photoHtml(p) {
  return `
    <button class="photo-item" data-photo="${escapeHtml(p.id)}">
      ${isVideo(p)
        ? `<video src="${escapeHtml(p.url)}" muted playsinline preload="metadata"></video><span class="video-badge">${icon('video')}</span>`
        : `<img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.caption)}" loading="lazy">`}
      <div class="cap">${renderText(p.caption) || 'Bez popisku'}</div>
    </button>`;
}

function renderGrid() {
  const grid = document.getElementById('photo-grid');
  if (!grid) return;
  const query = normalize(filterText);
  const list = query ? allPhotos.filter((p) => normalize(p.caption).includes(query)) : allPhotos;
  grid.innerHTML = list.length
    ? list.map(photoHtml).join('')
    : '<div class="empty" style="grid-column:1/-1">Žádné fotky neodpovídají hledání.</div>';
  bindErrors();
}

function bindErrors() {
  document.querySelectorAll('.photo-item img').forEach((img) => {
    img.addEventListener('error', () => {
      img.src = FALLBACK;
      img.classList.add('img-fallback');
    });
  });
}

export async function render() {
  const [demo, uploaded] = await Promise.all([getPhotos(), listUploadedPhotos()]);
  allPhotos = [
    ...demo.map((p) => ({ ...p, kind: p.kind || 'image' })),
    ...uploaded,
    ...getPhotosLocal()
  ];

  return `
    <div class="view">
      <div class="photos-toolbar">
        <div class="search-bar">${icon('search')}
          <input id="photo-search" type="search" placeholder="Hledat podle popisku…" value="${escapeHtml(filterText)}">
        </div>
        <button class="btn-add-photo" data-action="add-photo" aria-label="Přidat fotku nebo video">${icon('imagePlus')}</button>
      </div>
      <div class="section-head" style="margin-top:14px">
        <h2>Společné vzpomínky</h2>
        <span class="pill" id="photo-count">${allPhotos.length} položek</span>
      </div>
      <div class="photo-grid" id="photo-grid">${allPhotos.map(photoHtml).join('')}</div>
    </div>`;
}

export function mount() {
  bindErrors();

  document.getElementById('photo-search').addEventListener('input', (e) => {
    filterText = e.target.value;
    renderGrid();
  });

  document.querySelector('[data-action="add-photo"]').addEventListener('click', () => {
    pendingDataUrl = '';
    openModal('Přidat fotku nebo video', `
      <form id="photo-form" class="form">
        <div class="field"><label for="photo-file">Soubor (fotka nebo video)</label>
          <input id="photo-file" name="file" type="file" accept="image/*,video/*" required></div>
        <div class="photo-preview" id="photo-preview" hidden></div>
        <div class="field"><label for="photo-caption">Popisek</label>
          <input id="photo-caption" name="caption" type="text" placeholder="např. Rodinná oslava"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>Zrušit</button>
          <button type="submit" class="btn btn-primary">${icon('upload')} Přidat</button>
        </div>
      </form>`, (box) => {
      const fileInput = box.querySelector('#photo-file');
      const preview = box.querySelector('#photo-preview');

      fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          pendingDataUrl = reader.result;
          preview.hidden = false;
          preview.innerHTML = file.type.startsWith('video/')
            ? `<video src="${pendingDataUrl}" controls style="max-height:180px"></video>`
            : `<img src="${pendingDataUrl}" alt="Náhled">`;
        };
        reader.readAsDataURL(file);
      });

      box.querySelector('#photo-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!pendingDataUrl) { toast('Nejdřív vyberte soubor.'); return; }
        const caption = e.currentTarget.elements.caption.value.trim();
        const result = await uploadPhoto({ dataUrl: pendingDataUrl, caption });
        allPhotos.push(result.photo);
        filterText = '';
        const search = document.getElementById('photo-search');
        if (search) search.value = '';
        const count = document.getElementById('photo-count');
        if (count) count.textContent = `${allPhotos.length} položek`;
        renderGrid();
        closeModal();
        toast(result.local
          ? 'Soubor uložen v tomto zařízení (server není dostupný).'
          : 'Fotka/video bylo uloženo do složky fotky/.');
      });
    });
  });

  // Lightbox přes delegaci – funguje i po překreslení mřížky při hledání.
  document.getElementById('photo-grid').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-photo]');
    if (!btn) return;
    const photo = allPhotos.find((p) => p.id === btn.dataset.photo);
    if (!photo) return;
    const box = document.getElementById('lightbox');
    box.innerHTML = `
      <button class="lb-close" aria-label="Zavřít">${icon('close')}</button>
      ${isVideo(photo)
        ? `<video src="${escapeHtml(photo.url)}" controls autoplay style="max-height:70vh;max-width:100%"></video>`
        : `<img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.caption)}">`}
      <div class="lb-cap">${renderText(photo.caption) || 'Bez popisku'}</div>`;
    box.hidden = false;
    const close = () => { box.hidden = true; box.innerHTML = ''; };
    box.querySelector('.lb-close').addEventListener('click', close);
    box.addEventListener('click', (e) => { if (e.target === box) close(); }, { once: true });
  });
}
