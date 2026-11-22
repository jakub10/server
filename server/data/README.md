# data – sdílená data rodin a TV

- `rodiny.json` – rodiny podle kódu. Každá rodina obsahuje `name`, `location`,
  `members[]` a `messages[]`. Díky tomu se dvě zařízení se stejným kódem vidí
  ve stejné rodině a sdílejí chat.
- `tv.json` – historie příkazů odeslaných na televizi (oznámení, foto, video, sdílení obrazovky).

Kód rodiny funguje jako „heslo" – nikdo se bez něj nedostane dovnitř.
V přihlášení už proto nejsou žádné předvolené rodiny k výběru.
Soubory se vytvoří automaticky při prvním spuštění `node server.js`.
