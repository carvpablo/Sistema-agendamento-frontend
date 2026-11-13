"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import useAuth from "@/store/auth";
import { type LoginFormType } from "@/types/types";
import { API_URL } from "@/lib/api";

export default function Auth() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useAuth((state) => state.setUser);

  async function onSubmit(data: LoginFormType) {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/auth/professional/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || "Falha ao realizar login.");
        return;
      }

      setUser({ ...result.user, role: "professional" });

      router.push("/");
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-card text-card-foreground border border-border p-8 shadow-sm">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
          >
            ← Voltar ao início
          </Link>
          <h1 className="text-2xl font-bold text-card-foreground mt-3">
            Portal do Profissional
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acesse sua conta para gerenciar serviços e agenda.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              E-mail Profissional
            </label>
            <input
              {...register("email", { required: "E-mail é obrigatório" })}
              id="email"
              type="email"
              placeholder="profissional@email.com"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Senha
            </label>
            <input
              {...register("password", {
                minLength: {
                  value: 6,
                  message: "A senha deve ter no mínimo 6 caracteres",
                },
                maxLength: {
                  value: 12,
                  message: "A senha deve ter no máximo 12 caracteres",
                },
                required: "A senha é obrigatória",
              })}
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground shadow-md shadow-primary/20 transition-all cursor-pointer mt-2"
          >
            {loading ? "Entrando..." : "Entrar como Profissional"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não é parceiro?{" "}
          <Link
            href="/auth/professional/signin"
            className="font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            Criar conta profissional
          </Link>
        </p>
      </div>
    </div>
  );
}
