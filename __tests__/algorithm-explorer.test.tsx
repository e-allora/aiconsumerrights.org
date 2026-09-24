import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";

import { AlgorithmExplorer } from "@/components/guide/AlgorithmExplorer";

const tabs = () => screen.getAllByRole("tab");
const selectedIndex = () => tabs().findIndex((t) => t.getAttribute("aria-selected") === "true");
const panelHeading = () => screen.getByRole("tabpanel").querySelector("h3")!;

describe("AlgorithmExplorer", () => {
  it("is a labelled tab list of three steps with step 1 selected", () => {
    render(<AlgorithmExplorer />);
    expect(screen.getByRole("tablist", { name: "Three steps when a decision seems wrong" })).toBeInTheDocument();
    expect(tabs()).toHaveLength(3);
    expect(tabs().map((t) => t.textContent)).toEqual([
      "1Step 1: Ask in writing",
      "2Step 2: Ask for a person",
      "3Step 3: Talk it through",
    ]);
    expect(selectedIndex()).toBe(0);
    expect(panelHeading()).toHaveTextContent("Ask in writing");
  });

  it("links the panel to the selected tab, and only the selected tab is in the tab order", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    await user.click(tabs()[1]);
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", tabs()[1].id);
    expect(tabs()[1]).toHaveAttribute("aria-controls", panel.id);
    expect(tabs().map((t) => t.tabIndex)).toEqual([-1, 0, -1]);
  });

  it("changes step when a tab is clicked", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    await user.click(tabs()[2]);
    expect(selectedIndex()).toBe(2);
    expect(panelHeading()).toHaveTextContent("Keep the conversation constructive");
  });

  it("moves between steps with arrow keys, Home and End, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    await user.tab();
    expect(tabs()[0]).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(selectedIndex()).toBe(1);
    expect(tabs()[1]).toHaveFocus();

    await user.keyboard("{End}");
    expect(selectedIndex()).toBe(2);
    await user.keyboard("{ArrowRight}");
    expect(selectedIndex()).toBe(0);
    await user.keyboard("{ArrowLeft}");
    expect(selectedIndex()).toBe(2);
    await user.keyboard("{Home}");
    expect(selectedIndex()).toBe(0);
    expect(tabs()[0]).toHaveFocus();
  });

  it("walks the decision tree with 'No' and moves focus to the new step heading", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);

    await user.click(screen.getByRole("button", { name: "No, go to step 2" }));
    expect(selectedIndex()).toBe(1);
    expect(panelHeading()).toHaveTextContent("Request human review");
    expect(panelHeading()).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 3: Request human review");

    await user.click(screen.getByRole("button", { name: "No, go to step 3" }));
    expect(panelHeading()).toHaveTextContent("Keep the conversation constructive");

    await user.click(screen.getByRole("button", { name: "No, where else can I turn?" }));
    expect(panelHeading()).toHaveTextContent("Ask a consumer agency for help");
    expect(panelHeading()).toHaveFocus();
  });

  it("goes back a step, and ends the tree when a step settles it", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    await user.click(screen.getByRole("button", { name: "No, go to step 2" }));
    await user.click(screen.getByRole("button", { name: "Back to step 1" }));
    expect(selectedIndex()).toBe(0);

    await user.click(screen.getByRole("button", { name: "Yes, it is settled" }));
    expect(panelHeading()).toHaveTextContent("Good. Keep a record.");
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(panelHeading()).toHaveTextContent("Ask in writing");
  });

  it("works fully from the keyboard: Enter on the 'No' button advances", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    screen.getByRole("button", { name: "No, go to step 2" }).focus();
    await user.keyboard("{Enter}");
    expect(selectedIndex()).toBe(1);
    await user.keyboard(" ");
    expect(panelHeading()).toHaveFocus();
  });

  it("uses depth cards and tap targets for the steps", () => {
    render(<AlgorithmExplorer />);
    for (const tab of tabs()) expect(tab).toHaveClass("depth-card", "depth-card-interactive", "tap-target");
    expect(screen.getByRole("tabpanel")).toHaveClass("depth-card");
  });

  it("opens agency links in a new tab safely, with full names", async () => {
    const user = userEvent.setup();
    render(<AlgorithmExplorer />);
    await user.click(tabs()[2]);
    await user.click(screen.getByRole("button", { name: "No, where else can I turn?" }));
    const links = screen.getAllByRole("link", { name: /opens in a new tab/ });
    expect(links).toHaveLength(2);
    for (const a of links) {
      expect(a).toHaveAttribute("target", "_blank");
      expect(a).toHaveAttribute("rel", "noopener noreferrer");
    }
  });
});
