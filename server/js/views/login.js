import { icon } from '../icons.js';
import { DEMO_FAMILIES, joinFamily } from '../api.js';
import { navigate } from '../app.js';
import { avatarPicker, bindAvatarPicker, toast } from '../ui.js';
import { escapeHtml } from '../utils.js';

export const title = 'Přihlášení';

let mode = 'join';

export async function render() {
  return `
    <div class="login-screen">
      <div class="login-top">
        <div class="login-logo">${icon('heart')}</div>
        <h1>Rodina</h1>
        <p>Kalendář, fotky, chat i počasí.<br>Vše pro vaši rodinu na jednom místě.</p>
      </div>

      <form class="login-card ${mode === 'create' ? 'creating' : ''}" id="login-form">
        <div class="mode-switch">
          <button type="button" class="mode-btn ${mode === 'join' ? 'active' : ''}" data-mode="join">Připojit se</button>
          <button type="button" class="mode-btn ${mode === 'create' ? 'active' : ''}" data-mode="create">Založit rodinu</button>
        </div>

        <div class="login-step" style="margin-top:20px">1. Vaše rodina</div>
        <div class="field create-only">
          <label for="family-name">Název rodiny</label>
          <input id="family-name" name="familyName" type="text" placeholder="např. Rodina Novákových">
        </div>
        <div class="field">
          <label for="family-code" id="code-label">Kód rodiny</label>
          <input id="family-code" name="familyId" type="text" placeholder="např. RODINA-2026" required autocomplete="organization">
        </div>
        <div class="family-chips">
          ${DEMO_FAMILIES.map((f) => `
            <button type="button" class="family-chip" data-code="${escapeHtml(f.id)}" data-name="${escapeHtml(f.name)}">
              ${icon('usersSmall')} <span>${escapeHtml(f.name)}</span>
            </button>`).join('')}
        </div>

        <div class="login-step" style="margin-top:24px">2. Kde bydlíte?</div>
        <p class="login-hint">Podle místa se zobrazí přesnější počasí.</p>
        <div class="field">
          <label for="family-location">Město nebo obec</label>
          <input id="family-location" name="location" type="text" placeholder="např. Brno" value="Praha" required autocomplete="address-level2">
        </div>

        <div class="login-step" style="margin-top:24px">3. Jak se jmenujete?</div>
        <div class="field">
          <label for="user-name">Vaše jméno</label>
          <input id="user-name" name="userName" type="text" placeholder="např. Mamka" required autocomplete="given-name">
        </div>
        <label class="field-label">Váš avatar</label>
        ${avatarPicker('px-boy')}

        <button type="submit" class="btn btn-primary btn-block login-submit" id="login-submit">
          Připojit se k rodině ${icon('chevronRight')}
        </button>
        <p class="login-foot">${icon('info')} Údaje se ukládají do tohoto zařízení. Změnit je můžete v nastavení.</p>
      </form>
    </div>`;
}

export function mount() {
  mode = 'join';
  bindAvatarPicker(document);

  const card = document.getElementById('login-form');
  const codeInput = document.getElementById('family-code');
  const submit = document.getElementById('login-submit');

  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      card.classList.toggle('creating', mode === 'create');
      document.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b === btn));
      document.getElementById('code-label').textContent = mode === 'create' ? 'Kód nové rodiny' : 'Kód rodiny';
      submit.innerHTML = (mode === 'create' ? 'Založit rodinu' : 'Připojit se k rodině') + icon('chevronRight');
      document.getElementById('family-name').required = mode === 'create';
      if (mode === 'create') {
        document.querySelectorAll('[data-code]').forEach((c) => c.classList.remove('selected'));
        codeInput.value = '';
        codeInput.dataset.name = '';
      }
    });
  });

  document.querySelectorAll('[data-code]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('[data-code]').forEach((c) => c.classList.remove('selected'));
      chip.classList.add('selected');
      codeInput.value = chip.dataset.code;
      codeInput.dataset.name = chip.dataset.name;
    });
  });

  card.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const familyId = codeInput.value.trim();
    if (!familyId) return;
    const selected = document.querySelector('[data-code].selected');
    const familyName = mode === 'create'
      ? (form.elements.familyName.value.trim() || familyId)
      : (selected?.dataset.name || codeInput.dataset.name || familyId);
    await joinFamily({
      familyId,
      familyName,
      location: form.elements.location.value.trim() || 'Praha',
      userName: form.elements.userName.value.trim() || 'Já',
      userAvatar: form.elements.avatar.value || 'px-boy'
    });
    toast(mode === 'create' ? `Rodina ${familyName} byla založena!` : `Vítejte v rodině ${familyName}!`);
    navigate('home');
  });
}
