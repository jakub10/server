# Rodina – mobilní část aplikace

Telefonní (klientská) část – v telefonu se jen zobrazuje obsah ze serveru.
Čistý HTML/CSS/JS (ES moduly), bez buildu, jako PWA. Node 18+ nebo Python.

## Spuštění

```bash
./serve.sh 8080
# nebo: node server.js 8080          # plná funkce (povinné pro sdílenou rodinu, AI, TV)
# nebo: python3 -m http.server 8080  # jen statika – vše se ukládá lokálně v zařízení
```

`http://localhost:8080`, z telefonu `http://IP_SERVERU:8080`. PWA instalace vyžaduje HTTPS.

## Co umí

- **Přihlášení do rodiny** – **kód + heslo** (žádné výběrové tlačítko). Špatné heslo se odmítne s hláškou. Při založení zadáte i název a místo bydliště.
- **Rodina = složka na disku** – `data/rodiny/<KÓD>/` obsahuje `heslo.txt`, `nastaveni.json`, `clenove.json`, `zpravy.json`. Všechny nastavení odeslané z aplikace se ukládají do `nastaveni.json`. Dvě zařízení se stejným kódem **a heslem** uvidí stejnou rodinu a chat.
- **Stav připojení** – v Nastavení je zobrazena složka rodiny a zda je server online (offline = data jen v tomto zařízení).

> Důležité: obě zařízení musí otevřít **stejný server** (`http://IP_SERVERU:8080`). Když si každý spustí vlastní `server.js`, bude mít vlastní složku `data/rodiny/` a neshodnou se.
- **Kalendář** – měsíční grid, události se ukládají do `udalosti.json` rodiny (sdílené).
- **Fotky** – vyhledávání, nahrávání fotek i videí, lightbox. Ze spodní lišty odebrány – otevírají se z **Souborů → Fotky → Otevřít galerii**.
- **Rodinný chat** – sdílené zprávy, **výběr pixel smajlíků** (tlačítko s úsměvem), přikládání souborů.
- **Počasí** – podle lokality rodiny.
- **Soubory** – nahrávání PDF/TXT/…, vyhledávání, filtr podle typu, **samostatná kolonka Fotky** s náhledy, malá ikona u názvu souboru, tlačítko „Poslat do chatu".
- **Televize (TV)** – nová záložka:
  - oznámení na TV s volbou **důležitosti** (nízká → kritická),
  - odeslání **fotky** nebo **videa** na TV,
  - **Sdílet obrazovku** – odešle požadavek (zajišťujeme jen odeslání; zobrazení na TV obstará televize).
  - historie odeslaných příkazů v `data/tv.json`.
- **AI asistent** – Groq, odpovědi česky. Klíč v `save/groq-api-key.json`.
  Původní model `llama-3.3-70b-versatile` byl Groqem vyřazen (404) – nyní se používá
  `openai/gpt-oss-120b` s automatickým failsafe na `openai/gpt-oss-20b` a `qwen/qwen3.8-27b`.
- **Pixel art všude** – 25 připravených avatarů + **editor vlastního avataru**
  (12×12 bodů, 12 barev, uložení do `localStorage`). Smajlíky v textech se převádí na pixel art.
- **Nastavení** – profil, členové, lokalita, odhlášení, oznámení, vzhled stránky, bug report.

## Responzivita

Rozměry v %, `clamp()` pro nadpisy, media queries pro <360 px a <300 px.

## Složky

| Složka | Obsah |
| --- | --- |
| `data/rodiny/<KOD>/` | `heslo.txt`, `nastaveni.json`, `clenove.json`, `zpravy.json`, `udalosti.json` (kalendář), `avatary.json` (vlastní pixel avatary) |

V projektu je už připravená ukázková rodina **`SVOBODOVI`** se složkou
`data/rodiny/SVOBODOVI/` a heslem **`svobodovi`** (změníš ho v Nastavení → Změnit heslo rodiny).
| `data/tv.json` | příkazy pro TV |
| `bugreporty/` | hlášení chyb |
| `save/` | `groq-api-key.json` |
| `fotky/`, `soubory/` | nahrané soubory + `index.json` |

Při běhu jen na Python statickém serveru se data ukládají do `localStorage` (žádné sdílení, AI a TV nefungují).

## Struktura

```
index.html, manifest.json, sw.js, server.js, serve.sh
data/, bugreporty/, save/, fotky/, soubory/
css/styles.css, icons/icon.svg
js/
  app.js         navigace, přihlášení, zvonec, PWA
  api.js         ★ napojení na server (všechny fetch volání)
  store.js       session a lokální záloha
  appearance.js  motivy, fonty, barvy
  pixel.js       pixel avatary, editor, převod smajlíků
  ui.js          modály, toast, výběr avataru
  icons.js, utils.js
  views/         login, home, calendar, photos, chat, weather, files, tv, ai, settings
```

## Endpointy serveru

- `POST /api/rodina/join` (kód + heslo + `create`), `POST /api/rodina/state`,
  `POST /api/rodina/clen`, `POST /api/rodina/zprava`, `POST /api/rodina/profil`,
  `POST /api/rodina/lokace`, `POST /api/rodina/nastaveni`, `POST /api/rodina/heslo`,
  `POST /api/rodina/udalost` (kalendář), `POST /api/rodina/avatar` (pixel avatary)
- `POST /api/ai/chat`, `GET|POST /api/save/groq-key`
- `GET|POST /api/fotky`, `GET|POST /api/soubory`
- `GET|POST /api/tv`
- `GET|POST /api/bugreport`

`API_BASE` v `js/api.js` nastavte **včetně `/api`** (např. `/api`).

Citlivý soubor `save/groq-api-key.json` nedávejte do veřejného repozitáře.
