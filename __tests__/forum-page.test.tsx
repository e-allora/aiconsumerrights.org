import { render, screen, within } from "@testing-library/react";

import ForumPage from "@/app/forum/page";
import { ConsensusCluster, BROAD_AGREEMENT } from "@/components/forum/ConsensusCluster";

beforeEach(() => localStorage.clear());

describe("Forum page", () => {
  it("leads with the psychological safety message", () => {
    render(<ForumPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Your voice belongs here");
    expect(
      screen.getByText("Technology works best when everyone participates in shaping it.")
    ).toBeInTheDocument();
  });

  it("says plainly that the forum is a preview and nothing is sent", () => {
    render(<ForumPage />);
    expect(screen.getByTestId("preview-notice")).toHaveTextContent("Nothing is sent anywhere");
  });

  it("lists the five principles of constructive dialogue in order", () => {
    render(<ForumPage />);
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

  it("shows the civil discourse notice", () => {
    render(<ForumPage />);
    expect(
      screen.getAllByText(/Your input is reviewed for civil discourse standards\. We critique ideas, not people\./).length
    ).toBeGreaterThan(0);
  });

  it("shows the feedback loop card without claiming results that do not exist", () => {
    render(<ForumPage />);
    const card = screen.getByRole("region", { name: "We asked, you said, we did" });
    expect(within(card).getByText("We asked")).toBeInTheDocument();
    expect(within(card).getByText(/^No results yet/)).toBeInTheDocument();
    expect(within(card).getByText(/^Nothing yet/)).toBeInTheDocument();
    expect(card).toHaveAccessibleDescription("Status: waiting for the forum to open.");
  });

  it("labels the consensus numbers as example data before any number", () => {
    render(<ForumPage />);
    const cluster = screen.getByRole("region", { name: "Where groups agree" });
    const banner = within(cluster).getByTestId("example-banner");
    expect(banner).toHaveTextContent("Example data. No votes have been counted yet.");
    const text = cluster.textContent!;
    expect(text.indexOf("Example data")).toBeLessThan(text.search(/\d+%/));
  });

  it("has one h1 and action-first section headings", () => {
    render(<ForumPage />);
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
  const item = (agree: number[]) => ({
    id: "x",
    statement: "reasons help.",
    groups: agree.map((a, i) => ({ group: `Group ${i}`, agree: a })),
  });

  it("shows a statement only when every group agrees at the threshold or above", () => {
    const { rerender } = render(<ConsensusCluster items={[item([90, 80, BROAD_AGREEMENT])]} example={false} />);
    expect(screen.getByText(/of participants across all groups agree/)).toBeInTheDocument();
    rerender(<ConsensusCluster items={[item([95, 95, BROAD_AGREEMENT - 1])]} example={false} />);
    expect(screen.getByText("No statement has broad agreement yet.")).toBeInTheDocument();
  });

  it("gives every bar its number in text, not only in color", () => {
    render(<ConsensusCluster items={[item([91, 86, 87])]} example={false} />);
    for (const n of [91, 86, 87]) expect(screen.getByText(`${n}% agree`)).toBeInTheDocument();
    expect(screen.getByText("88% of participants across all groups agree")).toBeInTheDocument();
    expect(screen.queryByTestId("example-banner")).not.toBeInTheDocument();
  });
});
