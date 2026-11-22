# soubory – PDF, TXT a další soubory

Sem se ukládají soubory přidané v záložce **Soubory** (tlačítko s papírem a plusem).
Podporovány jsou libovolné typy – PDF, TXT, DOCX, XLSX, ZIP, obrázky, videa…

- `index.json` obsahuje seznam: `{ id, name, url, mime, ext, at }`
- Samotné soubory mají název `<id>.<přípona>` a jsou zde ve složce.
- Soubor lze z galerie Souborů poslat do rodinného chatu – zobrazí se jako odkaz.

Když běží jen Python statický server, soubor se uloží aspoň do `localStorage` v zařízení.
