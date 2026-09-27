import { render, screen, within } from "@testing-library/react";

import { approve, recheck, remove } from "@/app/admin/actions";
import AdminPage from "@/app/admin/page";
import { precheck } from "@/lib/forum/precheck";
import {
  approveSubmission,
  deleteSubmission,
  listSubmissions,
  recheckSubmission,
  type Submission,
} from "@/lib/forum/submissions";

const PASSWORD = "correct horse battery staple";
let authorization: string | null = null;
jest.mock("next/headers", () => ({ headers: () => new Headers(authorization ? { authorization } : {}) }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
jest.mock("@/lib/forum/submissions", () => ({
  listSubmissions: jest.fn(),
  approveSubmission: jest.fn(),
  deleteSubmission: jest.fn(),
  recheckSubmission: jest.fn(),
}));
jest.mock("@/lib/forum/precheck", () => ({ precheck: jest.fn() }));
const mockList = listSubmissions as jest.MockedFunction<typeof listSubmissions>;

const item = (over: Partial<Submission>): Submission => ({
  id: "5f0c6d6e-2f7a-4f0e-9a51-9a4c1d3f0a11",
  text: "Le ragioni devono essere chiare.",
  locale: "it",
  status: "pending",
  check: { namesCompany: false, namesPerson: false, contactInfo: false, attack: false, english: "Reasons must be clear." },
  createdAt: "2026-09-26T18:00:00.000Z",
  ...over,
});

// Next.js ships a React that accepts a server function as <form action>;
// the React 18 used by Jest warns about it. Mute only that warning.
const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((msg, ...rest) => {
    const text = [msg, ...rest].map(String).join(" ");
    if (text.includes("Invalid value for prop") && text.includes("`action`")) return;
    consoleError(msg, ...rest);
  });
});

beforeEach(() => {
  process.env.FORUM_ADMIN_PASSWORD = PASSWORD;
  authorization = `Basic ${btoa(`robert:${PASSWORD}`)}`;
  jest.clearAllMocks();
  mockList.mockReset().mockResolvedValue([]);
});

describe("Admin review page", () => {
  it("shows nothing without the password", async () => {
    authorization = null;
    await expect(AdminPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockList).not.toHaveBeenCalled();
  });

  it("lists pending suggestions with language, text, English translation, and actions", async () => {
    mockList.mockResolvedValue([item({})]);
    render(await AdminPage());
    const pending = screen.getByRole("region", { name: "Waiting for review (1)" });
    expect(within(pending).getByText("Le ragioni devono essere chiare.")).toHaveAttribute("lang", "it");
    expect(within(pending).getByText(/Italian · Sep 26, 2026/)).toBeInTheDocument();
    expect(within(pending).getByText("AI pre-check: no concerns.")).toBeInTheDocument();
    expect(within(pending).getByText("Reasons must be clear.")).toBeInTheDocument();
    expect(within(pending).getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(within(pending).getByRole("button", { name: "Reject and delete" })).toBeInTheDocument();
  });

  it("names each concern the pre-check raised", async () => {
    mockList.mockResolvedValue([
      item({ check: { namesCompany: true, namesPerson: false, contactInfo: false, attack: true, english: "x" } }),
    ]);
    render(await AdminPage());
    const flags = screen.getByRole("list", { name: "AI pre-check concerns" });
    expect(within(flags).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      "Names a company or product",
      "Attacks or insults people",
    ]);
  });

  it("warns when the pre-check did not run, and offers to check again", async () => {
    mockList.mockResolvedValue([item({ check: null })]);
    render(await AdminPage());
    expect(screen.getByText(/Not checked: the AI pre-check did not run/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Check again" })).toBeInTheDocument();
  });

  it("offers no re-check for a suggestion that was checked", async () => {
    mockList.mockResolvedValue([item({})]);
    render(await AdminPage());
    expect(screen.queryByRole("button", { name: "Check again" })).not.toBeInTheDocument();
  });

  it("lists approved suggestions separately, with a way to remove them", async () => {
    mockList.mockResolvedValue([item({ status: "approved", locale: "en", text: "Reasons must be clear." })]);
    render(await AdminPage());
    const approved = screen.getByRole("region", { name: "Approved (1)" });
    expect(within(approved).getByRole("button", { name: "Remove from voting and delete" })).toBeInTheDocument();
    expect(within(approved).queryByRole("button", { name: "Approve" })).not.toBeInTheDocument();
    expect(screen.getByText("Nothing to review.")).toBeInTheDocument();
  });
});

describe("Admin actions", () => {
  const form = (id: string) => {
    const f = new FormData();
    f.set("id", id);
    return f;
  };

  it("approve, remove, and check again act on the given id", async () => {
    await approve(form("abc"));
    await remove(form("def"));
    await recheck(form("ghi"));
    expect(approveSubmission).toHaveBeenCalledWith("abc");
    expect(deleteSubmission).toHaveBeenCalledWith("def");
    expect(recheckSubmission).toHaveBeenCalledWith("ghi", precheck);
  });

  it("refuse to act without the password", async () => {
    authorization = null;
    await expect(approve(form("abc"))).rejects.toThrow("Not allowed");
    await expect(remove(form("abc"))).rejects.toThrow("Not allowed");
    await expect(recheck(form("abc"))).rejects.toThrow("Not allowed");
    expect(approveSubmission).not.toHaveBeenCalled();
    expect(deleteSubmission).not.toHaveBeenCalled();
  });
});
