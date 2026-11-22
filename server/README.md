# Rodina – mobilní část aplikace

Telefonní (klientská) část aplikace – v telefonu se jen zobrazuje obsah ze serveru
(kalendář, fotky, chat, počasí, soubory, AI). Technologie: čistý HTML/CSS/JS
(ES moduly), bez buildu a závislostí, jako PWA. Běží na Linuxu (Node 18+ nebo Python).

## Spuštění

```bash
./serve.sh 8080
# nebo: node server.js 8080          # plná funkce: AI, klíče, fotky, soubory, bug reporty
# nebo: python3 -m http.server 8080  # jen statika – data se ukládají lokálně v zařízení
```

`http://localhost:8080`, z telefonu `http://IP_SERVERU:8080`. PWA instalace vyžaduje HTTPS.

## Co umí

- **Přihlášení / založení rodiny** – přepínač *Připojit se* / *Založit rodinu*,
  kód a název rodiny, **místo bydliště** (použije se pro počasí), jméno a avatar.
  Lokalitu jde změnit v Nastavení.
- **Kalendář** – měsíční grid, přidávání událostí.
- **Fotky** – vyhledávání, nahrávání fotek i videí, lightbox s přehráváním.
- **Rodinný chat** – zprávy, **přikládání libovolných souborů** (papírová sponka).
- **Počasí** – město ze zadané lokality, předpověď, detaily.
- **Soubory** – nová záložka: PDF, TXT, DOCX, ZIP, obrázky, videa…
  - vyhledávání podle názvu, **filtr podle typu** (Vše / Fotky / Videa / PDF / Text / Ostatní),
  - tlačítko **„Poslat do chatu"** – soubor se přiloží jako odkaz ke zprávě.
- **AI asistent** – záložka AI, píšete co chcete doprogramovat; odpovědi přes Groq.
  Klíč se ukládá do `save/groq-api-key.json` (tlačítkem v AI nebo ručně).
- **Pixel art všude** – 13 pixelových avatarů a pixelové obrázky místo všech smajlíků
  v chatu, popiscích, počasí i pozdravu. Smajlíky přicházející ze serveru se také
  automaticky převedou na pixel art (`renderText()` v `js/pixel.js`).
- **Nastavení** – profil (pixel-art avatary), členové rodiny, lokalita, odhlášení,
  oznámení, **vzhled celé stránky** (pozadí, styl písma, barva zvýraznění) a bug report.
- **Zvonec** vpravo nahoře – seznam oznámení, odstraní červený badge.

## Responzivita

Rozvržení používá **procenta** (paddingy, mezery, poloměry, šířky) a `clamp()` pro
nadpisy. Spodní lišta i horní lišta se přizpůsobí šířce obrazovky;
pro displeje pod 360 px a 300 px jsou v CSS samostatné media queries.

## Složky pro data

| Složka | Obsah |
| --- | --- |
| `bugreporty/` | hlášení chyb jako `.json` |
| `save/` | `groq-api-key.json` – Groq API klíč |
| `fotky/` | fotky a videa + `index.json` |
| `soubory/` | ostatní soubory (PDF, TXT, …) + `index.json` |

Při běhu jen na Python statickém serveru se vše ukládá do `localStorage` v zařízení.

## Struktura

```
index.html, manifest.json, sw.js, server.js, serve.sh
bugreporty/, save/, fotky/, soubory/
css/styles.css
icons/icon.svg
js/
  app.js         navigace, přihlášení, zvonec, PWA
  api.js         ★ napojení na server – demo data + fetch šablony
  store.js       session, profil, události, členové, fotky, soubory, klíč
  appearance.js  motivy, fonty, barvy (CSS proměnné)
  pixel.js       pixel-art avatary
  ui.js          modály, toast, přílohy, výběr avataru
  icons.js, utils.js
  views/         login, home, calendar, photos, chat, weather, files, ai, settings
```

## Napojení na server (pro druhou AI)

Vše je v **`js/api.js`**; `API_BASE` nastavte **včetně `/api`**
(např. `/api` nebo `https://server.example.com/api`). Endpointy, které `server.js` už má:

- `POST /api/bugreport` → `bugreporty/`
- `GET|POST /api/save/groq-key` → `save/groq-api-key.json`
- `POST /api/ai/chat` → Groq (`model` přes proměnnou `GROQ_MODEL`)
- `GET|POST /api/fotky` → `fotky/`
- `GET|POST /api/soubory` → `soubory/`

Formáty:

- událost `{ id, date:"RRRR-MM-DD", time, title, place? }`
- fotka/video `{ id, url, caption, kind:"image"|"video", at? }`
- soubor `{ id, name, url, mime, ext, at }`
- zpráva `{ id, from:"me"|id_clena, text, at, attachment?:{ name, url, mime, ext } }`
- počasí `{ city, temp, feels, cond, icon, high, low, wind, humidity, rain, forecast:[…] }`
- AI `{ messages:[{ role, content }] }` → `{ ok:true, text }`

Počasí už nyní posílá město z lokality rodiny (`getLocation()`).

Soubor `save/groq-api-key.json` obsahuje citlivý klíč – nedávejte ho do veřejného repozitáře.
