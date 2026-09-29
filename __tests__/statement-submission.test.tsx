import { act, render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";

import { StatementSubmission } from "@/components/forum/StatementSubmission";
import { submitStatement } from "@/lib/forum/client";
import { MESSAGES } from "@/test-utils";

jest.mock("@/lib/forum/client", () => ({ submitStatement: jest.fn() }));
const mockSubmit = submitStatement as jest.MockedFunction<typeof submitStatement>;
beforeEach(() => mockSubmit.mockReset().mockResolvedValue("sent"));

const PLACEHOLDER = MESSAGES.en.Forum.submission.placeholder;

const box = () => screen.getByRole("textbox", { name: "Suggest a statement for others to vote on" });
const box2 = (locale: "pt-BR") => screen.getByRole("textbox", { name: MESSAGES[locale].Forum.submission.label });

describe("StatementSubmission", () => {
  it("renders a labelled box with the placeholder and the pre-moderation disclosure", () => {
    render(<StatementSubmission />);
    expect(box()).toHaveAttribute("placeholder", PLACEHOLDER);
    expect(PLACEHOLDER).toBe(
      "e.g., 'Customer service portals should always let you request a human representative with one tap.'"
    );
    expect(box()).toHaveAccessibleDescription(
      expect.stringContaining("A person reads every statement before it is shown.")
    );
    expect(screen.getByText(/We critique ideas, not people\./)).toBeInTheDocument();
  });

  it("enforces the 140-character limit, even on paste", async () => {
    const user = userEvent.setup();
    render(<StatementSubmission />);
    expect(box()).toHaveAttribute("maxLength", "140");
    await user.click(box());
    await user.paste("x".repeat(200));
    expect(box()).toHaveValue("x".repeat(140));
    expect(screen.getByText("0 of 140 characters left")).toBeInTheDocument();
  });

  it("counts down as you type and ties the counter to the box", async () => {
    const user = userEvent.setup();
    render(<StatementSubmission />);
    await user.type(box(), "Hello");
    expect(screen.getByText("135 of 140 characters left")).toBeInTheDocument();
    expect(box()).toHaveAccessibleDescription(expect.stringContaining("135 of 140 characters left"));
  });

  it("asks for text instead of submitting an empty statement", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<StatementSubmission onSubmit={onSubmit} />);
    await user.type(box(), "   ");
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Please write a statement first.");
    expect(box()).toHaveAttribute("aria-invalid", "true");
  });

  it("sends trimmed text for review and clears the box", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue("sent");
    render(<StatementSubmission onSubmit={onSubmit} />);
    await user.type(box(), "  Reasons should be plain.  ");
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(onSubmit).toHaveBeenCalledWith("Reasons should be plain.");
    expect(box()).toHaveValue("");
    expect(screen.getByText("Thank you. Your statement is waiting for review.")).toBeInTheDocument();
  });

  it("sends to the review queue with the page language by default", async () => {
    const user = userEvent.setup();
    render(<StatementSubmission />, { locale: "pt-BR" });
    await user.type(box2("pt-BR"), "Motivos devem ser claros.");
    await user.keyboard("{Tab}{Enter}");
    expect(mockSubmit).toHaveBeenCalledWith("Motivos devem ser claros.", "pt-BR");
    expect(screen.getByRole("status")).toHaveTextContent(MESSAGES["pt-BR"].Forum.submission.sent);
  });

  it("keeps the text and explains when it has contact details", async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue("contact");
    render(<StatementSubmission />);
    await user.type(box(), "Write to me at ana@example.com");
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please remove links, email addresses, social media handles, and phone numbers, then try again."
    );
    expect(box()).toHaveValue("Write to me at ana@example.com");
    expect(box()).toHaveAttribute("aria-invalid", "true");
  });

  it("keeps the text and says so when sending fails", async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue("failed");
    render(<StatementSubmission />);
    await user.type(box(), "Reasons should be plain.");
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Your text is still in the box.");
    expect(box()).toHaveValue("Reasons should be plain.");
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("keeps the text and says to try tomorrow when the day's box is full", async () => {
    const user = userEvent.setup();
    mockSubmit.mockResolvedValue("busy");
    render(<StatementSubmission />);
    await user.type(box(), "Reasons should be plain.");
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again tomorrow.");
    expect(box()).toHaveValue("Reasons should be plain.");
  });

  it("sends once, even if the button is pressed again while sending", async () => {
    const user = userEvent.setup();
    let finish: (r: "sent") => void = () => {};
    mockSubmit.mockImplementation(() => new Promise((r) => (finish = r)));
    render(<StatementSubmission />);
    await user.type(box(), "Reasons should be plain.");
    const button = screen.getByRole("button", { name: "Submit for review" });
    await user.click(button);
    expect(button).toBeDisabled();
    await user.click(button);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    await act(async () => finish("sent"));
    expect(button).toBeEnabled();
  });

  it("is keyboard reachable, with tap targets and focus rings on box and button", async () => {
    const user = userEvent.setup();
    render(<StatementSubmission />);
    await user.tab();
    expect(box()).toHaveFocus();
    await user.tab();
    const submit = screen.getByRole("button", { name: "Submit for review" });
    expect(submit).toHaveFocus();
    for (const el of [box(), submit]) expect(el).toHaveClass("tap-target", "focus-visible:ring-[3px]");
  });
});
