# Public logs

Two files here are shown on the site exactly as written. Nothing generates them.

| File | Shown on | What goes in it |
| --- | --- | --- |
| `corrections.json` | How this site works, under "Corrections" | Something on the site was wrong, and it was fixed |
| `we-did.json` | Forum, in the "We did" column | Something changed because of forum votes |

## Add a correction

Copy this into the `entries` list in `corrections.json`. Order doesn't matter; the site shows the newest first.

```json
{
  "id": "2026-10-01-short-name",
  "date": "2026-10-01",
  "page": "/guide",
  "wrong": { "en": "What the page said, and why it was wrong." },
  "changed": { "en": "What it says now." },
  "flaggedBy": "Only if the person asked to be credited",
  "commit": "abc1234"
}
```

- `date` is the day the fix went live.
- `page` is the page's path without the language: `/`, `/guide`, `/forum`, `/sources`, `/about`, `/how-it-works`, `/help`, or a help guide such as `/help/credit`.
- Leave out `flaggedBy` unless the person asked for credit. Leave out `commit` if there isn't one.
- English is required. Add `"es"`, `"pt-PT"`, `"pt-BR"`, `"it"`, `"fr"`, `"de"` or `"hi"` next to `"en"` when you have a translation. Until then, that language shows the English text, marked as English.

## Add a "We did" entry

```json
{
  "id": "2026-10-01-short-name",
  "date": "2026-10-01",
  "page": "/guide",
  "did": { "en": "What changed, in one or two sentences." },
  "statements": ["t1-disclose"],
  "commit": "abc1234"
}
```

`statements` lists the forum statement ids whose results led to the change. The ids are in `lib/forum/statements.ts`.

Then run `npm test`. A test checks every entry: date format, page, commit, and statement ids.
