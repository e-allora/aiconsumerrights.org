import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/ui/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

const DESCRIPTION =
  "Why this site exists, how it keeps dialogue fair and open, and who reviews its pages.";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description: DESCRIPTION,
  path: "/about",
});

const SAFEGUARDS = [
  {
    name: "Every question leads somewhere you can see",
    text: "When forum votes change a guide or resource, the change is listed with its date. This is the \"We asked, you said, we did\" record.",
  },
  {
    name: "Statements stand on their own",
    text: "The forum has no reply threads. You vote on one short statement at a time, which leaves little room for spam or pile-ons.",
  },
  {
    name: "No barriers to taking part",
    text: "You do not need an account to vote. Pages aim for a grade 6 to 8 reading level and are built and tested against WCAG 2.2 Level AA.",
  },
  {
    name: "Common ground comes first",
    text: "Results highlight what different groups agree on, not what divides them.",
  },
  {
    name: "Fast, sturdy pages",
    text: "The guide and other pages are plain static pages, kept separate from anything interactive, so they load quickly and keep working.",
  },
];

export default function AboutPage() {
  return (
    <main id="main" className="mx-auto flex max-w-3xl flex-col gap-16 px-4 py-12 sm:py-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: `About ${SITE_NAME}`,
          url: `${SITE_URL}/about`,
          description: DESCRIPTION,
          inLanguage: "en",
        }}
      />
      <header className="flex flex-col gap-5">
        <h1>About this site</h1>
        <p className="text-xl">
          <strong>
            This site explains your rights when AI makes decisions about you, in plain language
            and without blame.
          </strong>{" "}
          It compares approaches in the US and the EU, and it invites everyone into the
          conversation.
        </p>
      </header>

      <section aria-labelledby="mission" className="flex flex-col gap-4">
        <h2 id="mission">Understand the mission</h2>
        <p>
          <strong>Make AI consumer rights easy to understand, and easy to talk about.</strong>{" "}
          People who use AI, educators, regulators, and teams that build AI all have a stake.
          This site starts from the view that each of them is acting in good faith and doing
          their best with what they know. It critiques ideas and systems, never people.
        </p>
      </section>

      <section aria-labelledby="safeguards" className="flex flex-col gap-6">
        <h2 id="safeguards">See the five safeguards</h2>
        <p>
          <strong>These rules keep the site fair, open, and hard to misuse.</strong>
        </p>
        <ol className="flex flex-col gap-4">
          {SAFEGUARDS.map((s, i) => (
            <li key={s.name} className="depth-card flex gap-4 p-5">
              <span aria-hidden="true" className="font-display text-2xl font-extrabold text-link">
                {i + 1}
              </span>
              <span className="flex flex-col gap-1">
                <strong className="font-display text-lg">{s.name}</strong>
                <span className="text-base">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="who" className="flex flex-col gap-4">
        <h2 id="who">Know who is behind it</h2>
        <p>
          <strong>Robert Sweetman runs this site.</strong> AI models helped research and draft
          it. A person reviews every page before launch. The footer on each page lists which
          models helped, which sources back the facts, and where review stands.
        </p>
        <p>
          <Link href="/sources" className="font-semibold text-link underline underline-offset-4">
            See every source and how it was checked
          </Link>
          .
        </p>
      </section>

      <section aria-labelledby="join" className="flex flex-col gap-4">
        <h2 id="join">Add your voice</h2>
        <p>
          <strong>Your view helps shape what comes next.</strong>{" "}
          <Link href="/forum" className="font-semibold text-link underline underline-offset-4">
            Vote on shared ideas in the forum
          </Link>
          . No account needed.
        </p>
      </section>
    </main>
  );
}
