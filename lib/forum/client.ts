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
