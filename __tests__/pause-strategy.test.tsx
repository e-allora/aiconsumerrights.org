import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import HomePage from "@/app/[locale]/page";
import { PAUSE_STEPS, PAUSEStrategy } from "@/components/guide/PAUSEStrategy";
import { MESSAGES, render, screen, within } from "@/test-utils";

const tabs = () => screen.getAllByRole("tab");
const panel = () => screen.getByRole("tabpanel");

describe.each(["en", "es", "pt-PT", "pt-BR", "it"] as const)("PAUSE Strategy in %s", (locale) => {
  const m = MESSAGES[locale].PAUSEStrategy;
  const steps = PAUSE_STEPS.map((id) => m.steps[id]);

  it("renders the title, subtitle, and five letter tabs on the main page", () => {
    // The test provider throws on any missing or broken key.
    render(<HomePage params={{ locale }} />, { locale });
    const section = screen.getByRole("region", { name: m.title });
    expect(within(section).getByText(m.subtitle)).toBeInTheDocument();
    const list = within(section).getByRole("tablist", { name: m.tablistLabel });
    expect(within(list).getAllByRole("tab")).toHaveLength(5);
  });

  it("names each tab with its letter and title", () => {
    render(<PAUSEStrategy />, { locale });
    expect(tabs().map((t) => t.getAttribute("aria-label"))).toEqual(steps.map((s) => `${s.letter}: ${s.title}`));
  });

  it("shows every step's title and full text when chosen", async () => {
    const user = userEvent.setup();
    render(<PAUSEStrategy />, { locale });
    for (let i = 0; i < 5; i++) {
      await user.click(tabs()[i]);
      expect(tabs()[i]).toHaveAttribute("aria-selected", "true");
      expect(within(panel()).getByRole("heading", { level: 3 })).toHaveTextContent(steps[i].title);
      expect(within(panel()).getByText(steps[i].body)).toBeInTheDocument();
      expect(panel()).toHaveAttribute("aria-labelledby", tabs()[i].id);
    }
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<PAUSEStrategy />, { locale });
    const results = await axe(container);
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });
});

describe("PAUSE Strategy keyboard and touch", () => {
  it("moves between letters with arrow keys, Home and End, wrapping at the ends", async () => {
    const user = userEvent.setup();
    render(<PAUSEStrategy />);
    await user.tab();
    expect(tabs()[0]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tabs()[1]).toHaveFocus();
    expect(tabs()[1]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{End}");
    expect(tabs()[4]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tabs()[0]).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(tabs()[4]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(tabs()[0]).toHaveFocus();
  });

  it("keeps one letter in the Tab order, then Tab moves into the step text", async () => {
    const user = userEvent.setup();
    render(<PAUSEStrategy />);
    expect(tabs().map((t) => t.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    await user.tab();
    await user.tab();
    expect(panel()).toHaveFocus();
  });

  it("announces the chosen step for screen readers", async () => {
    const user = userEvent.setup();
    render(<PAUSEStrategy />);
    await user.click(tabs()[2]);
    expect(screen.getByRole("status")).toHaveTextContent("Step 3 of 5: Understand Purpose & Data");
  });

  it("uses depth cards, 44px tap targets, and 3px focus rings", () => {
    render(<PAUSEStrategy />);
    for (const tab of tabs()) {
      expect(tab).toHaveClass("depth-card", "depth-card-interactive", "tap-target", "min-h-20");
      expect(tab).toHaveClass("focus-visible:ring-[3px]", "focus-visible:ring-ring");
    }
    expect(panel()).toHaveClass("depth-card", "focus-visible:ring-[3px]");
  });
});
