import { act, render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";

import { VotingEngine, tally } from "@/components/forum/VotingEngine";
import { clearVotes, sendVote } from "@/lib/forum/client";
import { STATEMENTS, TRACKS } from "@/lib/forum/statements";
import { MESSAGES } from "@/test-utils";

const text = (i: number) => MESSAGES.en.Forum.statements[STATEMENTS[i].id as keyof typeof MESSAGES.en.Forum.statements];

const FOCUS_RING = ["focus-visible:ring-[3px]", "focus-visible:ring-ring", "focus-visible:ring-offset-2"];
const heading = () => screen.getByRole("heading", { level: 3 });
const btn = (name: "Agree" | "Disagree" | "Pass") => screen.getByRole("button", { name });

jest.mock("@/lib/forum/client", () => ({
  sendVote: jest.fn(async () => true),
  clearVotes: jest.fn(async () => true),
}));
const mockSend = sendVote as jest.MockedFunction<typeof sendVote>;
const mockClear = clearVotes as jest.MockedFunction<typeof clearVotes>;

beforeEach(() => {
  localStorage.clear();
  mockSend.mockReset().mockResolvedValue(true);
  mockClear.mockReset().mockResolvedValue(true);
});

describe("seed statements", () => {
  it("has 8 short statements, 2 in each of the 4 tracks, in every language", () => {
    expect(STATEMENTS).toHaveLength(8);
    expect(TRACKS.map((t) => MESSAGES.en.Forum.tracks[t])).toEqual([
      "Transparency",
      "Human agency",
      "Privacy",
      "Shared responsibility",
    ]);
    for (const t of TRACKS) expect(STATEMENTS.filter((s) => s.track === t)).toHaveLength(2);
    for (const locale of ["en", "es"] as const) {
      const all = MESSAGES[locale].Forum.statements as Record<string, string>;
      for (const s of STATEMENTS) expect(all[s.id].length).toBeLessThanOrEqual(140);
    }
  });
});

describe("VotingEngine voting", () => {
  it("shows the first statement in an isolated card", () => {
    render(<VotingEngine />);
    expect(heading()).toHaveTextContent(text(0));
    expect(screen.getByRole("region", { name: text(0) })).toHaveClass("depth-card");
    expect(screen.getByText(/Transparency · Statement 1 of 8/)).toBeInTheDocument();
  });

  it.each([
    ["Agree", "1 agree, 0 disagree, 0 pass"],
    ["Disagree", "0 agree, 1 disagree, 0 pass"],
    ["Pass", "0 agree, 0 disagree, 1 pass"],
  ] as const)("%s records the vote, increments its count, and moves to the next card", async (choice, counts) => {
    const user = userEvent.setup();
    const onVote = jest.fn();
    render(<VotingEngine onVote={onVote} />);

    await user.click(btn(choice));

    expect(onVote).toHaveBeenCalledWith(STATEMENTS[0].id, choice.toLowerCase());
    expect(screen.getByTestId("tally")).toHaveTextContent(`Your votes: ${counts}`);
    expect(screen.getByText("1 of 8 answered")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(heading()).toHaveTextContent(text(1));
    expect(heading()).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(`Recorded: ${choice}. Statement 2 of 8.`);
  });

  it("counts one vote per statement, even on a fast double click", async () => {
    const user = userEvent.setup();
    const onVote = jest.fn();
    render(<VotingEngine statements={STATEMENTS.slice(0, 1)} onVote={onVote} />);
    await user.dblClick(btn("Agree"));
    expect(onVote).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("tally")).toHaveTextContent("1 agree, 0 disagree, 0 pass");
  });

  it("ignores a second click that lands before React re-renders", () => {
    const onVote = jest.fn();
    render(<VotingEngine onVote={onVote} />);
    const agree = btn("Agree");
    act(() => {
      agree.click();
      agree.click();
    });
    expect(onVote).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("tally")).toHaveTextContent("1 agree, 0 disagree, 0 pass");
    expect(heading()).toHaveTextContent(text(1));
  });

  it("never lets tallies exceed one per statement", () => {
    expect(tally({ a: "agree", b: "agree", c: "pass" })).toEqual({ agree: 2, disagree: 0, pass: 1 });
  });

  it("walks all 8 cards, then shows a summary and can start over", async () => {
    const user = userEvent.setup();
    render(<VotingEngine />);
    const order = ["Agree", "Disagree", "Pass", "Agree", "Agree", "Pass", "Disagree", "Agree"] as const;
    for (let i = 0; i < order.length; i++) {
      expect(heading()).toHaveTextContent(text(i));
      await user.click(btn(order[i]));
    }
    expect(heading()).toHaveTextContent("Thank you. You answered every statement.");
    expect(screen.getByTestId("tally")).toHaveTextContent("4 agree, 2 disagree, 2 pass");
    expect(screen.queryByRole("button", { name: "Agree" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear my votes and start over" }));
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(heading()).toHaveTextContent(text(0));
    expect(screen.getByTestId("tally")).toHaveTextContent("0 agree, 0 disagree, 0 pass");
  });

  it("remembers votes after a reload, so a statement cannot be voted twice", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<VotingEngine />);
    await user.click(btn("Agree"));
    unmount();

    render(<VotingEngine />);
    expect(await screen.findByText("1 of 8 answered")).toBeInTheDocument();
    expect(heading()).toHaveTextContent(text(1));
  });

  it("still works when browser storage is blocked", async () => {
    const user = userEvent.setup();
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<VotingEngine />);
    await user.click(btn("Agree"));
    expect(heading()).toHaveTextContent(text(1));
    spy.mockRestore();
  });
});

describe("VotingEngine sending votes", () => {
  it("sends each vote with the page language", async () => {
    const user = userEvent.setup();
    render(<VotingEngine />, { locale: "it" });
    await user.click(screen.getByRole("button", { name: MESSAGES.it.Forum.voting.agree }));
    expect(mockSend).toHaveBeenCalledWith(STATEMENTS[0].id, "agree", "it");
    expect(screen.queryByTestId("unsent")).not.toBeInTheDocument();
  });

  it("keeps a vote that fails to send, says so, and sends it on the next visit", async () => {
    const user = userEvent.setup();
    mockSend.mockResolvedValue(false);
    const { unmount } = render(<VotingEngine />);
    await user.click(btn("Agree"));
    expect(await screen.findByTestId("unsent")).toHaveTextContent("1 vote has not been sent yet.");
    unmount();

    mockSend.mockClear().mockResolvedValue(true);
    render(<VotingEngine />);
    await waitFor(() => expect(mockSend).toHaveBeenCalledWith(STATEMENTS[0].id, "agree", "en"));
    await waitFor(() => expect(screen.queryByTestId("unsent")).not.toBeInTheDocument());
    expect(screen.getByText("1 of 8 answered")).toBeInTheDocument();
  });

  it("does not send or show votes saved during the preview", async () => {
    localStorage.setItem("forum-votes-v1", JSON.stringify({ [STATEMENTS[0].id]: "agree" }));
    render(<VotingEngine />);
    await act(async () => {});
    expect(mockSend).not.toHaveBeenCalled();
    expect(screen.getByText("0 of 8 answered")).toBeInTheDocument();
  });

  it("keeps the votes and says so when clearing them on the server fails", async () => {
    const user = userEvent.setup();
    mockClear.mockResolvedValue(false);
    render(<VotingEngine statements={STATEMENTS.slice(0, 1)} />);
    await user.click(btn("Agree"));
    await user.click(screen.getByRole("button", { name: "Clear my votes and start over" }));
    expect(await screen.findByText("We could not clear your votes. Check your connection and try again.", { selector: "p.font-bold" })).toBeInTheDocument();
    expect(screen.getByTestId("tally")).toHaveTextContent("1 agree");
    expect(screen.getByRole("status")).toHaveTextContent("We could not clear your votes.");
  });
});

describe("VotingEngine accessibility", () => {
  it("vote buttons are 44px tall, have tap-target minimums and 3px focus rings", () => {
    render(<VotingEngine />);
    for (const name of ["Agree", "Disagree", "Pass"] as const) {
      const b = btn(name);
      expect(b).toHaveClass("tap-target", "h-12", ...FOCUS_RING);
      expect(b).toHaveAttribute("type", "button");
    }
  });

  it("describes each choice with a tooltip", () => {
    render(<VotingEngine />);
    expect(btn("Agree")).toHaveAccessibleDescription("You support this statement.");
    expect(btn("Disagree")).toHaveAccessibleDescription("You do not support this statement.");
    expect(btn("Pass")).toHaveAccessibleDescription("Skip it. You are unsure, or it does not apply to you.");
    expect(screen.getAllByRole("tooltip", { hidden: true })).toHaveLength(3);
  });

  it("groups the choices in a labelled toolbar with icons hidden from screen readers", () => {
    const { container } = render(<VotingEngine />);
    expect(screen.getByRole("toolbar", { name: "Your vote" })).toBeInTheDocument();
    container.querySelectorAll("[role=toolbar] svg").forEach((svg) =>
      expect(svg).toHaveAttribute("aria-hidden", "true")
    );
  });

  it("reaches the toolbar with Tab and moves between choices with arrow keys", async () => {
    const user = userEvent.setup();
    render(<VotingEngine />);
    await user.tab();
    expect(btn("Agree")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(btn("Disagree")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(btn("Pass")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(btn("Agree")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(btn("Pass")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(btn("Agree")).toHaveFocus();
    await user.keyboard("{End}");
    expect(btn("Pass")).toHaveFocus();
  });

  it("votes with Enter and Space, then lands focus on the next statement", async () => {
    const user = userEvent.setup();
    render(<VotingEngine />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(heading()).toHaveTextContent(text(1));
    expect(heading()).toHaveFocus();
    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByTestId("tally")).toHaveTextContent("2 agree");
  });

  it("keeps only one vote button in the Tab order", () => {
    render(<VotingEngine />);
    expect([btn("Agree"), btn("Disagree"), btn("Pass")].map((b) => b.tabIndex)).toEqual([0, -1, -1]);
  });
});
