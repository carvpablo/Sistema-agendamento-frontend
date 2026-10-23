"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useAuth from "@/store/auth";
import {
  type Availability,
  type CreateAvailabilityFormType,
} from "@/types/types";

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAvailabilityFormType>();

  // Trava o ano com no máximo 4 dígitos caso o usuário digite números a mais
  function enforceFourDigitYear(e: React.SyntheticEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const value = input.value;
    if (!value) return;

    const [datePart, timePart] = value.split("T");
    if (!datePart) return;

    const parts = datePart.split("-");
    if (parts[0] && parts[0].length > 4) {
      parts[0] = parts[0].slice(0, 4);
      input.value = `${parts.join("-")}${timePart ? `T${timePart}` : ""}`;
    }
  }

  async function fetchAvailabilities() {
    if (!user || user.role !== "professional") return;
    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:3000/professionals/${user.id}/availability`,
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
          `http://localhost:3000/professionals/${user!.id}/availability`,
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

  async function handleCreateAvailability(data: CreateAvailabilityFormType) {
    if (!user?.id || user.role !== "professional") return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const startDate = new Date(data.startAt);
    const endDate = new Date(data.endAt);

    if (
      startDate.getFullYear() < 1900 ||
      startDate.getFullYear() > 9999 ||
      endDate.getFullYear() < 1900 ||
      endDate.getFullYear() > 9999
    ) {
      setErrorMessage("O ano deve conter exatamente 4 dígitos válidos.");
      setIsSubmitting(false);
      return;
    }

    if (startDate >= endDate) {
      setErrorMessage("O horário final deve ser posterior ao horário inicial.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/professionals/availability",
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
      reset();
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
        `http://localhost:3000/professionals/availability/${id}`,
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
        <div className="max-w-md mx-auto p-8 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-4">
          <h1 className="text-xl font-bold text-rose-400">Acesso Restrito</h1>
          <p className="text-sm text-slate-400">
            Você precisa estar autenticado como um profissional para acessar e
            gerenciar os horários de disponibilidade.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/auth/professional/login"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
            >
              Entrar como Profissional
            </Link>
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
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
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Disponibilidade de Atendimento
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Defina os dias e janelas de horário em que você está livre para
          receber agendamentos.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Formulário para criar novo horário */}
        <div className="lg:col-span-1 rounded-2xl bg-slate-900/70 border border-slate-800 p-6 shadow-xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">Adicionar Horário</h2>
            <p className="text-xs text-slate-400 mt-1">
              Informe a data e o intervalo de início e fim.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(handleCreateAvailability)}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="startAt"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Início do Atendimento
              </label>
              <input
                id="startAt"
                type="datetime-local"
                min="2024-01-01T00:00"
                max="9999-12-31T23:59"
                onInput={enforceFourDigitYear}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm [color-scheme:dark]"
                {...register("startAt", {
                  required: "Horário inicial é obrigatório.",
                })}
              />
              {errors.startAt && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.startAt.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="endAt"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Término do Atendimento
              </label>
              <input
                id="endAt"
                type="datetime-local"
                min="2024-01-01T00:00"
                max="9999-12-31T23:59"
                onInput={enforceFourDigitYear}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm [color-scheme:dark]"
                {...register("endAt", {
                  required: "Horário final é obrigatório.",
                })}
              />
              {errors.endAt && (
                <p className="mt-1 text-xs text-rose-400">
                  {errors.endAt.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-500/25 transition-all text-sm cursor-pointer"
            >
              {isSubmitting ? "Salvando..." : "+ Adicionar Disponibilidade"}
            </button>
          </form>
        </div>

        {/* Lista de disponibilidades cadastradas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">
              Horários Cadastrados ({availabilities.length})
            </h2>
            <button
              onClick={fetchAvailabilities}
              className="text-xs font-medium text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Atualizar lista
            </button>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse bg-slate-900/40 rounded-2xl border border-slate-800/80">
              Carregando horários...
            </div>
          ) : availabilities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
              <h3 className="text-base font-semibold text-slate-300">
                Nenhuma disponibilidade cadastrada
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Cadastre seus horários ao lado para permitir que clientes façam
                agendamentos.
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
                    className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-5 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {startDate.toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-rose-500/10"
                        >
                          Excluir
                        </button>
                      </div>

                      <p className="text-lg font-extrabold text-white pt-1">
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
                      <p className="text-xs text-slate-400">
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
