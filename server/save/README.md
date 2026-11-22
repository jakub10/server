# save – uložené klíče a nastavení

Sem se ukládá **Groq API klíč** z obrazovky AI asistentu (tlačítko „Nastavit klíč").

- Soubor: `save/groq-api-key.json`
- Tvar: `{ "key": "gsk_...", "updatedAt": "2026-..." }`
- Klíč se z prohlížeče **neposílá přímo na Groq** – aplikace volá `POST /api/ai/chat`
  na tento server a server ho doplní z tohoto souboru. Klíč tedy neopouští server.

Klíč sem můžete také vložit ručně – stačí upravit `save/groq-api-key.json`:

```json
{
  "key": "vlozte_svuj_groq_api_key",
  "updatedAt": "2026-11-21T00:00:00.000Z"
}
```

 pozor: soubor obsahuje citlivé údaje – nedávejte ho do veřejného repozitáře.
