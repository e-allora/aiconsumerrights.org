import { render, screen } from "@/test-utils";
import userEvent from "@testing-library/user-event";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function SampleCard(props: React.ComponentProps<typeof Card>) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Your right to an explanation</CardTitle>
        <CardDescription>What you can ask for when AI helps decide.</CardDescription>
      </CardHeader>
      <CardContent>Body</CardContent>
      <CardFooter>
        <Button>Learn more</Button>
      </CardFooter>
    </Card>
  );
}

describe("Card", () => {
  it("is an article named by its title", () => {
    render(<SampleCard />);
    const card = screen.getByRole("article", { name: "Your right to an explanation" });
    const title = screen.getByRole("heading", { level: 3, name: "Your right to an explanation" });
    expect(card).toHaveAttribute("aria-labelledby", title.id);
  });

  it("can be a named region (section)", () => {
    render(<SampleCard as="section" />);
    expect(screen.getByRole("region", { name: "Your right to an explanation" })).toBeInTheDocument();
  });

  it("adds no aria-labelledby when rendered as a plain div", () => {
    const { container } = render(<SampleCard as="div" />);
    expect(container.firstElementChild).not.toHaveAttribute("aria-labelledby");
  });

  it("gives each card its own title id", () => {
    render(
      <>
        <SampleCard />
        <SampleCard />
      </>
    );
    const [a, b] = screen.getAllByRole("article");
    expect(a.getAttribute("aria-labelledby")).not.toBe(b.getAttribute("aria-labelledby"));
  });

  it("lets the title match the page outline", () => {
    render(
      <Card>
        <CardTitle as="h2">Top-level card</CardTitle>
      </Card>
    );
    expect(screen.getByRole("heading", { level: 2, name: "Top-level card" })).toBeInTheDocument();
  });

  it("uses the depth-card surface, and depth motion only when interactive", () => {
    const { rerender } = render(<SampleCard />);
    const card = screen.getByRole("article");
    expect(card).toHaveClass("depth-card");
    expect(card).not.toHaveClass("depth-card-interactive");

    rerender(<SampleCard interactive />);
    expect(screen.getByRole("article")).toHaveClass("depth-card", "depth-card-interactive");
  });

  it("keeps controls inside it focusable, with focus rings and tap targets", async () => {
    const user = userEvent.setup();
    render(<SampleCard interactive />);
    await user.tab();
    const button = screen.getByRole("button", { name: "Learn more" });
    expect(button).toHaveFocus();
    expect(button).toHaveClass("tap-target", "focus-visible:ring-[3px]");
  });
});
