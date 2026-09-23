import { render, screen } from "@testing-library/react";

import HomePage from "@/app/page";

describe("Home page", () => {
  it("links to the guide and the forum", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: "Read the guide" })).toHaveAttribute("href", "/guide");
    expect(screen.getByRole("link", { name: "Join the forum" })).toHaveAttribute("href", "/forum");
  });
});
