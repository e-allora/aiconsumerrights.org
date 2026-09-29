import userEvent from "@testing-library/user-event";

import HelpPage from "@/app/[locale]/help/page";
import SituationPage, { generateStaticParams } from "@/app/[locale]/help/[situation]/page";
import { LetterBuilder } from "@/components/help/LetterBuilder";
import { COMING, EU_AUTHORITY, REGIONS, SITUATIONS, homeRegion } from "@/lib/help";
import { routing } from "@/lib/i18n/routing";
import { PUBLISHED_ROUTES } from "@/lib/site";
import { getSource } from "@/lib/sources";
import { MESSAGES, render, screen, within } from "@/test-utils";

jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

type Tree = { [key: string]: string | Tree };
const at = (tree: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((node, key) => (node as Tree | undefined)?.[key], tree);
const tagsIn = (s: string) => Array.from(s.matchAll(/<(\w+)>/g), (m) => m[1]).filter((t) => t !== "b").sort();

afterEach(() => window.history.replaceState(null, "", "/"));

describe("lib/help", () => {
  it("cites only sources in the registry", () => {
    for (const s of SITUATIONS) {
      for (const help of Object.values(s.regions)) {
        for (const id of [...help.rights.flat(), ...Object.values(help.complain)]) expect(() => getSource(id)).not.toThrow();
      }
    }
    for (const id of Object.values(EU_AUTHORITY)) expect(getSource(id!).publisher).toBeTruthy();
  });

  it("has every message a situation needs, in every language", () => {
    for (const locale of routing.locales) {
      const m = MESSAGES[locale].Help as unknown as Tree;
      for (const s of SITUATIONS) {
        for (const key of s.happened) expect(at(m, `${s.id}.happened.${key}`)).toEqual(expect.any(String));
        expect(Object.keys(at(m, `${s.id}.company`) as Tree).sort()).toEqual(s.company.map((c) => c.key).sort());
        for (const region of REGIONS) {
          const help = s.regions[region];
          // One message per right, and no extra ones the page would never show.
          expect(Object.keys(at(m, `${s.id}.${region}.rights`) as Tree)).toHaveLength(help.rights.length);
          // The "if they don't answer" links match the sources set in lib/help.ts.
          const noReply = at(m, `${s.id}.${region}.noReply`) as string;
          const expected = [...Object.keys(help.complain), ...(help.phone ? ["tel"] : [])].sort();
          expect({ locale, region, tags: tagsIn(noReply) }).toEqual({ locale, region, tags: expected });
          const letter = at(m, `${s.id}.letters.${help.letter}`) as Tree;
          expect(letter.body).toContain("{name}");
          expect(letter.body).toContain("{decisionDate}");
          expect(letter.subject).toContain("{hasReference, select,");
        }
      }
    }
  });

  it("opens each language on the region its speakers most likely live in", () => {
    expect(homeRegion("pt-BR")).toBe("br");
    expect(homeRegion("hi")).toBe("in");
    expect(homeRegion("de")).toBe("eu");
    expect(homeRegion("en")).toBeUndefined();
    expect(homeRegion("es")).toBeUndefined();
  });

  it("publishes the hub and every situation in the sitemap", () => {
    const paths = PUBLISHED_ROUTES.map((r) => r.path);
    expect(paths).toContain("/help");
    for (const { situation } of generateStaticParams()) expect(paths).toContain(`/help/${situation}`);
  });
});

describe("/help", () => {
  it("links each situation and lists the guides still being written", () => {
    render(<HelpPage params={{ locale: "en" }} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("What happened to you?");
    expect(screen.getByRole("link", { name: /A loan or credit was refused/ })).toHaveAttribute("href", "/en/help/credit");
    const coming = screen.getByRole("region", { name: "Coming next" });
    expect(within(coming).getAllByRole("listitem")).toHaveLength(COMING.length);
    expect(screen.getByText(/still checking these pages|checking these pages against their sources/)).toBeInTheDocument();
    // The shortcomings come first, with a way for reviewers to offer help.
    expect(screen.getByText("Not reviewed by a legal expert yet.")).toBeInTheDocument();
    expect(screen.getByText(/native speakers haven't checked the translations/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "please get in touch" })).toHaveAttribute("href", "mailto:reviewers@aiconsumerrights.org");
  });
});

describe("/help/credit", () => {
  it("asks English speakers where they live before showing rights or a letter", () => {
    render(<SituationPage params={{ locale: "en", situation: "credit" }} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A loan or credit was refused");
    expect(screen.getByText(/Pick where you live/)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Your rights" })).not.toBeInTheDocument();
  });

  it("shows US rights, cited, and a Regulation B letter once the visitor picks the US", async () => {
    const user = userEvent.setup();
    render(<SituationPage params={{ locale: "en", situation: "credit" }} />);
    await user.click(screen.getByRole("radio", { name: "United States" }));
    expect(window.location.search).toBe("?where=us");
    const rights = screen.getByRole("region", { name: "Your rights" });
    expect(within(rights).getAllByRole("listitem")).toHaveLength(4);
    expect(within(rights).getAllByRole("link", { name: /^Source/ }).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText(/Under Regulation B \(12 CFR 1002\.9\)/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /file a complaint with the Consumer Financial Protection Bureau/ })).toHaveAttribute(
      "href",
      getSource("cfpb-complaint").url
    );
  });

  it("gives the UK its own rules since leaving the EU, with the Financial Ombudsman and the ICO", async () => {
    const user = userEvent.setup();
    render(<SituationPage params={{ locale: "en", situation: "credit" }} />);
    await user.click(screen.getByRole("radio", { name: "United Kingdom" }));
    expect(screen.getByText(/have applied since 5 February 2026/)).toBeInTheDocument();
    expect(screen.getByText(/I ask under Article 22C/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Financial Ombudsman Service/ })).toHaveAttribute("href", getSource("uk-fos-complain").url);
    expect(screen.getByRole("link", { name: /^Information Commissioner's Office/ })).toHaveAttribute("href", getSource("uk-ico-complaint").url);
  });

  it("opens Italian visitors on the EU, with a GDPR letter and the Garante", () => {
    render(<SituationPage params={{ locale: "it", situation: "credit" }} />, { locale: "it" });
    expect(screen.getByRole("radio", { name: "Unione europea" })).toBeChecked();
    expect(screen.getByText(/articolo 15 del GDPR/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Garante per la protezione dei dati personali/ })).toHaveAttribute(
      "href",
      getSource("it-garante-reclamo").url
    );
  });

  it("opens Hindi visitors on India, saying the data rights start in May 2027, with the 1915 helpline", () => {
    render(<SituationPage params={{ locale: "hi", situation: "credit" }} />, { locale: "hi" });
    expect(screen.getByRole("radio", { name: "भारत" })).toBeChecked();
    expect(screen.getByText(/मई 2027/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1915" })).toHaveAttribute("href", "tel:1915");
  });

  it("follows a shared ?where= link", () => {
    window.history.replaceState(null, "", "/en/help/credit?where=br");
    render(<SituationPage params={{ locale: "en", situation: "credit" }} />);
    expect(screen.getByRole("radio", { name: "Brazil" })).toBeChecked();
    expect(screen.getByText(/Articles 18 and 19 of the LGPD/)).toBeInTheDocument();
  });

  it("invites the company team that gets the letter, without blame", () => {
    render(<SituationPage params={{ locale: "en", situation: "credit" }} />);
    const company = screen.getByRole("region", { name: "If this letter reaches you at work" });
    expect(within(company).getAllByRole("listitem")).toHaveLength(SITUATIONS[0].company.length);
    expect(within(company).getByText(/Reply soon/)).toBeInTheDocument();
    expect(within(company).getByRole("link", { name: /^Source/ })).toBeInTheDocument();
    expect(within(company).getByRole("link", { name: "Your view is welcome in the forum too" })).toHaveAttribute("href", "/en/forum");
  });

  it("is a 404 for a situation that doesn't exist", () => {
    expect(() => render(<SituationPage params={{ locale: "en", situation: "nope" }} />)).toThrow("NEXT_NOT_FOUND");
  });
});

describe("/help/job", () => {
  it("covers background checks, accommodations, and the EEOC deadline, and says plainly what US law doesn't give", async () => {
    const user = userEvent.setup();
    render(<SituationPage params={{ locale: "en", situation: "job" }} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A job application was screened out");
    await user.click(screen.getByRole("radio", { name: "United States" }));
    expect(screen.getByText(/No federal law gives you a general right to know why/)).toBeInTheDocument();
    expect(screen.getByText(/Fair Credit Reporting Act provides for/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /file a charge with the EEOC/ })).toHaveAttribute("href", getSource("eeoc-charge").url);
    expect(screen.getByText(/usually 180 days, or 300 in many states/)).toBeInTheDocument();
  });

  it("names e-recruiting as one of the GDPR's own examples for EU visitors", () => {
    render(<SituationPage params={{ locale: "de", situation: "job" }} />, { locale: "de" });
    expect(screen.getByText(/eines der Beispiele, die die DSGVO selbst nennt/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Dezember 2027/)).toBeInTheDocument();
  });
});

describe("/help/housing", () => {
  it("treats tenant screening reports as consumer reports and gives HUD's one-year deadline", async () => {
    const user = userEvent.setup();
    render(<SituationPage params={{ locale: "en", situation: "housing" }} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A rental application was turned down");
    await user.click(screen.getByRole("radio", { name: "United States" }));
    expect(screen.getByText(/Tenant screening reports count as consumer reports/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /report it to HUD/ })).toHaveAttribute("href", getSource("hud-fheo-intake").url);
    expect(screen.getByText(/The deadline is one year/)).toBeInTheDocument();
    expect(screen.getByText(/so I can get my free copy and check it for errors/)).toBeInTheDocument();
  });

  it("lists insurance as still to come", () => {
    render(<HelpPage params={{ locale: "en" }} />);
    expect(screen.getByRole("link", { name: /A rental application was turned down/ })).toHaveAttribute("href", "/en/help/housing");
    expect(screen.getByText("An insurance decision went against you")).toBeInTheDocument();
  });
});

describe("LetterBuilder", () => {
  const letter = () => document.querySelector(".letter-print")!.textContent!;

  it("fills the letter as the visitor types, with blanks marked until then", async () => {
    const user = userEvent.setup();
    render(<LetterBuilder situation="credit" kind="eu" />);
    expect(letter()).toContain("[your name]");
    expect(letter()).toContain("Subject: Request under GDPR Articles 15 and 22\n");
    await user.type(screen.getByLabelText("Your name"), "Ana Silva");
    await user.type(screen.getByLabelText("Company name"), "Example Bank");
    await user.type(screen.getByLabelText("Date of the decision"), "2026-09-01");
    await user.type(screen.getByLabelText("Application or account number (optional)"), "A-123");
    expect(letter()).toContain("To: Example Bank");
    expect(letter()).toContain("On 1 September 2026, you refused");
    expect(letter()).toContain("Subject: Request under GDPR Articles 15 and 22 (ref. A-123)");
    expect(letter()).toMatch(/Kind regards,\nAna Silva$/);
    expect(screen.getByLabelText("Your name")).toHaveAttribute("autocomplete", "name");
  });

  it("copies the letter and offers it to the visitor's own email app, without sending anything to the site", async () => {
    const user = userEvent.setup();
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;
    const writeText = jest.spyOn(navigator.clipboard, "writeText");
    render(<LetterBuilder situation="credit" kind="plain" />);
    await user.type(screen.getByLabelText("Your name"), "Ana");
    await user.click(screen.getByRole("button", { name: "Copy letter" }));
    expect(writeText).toHaveBeenCalledWith(letter());
    expect(screen.getByRole("status")).toHaveTextContent("Copied.");
    const mail = screen.getByRole("link", { name: "Open in email" }).getAttribute("href")!;
    expect(mail.startsWith("mailto:?subject=Request%20for%20the%20reasons")).toBe(true);
    expect(decodeURIComponent(mail)).toContain("Ana");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/stays on this device/)).toBeInTheDocument();
  });

  it("says so when copying fails", async () => {
    const user = userEvent.setup();
    render(<LetterBuilder situation="credit" kind="us" />);
    jest.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    await user.click(screen.getByRole("button", { name: "Copy letter" }));
    expect(screen.getByRole("status")).toHaveTextContent("Couldn't copy.");
  });

  it("prints only the letter", async () => {
    const user = userEvent.setup();
    const print = jest.fn(() => {
      expect(document.documentElement).toHaveClass("printing-letter");
      window.dispatchEvent(new Event("afterprint"));
    });
    window.print = print;
    render(<LetterBuilder situation="credit" kind="us" />);
    await user.click(screen.getByRole("button", { name: "Print" }));
    expect(print).toHaveBeenCalled();
    expect(document.documentElement).not.toHaveClass("printing-letter");
  });
});
