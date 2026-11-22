# Bug reporty

Sem se ukládají hlášení z telefonní aplikace („Nahlásit problém" v Nastavení).

Když aplikaci spustíš přes `node server.js 8080` (nebo `./serve.sh`, který Node
použije, pokud je dostupný), každé odeslané hlášení se objeví v této složce jako
samostatný soubor `2026-...-xxxxx.json` s obsahem např.:

```json
{
  "id": "2026-11-21T18-30-12-345Z-ab12c",
  "receivedAt": "2026-11-21T18:30:12.345Z",
  "type": "Chyba v aplikaci",
  "text": "Po kliknutí na tlačítko se nic nestane",
  "contact": "",
  "at": "2026-11-21T18:30:12.345Z",
  "family": "RODINA-2026",
  "user": "Mamka",
  "userAgent": "Mozilla/5.0 ..."
}
```

Pokud aplikaci spustíš jen přes `python3 -m http.server`, server POST nepřijme
a hlášení se aspoň uloží lokálně v prohlížeči (localStorage). Po připojení
ostrého serveru stačí v `js/api.js` upravit `API_BASE` – cíl zůstává `/api/bugreport`.
