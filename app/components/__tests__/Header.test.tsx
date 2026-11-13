import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Header from "../Header";

describe("Header Component", () => {
  it("renderiza o logo/marca com link para a página inicial", () => {
    render(<Header />);

    const brandLink = screen.getByRole("link", { name: "Agendamentos!" });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute("href", "/");
  });

  it("renderiza o link de navegação para serviços", () => {
    render(<Header />);

    const servicesLink = screen.getByRole("link", { name: "Serviços" });
    expect(servicesLink).toBeInTheDocument();
    expect(servicesLink).toHaveAttribute("href", "/services");
  });

  it("renderiza botões de login para Cliente e Profissional com seus respectivos links", () => {
    render(<Header />);

    const clientLoginLink = screen.getByRole("link", { name: "Cliente" });
    expect(clientLoginLink).toBeInTheDocument();
    expect(clientLoginLink).toHaveAttribute("href", "/auth/user/login");

    const proLoginLink = screen.getByRole("link", { name: "Profissional" });
    expect(proLoginLink).toBeInTheDocument();
    expect(proLoginLink).toHaveAttribute("href", "/auth/professional/login");
  });
});

