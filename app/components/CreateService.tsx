"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { type CreateServiceFormType } from "@/types/types";

interface CreateServiceProps {
  onSuccess?: () => void;
}

export default function CreateService({ onSuccess }: CreateServiceProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceFormType>();

  async function handleCreateService(data: CreateServiceFormType) {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("http://localhost:3000/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || "Falha ao criar serviço.");
        return;
      }

      setSuccessMessage("Serviço criado com sucesso!");
      reset();
      router.refresh();

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto rounded-2xl bg-slate-900/70 border border-slate-800 p-8 shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Criar Novo Serviço</h2>
        <p className="text-sm text-slate-400 mt-1">
          Preencha os detalhes abaixo para disponibilizar um novo serviço.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(handleCreateService)} className="space-y-5">
        <div>
          <label
            htmlFor="service-name"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Nome do Serviço
          </label>
          <input
            id="service-name"
            type="text"
            placeholder="Ex: Corte Degradê"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            {...register("name", {
              required: "O nome do serviço é obrigatório.",
              minLength: {
                value: 3,
                message: "O nome deve ter no mínimo 3 caracteres.",
              },
            })}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-rose-400">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="service-description"
            className="block text-sm font-medium text-slate-300 mb-1.5"
          >
            Descrição <span className="text-slate-500">(opcional)</span>
          </label>
          <textarea
            id="service-description"
            rows={3}
            placeholder="Ex: Corte na máquina e tesoura com acabamento na navalha."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
            {...register("description", {
              maxLength: {
                value: 500,
                message: "A descrição deve ter no máximo 500 caracteres.",
              },
            })}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-rose-400">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="service-duration"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Duração (minutos)
            </label>
            <input
              id="service-duration"
              type="number"
              placeholder="Ex: 45"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              {...register("durationMinutes", {
                required: "A duração é obrigatória.",
                valueAsNumber: true,
                min: {
                  value: 5,
                  message: "Mínimo de 5 minutos.",
                },
              })}
            />
            {errors.durationMinutes && (
              <p className="mt-1.5 text-xs text-rose-400">
                {errors.durationMinutes.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="service-price"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              Preço (R$)
            </label>
            <input
              id="service-price"
              type="number"
              step="0.01"
              placeholder="Ex: 50.00"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              {...register("price", {
                required: "O preço é obrigatório.",
                valueAsNumber: true,
                min: {
                  value: 0.01,
                  message: "Deve ser maior que zero.",
                },
              })}
            />
            {errors.price && (
              <p className="mt-1.5 text-xs text-rose-400">
                {errors.price.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          {isLoading ? "Salvando..." : "Criar Serviço"}
        </button>
      </form>
    </div>
  );
}
