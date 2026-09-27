import { render, screen, within } from "@/test-utils";

import ForumPage from "@/app/[locale]/forum/page";
import { ConsensusCluster } from "@/components/forum/ConsensusCluster";
import { ForumResults } from "@/components/forum/ForumResults";

// The page's vote engine and results card call the API; answer with no votes.
jest.mock("@/lib/forum/client", () => ({
  sendVote: jest.fn(async () => true),
  clearVotes: jest.fn(async () => true),
  loadSuggestions: jest.fn(async () => []),
  submitStatement: jest.fn(async () => "sent"),
}));
const mockFetch = jest.fn();
beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset().mockResolvedValue({ ok: true, json: async () => ({ rows: [] }) });
  global.fetch = mockFetch as unknown as typeof fetch;
});

// Renders the page and waits for its results card to finish loading.
async function renderPage() {
  render(<ForumPage params={{ locale: "en" }} />);
  await screen.findByTestId("progress");
}

describe("Forum page", () => {
  it("leads with the psychological safety message", async () => {
    await renderPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your voice belongs here");
    expect(
      screen.getByText("Technology works best when everyone participates in shaping it.")
    ).toBeInTheDocument();
  });

  it("no longer shows the preview notice, now that votes and suggestions are live", async () => {
    await renderPage();
    expect(screen.queryByTestId("preview-notice")).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/preview|not sent/i);
  });

  it("says what a vote stores, where, and how to delete it, before the voting card", async () => {
    await renderPage();
    const note = screen.getByTestId("vote-privacy");
    expect(note).toHaveTextContent("a random code saved in your browser");
    expect(note).toHaveTextContent("We don't store your name, email, or IP address");
    expect(note).toHaveTextContent("Frankfurt, Germany");
    expect(note).toHaveTextContent("“Clear my votes” deletes them.");
    const toolbar = screen.getByRole("toolbar", { name: "Your vote" });
    expect(note.compareDocumentPosition(toolbar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("lists the five principles of constructive dialogue in order", async () => {
    await renderPage();
    const list = screen.getByRole("region", { name: "Follow five principles of constructive dialogue" });
    const names = within(list).getAllByRole("listitem").map((li) => li.querySelector("strong")!.textContent);
    expect(names).toEqual([
      "Critique ideas, never people",
      "Assume good faith",
      "Positivity with substance",
      "Ethics and transparency",
      "Lift while you climb",
    ]);
  });

  it("shows the civil discourse notice", async () => {
    await renderPage();
    expect(
      screen.getAllByText(/Your input is reviewed for civil discourse standards\. We critique ideas, not people\./).length
    ).toBeGreaterThan(0);
  });

  it("shows the feedback loop card without claiming results that do not exist", async () => {
    await renderPage();
    const card = screen.getByRole("region", { name: "We asked, you said, we did" });
    expect(within(card).getByText("We asked")).toBeInTheDocument();
    expect(within(card).getByText(/^No results yet/)).toBeInTheDocument();
    expect(within(card).getByText(/^Nothing yet/)).toBeInTheDocument();
    expect(card).toHaveAccessibleDescription("Status: voting is open.");
  });

  it("explains results by language group, never by opinion clusters that do not exist", async () => {
    await renderPage();
    const section = screen.getByRole("region", { name: "See where people agree" });
    expect(section).toHaveTextContent("Votes are grouped by the language people vote in.");
    expect(section).not.toHaveTextContent(/grouped by how they vote|example/i);
  });

  it("has one h1 and action-first section headings", async () => {
    await renderPage();
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s).toEqual([
      "Follow five principles of constructive dialogue",
      "Vote on 8 statements",
      "Add a statement of your own",
      "See where people agree",
      "Track what changes because of you",
    ]);
  });
});

describe("ConsensusCluster", () => {
  const result = { id: "t2-reasons", lowest: 72, groups: [
    { locale: "en" as const, agree: 88, votes: 40 },
    { locale: "it" as const, agree: 72, votes: 25 },
  ] };

  it("states the rules and the vote count before any result", () => {
    render(<ConsensusCluster items={[]} progress={{ votes: 0, languages: 0 }} />);
    const card = screen.getByRole("region", { name: "Where groups agree" });
    expect(card).toHaveTextContent(
      "only when at least 2 language groups each have 20 or more votes on it, and every one of those groups agrees at 60% or more. Passes are not counted."
    );
    expect(screen.getByTestId("progress")).toHaveTextContent("No votes have been counted yet.");
    expect(screen.getByText("No statement has broad agreement yet.")).toBeInTheDocument();
  });

  it("shows the lowest group's percent, and each group's percent and vote count in text", () => {
    render(<ConsensusCluster items={[result]} progress={{ votes: 70, languages: 2 }} />);
    expect(screen.getByTestId("progress")).toHaveTextContent("70 votes counted so far, from 2 languages.");
    expect(screen.getByText("At least 72% agree in every language group:").parentElement).toHaveTextContent(
      "When software helps make a decision about you, you should get the top reasons in plain language."
    );
    expect(screen.getByText("88% agree, 40 votes")).toBeInTheDocument();
    expect(screen.getByText("72% agree, 25 votes")).toBeInTheDocument();
    expect(screen.getByText("Italiano")).toHaveAttribute("lang", "it");
  });

  it("uses singular words for one vote from one language", () => {
    render(<ConsensusCluster items={[]} progress={{ votes: 1, languages: 1 }} />);
    expect(screen.getByTestId("progress")).toHaveTextContent("1 vote counted so far, from 1 language.");
  });
});

describe("ForumResults", () => {
  const rows = (agreeEn: number, agreeIt: number) => [
    { statementId: "t1-disclose", locale: "en", agree: agreeEn, disagree: 20 - agreeEn, pass: 3 },
    { statementId: "t1-disclose", locale: "it", agree: agreeIt, disagree: 20 - agreeIt, pass: 0 },
  ];

  it("says it is loading, then shows live results from the API", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ rows: rows(18, 15) }) });
    render(<ForumResults />);
    expect(screen.getByTestId("results-status")).toHaveTextContent("Loading results…");
    expect(await screen.findByText("At least 75% agree in every language group:")).toBeInTheDocument();
    expect(screen.getByTestId("progress")).toHaveTextContent("43 votes counted so far, from 2 languages.");
    expect(mockFetch).toHaveBeenCalledWith("/api/forum/results");
  });

  it("shows no result when one language group falls below the threshold", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ rows: rows(18, 11) }) });
    render(<ForumResults />);
    expect(await screen.findByText("No statement has broad agreement yet.")).toBeInTheDocument();
  });

  it("says plainly when results cannot load, and shows no numbers", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    render(<ForumResults />);
    expect(await screen.findByText("Results could not be loaded right now. Please try again later.")).toBeInTheDocument();
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument();
  });
});
