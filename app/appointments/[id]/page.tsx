"use client";

import { useEffect, useMemo, useState } from "react";
import useAuth from "@/store/auth";
import AppointmentList from "@/app/components/AppointmentList";
import { fetchCachedAppointments } from "./cachedAppointments";
import { invalidateAppointmentsCache } from "@/app/actions/cacheActions";
import {
  getClientAppointmentsCache,
  setClientAppointmentsCache,
} from "@/store/appointmentsClientCache";

type StatusFilter = "SCHEDULED" | "CANCELLED" | "COMPLETED" | "ALL";

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
  const { user } = useAuth();
  const userId = user?.id;
  const cacheKey = `${user?.role ?? "user"}:${userId ?? ""}`;
  const cachedInitial = userId
    ? getClientAppointmentsCache(cacheKey)
    : undefined;

  const [appointments, setAppointments] = useState<Appointment[]>(
    cachedInitial ?? [],
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("SCHEDULED");
  const [isLoading, setIsLoading] = useState<boolean>(!cachedInitial);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "ALL") return appointments;
    return appointments.filter((appt) => appt.status === statusFilter);
  }, [appointments, statusFilter]);

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancellingId(appointmentId);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3000/appointments/${appointmentId}/cancel`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível cancelar o agendamento.",
        );
      }

      setAppointments((prev) => {
        const updated = prev.map((appt) =>
          appt.id === appointmentId
            ? { ...appt, status: "CANCELLED" as const }
            : appt,
        );
        if (userId) {
          setClientAppointmentsCache(cacheKey, updated);
        }
        return updated;
      });
      await invalidateAppointmentsCache(userId);
    } catch (err: any) {
      setError(err.message || "Erro ao cancelar agendamento.");
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    async function fetchAppointments() {
      if (!userId) return;

      const existingCache = getClientAppointmentsCache(cacheKey);
      if (existingCache) {
        setAppointments(existingCache);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await fetchCachedAppointments(userId, user?.role);
        setClientAppointmentsCache(cacheKey, data);
        setAppointments(data);
      } catch (err: any) {
        if (!existingCache) {
          setError(err.message || "Erro ao carregar agendamentos.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointments();
  }, [userId, user?.role, cacheKey]);

  return (
    <main className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Meus Agendamentos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe o histórico e status dos seus horários marcados.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label
            htmlFor="status-filter"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
          >
            Filtrar por:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2.5 rounded-xl bg-card border border-input text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring hover:border-primary/50 transition-all cursor-pointer shadow-xs"
          >
            <option value="SCHEDULED">Agendados</option>
            <option value="CANCELLED">Cancelados</option>
            <option value="COMPLETED">Concluídos</option>
            <option value="ALL">Todos os agendamentos</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-muted-foreground animate-pulse">
          Carregando seus agendamentos...
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {!isLoading && (
        <AppointmentList
          appointmentList={filteredAppointments}
          onCancel={handleCancelAppointment}
          cancellingId={cancellingId}
        />
      )}
    </main>
  );
}
