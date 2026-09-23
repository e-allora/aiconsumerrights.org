import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PLACEHOLDER, StatementSubmission } from "@/components/forum/StatementSubmission";

const box = () => screen.getByRole("textbox", { name: "Suggest a statement for others to vote on" });

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
    const onSubmit = jest.fn();
    render(<StatementSubmission onSubmit={onSubmit} />);
    await user.type(box(), "  Reasons should be plain.  ");
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(onSubmit).toHaveBeenCalledWith("Reasons should be plain.");
    expect(box()).toHaveValue("");
    expect(screen.getByText("Thank you. Your statement is waiting for review.")).toBeInTheDocument();
  });

  it("says honestly that nothing was sent while there is no server", async () => {
    const user = userEvent.setup();
    render(<StatementSubmission />);
    await user.type(box(), "Reasons should be plain.");
    await user.keyboard("{Tab}{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("your statement was not sent anywhere yet");
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
