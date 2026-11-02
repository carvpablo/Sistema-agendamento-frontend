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

  function handleToggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

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
      <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar/90 text-sidebar-foreground backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-sidebar-primary hover:opacity-90 transition-opacity"
            >
              Agendamentos!
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/services"
                prefetch={true}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
              >
                Serviços
              </Link>

              {user && (
                <Link
                  href={`/appointments/${user.id}`}
                  prefetch={true}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                >
                  Meus Agendamentos
                </Link>
              )}

              {user?.role === "professional" && (
                <>
                  <Link
                    href={`/services/${user.id}`}
                    prefetch={true}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                  >
                    Meus Serviços
                  </Link>
                  <Link
                    href="/availability"
                    prefetch={true}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                  >
                    Disponibilidade
                  </Link>
                  <Link
                    href="/services/create"
                    prefetch={true}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-sidebar-primary hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
                  >
                    + Criar Serviço
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="Alternar tema"
              title="Alternar tema claro/escuro"
              className="p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              {/* Ícone de Sol (exibido no modo escuro) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 hidden dark:block"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              {/* Ícone de Lua (exibido no modo claro) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 block dark:hidden"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </button>

            {!user ? (
              <>
                <Link
                  href="/auth/user/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cliente
                </Link>
                <Link
                  href="/auth/professional/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 transition-all"
                >
                  Profissional
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-accent border border-primary/25 text-accent-foreground font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="hidden md:block text-sm">
                    <p className="font-medium text-foreground leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {user.role === "professional"
                        ? "Profissional"
                        : "Cliente"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors cursor-pointer"
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-popover text-popover-foreground border border-border p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-popover-foreground">
                Confirmar saída
              </h2>
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja encerrar sua sessão atual?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent disabled:opacity-50 text-secondary-foreground hover:text-accent-foreground border border-border transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogOut}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-destructive-foreground shadow-md shadow-destructive/20 transition-all cursor-pointer"
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
