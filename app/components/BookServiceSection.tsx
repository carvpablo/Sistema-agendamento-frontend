"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useAuth from "@/store/auth";
import { invalidateAppointmentsCache } from "@/app/actions/cacheActions";
import { clearClientAppointmentsCache } from "@/store/appointmentsClientCache";

export interface AvailableSlot {
  startAt: string;
  endAt: string;
}

export interface ProfessionalInfo {
  id: string;
  name: string;
  email: string;
}

interface BookServiceSectionProps {
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  price: number;
  professionals: ProfessionalInfo[];
}

export default function BookServiceSection({
  serviceId,
  serviceName,
  durationMinutes,
  price,
  professionals,
}: BookServiceSectionProps) {
  const { user } = useAuth();

  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(
    professionals[0]?.id ?? "",
  );
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(
    Boolean(professionals[0]?.id),
  );
  const [selectedDateKey, setSelectedDateKey] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedProfessionalId) return;

    let ignore = false;

    async function loadSlots() {
      try {
        const response = await fetch(
          `http://localhost:3000/professionals/${selectedProfessionalId}/available-slots?serviceId=${serviceId}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Não foi possível carregar os horários disponíveis.");
        }

        const data: AvailableSlot[] = await response.json();
        if (!ignore) {
          setSlots(data);
          if (data.length > 0) {
            const firstDayKey = toLocalDateKey(new Date(data[0].startAt));
            setSelectedDateKey(firstDayKey);
          } else {
            setSelectedDateKey("");
          }
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Erro ao buscar horários disponíveis.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      ignore = true;
    };
  }, [selectedProfessionalId, serviceId]);

  // Agrupa os slots por data local (YYYY-MM-DD)
  const slotsByDate = useMemo(() => {
    const grouped = new Map<string, AvailableSlot[]>();

    for (const slot of slots) {
      const dateKey = toLocalDateKey(new Date(slot.startAt));
      const existing = grouped.get(dateKey) ?? [];
      existing.push(slot);
      grouped.set(dateKey, existing);
    }

    return grouped;
  }, [slots]);

  const availableDates = useMemo(
    () => Array.from(slotsByDate.keys()),
    [slotsByDate],
  );

  const slotsForSelectedDate = useMemo(
    () => slotsByDate.get(selectedDateKey) ?? [],
    [slotsByDate, selectedDateKey],
  );

  function handleSelectProfessional(profId: string) {
    if (profId === selectedProfessionalId) return;
    setSelectedProfessionalId(profId);
    setSelectedSlot(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoadingSlots(true);
  }

  async function handleConfirmBooking() {
    if (!user || user.role === "professional" || !selectedSlot) return;

    setIsBooking(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("http://localhost:3000/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          serviceId,
          professionalId: selectedProfessionalId,
          clientId: user.id,
          startAt: selectedSlot.startAt,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.error || "Não foi possível concluir o agendamento.",
        );
        return;
      }

      // Remove o horário recém-agendado da lista local
      const updatedSlots = slots.filter(
        (item) => item.startAt !== selectedSlot.startAt,
      );
      setSlots(updatedSlots);
      setSelectedSlot(null);
      setSuccessMessage("Agendamento realizado com sucesso!");
      clearClientAppointmentsCache(user.id);
      await invalidateAppointmentsCache(user.id);
    } catch {
      setErrorMessage("Falha de conexão com o servidor ao tentar agendar.");
    } finally {
      setIsBooking(false);
    }
  }

  if (professionals.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6 text-center shadow-sm">
        <p className="text-sm text-muted-foreground">
          Este serviço ainda não possui profissionais vinculados para
          agendamento.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl bg-card text-card-foreground border border-border p-8 shadow-sm space-y-6">
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold text-card-foreground">
          Escolha o Dia e Horário
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Selecione um horário disponível abaixo para agendar{" "}
          <span className="text-foreground font-semibold">{serviceName}</span> (
          {durationMinutes} min).
        </p>
      </div>

      {/* Seleção de profissional (caso mais de um ofereça o serviço) */}
      {professionals.length > 1 && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            1. Escolha o Profissional
          </label>
          <div className="flex flex-wrap gap-2.5">
            {professionals.map((prof) => {
              const isSelected = prof.id === selectedProfessionalId;
              return (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => handleSelectProfessional(prof.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-muted text-foreground border-border hover:border-primary/50 hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {prof.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>{successMessage}</span>
          {user && (
            <Link
              href={`/appointments/${user.id}`}
              className="px-4 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold transition-colors text-center"
            >
              Ver Meus Agendamentos →
            </Link>
          )}
        </div>
      )}

      {isLoadingSlots ? (
        <div className="p-10 text-center text-muted-foreground animate-pulse bg-muted rounded-xl border border-border">
          Buscando horários disponíveis...
        </div>
      ) : availableDates.length === 0 ? (
        <div className="p-10 text-center bg-muted rounded-xl border border-dashed border-border space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Nenhum horário disponível no momento
          </p>
          <p className="text-xs text-muted-foreground">
            O profissional ainda não abriu horários compatíveis com a duração
            deste serviço ({durationMinutes} min).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Passo: Selecionar Dia */}
          <div className="space-y-2.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dia do Atendimento
            </span>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {availableDates.map((dateKey) => {
                const dateObj = parseLocalDateKey(dateKey);
                const isSelected = dateKey === selectedDateKey;
                const count = slotsByDate.get(dateKey)?.length ?? 0;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => {
                      setSelectedDateKey(dateKey);
                      setSelectedSlot(null);
                    }}
                    className={`min-w-[125px] p-3.5 rounded-xl border text-left transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-accent border-primary text-accent-foreground shadow-sm"
                        : "bg-muted border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    <span className="block text-xs uppercase font-semibold text-primary">
                      {dateObj.toLocaleDateString("pt-BR", {
                        weekday: "short",
                      })}
                    </span>
                    <span
                      className={`block text-base font-extrabold mt-0.5 ${
                        isSelected
                          ? "text-accent-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {dateObj.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-1">
                      {count} {count === 1 ? "horário" : "horários"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passo: Selecionar Horário */}
          <div className="space-y-2.5">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Horários Livres
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {slotsForSelectedDate.map((slot) => {
                const start = new Date(slot.startAt);
                const end = new Date(slot.endAt);
                const isSelected = selectedSlot?.startAt === slot.startAt;

                return (
                  <button
                    key={slot.startAt}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3 px-3 rounded-xl border text-center font-semibold text-sm transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/25"
                        : "bg-muted border-border text-foreground hover:border-primary/50 hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {start.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {end.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resumo e Confirmação */}
          {selectedSlot && (
            <div className="rounded-xl bg-muted border border-primary/30 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Resumo do Agendamento
                </span>
                <p className="text-sm text-foreground font-semibold">
                  {new Date(selectedSlot.startAt).toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  às{" "}
                  {new Date(selectedSlot.startAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Valor:{" "}
                  <span className="text-foreground dark:text-white font-bold">
                    R$ {Number(price).toFixed(2)}
                  </span>
                </p>
              </div>

              {!user ? (
                <Link
                  href="/auth/user/login"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all text-center"
                >
                  Entre como Cliente para Agendar
                </Link>
              ) : user.role === "professional" ? (
                <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/25 px-3 py-2 rounded-lg">
                  Apenas contas de cliente podem realizar agendamentos.
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isBooking}
                  onClick={handleConfirmBooking}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  {isBooking ? "Confirmando..." : "Confirmar Agendamento"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}
