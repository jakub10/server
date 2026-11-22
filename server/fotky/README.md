# fotky – nahrané fotky a videa

Sem se ukládají soubory přidané v galerii aplikace (tlačítko „Přidat fotku/video").

- `index.json` obsahuje seznam položek: `{ id, url, caption, kind, at }`
- Samotné soubory mají název podle id a příponu podle typu (`.jpg`, `.png`, `.mp4`, …)
- `kind` je `image` nebo `video` – video se v galerii zobrazí jako přehrávač.

Když aplikace běží jen přes `python3 -m http.server`, soubory se neuloží na disk,
ale aspoň do `localStorage` v tomto zařízení.
