import { render, screen, within } from "@/test-utils";
import userEvent from "@testing-library/user-event";

import { ThemeProvider } from "@/components/theme-provider";
import { SiteNav } from "@/components/ui/SiteNav";
import { NAV_ITEMS } from "@/lib/site";
import { MESSAGES } from "@/test-utils";

const label = (key: string) => (MESSAGES.en.Navigation as Record<string, unknown>)[key] as string;

function renderNav(path = "/") {
  (globalThis as unknown as { __mockPathname: string }).__mockPathname = path;
  return render(
    <ThemeProvider attribute="class" defaultTheme="light">
      <SiteNav />
    </ThemeProvider>
  );
}

beforeEach(() => localStorage.clear());

describe("SiteNav", () => {
  it.each(["Main", "Quick"])("the %s navigation links to every route in order", (name) => {
    renderNav();
    const nav = screen.getByRole("navigation", { name });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(
      NAV_ITEMS.map((i) => `/en${i.href === "/" ? "" : i.href}`)
    );
    expect(links.map((a) => a.textContent)).toEqual(NAV_ITEMS.map((i) => label(i.key)));
  });

  it.each(["/", "/guide", "/forum", "/sources", "/about"])("marks %s as the current page", (path) => {
    renderNav(path);
    for (const name of ["Main", "Quick"]) {
      const current = within(screen.getByRole("navigation", { name })).getAllByRole("link", { current: "page" });
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveAttribute("href", `/en${path === "/" ? "" : path}`);
    }
  });

  it("links home from the site name", () => {
    renderNav("/forum");
    expect(screen.getByRole("link", { name: "AI Consumer Rights" })).toHaveAttribute("href", "/en");
  });

  it("gives every nav link a tap target and a 3px focus ring", () => {
    renderNav();
    for (const name of ["Main", "Quick"]) {
      for (const a of within(screen.getByRole("navigation", { name })).getAllByRole("link")) {
        expect(a).toHaveClass("tap-target", "focus-visible:ring-[3px]");
      }
    }
  });

  it("keeps the mobile bar in the thumb zone and the header links on desktop", () => {
    renderNav();
    expect(screen.getByRole("navigation", { name: "Quick" })).toHaveClass("fixed", "bottom-0", "md:hidden");
    expect(screen.getByRole("navigation", { name: "Main" })).toHaveClass("hidden", "md:block");
  });

  it("opens a labelled drawer with every page and a hint for each", async () => {
    const user = userEvent.setup();
    renderNav("/guide");
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    const links = within(within(dialog).getByRole("navigation", { name: "All pages" })).getAllByRole("link");
    expect(links).toHaveLength(NAV_ITEMS.length);
    for (const item of NAV_ITEMS) expect(within(dialog).getByText(label(`${item.key}Hint`))).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { current: "page" })).toHaveAttribute("href", "/en/guide");
  });

  it("traps focus in the drawer, closes on Escape, and returns focus to the menu button", async () => {
    const user = userEvent.setup();
    renderNav();
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    for (let i = 0; i < 10; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes from the close button and when a link is chosen", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // jsdom can't navigate; stop the browser default, keep React's handler.
    const stop = (e: Event) => e.preventDefault();
    document.addEventListener("click", stop);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(within(screen.getByRole("dialog")).getByRole("link", { name: /Forum/ }));
    document.removeEventListener("click", stop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("includes the theme toggle in the header", () => {
    renderNav();
    expect(screen.getByRole("button", { name: "Dark theme" })).toBeInTheDocument();
  });
});
