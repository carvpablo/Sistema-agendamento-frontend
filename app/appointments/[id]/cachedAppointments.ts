import { type Appointment } from "./page";
import { API_URL } from "@/lib/api";

export async function fetchCachedAppointments(
  id: string,
  role?: string,
): Promise<Appointment[]> {
  const baseUrl =
    role === "professional"
      ? `${API_URL}/professionals/${id}/appointments`
      : `${API_URL}/clients/${id}/appointments`;

  const response = await fetch(baseUrl, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Sua sessão expirou ou você não tem permissão para acessar esta agenda. Entre novamente na sua conta.",
      );
    }

    let serverMessage: string | undefined;
    try {
      const errorData = (await response.json()) as { error?: string };
      serverMessage = errorData?.error;
    } catch {
      // Ignora erro de parse JSON e usa mensagem padrão
    }

    throw new Error(serverMessage || "Falha ao buscar os agendamentos.");
  }

  return response.json();
}
