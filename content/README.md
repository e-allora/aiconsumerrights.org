# Public logs

Three files here are shown on the site exactly as written. Nothing generates them.

| File | Shown on | What goes in it |
| --- | --- | --- |
| `corrections.json` | How this site works, under "Corrections" | Something on the site was wrong, and it was fixed |
| `we-did.json` | Forum, in the "We did" column | Something changed because of forum votes |
| `reviews.json` | Each help guide, in the part that was reviewed, and How this site works, under "Reviewing a page" | Someone who works in the field reviewed one part of one help guide |

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

## Add a review

Add an entry only after the reviewer has said yes, in writing, to the exact words that will appear. Send them the line first. If they would rather not be mentioned at all, add nothing.

```json
{
  "id": "2026-10-20-credit-us",
  "date": "2026-10-20",
  "guide": "credit",
  "region": "us",
  "language": "en",
  "scope": { "en": "The US rights and the letter." },
  "credit": { "as": "name", "name": "Their name", "organisation": "Their clinic", "url": "https://example.org" }
}
```

- `guide` is the help guide: `credit`, `job`, `housing`, `insurance`, `chatbot`, `account` or `deepfake`.
- `region` is the part they reviewed: `us`, `uk`, `eu`, `br`, `in` or `other`.
- `language` is the language of the page they read, such as `en`, `it` or `pt-BR`.
- `scope` says what they looked at, in one short sentence. English is required; add other languages next to `"en"` when you have them.
- `credit` is how they chose to be named. Use one of these:
  - by name: `{ "as": "name", "name": "…", "organisation": "…", "url": "https://…" }` (`organisation` and `url` are optional);
  - as an organisation: `{ "as": "organisation", "organisation": "…", "url": "https://…" }` (`url` is optional);
  - without a name: `{ "as": "anonymous", "description": { "en": "A consumer-law clinic in the United States" } }`.

A review covers only the part named. The site says so next to every entry, and it never presents a review as approval of the rest.

Then run `npm test`. A test checks every entry: date format, page, commit, statement ids, and for reviews the guide, region, language, and credit.
