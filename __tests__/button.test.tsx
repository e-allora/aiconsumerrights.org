import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";

import { Button } from "@/components/ui/button";

const FOCUS_RING = ["focus-visible:ring-[3px]", "focus-visible:ring-ring", "focus-visible:ring-offset-2"];

describe("Button", () => {
  it("renders a button role named by its text", () => {
    render(<Button>Share your view</Button>);
    expect(screen.getByRole("button", { name: "Share your view" })).toBeInTheDocument();
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it.each(["default", "sm", "lg", "icon"] as const)(
    "size %s has the tap-target minimum and the 3px focus ring",
    (size) => {
      render(
        size === "icon" ? <Button size="icon" aria-label="Close">×</Button> : <Button size={size}>Go</Button>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("tap-target", ...FOCUS_RING);
    }
  );

  it("gives the main sizes at least a 44px height (h-11 = 2.75rem)", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-11");
    render(<Button size="icon" aria-label="Menu">≡</Button>);
    expect(screen.getByRole("button", { name: "Menu" })).toHaveClass("size-11");
  });

  it("names an icon-only button with its aria-label", () => {
    render(<Button size="icon" aria-label="Close dialog"><svg aria-hidden="true" /></Button>);
    expect(screen.getByRole("button", { name: "Close dialog" })).toBeInTheDocument();
  });

  it("requires an aria-label on icon-only buttons at compile time", () => {
    // @ts-expect-error size="icon" without aria-label must not type-check.
    const el = <Button size="icon">×</Button>;
    expect(el).toBeTruthy();
  });

  it("has the press micro-interaction class", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button")).toHaveClass("press");
  });

  it("is reachable by keyboard and fires on Enter and Space", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Vote</Button>);
    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("exposes the disabled state and ignores clicks", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Vote</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders as a link with button styling via asChild", () => {
    render(<Button asChild><a href="/guide">Read the guide</a></Button>);
    const link = screen.getByRole("link", { name: "Read the guide" });
    expect(link).toHaveAttribute("href", "/guide");
    expect(link).not.toHaveAttribute("type");
    expect(link).toHaveClass("tap-target", ...FOCUS_RING);
  });
});
