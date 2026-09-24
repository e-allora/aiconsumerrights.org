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
const pt = flatten(MESSAGES["pt-PT"] as unknown as Tree);
const ptBR = flatten(MESSAGES["pt-BR"] as unknown as Tree);
const TRANSLATIONS = { es, "pt-PT": pt, "pt-BR": ptBR };
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

  it.each(Object.entries(TRANSLATIONS))("have exactly the same keys in English and %s", (_, messages) => {
    expect(Object.keys(messages).sort()).toEqual(Object.keys(en).sort());
  });

  it("have no empty translations", () => {
    for (const messages of [en, es, pt, ptBR]) {
      for (const [k, v] of Object.entries(messages)) {
        if (!MAY_BE_EMPTY.test(k)) expect(`${k}: ${v.trim()}`).not.toBe(`${k}: `);
      }
    }
  });

  it.each(Object.entries(TRANSLATIONS))("keep every {placeholder} and <tag> in %s", (_, messages) => {
    for (const key of Object.keys(en)) {
      expect({ key, p: placeholders(messages[key]) }).toEqual({ key, p: placeholders(en[key]) });
      expect({ key, t: tags(messages[key]) }).toEqual({ key, t: tags(en[key]) });
    }
  });

  it("include the required Spanish wording", () => {
    expect(MESSAGES.es.Common.siteName).toBe("Derechos del Consumidor frente a la IA");
    expect(MESSAGES.es.Forum.eyebrow).toBe("Foro de Voz y Visión");
    expect(MESSAGES.es.PAUSEStrategy.title).toBe("La Estrategia PAUSA");
    expect(MESSAGES.es.Forum.civility).toContain("Analizamos las ideas, no a las personas");
    expect(MESSAGES.es.Guide.explorer.steps.review.title).toBe("Solicitar revisión humana");
  });

  it("include the required Portuguese wording", () => {
    const m = MESSAGES["pt-PT"];
    expect(m.Common.siteName).toBe("Direitos do Consumidor perante a IA");
    expect(m.Home.lead).toBe("Ajuda em linguagem simples quando a IA toma decisões sobre si.");
    expect(m.Forum.eyebrow).toBe("Fórum Voz e Visão");
    expect([
      m.Forum.principles.critique,
      m.Forum.principles.goodFaith,
      m.Forum.principles.positivity,
      m.Forum.principles.ethics,
      m.Forum.principles.lift,
    ]).toEqual([
      "Critique as ideias, nunca as pessoas",
      "Presuma boa-fé",
      "Positividade com substância",
      "Ética e transparência",
      "Crescer e ajudar a crescer",
    ]);
    expect(m.PAUSEStrategy.title).toBe("A Estratégia PAUSA");
    expect(m.PAUSEStrategy.subtitle).toBe("O seu hábito diário de 5 passos perante a IA");
    expect(m.PAUSEStrategy.steps.understand.body).toBe(
      "Pergunte em que informação a ferramenta se baseia, se foi testada de forma independente e se existem enviesamentos ocultos ou interesses comerciais subjacentes."
    );
  });

  it("use Brazilian wording in pt-BR, not European", () => {
    const text = Object.values(ptBR).join(" ");
    // The five swaps requested, plus common European forms that read as foreign in Brazil.
    // "estar a" + verb ("estou a falar") is European; Brazil says "estou falando".
    expect(text).not.toMatch(/sobre si\b|palavras-passe|\bcontacto|\bfactos?\b|\bequipas?\b/i);
    expect(text).not.toMatch(/\b(estou|está|estão) a \w+(ar|er|ir)\b|\bseparador\b|\bpartilh|\bregisto\b|\brecolha\b/i);
    expect(MESSAGES["pt-BR"].Home.lead).toBe("Ajuda em linguagem simples quando a IA toma decisões sobre você.");
    for (const word of ["senhas", "contato", "fatos", "equipe", "sobre você"]) expect(text).toContain(word);
  });

  it("name every language in its own language, in every file", () => {
    for (const locale of routing.locales) {
      expect(MESSAGES[locale].Navigation.languageNames).toEqual({
        en: "English",
        es: "Español",
        "pt-PT": "Português (PT)",
        "pt-BR": "Português (BR)",
      });
    }
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

  it("keep the blameless tone in Portuguese: no blame words or named companies", () => {
    const text = [...Object.values(pt), ...Object.values(ptBR)].join(" ");
    expect(text).not.toMatch(/\b(burla|fraude|culpado|vergonha|ganancios)/i);
    expect(text).not.toMatch(/\b(OpenAI|Google|Meta|Amazon|Microsoft|Apple|Rite Aid)\b/);
  });
});

describe("Brazil's AI bill (PL 2338/2023)", () => {
  // A pending bill must never read as a right in force, in any language.
  const PENDING = { en: /still a bill/, es: /Sigue siendo un proyecto/, "pt-PT": /Continua a ser um projeto/, "pt-BR": /ainda é um projeto/ };

  it.each(Object.entries(PENDING))("is described as pending in %s", (locale, pattern) => {
    const rows = MESSAGES[locale as keyof typeof MESSAGES].Guide.compare.rows;
    expect(rows.told.br).toMatch(pattern);
    expect(rows.told.br).toContain("PL 2338/2023");
    expect(rows.changing.br).toContain("PL 2338/2023");
    expect(rows.changing.br).toMatch(/2026/);
  });
});

describe("PAUSE Strategy messages", () => {
  const letters = (locale: keyof typeof MESSAGES) =>
    Object.values(MESSAGES[locale].PAUSEStrategy.steps)
      .map((step) => step.letter)
      .join("");

  it("spell PAUSE in English and PAUSA in Spanish", () => {
    expect(letters("en")).toBe("PAUSE");
    expect(letters("es")).toBe("PAUSA");
    expect(letters("pt-PT")).toBe("PAUSA");
    expect(letters("pt-BR")).toBe("PAUSA");
  });

  it("start each step title with its letter", () => {
    for (const locale of routing.locales) {
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
