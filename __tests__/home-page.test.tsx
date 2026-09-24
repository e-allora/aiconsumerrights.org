import { render, screen } from "@/test-utils";

import HomePage from "@/app/[locale]/page";

describe("Home page", () => {
  it("links to the guide and the forum in English", () => {
    render(<HomePage params={{ locale: "en" }} />);
    expect(screen.getByRole("link", { name: "Read the guide" })).toHaveAttribute("href", "/en/guide");
    expect(screen.getByRole("link", { name: "Join the forum" })).toHaveAttribute("href", "/en/forum");
  });

  it("links to the Spanish guide and forum in Spanish", () => {
    render(<HomePage params={{ locale: "es" }} />, { locale: "es" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Derechos del Consumidor frente a la IA");
    expect(screen.getByRole("link", { name: "Lee la guía" })).toHaveAttribute("href", "/es/guide");
    expect(screen.getByRole("link", { name: "Únete al foro" })).toHaveAttribute("href", "/es/forum");
  });
});
