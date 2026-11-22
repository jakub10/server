export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const MONTHS = [
  'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'
];
export const MONTHS_SHORT = ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čvn', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro'];
export const DAYS_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

// Pondělí = 0
export function mondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Dobrou noc';
  if (h < 11) return 'Dobré ráno';
  if (h < 18) return 'Dobrý den';
  return 'Dobrý večer';
}

export function longDate(date = new Date()) {
  return `${date.getDate()}. ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function timeLabel(value) {
  const d = new Date(value);
  const now = new Date();
  if (sameDay(d, now)) return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  if (d.getFullYear() === now.getFullYear()) return `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`;
  return d.toLocaleDateString('cs-CZ');
}
