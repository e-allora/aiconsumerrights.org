# Contributing

Ideas, corrections, and fixes are welcome. One person runs this site, with AI help, so replies can take a few days.

## The quickest ways to help

- **Something is wrong or out of date.** [Open an issue](https://github.com/e-allora/aiconsumerrights.org/issues/new/choose) or email feedback@aiconsumerrights.org. Say what is wrong, why, and how to fix it if you can.
- **You can review a help page or a translation.** Lawyers, legal clinics, consumer organisations, and native speakers can write to reviewers@aiconsumerrights.org. Reviewers are named only with their permission.

## How we work together

1. Critique ideas, never people.
2. Assume good faith.
3. Pair positivity with substance.
4. Be open about AI use, cite your sources, and say what you don't know.
5. Lift while you climb.

The full values are in [docs/MISSION.md](../docs/MISSION.md).

## Rules for content

- **Every legal claim cites a source** in `lib/data/sources.json`. An unknown source id fails the build.
- **No person, company, or group is singled out.** Tests fail on blame words and on named companies.
- **Plain language.** Short sentences and everyday words.
- **All eight languages stay in step.** A test fails if a message key is missing in any language.
- **A wrong published fact gets a public entry** in `content/corrections.json` when it is fixed.

## Before you open a pull request

```bash
npm test             # unit, accessibility, i18n, and tone tests
npx tsc --noEmit     # type-check
npm run lint
npm run build
npm run audit:a11y   # real-browser WCAG 2.2 A/AA audit; needs Chromium
```

## Licences

Code you contribute is under the [MIT License](../LICENSE). Text you contribute is under [CC BY 4.0](../LICENSE-CONTENT).
