import { icon } from '../icons.js';
import { getMembers, addMember, updateProfile, leaveFamily, submitBugReport, getProfile, getLocation, updateLocation } from '../api.js';
import { THEMES, FONTS, ACCENTS, setAppearance } from '../appearance.js';
import { getSession, getPrefs, savePrefs, getBugReports } from '../store.js';
import { openModal, closeModal, toast, avatarPicker, bindAvatarPicker } from '../ui.js';
import { rerender, navigate } from '../app.js';
import { escapeHtml } from '../utils.js';
import { avatarHtml, renderText } from '../pixel.js';

export const title = 'Nastavení';

export async function render() {
  const session = getSession();
  const profile = getProfile();
  const members = await getMembers();
  const prefs = getPrefs();
  const localReports = getBugReports().length;

  return `
    <div class="view">
      <div class="card profile-card">
        <div class="profile-avatar">${avatarHtml(profile.avatar)}</div>
        <div class="profile-info">
          <h2>${renderText(profile.name)}</h2>
          <p>Člen rodiny ${escapeHtml(session?.familyName || '')}</p>
        </div>
        <button class="icon-btn" data-action="profile" aria-label="Upravit profil">${icon('edit')}</button>
      </div>

      <div class="card">
        <div class="card-title">${icon('users')} Vaše rodina</div>
        <div class="setting-row">
          <div class="setting-icon">${icon('usersSmall')}</div>
          <div class="setting-text"><div class="s-label">Název rodiny</div><div class="s-value">${escapeHtml(session?.familyName || '—')}</div></div>
        </div>
        <div class="setting-row">
          <div class="setting-icon">${icon('flag')}</div>
          <div class="setting-text"><div class="s-label">Kód rodiny</div><div class="s-value mono">${escapeHtml(session?.familyId || '—')}</div></div>
        </div>
        <div class="setting-row clickable" data-action="location">
          <div class="setting-icon">${icon('sun')}</div>
          <div class="setting-text"><div class="s-label">Místo bydliště</div><div class="s-value">${escapeHtml(getLocation())} · pro počasí</div></div>
          ${icon('chevronRight', 'row-chevron')}
        </div>
        <div class="setting-row clickable" data-action="switch-family">
          <div class="setting-icon">${icon('logout')}</div>
          <div class="setting-text"><div class="s-label">Změnit rodinu / odhlásit se</div><div class="s-value">Vrátit se na přihlášení</div></div>
          ${icon('chevronRight', 'row-chevron')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          ${icon('users')} Členové rodiny
          <button class="mini-add" data-action="add-member" aria-label="Přidat člena">${icon('plus')}</button>
        </div>
        ${Object.entries(members).map(([id, m]) => `
          <div class="list-row">
            <div class="avatar">${avatarHtml(m.avatar)}</div>
            <div class="row-body">
              <div class="r-title">${renderText(m.name)}${id === 'me' ? ' (vy)' : ''}</div>
              <div class="r-sub">${id === 'me' ? 'Váš profil' : 'Člen rodiny'}</div>
            </div>
          </div>`).join('')}
        <button class="btn btn-soft btn-block" data-action="add-member" style="margin-top:12px">${icon('userPlus')} Přidat člena rodiny</button>
      </div>

      <div class="card">
        <div class="card-title">${icon('settings')} Nastavení aplikace</div>
        <label class="setting-row clickable">
          <div class="setting-icon">${icon('bell')}</div>
          <div class="setting-text"><div class="s-label">Oznámení</div><div class="s-value">Upozornění na zprávy a události</div></div>
          <input type="checkbox" class="switch" id="pref-notifications" ${prefs.notifications ? 'checked' : ''}>
        </label>
      </div>

      <div class="card">
        <div class="card-title">${icon('settings')} Vzhled aplikace</div>
        <div class="appearance-label">Pozadí</div>
        <div class="swatches">
          ${Object.entries(THEMES).map(([id, t]) => `
            <button class="swatch ${prefs.theme === id ? 'selected' : ''}" data-theme="${id}" title="${t.label}"
              style="background:${t.bg};border-color:${prefs.theme === id ? 'var(--primary)' : t.line}"></button>`).join('')}
        </div>
        <div class="appearance-label">Styl písma</div>
        <div class="swatches">
          ${Object.entries(FONTS).map(([id, f]) => `
            <button class="swatch swatch-font ${prefs.font === id ? 'selected' : ''}" data-font="${id}"
              style="font-family:${f.value}">${f.label}</button>`).join('')}
        </div>
        <div class="appearance-label">Barva zvýraznění</div>
        <div class="swatches">
          ${Object.entries(ACCENTS).map(([id, a]) => `
            <button class="swatch ${prefs.accent === id ? 'selected' : ''}" data-accent="${id}" title="${a.label}"
              style="background:${a.primary}"></button>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">${icon('flag')} Nahlásit problém</div>
        <p class="muted" style="font-size:13px;margin-bottom:12px">
          Našli jste chybu? Napište nám. Hlášení se uloží do složky <b>bugreporty/</b> na serveru.
          ${localReports ? `<br><span class="pill" style="margin-top:8px">${localReports} lokálních hlášení</span>` : ''}
        </p>
        <button class="btn btn-primary btn-block" data-action="bugreport">${icon('flag')} Napsat hlášení</button>
      </div>

      <p class="version">Rodina pro telefon · verze 1.1</p>
    </div>`;
}

export function mount() {
  document.querySelector('[data-action="profile"]').addEventListener('click', () => {
    const p = getProfile();
    openModal('Upravit profil', `
      <form id="profile-form" class="form">
        <div class="field"><label for="profile-name">Vaše jméno</label>
          <input id="profile-name" name="name" type="text" value="${escapeHtml(p.name)}" required></div>
        <label class="field-label">Váš avatar</label>
        ${avatarPicker(p.avatar)}
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>Zrušit</button>
          <button type="submit" class="btn btn-primary">Uložit</button>
        </div>
      </form>`, (box) => {
      bindAvatarPicker(box);
      box.querySelector('#profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        updateProfile({
          name: e.currentTarget.elements.name.value.trim() || 'Já',
          avatar: e.currentTarget.elements.avatar.value
        });
        closeModal();
        rerender();
        toast('Profil byl uložen.');
      });
    });
  });

  document.querySelectorAll('[data-action="add-member"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openModal('Přidat člena rodiny', `
        <form id="member-form" class="form">
          <div class="field"><label for="member-name">Jméno</label>
            <input id="member-name" name="name" type="text" placeholder="např. Dědeček" required></div>
          <label class="field-label">Avatar</label>
          ${avatarPicker('px-person')}
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" data-close>Zrušit</button>
            <button type="submit" class="btn btn-primary">Přidat</button>
          </div>
        </form>`, (box) => {
        bindAvatarPicker(box);
        box.querySelector('#member-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const name = e.currentTarget.elements.name.value.trim();
          if (!name) return;
          await addMember({ name, avatar: e.currentTarget.elements.avatar.value });
          closeModal();
          rerender();
          toast(`${name} byl přidán do rodiny.`);
        });
      });
    });
  });

  document.querySelector('[data-action="switch-family"]').addEventListener('click', () => {
    openModal('Změnit rodinu', `
      <p class="modal-text">Odejdete ze současné rodiny a vrátíte se na přihlašovací obrazovku. Vaše místní data zůstanou v tomto zařízení.</p>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Zrušit</button>
        <button type="button" class="btn btn-danger" id="confirm-leave">Odhlásit se</button>
      </div>`, (box) => {
      box.querySelector('#confirm-leave').addEventListener('click', () => {
        leaveFamily();
        closeModal();
        navigate('home');
      });
    });
  });

  document.querySelector('[data-action="location"]').addEventListener('click', () => {
    openModal('Místo bydliště', `
      <form id="location-form" class="form">
        <p class="modal-text">Město nebo obec, podle které se zobrazí počasí.</p>
        <div class="field"><label for="location-input">Město / obec</label>
          <input id="location-input" name="location" type="text" value="${escapeHtml(getLocation())}" required></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>Zrušit</button>
          <button type="submit" class="btn btn-primary">Uložit</button>
        </div>
      </form>`, (box) => {
      box.querySelector('#location-form').addEventListener('submit', (e) => {
        e.preventDefault();
        updateLocation(e.currentTarget.elements.location.value.trim() || 'Praha');
        closeModal();
        rerender();
        toast('Místo bydliště bylo uloženo.');
      });
    });
  });

  document.querySelectorAll('[data-theme]').forEach((btn) => {
    btn.addEventListener('click', () => { setAppearance({ theme: btn.dataset.theme }); rerender(); });
  });
  document.querySelectorAll('[data-font]').forEach((btn) => {
    btn.addEventListener('click', () => { setAppearance({ font: btn.dataset.font }); rerender(); });
  });
  document.querySelectorAll('[data-accent]').forEach((btn) => {
    btn.addEventListener('click', () => { setAppearance({ accent: btn.dataset.accent }); rerender(); });
  });

  const pref = document.getElementById('pref-notifications');
  pref.addEventListener('change', () => {
    savePrefs({ notifications: pref.checked });
    toast(pref.checked ? 'Oznámení zapnuta.' : 'Oznámení vypnuta.');
  });

  document.querySelector('[data-action="bugreport"]').addEventListener('click', () => {
    openModal('Nahlásit problém', `
      <form id="bug-form" class="form">
        <div class="field"><label for="bug-type">Typ hlášení</label>
          <select id="bug-type" name="type">
            <option>Chyba v aplikaci</option>
            <option>Návrh na vylepšení</option>
            <option>Něco jiného</option>
          </select></div>
        <div class="field"><label for="bug-text">Co se stalo?</label>
          <textarea id="bug-text" name="text" rows="5" required placeholder="Popište problém,nejlépe krok za krokem…"></textarea></div>
        <div class="field"><label for="bug-contact">Kontakt (nepovinné)</label>
          <input id="bug-contact" name="contact" type="text" placeholder="e-mail nebo telefon"></div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>Zrušit</button>
          <button type="submit" class="btn btn-primary" id="bug-submit">${icon('send')} Odeslat</button>
        </div>
      </form>`, (box) => {
      box.querySelector('#bug-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const submit = box.querySelector('#bug-submit');
        submit.disabled = true;
        const result = await submitBugReport({
          type: e.currentTarget.elements.type.value,
          text: e.currentTarget.elements.text.value.trim(),
          contact: e.currentTarget.elements.contact.value.trim()
        });
        closeModal();
        rerender();
        toast(result.local
          ? 'Hlášení uloženo v tomto zařízení (server není připojen).'
          : 'Děkujeme! Hlášení bylo uloženo do složky bugreporty/.');
      });
    });
  });
}
