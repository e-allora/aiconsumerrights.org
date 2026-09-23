import type { Metadata } from "next";
import Link from "next/link";

import { AlgorithmExplorer } from "@/components/guide/AlgorithmExplorer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cite } from "@/components/ui/Cite";
import { JsonLd } from "@/components/ui/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { formatDate, sources } from "@/lib/sources";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "AI you can question",
  description: "Plain-language help with chatbots, recommendations, and automated screening, with US and EU rules side by side and three calm steps to take.",
  path: "/guide",
  type: "article",
});

const TOUCHPOINTS = [
  {
    id: "chatbots",
    term: "Chatbots",
    what: "answer questions in a chat window or on the phone. They are often fast and helpful. They can also state something false with confidence.",
    ask: "Am I talking to AI? Where can I check this answer?",
    rule: (
      <>
        <strong>Law (EU).</strong> Since 2 August 2026, a chatbot must tell you it is AI, unless
        that is obvious.
        <Cite ids={["eu-ai-act-art50", "eu-ai-act"]} /> <strong>Law (US).</strong> No federal law
        requires this. Some states do, and the rules differ by state.
        <Cite ids={["ncsl-ai-database"]} />
      </>
    ),
  },
  {
    id: "recommendations",
    term: "Recommendation algorithms",
    what: "pick what you see next: videos, products, news, and ads. They learn from what you click, watch, and buy.",
    ask: "Why am I seeing this? Can I turn off personal suggestions?",
    rule: (
      <>
        <strong>Guidance.</strong> UNESCO&apos;s global standard on AI ethics says AI systems do
        not replace human responsibility, and it asks for transparency.
        <Cite ids={["unesco-ethics-2021"]} /> The US Blueprint for an AI Bill of Rights asks for
        plain notice and explanation. Neither one is binding law.
        <Cite ids={["ostp-blueprint-2022"]} />
      </>
    ),
  },
  {
    id: "screening",
    term: "Automated screening",
    what: "sorts applications for loans, jobs, apartments, and insurance. Software may score your file before a person sees it.",
    ask: "Did software help decide? What were the main reasons?",
    rule: (
      <>
        <strong>Law (US, credit).</strong> A lender that turns you down must give the specific
        main reasons.
        <Cite ids={["cfpb-reg-b"]} /> <strong>Law (EU).</strong> When a machine alone makes a
        serious decision about you, you can ask for a person to review it.
        <Cite ids={["gdpr"]} />
      </>
    ),
  },
];

const COMPARISON = [
  {
    question: "Will I be told it is AI?",
    us: <>No federal rule. Some states require it.<Cite ids={["ncsl-ai-database"]} /></>,
    eu: <>Yes, since 2 August 2026, unless it is obvious.<Cite ids={["eu-ai-act-art50"]} /></>,
  },
  {
    question: "Can I get the reasons for a decision?",
    us: <>Yes for credit: the specific main reasons.<Cite ids={["cfpb-reg-b"]} /></>,
    eu: <>You can ask for meaningful information about how an automated decision was made.<Cite ids={["gdpr"]} /></>,
  },
  {
    question: "Can a person review it?",
    us: <>No general federal right. The 2022 Blueprint recommends it, but it is not law.<Cite ids={["ostp-blueprint-2022"]} /></>,
    eu: <>Yes, when a machine alone made a decision with a legal or similarly serious effect.<Cite ids={["gdpr"]} /></>,
  },
  {
    question: "Who checks the rules?",
    us: <>The FTC says existing law has no AI exemption. The CFPB covers credit.<Cite ids={["ftc-ai-comply-2024", "cfpb-reg-b"]} /></>,
    eu: <>National authorities in each EU country.<Cite ids={["eu-ai-act"]} /></>,
  },
  {
    question: "What is changing?",
    us: <>A December 2025 executive order calls for one national approach and a review of state AI laws.<Cite ids={["eo-14365-2025"]} /></>,
    eu: <>Rules for high-risk AI, like hiring and credit, now start on 2 December 2027.<Cite ids={["eu-digital-omnibus-2026"]} /></>,
  },
];

const STAKEHOLDERS = [
  { who: "People using AI", text: "want fair answers and a simple way to ask questions." },
  { who: "Educators", text: "are teaching new skills quickly, often with few resources." },
  { who: "Regulators", text: "weigh safety against new ideas, and good rules take time to write." },
  { who: "Teams that build AI", text: "often want feedback. A clear, specific question helps them fix real problems." },
];

export default function GuidePage() {
  return (
    <main id="main" className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-12 sm:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "AI you can question",
          description:
            "Plain-language explanations of everyday AI, with US and EU rules compared side by side and three calm steps to take when a decision seems wrong.",
          url: `${SITE_URL}/guide`,
          inLanguage: "en",
          dateModified: sources.checkedOn,
          publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
          about: ["Consumer rights", "Automated decision-making", "EU AI Act", "Human review"],
        }}
      />
      <header className="flex max-w-3xl flex-col gap-5">
        <p className="font-display text-lg font-bold text-link">The guide</p>
        <h1>AI you can question</h1>
        <p className="text-xl">
          <strong>
            AI now helps make many everyday decisions. You can ask how it works, ask for a
            person, and talk it through.
          </strong>{" "}
          This page shows you how, with the rules in the US and the EU side by side.
        </p>
        <p className="text-base text-muted-foreground">
          Facts checked on {formatDate(sources.checkedOn)}. General information, not legal
          advice. Laws differ by place. For anything involving significant money, health,
          housing, or legal status, talk to a lawyer, a legal-aid office, or your consumer agency.
        </p>
      </header>

      <section aria-labelledby="touchpoints" className="flex flex-col gap-8">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="touchpoints">Spot the AI in your day</h2>
          <p>
            <strong>Three kinds of AI touch most people&apos;s lives.</strong> Each one is easier
            to question once you know its name.
          </p>
        </div>
        <ul className="grid gap-6 md:grid-cols-3">
          {TOUCHPOINTS.map((t) => (
            <li key={t.id} className="flex">
              <Card interactive className="flex w-full flex-col">
                <CardHeader>
                  <CardTitle>{t.term}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 text-base">
                  <p>
                    <strong>{t.term}</strong> {t.what}
                  </p>
                  <p>
                    <strong>Ask:</strong> &ldquo;{t.ask}&rdquo;
                  </p>
                  <p className="mt-auto border-t-2 border-border/10 pt-4">{t.rule}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="compare" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="compare">Compare the rules in the US and the EU</h2>
          <p>
            <strong>Both places want AI that people can trust.</strong> They take different
            routes. The US mostly applies existing laws, one sector and one state at a time. The
            EU passed one broad AI law and pairs it with its privacy law.
          </p>
        </div>
        <div className="depth-card overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-base">
            <caption className="sr-only">
              US and EU rules compared, as of {formatDate(sources.checkedOn)}
            </caption>
            <thead>
              <tr className="border-b-2 border-border/15">
                <th scope="col" className="p-4 font-display">Your question</th>
                <th scope="col" className="p-4 font-display">United States</th>
                <th scope="col" className="p-4 font-display">European Union</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.question} className="border-b border-border/10 last:border-0 align-top">
                  <th scope="row" className="p-4 font-bold">{row.question}</th>
                  <td className="p-4">{row.us}</td>
                  <td className="p-4">{row.eu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="steps" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="steps">Take three calm steps when a decision seems wrong</h2>
          <p>
            <strong>Start small and stay specific.</strong> Most problems get fixed at step one.
            Use the arrow keys or tap a step to move between them.
          </p>
        </div>
        <AlgorithmExplorer />
      </section>

      <section aria-labelledby="everyone" className="flex max-w-3xl flex-col gap-5">
        <h2 id="everyone">See every side of the table</h2>
        <p>
          <strong>Most people in this story are trying to do right by others.</strong> A
          question asked in good faith usually gets a better answer.
        </p>
        <ul className="flex flex-col gap-3">
          {STAKEHOLDERS.map((s) => (
            <li key={s.who}>
              <strong>{s.who}</strong> {s.text}
            </li>
          ))}
        </ul>
        <p>
          <strong>Research (2026).</strong> Experts and the public often see AI differently.
          Stanford&apos;s AI Index found a 50-point gap between them on how AI will affect jobs.
          <Cite ids={["stanford-ai-index-2026"]} /> In a Pew survey of 5,119 US adults, most said
          AI is moving too fast.
          <Cite ids={["pew-2026"]} /> Honest questions help close gaps like these.
        </p>
        <p>
          <strong>Add your voice.</strong>{" "}
          <Link href="/forum" className="font-semibold text-link underline underline-offset-4">
            Vote on shared ideas in the forum
          </Link>
          . No account needed.
        </p>
      </section>
    </main>
  );
}
