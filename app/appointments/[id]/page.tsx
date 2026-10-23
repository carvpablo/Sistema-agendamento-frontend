"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import useAuth from "@/store/auth";
import AppointmentList from "@/app/components/AppointmentList";

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  servicePrice: number;
  startAt: string;
  endAt: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  professional?: {
    name: string;
  };
  client?: {
    name: string;
    email: string;
  };
  service?: {
    name: string;
    durationMinutes: number;
    price: number;
  };
}

export default function UserAppointmentsPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppointments() {
      if (!params?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const baseUrl =
          user?.role === "professional"
            ? `http://localhost:3000/professionals/${params.id}/appointments`
            : `http://localhost:3000/clients/${params.id}/appointments`;

        const response = await fetch(baseUrl, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Falha ao buscar os agendamentos.");
        }

        const data: Appointment[] = await response.json();
        setAppointments(data);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar agendamentos.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointments();
  }, [params?.id, user?.role]);

  return (
    <main className="space-y-8">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Meus Agendamentos
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Acompanhe o histórico e status dos seus horários marcados.
        </p>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-slate-400 animate-pulse">
          Carregando seus agendamentos...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <AppointmentList appointmentList={appointments} />
      )}
    </main>
  );
}
