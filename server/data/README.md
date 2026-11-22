# data – sdílená data

- `rodiny/<KOD>/` – jedna složka pro každou rodinu:
  - `heslo.txt` – heslo rodiny (ověřuje se při přihlášení)
  - `nastaveni.json` – název, lokalita a nastavení odeslaná z aplikace
  - `clenove.json` – členové rodiny
  - `zpravy.json` – sdílený chat
- `tv.json` – historie příkazů odeslaných na televizi.

Rodina se založí zadáním kódu + hesla; složka vznikne automaticky. Přihlášení
projde jen se správným kódem **i** heslem. Všechna zařízení musí používat stejný
server, jinak mají každé svou vlastní složku `data/rodiny/`.
