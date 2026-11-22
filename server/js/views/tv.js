import { icon } from '../icons.js';
import { getTvItems, sendToTv, uploadPhoto, uploadFile } from '../api.js';
import { toast } from '../ui.js';
import { escapeHtml, timeLabel } from '../utils.js';

export const title = 'Televize';

let items = [];

const TYPE_LABEL = { notification: 'Oznámení', photo: 'Fotka', video: 'Video', screen: 'Obrazovka' };
const TYPE_GLYPH = { notification: 'bellPlus', photo: 'image', video: 'video', screen: 'cast' };

function rowsHtml() {
  if (!items.length) return '<div class="empty">Zatím nic odesláno.</div>';
  return items.map((it) => `
    <div class="list-row">
      <div class="avatar">${icon(TYPE_GLYPH[it.type] || 'bellPlus')}</div>
      <div class="row-body">
        <div class="r-title">${escapeHtml(TYPE_LABEL[it.type] || it.type)}</div>
        <div class="r-sub">${escapeHtml(it.text || it.name || '—')}</div>
      </div>
      <div class="row-time">${it.at ? timeLabel(it.at) : ''}</div>
    </div>`).join('');
}

export async function render() {
  items = await getTvItems();
  return `
    <div class="view">
      <div class="card">
        <div class="card-title">${icon('bellPlus')} Oznámení na televizi</div>
        <form id="tv-note-form" class="form">
          <div class="field"><label for="tv-note">Zpráva pro televizi</label>
            <textarea id="tv-note" name="text" rows="2" placeholder="např. Večeře je připravená" required></textarea></div>
          <div class="field"><label for="tv-priority">Jak je to důležité?</label>
            <select id="tv-priority" name="priority">
              <option value="low">Nízká</option>
              <option value="normal" selected>Normální</option>
              <option value="high">Vysoká</option>
              <option value="critical">Kritická</option>
            </select></div>
          <button type="submit" class="btn btn-primary btn-block">${icon('send')} Odeslat na TV</button>
        </form>
      </div>

      <div class="card">
        <div class="card-title">${icon('image')} Fotka nebo video na TV</div>
        <div class="tv-buttons">
          <button class="btn btn-soft" id="tv-photo-btn">${icon('image')} Fotka</button>
          <button class="btn btn-soft" id="tv-video-btn">${icon('video')} Video</button>
        </div>
        <input type="file" id="tv-photo-input" accept="image/*" hidden>
        <input type="file" id="tv-video-input" accept="video/*" hidden>
        <p class="muted" style="font-size:11px;margin-top:10px">Vybraný soubor se odešle na televizi.</p>
      </div>

      <div class="card">
        <div class="card-title">${icon('cast')} Sdílet obrazovku</div>
        <p class="muted" style="font-size:12px;margin-bottom:12px">
          Co je zrovna na počítači, se zobrazí na televizi. Zajišťujeme jen <strong>odeslání</strong> požadavku –
          samotné zobrazení obstará televize.
        </p>
        <button class="btn btn-primary btn-block" id="tv-cast">${icon('cast')} Sdílet obrazovku</button>
      </div>

      <div class="card">
        <div class="card-title">${icon('clock')} Historie</div>
        <div id="tv-history">${rowsHtml()}</div>
      </div>
    </div>`;
}

async function push(item, message) {
  const { local } = await sendToTv(item);
  items.unshift({ ...item, id: item.id || `local_${Date.now()}`, at: new Date().toISOString() });
  const host = document.getElementById('tv-history');
  if (host) host.innerHTML = rowsHtml();
  toast(local ? message + ' (uloženo lokálně)' : message);
}

export function mount() {
  document.getElementById('tv-note-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = e.currentTarget.elements.text.value.trim();
    if (!text) return;
    e.currentTarget.elements.text.value = '';
    await push({ type: 'notification', text, priority: e.currentTarget.elements.priority.value }, 'Oznámení odesláno na TV.');
  });

  const sendFile = (inputId, kind) => {
    const input = document.getElementById(inputId);
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const isPhoto = kind === 'photo';
        const dataUrl = reader.result;
        const result = isPhoto
          ? await uploadPhoto({ dataUrl, caption: file.name })
          : await uploadFile({ name: file.name, mime: file.type || 'video/mp4', dataUrl });
        const saved = isPhoto ? result.photo : result.file;
        await push({ type: kind, url: saved.url, name: file.name, text: file.name }, isPhoto ? 'Fotka odeslána na TV.' : 'Video odesláno na TV.');
      };
      reader.readAsDataURL(file);
      input.value = '';
    });
  };
  sendFile('tv-photo-input', 'photo');
  sendFile('tv-video-input', 'video');

  document.getElementById('tv-photo-btn').addEventListener('click', () => document.getElementById('tv-photo-input').click());
  document.getElementById('tv-video-btn').addEventListener('click', () => document.getElementById('tv-video-input').click());
  document.getElementById('tv-cast').addEventListener('click', () => push({ type: 'screen', text: 'Sdílení obrazovky z počítače' }, 'Požadavek na sdílení obrazovky odeslán.'));
}
