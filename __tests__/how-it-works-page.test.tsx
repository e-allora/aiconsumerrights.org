import { render, screen, within } from "@/test-utils";

import HowItWorksPage from "@/app/[locale]/how-it-works/page";
import AboutPage from "@/app/[locale]/about/page";
import { AttributionFooter } from "@/components/ui/AttributionFooter";
import { RULES } from "@/lib/forum/consensus";
import { DAILY_LIMITS } from "@/lib/forum/submissions";
import { VOTER_COOKIE_DAYS } from "@/lib/forum/votes";
import { corrections } from "@/lib/public-log";
import { PUBLISHED_ROUTES } from "@/lib/site";
import { MESSAGES } from "@/test-utils";

const section = (name: string) => screen.getByRole("region", { name });

describe("How this site works page", () => {
  it("says who runs it, with no money behind it, and links the code and the mission", () => {
    render(<HowItWorksPage params={{ locale: "en" }} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("How this site works");
    const who = section("Who runs it");
    expect(who).toHaveTextContent("Robert Sweetman, on his own. No money, sponsors, or investors are behind it.");
    expect(within(who).getByRole("link", { name: "The code is public on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/e-allora/aiconsumerrights.org"
    );
    expect(within(who).getByRole("link", { name: /mission and values/ })).toHaveAttribute(
      "href",
      "https://github.com/e-allora/aiconsumerrights.org/blob/main/docs/MISSION.md"
    );
  });

  it("names every service the site uses and what each one sees", () => {
    render(<HowItWorksPage params={{ locale: "en" }} />);
    const items = within(section("Services we use, and what each one sees")).getAllByRole("listitem");
    const text = items.map((li) => li.textContent).join(" ");
    for (const name of ["Vercel", "Neon", "OpenRouter", "Mistral Small", "Google's Gemini", "GitHub", "Proton", "Cloudflare", "The fonts", "The Internet Archive"]) {
      expect(text).toContain(name);
    }
    expect(text).toContain("including IP addresses");
    expect(text).toContain("promise not to keep your text or train on it");
  });

  it("quotes the real numbers from the code, not copies that can drift", () => {
    render(<HowItWorksPage params={{ locale: "en" }} />);
    expect(section("What we keep, and for how long")).toHaveTextContent(`The browser code lasts ${VOTER_COOKIE_DAYS} days.`);
    expect(section("What isn't finished or perfect")).toHaveTextContent(`after ${RULES.minVotes} or more votes per language`);
    expect(section("What isn't finished or perfect")).toHaveTextContent(
      `the AI checks at most ${DAILY_LIMITS.aiChecks} suggestions a day`
    );
    expect(section("What isn't finished or perfect")).toHaveTextContent(`After ${DAILY_LIMITS.submissions} suggestions in a day`);
  });

  it("lists what isn't finished, including the weaknesses", () => {
    render(<HowItWorksPage params={{ locale: "en" }} />);
    const items = within(section("What isn't finished or perfect")).getAllByRole("listitem");
    expect(items).toHaveLength(8);
    expect(items[1]).toHaveTextContent("haven't been reviewed by a lawyer, legal clinic, or consumer organisation yet");
    expect(items[2]).toHaveTextContent("Native speakers haven't checked all of them yet.");
    expect(items.at(-1)).toHaveTextContent("can't stop someone from voting more than once, for example with a second browser or a script");
  });

  it("lists every fixed error from the corrections log, before the contact box", () => {
    render(<HowItWorksPage params={{ locale: "en" }} />);
    const log = section("Corrections");
    expect(log).toHaveTextContent("When something on this site is wrong, we fix it and list it here");
    expect(within(log).queryAllByRole("listitem")).toHaveLength(corrections.length);
    const contact = section("Tell us what's wrong");
    expect(log.compareDocumentPosition(contact) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("asks for criticism with a reason, gives the email, and invites reviewers", () => {
    render(<HowItWorksPage params={{ locale: "en" }} />);
    const contact = section("Tell us what's wrong");
    expect(contact).toHaveTextContent("Criticism is welcome when it comes with a reason.");
    expect(within(contact).getByRole("link", { name: "feedback@aiconsumerrights.org" })).toHaveAttribute(
      "href",
      "mailto:feedback@aiconsumerrights.org"
    );
    expect(within(contact).getByRole("link", { name: "reviewers@aiconsumerrights.org" })).toHaveAttribute(
      "href",
      "mailto:reviewers@aiconsumerrights.org"
    );
    expect(within(contact).getByRole("link", { name: "open an issue on GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/e-allora/aiconsumerrights.org/issues"
    );
    expect(contact).toHaveTextContent("a no needs no explanation");
    expect(contact).not.toHaveTextContent("shipitworks");
  });

  it.each(["es", "pt-PT", "pt-BR", "it", "fr", "de", "hi"] as const)("renders in %s with the same numbers and links", (locale) => {
    render(<HowItWorksPage params={{ locale }} />, { locale });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(MESSAGES[locale].HowItWorks.title);
    expect(document.body).toHaveTextContent(String(VOTER_COOKIE_DAYS));
    expect(screen.getByRole("link", { name: "feedback@aiconsumerrights.org" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "reviewers@aiconsumerrights.org" })).toBeInTheDocument();
  });

  it("is published in the sitemap and linked from the footer and About", () => {
    expect(PUBLISHED_ROUTES.map((r) => r.path)).toContain("/how-it-works");
    render(<AttributionFooter />);
    const footerLink = screen.getByRole("link", { name: MESSAGES.en.HowItWorks.footerLink });
    expect(footerLink).toHaveAttribute("href", "/en/how-it-works");
    render(<AboutPage params={{ locale: "en" }} />);
    expect(screen.getAllByRole("link", { name: MESSAGES.en.HowItWorks.footerLink })).toHaveLength(2);
  });
});
