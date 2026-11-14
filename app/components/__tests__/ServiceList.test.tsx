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

  it("não exibe o botão de excluir para visitantes ou clientes", () => {
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
      screen.queryByRole("button", { name: /excluir serviço/i }),
    ).not.toBeInTheDocument();
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
