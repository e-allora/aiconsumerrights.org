import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { approve, recheck, remove } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/admin-auth";
import type { Precheck } from "@/lib/forum/precheck";
import { listSubmissions, type Submission } from "@/lib/forum/submissions";

export const dynamic = "force-dynamic";

const LANGUAGES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  "pt-PT": "Portuguese (Portugal)",
  "pt-BR": "Portuguese (Brazil)",
  it: "Italian",
};

const MODEL_NAMES: Record<string, string> = {
  "mistralai/mistral-small-2603": "Mistral Small",
  "google/gemini-2.5-flash-lite": "Gemini 2.5 Flash-Lite (backup)",
};

const FLAGS: [keyof Omit<Precheck, "english">, string][] = [
  ["namesCompany", "Names a company or product"],
  ["namesPerson", "Names a person"],
  ["contactInfo", "Has contact or personal details"],
  ["attack", "Attacks or insults people"],
];

function CheckSummary({ item }: { item: Submission }) {
  if (!item.check) {
    return (
      <p className="font-bold">
        Not checked: the AI pre-check did not run, usually because the model was busy. Try &ldquo;Check again&rdquo;, or
        read it carefully yourself.
      </p>
    );
  }
  const raised = FLAGS.filter(([key]) => item.check![key]);
  return (
    <div className="flex flex-col gap-1">
      {item.check.model && <p className="text-sm text-muted-foreground">Checked by {MODEL_NAMES[item.check.model] ?? item.check.model}.</p>}
      {raised.length === 0 ? (
        <p>AI pre-check: no concerns.</p>
      ) : (
        <ul aria-label="AI pre-check concerns" className="flex flex-wrap gap-2">
          {raised.map(([key, label]) => (
            <li key={key} className="rounded-md border-2 border-foreground px-2 py-1 text-sm font-bold">
              {label}
            </li>
          ))}
        </ul>
      )}
      {item.locale !== "en" && (
        <p className="text-muted-foreground">
          <strong>English:</strong> {item.check.english}
        </p>
      )}
    </div>
  );
}

function Item({ item }: { item: Submission }) {
  const date = new Date(item.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  return (
    <li className="depth-card flex flex-col gap-3 p-5">
      <p className="text-sm text-muted-foreground">
        {LANGUAGES[item.locale] ?? item.locale} · {date} UTC
      </p>
      <p className="text-lg" lang={item.locale}>
        {item.text}
      </p>
      <CheckSummary item={item} />
      <div className="flex flex-wrap gap-3">
        {!item.check && (
          <form action={recheck}>
            <input type="hidden" name="id" value={item.id} />
            <Button type="submit" variant="outline">
              Check again
            </Button>
          </form>
        )}
        {item.status === "pending" && (
          <form action={approve}>
            <input type="hidden" name="id" value={item.id} />
            <Button type="submit">Approve</Button>
          </form>
        )}
        <form action={remove}>
          <input type="hidden" name="id" value={item.id} />
          <Button type="submit" variant="outline">
            {item.status === "pending" ? "Reject and delete" : "Remove from voting and delete"}
          </Button>
        </form>
      </div>
    </li>
  );
}

export default async function AdminPage() {
  // Middleware asks for the password first; this checks again.
  if (!isAdmin(headers().get("authorization"))) notFound();
  const items = await listSubmissions();
  const pending = items.filter((i) => i.status === "pending");
  const approved = items.filter((i) => i.status === "approved");
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1>Forum review</h1>
        <p>
          Approved suggestions appear on the voting card for people using the same language. Rejecting deletes the
          text; nothing is kept.
        </p>
      </header>
      <section aria-labelledby="pending" className="flex flex-col gap-4">
        <h2 id="pending">Waiting for review ({pending.length})</h2>
        {pending.length === 0 ? <p>Nothing to review.</p> : <ul className="flex flex-col gap-4">{pending.map((i) => <Item key={i.id} item={i} />)}</ul>}
      </section>
      <section aria-labelledby="approved" className="flex flex-col gap-4">
        <h2 id="approved">Approved ({approved.length})</h2>
        {approved.length === 0 ? <p>None yet.</p> : <ul className="flex flex-col gap-4">{approved.map((i) => <Item key={i.id} item={i} />)}</ul>}
      </section>
    </main>
  );
}
