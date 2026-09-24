import userEvent from "@testing-library/user-event";

import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { SiteNav } from "@/components/ui/SiteNav";
import { ThemeProvider } from "@/components/theme-provider";
import { render, screen, waitFor, within } from "@/test-utils";

const state = globalThis as unknown as {
  __mockPathname: string;
  __mockRouter: { replace: jest.Mock; push: jest.Mock };
};

beforeEach(() => {
  state.__mockPathname = "/forum";
  state.__mockRouter = { replace: jest.fn(), push: jest.fn() };
  window.location.hash = "";
});

const trigger = () => screen.getByRole("button", { name: /Choose a language|Elige un idioma|Escolha um idioma/ });

describe("LanguageSwitcher", () => {
  it("names the menu button and the current language for screen readers", () => {
    render(<LanguageSwitcher />);
    expect(trigger()).toHaveAccessibleName("Choose a language. Current language: English");
    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("describes itself in Portuguese on Portuguese pages", () => {
    render(<LanguageSwitcher />, { locale: "pt-PT" });
    expect(trigger()).toHaveAccessibleName("Escolha um idioma. Idioma atual: Português (PT)");
  });

  it("switches /en/forum to /pt/forum, keeping the page", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(trigger());
    await user.click(await screen.findByRole("menuitemradio", { name: "Português (PT)" }));
    expect(state.__mockRouter.replace).toHaveBeenCalledWith("/forum", { locale: "pt-PT" });
  });

  it("switches /pt/forum to /pt-BR/forum, keeping the page", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />, { locale: "pt-PT" });
    await user.click(trigger());
    await user.click(await screen.findByRole("menuitemradio", { name: "Português (BR)" }));
    expect(state.__mockRouter.replace).toHaveBeenCalledWith("/forum", { locale: "pt-BR" });
  });

  it("describes itself in Brazilian Portuguese on /pt-BR pages", () => {
    render(<LanguageSwitcher />, { locale: "pt-BR" });
    expect(trigger()).toHaveAccessibleName("Escolha um idioma. Idioma atual: Português (BR)");
  });

  it("describes itself in Spanish on Spanish pages", () => {
    render(<LanguageSwitcher />, { locale: "es" });
    expect(trigger()).toHaveAccessibleName("Elige un idioma. Idioma actual: Español");
  });

  it("opens from the keyboard and lists each language in its own language", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    trigger().focus();
    await user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    const items = within(menu).getAllByRole("menuitemradio");
    expect(items.map((i) => i.textContent)).toEqual(["English", "Español", "Português (PT)", "Português (BR)"]);
    expect(items.map((i) => i.getAttribute("lang"))).toEqual(["en", "es", "pt-PT", "pt-BR"]);
    expect(items.map((i) => i.getAttribute("aria-checked"))).toEqual(["true", "false", "false", "false"]);
  });

  it("switches /en/forum to /es/forum, keeping the page", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(trigger());
    await user.click(await screen.findByRole("menuitemradio", { name: "Español" }));
    expect(state.__mockRouter.replace).toHaveBeenCalledWith("/forum", { locale: "es" });
  });

  it("keeps the section anchor when switching", async () => {
    const user = userEvent.setup();
    state.__mockPathname = "/guide";
    window.location.hash = "#steps";
    render(<LanguageSwitcher />);
    await user.click(trigger());
    await user.click(await screen.findByRole("menuitemradio", { name: "Español" }));
    expect(state.__mockRouter.replace).toHaveBeenCalledWith("/guide#steps", { locale: "es" });
  });

  it("does nothing when the current language is chosen again", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    await user.click(trigger());
    await user.click(await screen.findByRole("menuitemradio", { name: "English" }));
    expect(state.__mockRouter.replace).not.toHaveBeenCalled();
  });

  it("moves with arrow keys, selects with Enter, and returns focus to the button", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    trigger().focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("menu");
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(screen.getByRole("menuitemradio", { name: "Español" })).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(state.__mockRouter.replace).toHaveBeenCalledWith("/forum", { locale: "es" });
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it("closes on Escape with focus back on the button, which keeps its 3px focus ring", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    trigger().focus();
    await user.keyboard("{Enter}");
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveClass("focus-visible:ring-[3px]", "focus-visible:ring-ring", "focus-visible:ring-offset-2");
  });

  it("meets the touch-target minimum on the button and every option", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    expect(trigger()).toHaveClass("tap-target", "h-11");
    await user.click(trigger());
    for (const item of await screen.findAllByRole("menuitemradio")) {
      expect(item).toHaveClass("tap-target", "min-h-11");
    }
  });
});

describe("LanguageSwitcher placement", () => {
  it("sits in the header on desktop and in the mobile menu drawer", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <SiteNav />
      </ThemeProvider>
    );
    const header = screen.getByRole("banner");
    const headerSwitcher = within(header).getByRole("button", { name: /Choose a language/ });
    expect(headerSwitcher).toHaveClass("hidden", "md:inline-flex");

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Menu" });
    expect(within(drawer).getByRole("button", { name: /Choose a language/ })).toBeInTheDocument();
  });
});
