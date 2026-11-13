"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useAuth, { useAuthHydrated } from "@/store/auth";
import {
  useAppointmentFilter,
  type AppointmentStatusFilter,
} from "@/store/appointmentFilter";
import AppointmentList from "@/app/components/AppointmentList";
import { fetchCachedAppointments } from "./cachedAppointments";
import { invalidateAppointmentsCache } from "@/app/actions/cacheActions";
import { API_URL } from "@/lib/api";
import {
  getClientAppointmentsCache,
  setClientAppointmentsCache,
} from "@/store/appointmentsClientCache";
import { useNow } from "@/lib/useNow";
import { cn } from "@/lib/utils";

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

const STATUS_TABS: { id: AppointmentStatusFilter; label: string }[] = [
  { id: "SCHEDULED", label: "Agendados" },
  { id: "COMPLETED", label: "Concluídos" },
  { id: "CANCELLED", label: "Cancelados" },
  { id: "ALL", label: "Todos" },
];

function parseStatusFilter(value: string | null): AppointmentStatusFilter | null {
  const match = STATUS_TABS.find((tab) => tab.id === value);
  return match ? match.id : null;
}

/**
 * Próximos horários primeiro (do mais próximo ao mais distante); depois o
 * restante, do mais recente ao mais antigo.
 */
function sortAppointments(list: Appointment[], now: number): Appointment[] {
  const startOf = (a: Appointment) => new Date(a.startAt).getTime();
  const isUpcoming = (a: Appointment) =>
    a.status === "SCHEDULED" && (!now || new Date(a.endAt).getTime() >= now);

  const upcoming = list.filter(isUpcoming).sort((a, b) => startOf(a) - startOf(b));
  const rest = list.filter((a) => !isUpcoming(a)).sort((a, b) => startOf(b) - startOf(a));
  return [...upcoming, ...rest];
}

function AppointmentsSkeleton() {
  return (
    <ul
      aria-busy="true"
      aria-label="Carregando seus agendamentos"
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {[0, 1].map((i) => (
        <li
          key={i}
          aria-hidden="true"
          className="rounded-2xl bg-card border border-border p-5 space-y-4 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-[66px] shrink-0 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-40 max-w-full rounded bg-muted" />
              <div className="h-3.5 w-28 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-5 w-24 rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function UserAppointmentsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const isAuthHydrated = useAuthHydrated();
  const now = useNow();
  const { statusFilter, setStatusFilter } = useAppointmentFilter();

  const userId = user?.id;
  const cacheKey = `${user?.role ?? "user"}:${userId ?? ""}`;
  const cachedInitial = userId
    ? getClientAppointmentsCache(cacheKey)
    : undefined;

  // Filtro na URL tem prioridade; se ausente, usa o store ou padrão "SCHEDULED"
  const urlStatus = parseStatusFilter(searchParams.get("status"));
  const activeFilter: AppointmentStatusFilter = urlStatus ?? statusFilter ?? "SCHEDULED";
  const highlightId = searchParams.get("highlight");

  // Sincroniza store quando o URL traz status específico
  useEffect(() => {
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
  }, [urlStatus, statusFilter, setStatusFilter]);

  const [appointments, setAppointments] = useState<Appointment[]>(
    cachedInitial ?? [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(!cachedInitial);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [cancelledServiceName, setCancelledServiceName] = useState<
    string | null
  >(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<number>(0);
  const cancelNoticeRef = useRef<HTMLDivElement>(null);

  function retryLoad() {
    setLoadError(null);
    setIsLoading(true);
    setAttempt((current) => current + 1);
  }

  // Contagem por status em tempo real
  const counts = useMemo(() => {
    const scheduled = appointments.filter((a) => a.status === "SCHEDULED").length;
    const completed = appointments.filter((a) => a.status === "COMPLETED").length;
    const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;
    return {
      SCHEDULED: scheduled,
      COMPLETED: completed,
      CANCELLED: cancelled,
      ALL: appointments.length,
    };
  }, [appointments]);

  const handleFilterChange = (nextFilter: AppointmentStatusFilter) => {
    setStatusFilter(nextFilter);
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", nextFilter);
    params.delete("highlight"); // Limpa destaque ao alternar abas conscientemente
    const qs = params.toString();
    router.replace(`${pathname}?${qs}`, { scroll: false });
  };

  const filteredAppointments = useMemo(() => {
    const visible =
      activeFilter === "ALL"
        ? appointments
        : appointments.filter((appt) => appt.status === activeFilter);
    return sortAppointments(visible, now);
  }, [appointments, activeFilter, now]);

  const handleCancelAppointment = async (appointmentId: string) => {
    const cancelledName =
      appointments.find((appt) => appt.id === appointmentId)?.service?.name ??
      "o agendamento";
    setCancellingId(appointmentId);
    setActionError(null);
    setCancelledServiceName(null);

    try {
      const response = await fetch(
        `${API_URL}/appointments/${appointmentId}/cancel`,
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
      setCancelledServiceName(cancelledName);
      await invalidateAppointmentsCache(userId);
    } catch (err: unknown) {
      setActionError({
        id: appointmentId,
        message:
          err instanceof Error
            ? err.message
            : "Erro ao cancelar agendamento.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  // O card cancelado sai do filtro atual: o foco vai para o aviso
  useEffect(() => {
    if (cancelledServiceName) cancelNoticeRef.current?.focus();
  }, [cancelledServiceName]);

  useEffect(() => {
    let ignore = false;

    async function fetchAppointments() {
      if (!userId) return;

      const existingCache = getClientAppointmentsCache(cacheKey);
      if (existingCache) {
        setAppointments(existingCache);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      setLoadError(null);

      try {
        const data = await fetchCachedAppointments(userId, user?.role);
        if (ignore) return;
        setClientAppointmentsCache(cacheKey, data);
        setAppointments(data);
      } catch (err: unknown) {
        if (!ignore && !existingCache) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar seus agendamentos.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    fetchAppointments();
    return () => {
      ignore = true;
    };
  }, [userId, user?.role, cacheKey, attempt]);

  const isProfessional = user?.role === "professional";

  // Evita exibir abas vazias com contagem 0 antes da hidratação da sessão
  if (!isAuthHydrated && !userId) {
    return (
      <main className="space-y-8">
        <AppointmentsSkeleton />
      </main>
    );
  }

  // Sessão lida e sem usuário autenticado
  if (isAuthHydrated && !userId) {
    return (
      <main className="space-y-8">
        <div className="rounded-2xl bg-card border border-border p-10 text-center space-y-3">
          <h1 className="text-lg font-semibold text-foreground">
            Entre na sua conta para ver seus agendamentos
          </h1>
          <p className="text-xs text-muted-foreground">
            Sua sessão não foi encontrada neste navegador.
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/auth/user/login"
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              Entrar como cliente
            </Link>
            <Link
              href="/auth/professional/login"
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors"
            >
              Entrar como profissional
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {isProfessional ? "Agenda de Clientes" : "Meus Agendamentos"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isProfessional
              ? "Acompanhe os atendimentos marcados pelos seus clientes."
              : "Acompanhe o histórico e status dos seus horários marcados."}
          </p>
        </div>

        {/* Abas de filtro respaldadas na URL com contagens */}
        <div
          role="tablist"
          aria-label="Filtrar agendamentos por status"
          className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0"
        >
          {STATUS_TABS.map((tab, index) => {
            const isSelected = activeFilter === tab.id;
            const count = counts[tab.id];
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                id={`tab-${tab.id.toLowerCase()}`}
                tabIndex={isSelected ? 0 : -1}
                aria-selected={isSelected}
                aria-controls="appointments-panel"
                onClick={() => handleFilterChange(tab.id)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const dir = e.key === "ArrowRight" ? 1 : -1;
                  const nextIndex =
                    (index + dir + STATUS_TABS.length) % STATUS_TABS.length;
                  const nextTab = STATUS_TABS[nextIndex];
                  handleFilterChange(nextTab.id);
                  document
                    .getElementById(`tab-${nextTab.id.toLowerCase()}`)
                    ?.focus();
                }}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums leading-none",
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border/60",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {cancelledServiceName && (
        <div
          ref={cancelNoticeRef}
          tabIndex={-1}
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>
            Agendamento de{" "}
            <span className="font-semibold">{cancelledServiceName}</span>{" "}
            cancelado. O horário foi liberado.
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleFilterChange("CANCELLED");
                setCancelledServiceName(null);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Ver cancelados
            </button>
            <Link
              href="/services"
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold transition-colors"
            >
              Agendar outro serviço
            </Link>
            <button
              type="button"
              onClick={() => setCancelledServiceName(null)}
              className="px-2.5 py-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div
        id="appointments-panel"
        role="tabpanel"
        aria-labelledby={`tab-${activeFilter.toLowerCase()}`}
      >
        {isLoading ? (
          <AppointmentsSkeleton />
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-2xl bg-card border border-border p-10 text-center space-y-3"
          >
            <p className="text-sm font-medium text-foreground">{loadError}</p>
            <p className="text-xs text-muted-foreground">
              Seus agendamentos não foram apagados. Verifique sua conexão e tente
              novamente.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={retryLoad}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors cursor-pointer"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <AppointmentList
            appointmentList={filteredAppointments}
            onCancel={isProfessional ? undefined : handleCancelAppointment}
            cancellingId={cancellingId}
            cancelError={actionError}
            onDismissCancelError={() => setActionError(null)}
            highlightId={highlightId}
            isProfessional={isProfessional}
            isFiltered={activeFilter !== "ALL" && appointments.length > 0}
            onResetFilter={() => handleFilterChange("ALL")}
            emptyActionHref={isProfessional ? "/availability" : "/services"}
            emptyActionLabel={
              isProfessional
                ? "Configurar Disponibilidade"
                : "Ver serviços disponíveis"
            }
          />
        )}
      </div>
    </main>
  );
}

export default function UserAppointmentsPage() {
  return (
    <Suspense
      fallback={
        <main className="space-y-8">
          <AppointmentsSkeleton />
        </main>
      }
    >
      <UserAppointmentsView />
    </Suspense>
  );
}
