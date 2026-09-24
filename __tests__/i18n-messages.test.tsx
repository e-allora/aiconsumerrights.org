import requestConfig from "@/i18n";
import { STATEMENTS } from "@/lib/forum/statements";
import { routing } from "@/lib/i18n/routing";
import { sources } from "@/lib/sources";
import { MESSAGES } from "@/test-utils";

type Tree = { [key: string]: string | Tree };

/** Flattens {"A": {"b": "x"}} into {"A.b": "x"}. */
function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((out, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === "string" ? { ...out, [key]: v } : { ...out, ...flatten(v, key) };
  }, {});
}

const en = flatten(MESSAGES.en as unknown as Tree);
const es = flatten(MESSAGES.es as unknown as Tree);
// Keys that may be empty on purpose (an unlabeled rule; a note only Spanish needs).
const MAY_BE_EMPTY = /(rule2Label|sourcesLanguageNote)$/;
const placeholders = (s: string) => Array.from(s.matchAll(/\{(\w+)/g), (m) => m[1]).sort();
const tags = (s: string) => Array.from(s.matchAll(/<(\w+)>/g), (m) => m[1]).sort();

describe("message files", () => {
  it("use the six required namespaces", () => {
    for (const ns of ["Navigation", "Guide", "Forum", "PAUSEStrategy", "Attribution", "Common"]) {
      expect(MESSAGES.en).toHaveProperty(ns);
      expect(MESSAGES.es).toHaveProperty(ns);
    }
  });

  it("have exactly the same keys in English and Spanish", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it("have no empty translations", () => {
    for (const [k, v] of Object.entries(es)) if (!MAY_BE_EMPTY.test(k)) expect(`${k}: ${v.trim()}`).not.toBe(`${k}: `);
    for (const [k, v] of Object.entries(en)) if (!MAY_BE_EMPTY.test(k)) expect(`${k}: ${v.trim()}`).not.toBe(`${k}: `);
  });

  it("keep every {placeholder} and <tag> in both languages", () => {
    for (const key of Object.keys(en)) {
      expect({ key, p: placeholders(es[key]) }).toEqual({ key, p: placeholders(en[key]) });
      expect({ key, t: tags(es[key]) }).toEqual({ key, t: tags(en[key]) });
    }
  });

  it("include the required Spanish wording", () => {
    expect(MESSAGES.es.Common.siteName).toBe("Derechos del Consumidor frente a la IA");
    expect(MESSAGES.es.Forum.eyebrow).toBe("Foro de Voz y Visión");
    expect(MESSAGES.es.PAUSEStrategy.title).toBe("La Estrategia PAUSA");
    expect(MESSAGES.es.Forum.civility).toContain("Analizamos las ideas, no a las personas");
    expect(MESSAGES.es.Guide.explorer.steps.review.title).toBe("Solicitar revisión humana");
  });

  it("cover every forum statement, model credit, and source category", () => {
    for (const locale of routing.locales) {
      const m = MESSAGES[locale];
      for (const s of STATEMENTS) expect(m.Forum.statements).toHaveProperty([s.id]);
      for (const model of sources.models) expect(m.Attribution.models).toHaveProperty([model.id]);
      for (const c of sources.categories) expect(m.Attribution.categories).toHaveProperty([c.id]);
    }
  });

  it("keep the blameless tone in Spanish: no blame words or named companies", () => {
    const text = Object.values(es).join(" ");
    expect(text).not.toMatch(/\b(estafa|fraude|culpable|vergüenza|codicios)/i);
    expect(text).not.toMatch(/\b(OpenAI|Google|Meta|Amazon|Microsoft|Apple|Rite Aid)\b/);
  });
});

describe("PAUSE Strategy messages", () => {
  const letters = (locale: "en" | "es") =>
    Object.values(MESSAGES[locale].PAUSEStrategy.steps)
      .map((step) => step.letter)
      .join("");

  it("spell PAUSE in English and PAUSA in Spanish", () => {
    expect(letters("en")).toBe("PAUSE");
    expect(letters("es")).toBe("PAUSA");
  });

  it("start each step title with its letter", () => {
    for (const locale of ["en", "es"] as const) {
      for (const step of Object.values(MESSAGES[locale].PAUSEStrategy.steps)) {
        expect(step.title[0]).toBe(step.letter);
      }
    }
  });
});

describe("i18n.ts request config", () => {
  type Loader = (p: { requestLocale: Promise<string | undefined> }) => Promise<{ locale: string; messages: unknown }>;
  const load = requestConfig as unknown as Loader;

  it.each(routing.locales)("loads the %s message file for /%s routes", async (locale) => {
    const config = await load({ requestLocale: Promise.resolve(locale) });
    expect(config.locale).toBe(locale);
    expect(config.messages).toEqual(MESSAGES[locale]);
  });

  it("falls back to English for an unknown or missing locale", async () => {
    expect((await load({ requestLocale: Promise.resolve("fr") })).locale).toBe("en");
    expect((await load({ requestLocale: Promise.resolve(undefined) })).locale).toBe("en");
  });
});
