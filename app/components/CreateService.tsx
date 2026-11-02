"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { type CreateServiceFormType } from "@/types/types";
import { invalidateServicesCache } from "@/app/actions/cacheActions";
import useAuth from "@/store/auth";

interface CreateServiceProps {
  onSuccess?: () => void;
}

export default function CreateService({ onSuccess }: CreateServiceProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

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
      await invalidateServicesCache(user?.id);
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
    <div className="max-w-lg mx-auto rounded-2xl bg-card text-card-foreground border border-border p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-card-foreground">
          Criar Novo Serviço
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os detalhes abaixo para disponibilizar um novo serviço.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(handleCreateService)} className="space-y-5">
        <div>
          <label
            htmlFor="service-name"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Nome do Serviço
          </label>
          <input
            id="service-name"
            type="text"
            placeholder="Ex: Corte Degradê"
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            {...register("name", {
              required: "O nome do serviço é obrigatório.",
              minLength: {
                value: 3,
                message: "O nome deve ter no mínimo 3 caracteres.",
              },
            })}
          />
          {errors.name && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="service-description"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Descrição <span className="text-muted-foreground">(opcional)</span>
          </label>
          <textarea
            id="service-description"
            rows={3}
            placeholder="Ex: Corte na máquina e tesoura com acabamento na navalha."
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all resize-none"
            {...register("description", {
              maxLength: {
                value: 500,
                message: "A descrição deve ter no máximo 500 caracteres.",
              },
            })}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="service-duration"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Duração (minutos)
            </label>
            <input
              id="service-duration"
              type="number"
              placeholder="Ex: 45"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
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
              <p className="mt-1.5 text-xs text-destructive">
                {errors.durationMinutes.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="service-price"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Preço (R$)
            </label>
            <input
              id="service-price"
              type="number"
              step="0.01"
              placeholder="Ex: 50.00"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
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
              <p className="mt-1.5 text-xs text-destructive">
                {errors.price.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground shadow-md shadow-primary/20 transition-all cursor-pointer"
        >
          {isLoading ? "Salvando..." : "Criar Serviço"}
        </button>
      </form>
    </div>
  );
}
