"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type SigninFormType } from "@/types/types";
import useAuth from "@/store/auth";

export default function Signin() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const setUser = useAuth((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormType>();

  async function handleSignin(data: SigninFormType) {
    try {
      setIsLoading(true);
      const response = await fetch(
        "http://localhost:3000/auth/professional/signin",
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
        setErrorMessage(result.error || "Falha ao realizar cadastrocadastro.");
        return;
      }

      setUser({ ...result.user, role: "professional" });

      router.push("/");
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-card text-card-foreground border border-border p-8 shadow-sm">
        <div className="mb-6">
          <Link
            href="/auth/professional/login"
            className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
          >
            ← Voltar ao login
          </Link>
          <h1 className="text-2xl font-bold text-card-foreground mt-3">
            Cadastro de Profissional
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crie sua conta para oferecer serviços e gerenciar sua agenda.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(handleSignin)} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Nome do Profissional
            </label>
            <input
              {...register("name", {
                required: "O nome é obrigatório",
                minLength: {
                  value: 2,
                  message: "O nome deve ter pelo menos 2 caracteres",
                },
              })}
              type="text"
              id="name"
              placeholder="Ex: Carlos Barbeiro"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              E-mail Profissional
            </label>
            <input
              {...register("email", { required: "O e-mail é obrigatório" })}
              type="email"
              id="email"
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
                required: "A senha é obrigatória",
                minLength: {
                  value: 6,
                  message: "A senha deve ter no mínimo 6 caracteres",
                },
                maxLength: {
                  value: 12,
                  message: "A senha deve ter no máximo 12 caracteres",
                },
              })}
              type="password"
              id="password"
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
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground shadow-md shadow-primary/20 transition-all cursor-pointer mt-2"
          >
            {isLoading ? "Criando conta..." : "Criar Conta Profissional"}
          </button>
        </form>
      </div>
    </div>
  );
}
