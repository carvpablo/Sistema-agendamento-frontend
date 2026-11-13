"use client";

import * as React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useAuth from "@/store/auth";
import { type Availability } from "@/types/types";
import { API_URL } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui/input-group";

function parseTimeParts(timeStr: string): [number, number, number] {
  const parts = timeStr.split(":").map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("09:00:00");
  const [endTime, setEndTime] = useState<string>("18:00:00");

  const markedDates = useMemo(
    () => availabilities.map((item) => new Date(item.startAt)),
    [availabilities],
  );

  async function fetchAvailabilities() {
    if (!user || user.role !== "professional") return;
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/professionals/${user.id}/availability`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao buscar disponibilidades.");
      }

      const data: Availability[] = await response.json();
      setAvailabilities(data);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Erro ao carregar lista de horários.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!user || user.role !== "professional") return;

    let ignore = false;

    async function loadInitialAvailabilities() {
      try {
        const response = await fetch(
          `${API_URL}/professionals/${user!.id}/availability`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Erro ao buscar disponibilidades.");
        }

        const data: Availability[] = await response.json();
        if (!ignore) {
          setAvailabilities(data);
        }
      } catch (err) {
        if (!ignore) {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Erro ao carregar lista de horários.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadInitialAvailabilities();

    return () => {
      ignore = true;
    };
  }, [user]);

  async function handleCreateAvailability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user?.id || user.role !== "professional") return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!date) {
      setErrorMessage("Selecione uma data no calendário.");
      return;
    }

    if (!startTime || !endTime) {
      setErrorMessage("Informe o horário de início e de término.");
      return;
    }

    const [startH, startM, startS] = parseTimeParts(startTime);
    const [endH, endM, endS] = parseTimeParts(endTime);

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const startDate = new Date(year, month, day, startH, startM, startS);
    const endDate = new Date(year, month, day, endH, endM, endS);

    if (startDate >= endDate) {
      setErrorMessage("O horário final deve ser posterior ao horário inicial.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/professionals/availability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            professionalId: user.id,
            startAt: startDate.toISOString(),
            endAt: endDate.toISOString(),
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || "Falha ao registrar disponibilidade.");
        return;
      }

      setSuccessMessage("Horário de disponibilidade cadastrado com sucesso!");
      fetchAvailabilities();
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este horário?")) return;

    try {
      const response = await fetch(
        `${API_URL}/professionals/availability/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Falha ao excluir disponibilidade.");
      }

      setAvailabilities((prev) => prev.filter((item) => item.id !== id));
      setSuccessMessage("Disponibilidade removida com sucesso!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  // Bloqueia se não estiver logado (!user) OU se não for profissional (user.role !== "professional")
  if (!user || user.role !== "professional") {
    return (
      <main className="py-16 text-center">
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-4">
          <h1 className="text-xl font-bold text-destructive">
            Acesso Restrito
          </h1>
          <p className="text-sm text-muted-foreground">
            Você precisa estar autenticado como um profissional para acessar e
            gerenciar os horários de disponibilidade.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/auth/professional/login"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            >
              Entrar como Profissional
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-all"
            >
              Início
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-10 py-4">
      <div className="border-b border-border pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Disponibilidade de Atendimento
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Defina os dias e janelas de horário em que você está livre para
          receber agendamentos.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Card com Calendário e seleção de horário */}
        <div className="lg:col-span-1 flex justify-center lg:justify-start">
          <Card size="sm" className="w-fit">
            <CardHeader className="pb-1">
              <CardTitle>Adicionar Horário</CardTitle>
              <CardDescription>
                Escolha o dia no calendário e o intervalo de atendimento.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                markedDates={markedDates}
                disablePast
                className="p-0"
              />
            </CardContent>

            <CardFooter className="border-t bg-card flex-col items-stretch gap-4">
              <form
                onSubmit={handleCreateAvailability}
                className="w-full space-y-4"
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="time-from">
                      Horário de Início
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="time-from"
                        type="time"
                        step="1"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                        className="[&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </InputGroup>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="time-to">
                      Horário de Término
                    </FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="time-to"
                        type="time"
                        step="1"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                        className="[&::-webkit-calendar-picker-indicator]:cursor-pointer"
                      />
                    </InputGroup>
                  </Field>
                </FieldGroup>

                <button
                  type="submit"
                  disabled={isSubmitting || !date}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground shadow-sm transition-all text-sm cursor-pointer"
                >
                  {isSubmitting ? "Salvando..." : "+ Adicionar Disponibilidade"}
                </button>
              </form>
            </CardFooter>
          </Card>
        </div>

        {/* Lista de disponibilidades cadastradas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              Horários Cadastrados ({availabilities.length})
            </h2>
            <button
              onClick={fetchAvailabilities}
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              Atualizar lista
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse bg-muted rounded-2xl border border-border">
              Carregando horários...
            </div>
          ) : availabilities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted p-12 text-center">
              <h3 className="text-base font-semibold text-foreground">
                Nenhuma disponibilidade cadastrada
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Selecione um dia no calendário ao lado para liberar horários de
                atendimento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availabilities.map((item) => {
                const startDate = new Date(item.startAt);
                const endDate = new Date(item.endAt);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-card text-card-foreground border border-border p-5 space-y-3 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent text-accent-foreground border border-primary/20">
                          {startDate.toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-destructive hover:opacity-80 transition-opacity cursor-pointer px-2 py-0.5 rounded hover:bg-destructive/10"
                        >
                          Excluir
                        </button>
                      </div>

                      <p className="text-lg font-extrabold text-card-foreground pt-1 tabular-nums">
                        {startDate.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {endDate.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {startDate.toLocaleDateString("pt-BR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
