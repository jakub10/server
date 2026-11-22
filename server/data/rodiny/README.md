# data/rodiny – složky jednotlivých rodin

Každá rodina má vlastní složku pojmenovanou podle svého kódu:

```
data/rodiny/SVOBODOVI/
  heslo.txt        – heslo rodiny (ukázková rodina: svobodovi)
  nastaveni.json   – název, místo bydliště a nastavení z aplikace
  clenove.json     – členové rodiny
  zpravy.json      – sdílený chat
  udalosti.json    – události kalendáře
  avatary.json     – vlastní pixel-art avatary
```

Složka vznikne při založení rodiny automaticky, chybějící soubory se doplní.
Připojení projde jen se správným kódem **a** heslem. Kalendář, členové, zprávy
i vlastní avatary se ukládají do této složky, takže je vidí všechna zařízení
připojená ke stejnému serveru.
