import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ServiceList from "../ServiceList";
import useAuth from "@/store/auth";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/app/actions/cacheActions", () => ({
  invalidateServicesCache: vi.fn().mockResolvedValue(undefined),
}));

const sampleServices = [
  {
    id: "service-1",
    name: "Corte de Cabelo",
    description: "Corte masculino completo",
    durationMinutes: 45,
    price: 60,
    professionalServices: [
      {
        professional: {
          id: "prof-1",
          name: "Julia Silva",
        },
      },
    ],
  },
];

describe("ServiceList Component", () => {
  beforeEach(() => {
    useAuth.setState({ user: null });
    vi.restoreAllMocks();
  });

  it("não exibe os botões de editar ou excluir para visitantes ou clientes", () => {
    useAuth.setState({
      user: {
        id: "client-1",
        name: "Cliente Teste",
        email: "cliente@email.com",
        role: "user",
      },
    });

    render(<ServiceList serviceList={sampleServices} />);

    expect(
      screen.queryByRole("button", { name: /editar serviço/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /excluir serviço/i }),
    ).not.toBeInTheDocument();
  });

  it("permite ao profissional dono editar o próprio serviço inline e atualizar o card", async () => {
    const user = userEvent.setup();
    useAuth.setState({
      user: {
        id: "prof-1",
        name: "Julia Silva",
        email: "julia@email.com",
        role: "professional",
      },
    });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "service-1",
        name: "Corte Degradê Premium",
        description: "Corte atualizado com lavagem",
        durationMinutes: 60,
        price: 85,
      }),
    } as Response);

    render(
      <ServiceList
        serviceList={sampleServices}
        ownerProfessionalId="prof-1"
      />,
    );

    const editButton = screen.getByRole("button", {
      name: "Editar serviço Corte de Cabelo",
    });
    await user.click(editButton);

    const nameInput = screen.getByLabelText("Nome do Serviço");
    await user.clear(nameInput);
    await user.type(nameInput, "Corte Degradê Premium");

    const priceInput = screen.getByLabelText("Valor Cobrado");
    await user.clear(priceInput);
    await user.type(priceInput, "85");

    const preset60 = screen.getByRole("button", { name: "1h" });
    await user.click(preset60);

    const saveButton = screen.getByRole("button", {
      name: "Salvar alterações",
    });
    await user.click(saveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/services/service-1"),
        expect.objectContaining({
          method: "PATCH",
          credentials: "include",
        }),
      );
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      /Alterações em Corte Degradê Premium salvas com sucesso/i,
    );
    expect(
      screen.getByRole("heading", { name: "Corte Degradê Premium" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1h")).toBeInTheDocument();
  });

  it("exibe o botão de excluir para o profissional dono do serviço e confirma a exclusão inline", async () => {
    const user = userEvent.setup();
    useAuth.setState({
      user: {
        id: "prof-1",
        name: "Julia Silva",
        email: "julia@email.com",
        role: "professional",
      },
    });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "Service deleted successfully" }),
    } as Response);

    render(
      <ServiceList
        serviceList={sampleServices}
        ownerProfessionalId="prof-1"
      />,
    );

    const deleteButton = screen.getByRole("button", {
      name: "Excluir serviço Corte de Cabelo",
    });
    expect(deleteButton).toBeInTheDocument();

    await user.click(deleteButton);

    expect(
      screen.getByRole("button", { name: "Manter serviço" }),
    ).toBeInTheDocument();
    const confirmButton = screen.getByRole("button", {
      name: "Confirmar exclusão",
    });

    await user.click(confirmButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/services/service-1"),
        expect.objectContaining({
          method: "DELETE",
          credentials: "include",
        }),
      );
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      /Serviço Corte de Cabelo excluído do seu catálogo/i,
    );
  });
});
