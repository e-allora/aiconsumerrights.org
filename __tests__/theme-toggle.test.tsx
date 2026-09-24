import { render, screen, waitFor } from "@/test-utils";
import userEvent from "@testing-library/user-event";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";

function renderToggle() {
  return render(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <ThemeToggle />
    </ThemeProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

describe("ThemeToggle", () => {
  it("is a labelled toggle button that starts off in light mode", async () => {
    renderToggle();
    const toggle = await screen.findByRole("button", { name: "Dark theme" });
    await waitFor(() => expect(toggle).toBeEnabled());
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement).toHaveClass("light");
  });

  it("adds and removes the dark class on <html>", async () => {
    const user = userEvent.setup();
    renderToggle();
    const toggle = screen.getByRole("button", { name: "Dark theme" });
    await waitFor(() => expect(toggle).toBeEnabled());

    await user.click(toggle);
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
    expect(document.documentElement).not.toHaveClass("light");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    await waitFor(() => expect(document.documentElement).not.toHaveClass("dark"));
    expect(document.documentElement).toHaveClass("light");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("works from the keyboard", async () => {
    const user = userEvent.setup();
    renderToggle();
    const toggle = screen.getByRole("button", { name: "Dark theme" });
    await waitFor(() => expect(toggle).toBeEnabled());

    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  });

  it("hides its icons from screen readers", () => {
    const { container } = renderToggle();
    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(2);
    icons.forEach((svg) => expect(svg).toHaveAttribute("aria-hidden", "true"));
  });
});
