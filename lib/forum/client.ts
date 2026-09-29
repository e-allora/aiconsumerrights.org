// Browser calls to the forum API. Each resolves to true on success and
// false on any failure, so a network problem never breaks the page.

const VOTE_URL = "/api/forum/vote";

export async function sendVote(statementId: string, vote: string, locale: string): Promise<boolean> {
  try {
    const res = await fetch(VOTE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statementId, vote, locale }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function clearVotes(): Promise<boolean> {
  try {
    const res = await fetch(VOTE_URL, { method: "DELETE" });
    return res.ok;
  } catch {
    return false;
  }
}

export type SubmitResult = "sent" | "contact" | "busy" | "failed";

/** Sends a suggestion for review. "contact" means it had a link, email, handle, or phone number. */
export async function submitStatement(text: string, locale: string): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/forum/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, locale }),
    });
    if (res.ok) return "sent";
    if (res.status === 422) return "contact";
    return res.status === 429 ? "busy" : "failed";
  } catch {
    return "failed";
  }
}

/** Approved suggestions for a language. An empty list on any failure. */
export async function loadSuggestions(locale: string): Promise<{ id: string; text: string }[]> {
  try {
    const res = await fetch(`/api/forum/suggestions?locale=${encodeURIComponent(locale)}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { statements?: unknown };
    return Array.isArray(data.statements) ? (data.statements as { id: string; text: string }[]) : [];
  } catch {
    return [];
  }
}
