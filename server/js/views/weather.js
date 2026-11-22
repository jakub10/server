import { icon } from '../icons.js';
import { getWeather } from '../api.js';
import { escapeHtml } from '../utils.js';
import { glyphHtml } from '../pixel.js';

export const title = 'Počasí';

export async function render() {
  const w = await getWeather();
  return `
    <div class="view">
      <section class="weather-now">
        <div class="city">${glyphHtml('pin')} ${escapeHtml(w.city)}</div>
        <div class="cond">${escapeHtml(w.cond)} · pocitově ${w.feels}°</div>
        <div class="weather-main">
          <div class="temp">${w.temp}<sup>°C</sup></div>
          ${icon(w.icon, 'big-icon')}
        </div>
        <div class="cond">Max ${w.high}° · Min ${w.low}°</div>
      </section>

      <div class="card">
        <div class="card-title">${icon('calendar')} Předpověď</div>
        <div class="forecast">
          ${w.forecast.map((f) => `
            <div class="forecast-day">
              <div class="d">${escapeHtml(f.day)}</div>
              ${icon(f.icon)}
              <div class="t">${f.high}° <span>${f.low}°</span></div>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">${icon('cloud')} Podrobnosti</div>
        <div class="detail-grid">
          <div class="detail">${icon('wind')}<div><div class="dv">${w.wind} km/h</div><div class="dl">Vítr</div></div></div>
          <div class="detail">${icon('drop')}<div><div class="dv">${w.humidity} %</div><div class="dl">Vlhkost</div></div></div>
          <div class="detail">${icon('umbrella')}<div><div class="dv">${w.rain} %</div><div class="dl">Šance na déšť</div></div></div>
          <div class="detail">${icon('clock')}<div><div class="dv">${new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</div><div class="dl">Aktualizováno</div></div></div>
        </div>
      </div>
    </div>`;
}

export function mount() {}
