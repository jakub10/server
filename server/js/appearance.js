import { getPrefs, savePrefs } from './store.js';

export const THEMES = {
  light: { label: 'Světlé', bg: '#eef1f8', surface: '#ffffff', surface2: '#f7f8fc', text: '#1f2540', muted: '#8b93ab', line: '#eceef5' },
  dark:  { label: 'Tmavé',  bg: '#141829', surface: '#222840', surface2: '#2b3350', text: '#eef1ff', muted: '#9aa3c4', line: '#343c5a' },
  warm:  { label: 'Teplé',  bg: '#fdf1e6', surface: '#fffaf4', surface2: '#f9ecdf', text: '#3d2b22', muted: '#a3897a', line: '#f0dfd2' },
  mint:  { label: 'Mátové', bg: '#e8f5ef', surface: '#fbfffd', surface2: '#eef8f3', text: '#1d3a30', muted: '#7f9d91', line: '#d9ebe2' }
};

export const FONTS = {
  system: { label: 'Systémové', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" },
  rounded: { label: 'Zaoblené', value: "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif" },
  serif: { label: 'Serifové', value: "Georgia, 'Times New Roman', serif" },
  mono: { label: 'Monospace', value: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }
};

export const ACCENTS = {
  indigo: { label: 'Modrá', primary: '#5b67f0', dark: '#4551d6', soft: '#eef0ff' },
  coral:  { label: 'Korálová', primary: '#ff7a59', dark: '#e55c3d', soft: '#fff0ea' },
  green:  { label: 'Zelená', primary: '#27ae60', dark: '#1e8f4e', soft: '#e7f8ef' },
  purple: { label: 'Fialová', primary: '#9b6bdf', dark: '#7d4fc0', soft: '#f3ebff' }
};

/** Použije uložený vzhled na celou stránku. Volá se při startu i po změně. */
export function applyAppearance() {
  const prefs = getPrefs();
  const theme = THEMES[prefs.theme] || THEMES.light;
  const font = FONTS[prefs.font] || FONTS.system;
  const accent = ACCENTS[prefs.accent] || ACCENTS.indigo;
  const root = document.documentElement.style;

  root.setProperty('--bg', theme.bg);
  root.setProperty('--surface', theme.surface);
  root.setProperty('--surface-2', theme.surface2);
  root.setProperty('--text', theme.text);
  root.setProperty('--muted', theme.muted);
  root.setProperty('--line', theme.line);
  root.setProperty('--app-font', font.value);
  root.setProperty('--primary', accent.primary);
  root.setProperty('--primary-dark', accent.dark);
  root.setProperty('--primary-soft', accent.soft);

  document.body.style.background = theme.bg;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', accent.primary);
}

export function setAppearance(patch) {
  savePrefs(patch);
  applyAppearance();
}
