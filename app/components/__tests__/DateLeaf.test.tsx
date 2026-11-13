import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DateLeaf from "../DateLeaf";

describe("DateLeaf Component", () => {
  it("renderiza o dia da semana, número do dia e mês corretamente", () => {
    // 1. Arrange / Act: Monta o componente com props simuladas
    render(
      <DateLeaf
        weekday="TER"
        day="14"
        month="NOV"
        longDate="Terça-feira, 14 de Novembro"
      />,
    );

    // 2. Assert: Verifica se os textos visíveis estão presentes no documento
    expect(screen.getByText("TER")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText("NOV")).toBeInTheDocument();
  });

  it("renderiza a data completa oculta para leitores de tela (acessibilidade)", () => {
    render(
      <DateLeaf
        weekday="QUA"
        day="15"
        month="NOV"
        longDate="Quarta-feira, 15 de Novembro de 2026"
      />,
    );

    // O texto deve existir no DOM para ferramentas de tecnologia assistiva
    const srOnlyText = screen.getByText("Quarta-feira, 15 de Novembro de 2026.");
    expect(srOnlyText).toBeInTheDocument();
    expect(srOnlyText).toHaveClass("sr-only");
  });

  it("aplica estilo padrão (muted) quando emphasized não é informado", () => {
    const { container } = render(
      <DateLeaf
        weekday="SEG"
        day="10"
        month="AGO"
        longDate="Segunda-feira, 10 de Agosto"
      />,
    );

    // O bloco visual tem aria-hidden="true"
    const leafContainer = container.querySelector('[aria-hidden="true"]');
    expect(leafContainer).toHaveClass("bg-muted");
    expect(leafContainer).toHaveClass("text-muted-foreground");
  });

  it("aplica estilo destacado (accent) quando emphasized é true", () => {
    const { container } = render(
      <DateLeaf
        weekday="SEX"
        day="20"
        month="DEZ"
        longDate="Sexta-feira, 20 de Dezembro"
        emphasized={true}
      />,
    );

    const leafContainer = container.querySelector('[aria-hidden="true"]');
    expect(leafContainer).toHaveClass("bg-accent");
    expect(leafContainer).toHaveClass("text-accent-foreground");
  });
});

