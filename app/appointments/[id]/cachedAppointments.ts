"use cache: private";

import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { type Appointment } from "./page";

export async function fetchCachedAppointments(
  id: string,
  role?: string,
): Promise<Appointment[]> {
  cacheLife({ stale: 300, expire: 600 });
  cacheTag("appointments", `appointments:${id}`);

  const cookieStore = await cookies();
  const token = cookieStore.get("jwt_token")?.value;

  const baseUrl =
    role === "professional"
      ? `http://localhost:3000/professionals/${id}/appointments`
      : `http://localhost:3000/clients/${id}/appointments`;

  const response = await fetch(baseUrl, {
    headers: token ? { Cookie: `jwt_token=${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Falha ao buscar os agendamentos.");
  }

  return response.json();
}

