"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuth from "@/store/auth";

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleConfirmLogOut() {
    setIsLoggingOut(true);
    try {
      await fetch("http://localhost:3000/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Error logging out", err);
    } finally {
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
      logout();
      router.push("/");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
            >
              Agendamentos!
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/services"
                className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                Serviços
              </Link>

              {user && (
                <Link
                  href={`/appointments/${user.id}`}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  Meus Agendamentos
                </Link>
              )}

              {user?.role === "professional" && (
                <>
                  <Link
                    href={`/services/${user.id}`}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    Meus Serviços
                  </Link>
                  <Link
                    href="/availability"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    Disponibilidade
                  </Link>
                  <Link
                    href="/services/create"
                    className="px-3 py-2 rounded-lg text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                  >
                    + Criar Serviço
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  href="/auth/user/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cliente
                </Link>
                <Link
                  href="/auth/professional/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-500/20 transition-all"
                >
                  Profissional
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="hidden md:block text-sm">
                    <p className="font-medium text-slate-200 leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">
                      {user.role === "professional"
                        ? "Profissional"
                        : "Cliente"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal de confirmação de Logout */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
          onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Confirmar saída</h2>
              <p className="text-sm text-slate-400">
                Tem certeza que deseja encerrar sua sessão atual?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogOut}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                {isLoggingOut ? "Saindo..." : "Sim, sair"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
