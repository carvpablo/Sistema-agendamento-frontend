"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import useAuth from "@/store/auth";
import { type LoginFormType } from "@/types/types";

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
      const response = await fetch("http://localhost:3000/auth/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result.error || "Falha ao realizar login.");
        return;
      }

      setUser({ ...result.user, role: "user" });

      router.push("/");
    } catch {
      setErrorMessage("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/70 border border-slate-800 p-8 shadow-xl">
        <div className="mb-6">
          <Link
            href="/"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            ← Voltar ao início
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">
            Login de Cliente
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Entre com sua conta para agendar serviços.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              E-mail
            </label>
            <input
              {...register("email", { required: "E-mail é obrigatório" })}
              id="email"
              type="email"
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-rose-400">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300 mb-1.5"
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-rose-400">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer mt-2"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Não tem uma conta?{" "}
          <Link
            href="/auth/user/signin"
            className="font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
