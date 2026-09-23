import type { Metadata } from "next";

import { ConsensusCluster, type ConsensusItem } from "@/components/forum/ConsensusCluster";
import { StatementSubmission } from "@/components/forum/StatementSubmission";
import { VotingEngine } from "@/components/forum/VotingEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATEMENTS, TRACKS } from "@/lib/forum/statements";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Forum",
  description: "Vote on short statements about AI and your rights, or suggest one. No account needed. Common ground is shown first.",
  path: "/forum",
});

const PRINCIPLES = [
  { name: "Critique ideas, never people", text: "Disagree with an idea as clearly as you like. Leave the person out of it." },
  { name: "Assume good faith", text: "Most people are doing their best with what they know. Ask before you assume harm." },
  { name: "Positivity with substance", text: "Encouragement and rigor work together. Be kind and be specific." },
  { name: "Ethics and transparency", text: "Say when AI helped you write something, cite your sources, and be honest about what you do not know." },
  { name: "Lift while you climb", text: "Share what you learn so the next person has an easier time." },
];

// Illustration only. The ConsensusCluster labels it as example data.
const EXAMPLE_CONSENSUS: ConsensusItem[] = [
  {
    id: "example-reasons",
    statement: "plain-language reasons build trust.",
    groups: [
      { group: "Opinion group A", agree: 91 },
      { group: "Opinion group B", agree: 86 },
      { group: "Opinion group C", agree: 87 },
    ],
  },
];

export default function ForumPage() {
  return (
    <main id="main" className="mx-auto flex max-w-5xl flex-col gap-20 px-4 py-12 sm:py-16">
      <header className="flex max-w-3xl flex-col gap-5">
        <p className="font-display text-lg font-bold text-link">Voice and vision forum</p>
        <h1>Your voice belongs here</h1>
        <p className="text-xl">
          <strong>Technology works best when everyone participates in shaping it.</strong> Vote on
          short statements, or suggest your own. No account needed.
        </p>
        <p
          data-testid="preview-notice"
          className="rounded-md border-2 border-border/20 bg-muted px-4 py-3 text-base"
        >
          <strong>This forum is in preview.</strong> Votes and statements stay in your browser.
          Nothing is sent anywhere until the forum opens.
        </p>
      </header>

      <section aria-labelledby="principles" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="principles">Follow five principles of constructive dialogue</h2>
          <p>
            <strong>These keep the forum useful for everyone.</strong> Each statement stands on
            its own, so there are no reply threads to argue in.
          </p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <li key={p.name} className="depth-card flex flex-col gap-2 p-5">
              <span aria-hidden="true" className="font-display text-2xl font-extrabold text-link">
                {i + 1}
              </span>
              <strong className="font-display text-lg">{p.name}</strong>
              <span className="text-base">{p.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="vote" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="vote">Vote on {STATEMENTS.length} statements</h2>
          <p>
            <strong>Pick Agree, Disagree, or Pass for each one.</strong> The statements cover{" "}
            {TRACKS.length} tracks: {TRACKS.map((t) => t.name.toLowerCase()).join(", ")}. Use Tab
            to reach the buttons and the arrow keys to move between them.
          </p>
          <p className="text-base text-muted-foreground">
            Your input is reviewed for civil discourse standards. We critique ideas, not people.
          </p>
        </div>
        <VotingEngine />
      </section>

      <section aria-labelledby="suggest" className="flex max-w-3xl flex-col gap-6">
        <h2 id="suggest">Add a statement of your own</h2>
        <StatementSubmission />
      </section>

      <section aria-labelledby="results" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="results">See where people agree</h2>
          <p>
            <strong>Results show common ground, not the loudest voices.</strong> People are
            grouped by how they vote, and a statement counts as broad agreement only when every
            group supports it.
          </p>
        </div>
        <ConsensusCluster items={EXAMPLE_CONSENSUS} example />
      </section>

      <section aria-labelledby="loop" className="flex flex-col gap-6">
        <div className="flex max-w-3xl flex-col gap-3">
          <h2 id="loop">Track what changes because of you</h2>
          <p>
            <strong>Every question leads to a visible outcome.</strong> This card is updated each
            time votes shape a guide or resource on this site.
          </p>
        </div>
        <Card as="section" aria-describedby="loop-status">
          <CardHeader>
            <CardTitle>We asked, you said, we did</CardTitle>
            <p id="loop-status" className="text-base text-muted-foreground">
              Status: waiting for the forum to open.
            </p>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col gap-1">
                <dt className="font-display text-lg font-bold">We asked</dt>
                <dd className="text-base">
                  {STATEMENTS.length} statements in {TRACKS.length} tracks, listed above.
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="font-display text-lg font-bold">You said</dt>
                <dd className="text-base">
                  No results yet. Areas of broad agreement will appear here once enough people
                  vote.
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="font-display text-lg font-bold">We did</dt>
                <dd className="text-base">
                  Nothing yet. Each change will be listed here with its date and a link to the
                  page it changed.
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
