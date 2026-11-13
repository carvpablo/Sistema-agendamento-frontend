"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Plus } from "lucide-react";
import useAuth, { useAuthHydrated } from "@/store/auth";
import { useNow } from "@/lib/useNow";
import {
  formatCurrency,
  formatDuration,
  getAppointmentWhen,
  getRelativeLabel,
} from "@/lib/format";
import DateLeaf from "./components/DateLeaf";
import { useAppointmentFilter } from "@/store/appointmentFilter";
import { fetchCachedAppointments } from "./appointments/[id]/cachedAppointments";
import {
  getClientAppointmentsCache,
  setClientAppointmentsCache,
} from "@/store/appointmentsClientCache";
import { type Appointment } from "./appointments/[id]/page";

// Referência estável: evita recalcular memos quando ainda não há dados
const NO_APPOINTMENTS: Appointment[] = [];

function getWhenParts(startAt: string, endAt: string, now: number | null) {
  return {
    ...getAppointmentWhen(startAt, endAt),
    relative: getRelativeLabel(startAt, endAt, now),
  };
}

export default function Home() {
  const { user } = useAuth();
  const isAuthHydrated = useAuthHydrated();
  const now = useNow();
  const { setStatusFilter } = useAppointmentFilter();

  const userId = user?.id;
  const userRole = user?.role;
  const cacheKey = `${userRole ?? "user"}:${userId ?? ""}`;

  // Dados buscados nesta sessão, amarrados à conta a que pertencem
  const [fetched, setFetched] = useState<{
    key: string;
    items: Appointment[];
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<number>(0);

  // null = ainda sem dados para esta conta (nem busca, nem cache)
  const loadedAppointments: Appointment[] | null = !userId
    ? NO_APPOINTMENTS
    : fetched?.key === cacheKey
      ? fetched.items
      : (getClientAppointmentsCache(cacheKey) ?? null);
  const appointments = loadedAppointments ?? NO_APPOINTMENTS;
  const isLoadingAppointments =
    Boolean(userId) && loadedAppointments === null && !loadError;

  function retryLoad() {
    setLoadError(null);
    setAttempt((current) => current + 1);
  }

  useEffect(() => {
    if (!userId) return;

    let ignore = false;

    fetchCachedAppointments(userId, userRole)
      .then((data) => {
        if (ignore) return;
        setClientAppointmentsCache(cacheKey, data);
        setFetched({ key: cacheKey, items: data });
        setLoadError(null);
      })
      .catch((err: unknown) => {
        // Com dados em cache, mantém a agenda já exibida; sem eles, avisa a falha
        if (!ignore && !getClientAppointmentsCache(cacheKey)) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar sua agenda.",
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [userId, userRole, cacheKey, attempt]);

  // Sem horário atual (primeiro frame) não dá para separar futuros de passados
  const isAgendaPending = isLoadingAppointments || !now;

  // Futuros e em andamento, em ordem; os já encerrados saem da lista da home
  const upcomingAll = useMemo(() => {
    if (!now) return [];
    return appointments
      .filter(
        (a) => a.status === "SCHEDULED" && new Date(a.endAt).getTime() >= now,
      )
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
  }, [appointments, now]);

  const upcomingScheduled = useMemo(
    () => upcomingAll.slice(0, 4),
    [upcomingAll],
  );

  // Horários que já terminaram mas seguem como "Agendado" no sistema
  const overdueCount = useMemo(() => {
    if (!now) return 0;
    return appointments.filter(
      (a) => a.status === "SCHEDULED" && new Date(a.endAt).getTime() < now,
    ).length;
  }, [appointments, now]);

  // O destaque vai para o primeiro horário ainda não encerrado
  const nextUpcomingId = upcomingScheduled[0]?.id;

  // Contagens só valem com dados carregados; em falha mostramos "—", nunca 0
  const countsUnavailable = isAgendaPending || loadError;

  const completedCount = useMemo(
    () => appointments.filter((a) => a.status === "COMPLETED").length,
    [appointments],
  );
  const counts = {
    scheduled: upcomingAll.length,
    completed: completedCount,
  };

  // Antes de ler a sessão salva, `user` é sempre null: não confundir com visitante
  if (!user && !isAuthHydrated) {
    return (
      <main aria-busy="true" aria-label="Carregando" className="py-20">
        <div className="mx-auto max-w-3xl space-y-4 animate-pulse">
          <div className="h-10 w-3/4 mx-auto rounded bg-muted" />
          <div className="h-4 w-1/2 mx-auto rounded bg-muted" />
        </div>
      </main>
    );
  }

  // Visitante não autenticado: Landing Page pública
  if (!user) {
    return (
      <main className="py-12 sm:py-20">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground balance">
            Agende serviços com praticidade e rapidez
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Conectamos clientes aos melhores profissionais. Confira preços
            transparentes, escolha horários livres sem conflito e acompanhe sua
            agenda em um único lugar.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/services"
              className="px-6 py-3 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            >
              Explorar Serviços
            </Link>

            <Link
              href="/auth/user/signin"
              className="px-6 py-3 rounded-xl font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-all"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>

        <div className="mt-20 border-t border-border pt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Catálogo Transparente
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Visualize o valor exato, o profissional responsável e o tempo
              estimado de duração antes mesmo de confirmar.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Horários Sem Conflito
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os horários exibidos consideram automaticamente as janelas abertas
              pelo profissional e a duração de cada serviço.
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-base font-bold text-foreground">
              Gestão para Profissionais
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cadastre seus próprios serviços, abra janelas de disponibilidade e
              acompanhe sua agenda de clientes em tempo real.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Painel Logado (Cliente ou Profissional)
  const isProfessional = user.role === "professional";
  const firstName = user.name.split(" ")[0];

  return (
    <main className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Olá, {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isProfessional
              ? "Gerencie seus serviços, janelas de disponibilidade e atendimentos agendados."
              : "Acompanhe seus horários marcados e agende novos serviços."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isProfessional ? (
            <>
              <Link
                href="/availability"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors"
              >
                <Clock aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={1.5} />
                Disponibilidade
              </Link>
              <Link
                href="/services/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                <Plus aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={2} />
                Novo Serviço
              </Link>
            </>
          ) : (
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              <Plus aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={2} />
              Agendar Novo Serviço
            </Link>
          )}
        </div>
      </div>

      {/* Agenda: o próximo horário lidera; contagens viram uma linha de apoio */}
      <section className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-card-foreground">
              {isProfessional
                ? "Próximos Atendimentos"
                : "Meus Próximos Agendamentos"}
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              <span>
                {countsUnavailable ? "—" : counts.scheduled}{" "}
                {counts.scheduled === 1 ? "agendado" : "agendados"}
              </span>
              {isProfessional ? (
                <>
                  {" · "}
                  <Link
                    href={`/services/${user.id}`}
                    className="hover:text-foreground hover:underline underline-offset-4 transition-colors"
                  >
                    Gerenciar meus serviços
                  </Link>
                </>
              ) : (
                <>
                  {" · "}
                  <Link
                    href={`/appointments/${user.id}?status=COMPLETED`}
                    onClick={() => setStatusFilter("COMPLETED")}
                    className="hover:text-foreground hover:underline underline-offset-4 transition-colors"
                  >
                    {countsUnavailable ? "—" : counts.completed}{" "}
                    {counts.completed === 1 ? "concluído" : "concluídos"}
                  </Link>
                </>
              )}
            </p>
          </div>
          <Link
            href={`/appointments/${user.id}?status=SCHEDULED`}
            onClick={() => setStatusFilter("SCHEDULED")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary dark:text-accent-foreground hover:opacity-80 transition-opacity shrink-0 py-1 rounded-sm"
          >
            Ver todos
            <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        {isAgendaPending && !loadError ? (
          <ul
            aria-busy="true"
            aria-label="Carregando sua agenda"
            className="border-t border-border divide-y divide-border"
          >
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                aria-hidden="true"
                className="flex items-center gap-4 px-6 py-4 animate-pulse"
              >
                <div className="w-14 h-[66px] shrink-0 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-3.5 w-40 max-w-full rounded bg-muted" />
                  <div className="h-3.5 w-28 rounded bg-muted" />
                  <div className="h-3 w-32 rounded bg-muted" />
                </div>
                <div className="h-3.5 w-16 rounded bg-muted" />
              </li>
            ))}
          </ul>
        ) : loadError ? (
          <div
            role="alert"
            className="px-6 py-10 text-center space-y-3 border-t border-border"
          >
            <p className="text-sm font-medium text-foreground">
              {loadError}
            </p>
            <p className="text-xs text-muted-foreground">
              Seus agendamentos não foram apagados. Verifique sua conexão e
              tente novamente.
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
        ) : upcomingScheduled.length === 0 ? (
          <div className="px-6 py-10 text-center space-y-3 border-t border-border">
            <p className="text-sm font-medium text-foreground">
              Nenhum horário agendado no momento.
            </p>
            <p className="text-xs text-muted-foreground">
              {isProfessional
                ? "Mantenha seus horários de disponibilidade atualizados para receber novos agendamentos."
                : "Escolha um serviço no catálogo e reserve um horário livre."}
            </p>
            <div className="pt-1">
              <Link
                href={isProfessional ? "/availability" : "/services"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors"
              >
                {isProfessional
                  ? "Configurar Disponibilidade"
                  : "Ver serviços disponíveis"}
              </Link>
            </div>
          </div>
        ) : (
          <ul className="border-t border-border divide-y divide-border">
            {upcomingScheduled.map((appt) => {
              const counterpartName = isProfessional
                ? appt.client?.name
                : appt.professional?.name;
              const counterpartLabel = isProfessional
                ? "Cliente"
                : "Profissional";
              const when = getWhenParts(appt.startAt, appt.endAt, now);
              const durationMin =
                appt.service?.durationMinutes ?? when.durationMin;
              const isNext = appt.id === nextUpcomingId;

              return (
                <li key={appt.id}>
                  <Link
                    href={`/appointments/${user.id}?status=SCHEDULED&highlight=${appt.id}`}
                    onClick={() => setStatusFilter("SCHEDULED")}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted focus-visible:outline-none focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring transition-colors"
                  >
                    <DateLeaf
                      weekday={when.weekday}
                      day={when.day}
                      month={when.month}
                      longDate={when.longDate}
                      emphasized={isNext}
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold text-card-foreground truncate">
                        {appt.service?.name || "Serviço Agendado"}
                      </p>
                      <p className="text-sm text-foreground tabular-nums">
                        <span className="font-medium">
                          {when.timeRange}
                        </span>
                        {durationMin ? (
                          <span className="text-muted-foreground">
                            {" · "}
                            {formatDuration(durationMin)}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {counterpartName
                          ? `${counterpartLabel}: ${counterpartName}`
                          : null}
                        {counterpartName && when.relative ? " · " : null}
                        {when.relative ? (
                          <span
                            className={
                              isNext ? "font-medium text-accent-foreground" : undefined
                            }
                          >
                            {when.relative}
                          </span>
                        ) : null}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                      {formatCurrency(appt.servicePrice)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {!isAgendaPending && !loadError && overdueCount > 0 && (
          <div className="border-t border-border px-6 py-3 text-xs text-muted-foreground">
            {isProfessional
              ? overdueCount === 1
                ? "1 atendimento anterior permanece registrado no histórico como agendado."
                : `${overdueCount} atendimentos anteriores permanecem registrados no histórico como agendados.`
              : overdueCount === 1
                ? "1 horário anterior ainda consta como agendado enquanto aguarda confirmação de conclusão pelo profissional."
                : `${overdueCount} horários anteriores ainda constam como agendados enquanto aguardam confirmação de conclusão pelo profissional.`}
          </div>
        )}
      </section>
    </main>
  );
}
