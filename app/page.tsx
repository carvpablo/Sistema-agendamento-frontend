"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Clock,
  Plus,
  Sparkles,
} from "lucide-react";
import useAuth from "@/store/auth";
import { useAppointmentFilter } from "@/store/appointmentFilter";
import { fetchCachedAppointments } from "./appointments/[id]/cachedAppointments";
import {
  getClientAppointmentsCache,
  setClientAppointmentsCache,
} from "@/store/appointmentsClientCache";
import { type Appointment } from "./appointments/[id]/page";

export default function Home() {
  const { user } = useAuth();
  const { setStatusFilter } = useAppointmentFilter();

  const userId = user?.id;
  const cacheKey = `${user?.role ?? "user"}:${userId ?? ""}`;
  const cachedInitial = userId
    ? getClientAppointmentsCache(cacheKey)
    : undefined;

  const [fetchedAppointments, setFetchedAppointments] = useState<{
    key: string;
    data: Appointment[];
  } | null>(null);

  const appointments = useMemo(() => {
    if (fetchedAppointments?.key === cacheKey) {
      return fetchedAppointments.data;
    }
    return cachedInitial ?? [];
  }, [fetchedAppointments, cacheKey, cachedInitial]);

  const isLoadingAppointments =
    Boolean(userId) &&
    !cachedInitial &&
    fetchedAppointments?.key !== cacheKey;

  useEffect(() => {
    if (!userId) return;

    let ignore = false;

    fetchCachedAppointments(userId, user?.role)
      .then((data) => {
        if (ignore) return;
        setClientAppointmentsCache(cacheKey, data);
        setFetchedAppointments({ key: cacheKey, data });
      })
      .catch(() => {
        if (!ignore) {
          setFetchedAppointments({ key: cacheKey, data: cachedInitial ?? [] });
        }
      });

    return () => {
      ignore = true;
    };
  }, [userId, user?.role, cacheKey, cachedInitial]);

  const upcomingScheduled = useMemo(() => {
    return appointments
      .filter((a) => a.status === "SCHEDULED")
      .sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      )
      .slice(0, 4);
  }, [appointments]);

  const counts = useMemo(() => {
    let scheduled = 0;
    let completed = 0;
    for (const appt of appointments) {
      if (appt.status === "SCHEDULED") scheduled++;
      else if (appt.status === "COMPLETED") completed++;
    }
    return { scheduled, completed, total: appointments.length };
  }, [appointments]);

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
              : "Confira seus próximos horários marcados ou explore novos serviços para agendar."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isProfessional ? (
            <>
              <Link
                href="/availability"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors"
              >
                <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                Disponibilidade
              </Link>
              <Link
                href="/services/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} />
                Novo Serviço
              </Link>
            </>
          ) : (
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              Agendar Novo Serviço
            </Link>
          )}
        </div>
      </div>

      {/* Resumo factual da agenda do usuário */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href={`/appointments/${user.id}`}
          onClick={() => setStatusFilter("SCHEDULED")}
          className="group rounded-xl bg-card border border-border p-5 flex items-center justify-between hover:border-primary/50 transition-colors"
        >
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground block">
              {isProfessional ? "Atendimentos Agendados" : "Horários Agendados"}
            </span>
            <span className="text-2xl font-extrabold text-card-foreground tabular-nums block">
              {isLoadingAppointments ? "—" : counts.scheduled}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-accent text-accent-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Calendar className="w-4 h-4" strokeWidth={1.5} />
          </div>
        </Link>

        {isProfessional ? (
          <Link
            href={`/services/${user.id}`}
            className="group rounded-xl bg-card border border-border p-5 flex items-center justify-between hover:border-primary/50 transition-colors"
          >
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">
                Catálogo Profissional
              </span>
              <span className="text-base font-bold text-card-foreground block">
                Ver e gerenciar meus serviços
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-accent text-accent-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Briefcase className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </Link>
        ) : (
          <Link
            href={`/appointments/${user.id}`}
            onClick={() => setStatusFilter("COMPLETED")}
            className="group rounded-xl bg-card border border-border p-5 flex items-center justify-between hover:border-primary/50 transition-colors"
          >
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground block">
                Serviços Concluídos
              </span>
              <span className="text-2xl font-extrabold text-card-foreground tabular-nums block">
                {isLoadingAppointments ? "—" : counts.completed}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-accent text-accent-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
            </div>
          </Link>
        )}
      </div>

      {/* Lista de próximos agendamentos reais */}
      <section className="rounded-xl bg-card border border-border p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-base font-bold text-card-foreground">
            {isProfessional
              ? "Próximos Atendimentos"
              : "Meus Próximos Agendamentos"}
          </h2>
          <Link
            href={`/appointments/${user.id}`}
            onClick={() => setStatusFilter("SCHEDULED")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            Ver todos
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        {isLoadingAppointments ? (
          <div className="py-8 text-center text-sm text-muted-foreground animate-pulse">
            Carregando agenda...
          </div>
        ) : upcomingScheduled.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <p className="text-sm font-medium text-foreground">
              Nenhum horário agendado no momento.
            </p>
            <p className="text-xs text-muted-foreground">
              {isProfessional
                ? "Mantenha seus horários de disponibilidade atualizados para receber novos agendamentos."
                : "Explore o catálogo de serviços para reservar seu próximo horário."}
            </p>
            <div className="pt-1">
              <Link
                href={isProfessional ? "/availability" : "/services"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors"
              >
                {isProfessional
                  ? "Configurar Disponibilidade"
                  : "Explorar Catálogo"}
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {upcomingScheduled.map((appt) => {
              const counterpartName = isProfessional
                ? appt.client?.name
                : appt.professional?.name;
              const counterpartLabel = isProfessional
                ? "Cliente"
                : "Profissional";

              return (
                <li
                  key={appt.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-semibold text-card-foreground truncate">
                      {appt.service?.name || "Serviço Agendado"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {counterpartName ? (
                        <>
                          {counterpartLabel}:{" "}
                          <span className="font-medium text-foreground">
                            {counterpartName}
                          </span>{" "}
                          ·{" "}
                        </>
                      ) : null}
                      <span className="tabular-nums">
                        {new Date(appt.startAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <span className="text-sm font-extrabold text-foreground dark:text-white tabular-nums">
                      R$ {Number(appt.servicePrice).toFixed(2)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-accent text-accent-foreground border border-primary/20">
                      Agendado
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
