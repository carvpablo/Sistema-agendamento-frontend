"use client";

import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";
import {
  Briefcase,
  Calendar,
  Clock,
  Command,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  SunMoon,
  X,
} from "lucide-react";
import useAuth from "@/store/auth";
import {
  SidebarNav,
  type SidebarNavProps,
  type NavGroupData,
  type NavItemData,
} from "@/components/ui/dashboard-sidebar";
import Header from "./Header";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
const getIsMacSnapshot = () =>
  typeof navigator !== "undefined" &&
  /(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent);
const getIsMacServerSnapshot = () => false;

function useIsMac() {
  return useSyncExternalStore(
    emptySubscribe,
    getIsMacSnapshot,
    getIsMacServerSnapshot,
  );
}

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveActiveRoute(pathname: string, isProfessional: boolean) {
  if (pathname === "/") {
    return { activeId: "home", activeTitle: "Visão Geral" };
  }
  if (pathname === "/services") {
    return {
      activeId: "services",
      activeTitle: isProfessional ? "Catálogo Público" : "Explorar Serviços",
    };
  }
  if (pathname.startsWith("/services/details/")) {
    return { activeId: "services", activeTitle: "Detalhes do Serviço" };
  }
  if (pathname === "/services/create") {
    return { activeId: "create-service", activeTitle: "Criar Serviço" };
  }
  if (pathname.startsWith("/services/")) {
    return { activeId: "my-services", activeTitle: "Meus Serviços" };
  }
  if (pathname === "/availability") {
    return { activeId: "availability", activeTitle: "Disponibilidade" };
  }
  if (pathname.startsWith("/appointments")) {
    return {
      activeId: "appointments",
      activeTitle: isProfessional ? "Agenda de Clientes" : "Meus Agendamentos",
    };
  }
  return { activeId: "home", activeTitle: "Painel" };
}

function ActiveSidebarNav({
  isProfessional,
  ...sidebarProps
}: Omit<SidebarNavProps, "activeId"> & {
  isProfessional: boolean;
}) {
  const pathname = usePathname();
  const { activeId } = resolveActiveRoute(pathname, isProfessional);
  return <SidebarNav {...sidebarProps} activeId={activeId} />;
}

function ActiveBreadcrumbTitle({
  isProfessional,
}: {
  isProfessional: boolean;
}) {
  const pathname = usePathname();
  const { activeTitle } = resolveActiveRoute(pathname, isProfessional);
  return (
    <span aria-current="page" className="font-medium text-foreground truncate">
      {activeTitle}
    </span>
  );
}

interface PaletteCommand {
  id: string;
  label: string;
  sublabel?: string;
  section: string;
  icon: React.ElementType;
  action: () => void;
}

interface ServiceData {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [services, setServices] = useState<ServiceData[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const isMac = useIsMac();
  const shortcutHint = isMac ? "⌘K" : "Ctrl K";

  const isDashboardActive = Boolean(user);
  const isProfessional = user?.role === "professional";
  const userId = user?.id;
  const userRole = user?.role;

  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (!userId) return;
    router.prefetch("/services");
    router.prefetch(`/appointments/${userId}`);
    if (userRole === "professional") {
      router.prefetch(`/services/${userId}`);
      router.prefetch("/services/create");
      router.prefetch("/availability");
    }
  }, [userId, userRole, router]);

  useEffect(() => {
    if (!isDashboardActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
        setSelectedIndex(0);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsMobileOpen(false);
        setIsLogoutModalOpen((open) => (isLoggingOut ? open : false));
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDashboardActive, isLoggingOut]);

  // Carrega lista de serviços ao abrir a paleta de busca
  useEffect(() => {
    if (!isSearchOpen || services.length > 0) return;
    let ignore = false;

    async function loadServices() {
      try {
        setIsLoadingServices(true);
        const res = await fetch(`${API_URL}/services`);
        if (res.ok) {
          const data = await res.json();
          if (!ignore && Array.isArray(data)) {
            setServices(data);
          }
        }
      } catch {
        // Fallback silencioso caso o backend não esteja respondendo
      } finally {
        if (!ignore) setIsLoadingServices(false);
      }
    }

    loadServices();
    return () => {
      ignore = true;
    };
  }, [isSearchOpen, services.length]);

  function handleToggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  async function handleConfirmLogOut() {
    setIsLoggingOut(true);
    try {
      await fetch(`${API_URL}/auth/logout`, {
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

  function handleSidebarSelect(id: string) {
    if (id === "search") {
      setSearchQuery("");
      setIsSearchOpen(true);
      setIsMobileOpen(false);
    } else if (id === "theme") {
      handleToggleTheme();
    } else if (id === "logout") {
      setIsMobileOpen(false);
      setIsLogoutModalOpen(true);
    } else {
      setIsMobileOpen(false);
    }
  }

  const navGroups = useMemo<NavGroupData[]>(() => {
    if (isProfessional) {
      return [
        {
          items: [
            {
              id: "search",
              title: "Buscar...",
              icon: Search,
              shortcut: shortcutHint,
            },
            {
              id: "home",
              title: "Visão Geral",
              icon: LayoutDashboard,
              href: "/",
            },
            {
              id: "services",
              title: "Catálogo Público",
              icon: Sparkles,
              href: "/services",
            },
          ],
        },
        {
          heading: "Gestão Profissional",
          items: [
            {
              id: "appointments",
              title: "Agenda de Clientes",
              icon: Calendar,
              href: userId ? `/appointments/${userId}` : "/appointments",
            },
            {
              id: "my-services",
              title: "Meus Serviços",
              icon: Briefcase,
              href: userId ? `/services/${userId}` : "/services",
            },
            {
              id: "create-service",
              title: "Criar Serviço",
              icon: Plus,
              href: "/services/create",
            },
            {
              id: "availability",
              title: "Disponibilidade",
              icon: Clock,
              href: "/availability",
            },
          ],
        },
      ];
    }

    return [
      {
        items: [
          {
            id: "search",
            title: "Buscar...",
            icon: Search,
            shortcut: shortcutHint,
          },
          {
            id: "home",
            title: "Visão Geral",
            icon: LayoutDashboard,
            href: "/",
          },
          {
            id: "services",
            title: "Explorar Serviços",
            icon: Sparkles,
            href: "/services",
          },
          {
            id: "appointments",
            title: "Meus Agendamentos",
            icon: Calendar,
            href: userId ? `/appointments/${userId}` : "/appointments",
          },
        ],
      },
    ];
  }, [isProfessional, userId, shortcutHint]);

  const bottomItems = useMemo<NavItemData[]>(
    () => [{ id: "theme", title: "Alternar Tema", icon: SunMoon }],
    [],
  );

  const baseCommands = useMemo<PaletteCommand[]>(() => {
    const cmds: PaletteCommand[] = [
      {
        id: "cmd-home",
        label: "Ir para Visão Geral",
        sublabel: "Página inicial do seu painel",
        section: "Navegação",
        icon: LayoutDashboard,
        action: () => router.push("/"),
      },
      {
        id: "cmd-services",
        label: isProfessional
          ? "Abrir Catálogo Público de Serviços"
          : "Explorar Serviços Disponíveis",
        sublabel: "Ver todos os serviços cadastrados na plataforma",
        section: "Navegação",
        icon: Sparkles,
        action: () => router.push("/services"),
      },
      {
        id: "cmd-appointments",
        label: isProfessional ? "Ver Agenda de Clientes" : "Ver Meus Agendamentos",
        sublabel: "Acompanhar agendamentos marcados e horários",
        section: "Navegação",
        icon: Calendar,
        action: () => {
          if (userId) router.push(`/appointments/${userId}`);
        },
      },
    ];

    if (isProfessional) {
      cmds.push(
        {
          id: "cmd-my-services",
          label: "Gerenciar Meus Serviços",
          sublabel: "Editar serviços ofertados e valores",
          section: "Profissional",
          icon: Briefcase,
          action: () => {
            if (userId) router.push(`/services/${userId}`);
          },
        },
        {
          id: "cmd-create-service",
          label: "Criar Novo Serviço",
          sublabel: "Cadastrar novo procedimento ou serviço",
          section: "Profissional",
          icon: Plus,
          action: () => router.push("/services/create"),
        },
        {
          id: "cmd-availability",
          label: "Configurar Horários de Disponibilidade",
          sublabel: "Definir janelas de atendimento por dia",
          section: "Profissional",
          icon: Clock,
          action: () => router.push("/availability"),
        },
      );
    }

    cmds.push(
      {
        id: "cmd-theme",
        label: "Alternar Tema Claro / Escuro",
        sublabel: "Mudar preferência visual da interface",
        section: "Preferências",
        icon: SunMoon,
        action: handleToggleTheme,
      },
      {
        id: "cmd-logout",
        label: "Sair da Conta",
        sublabel: "Encerrar sessão com segurança",
        section: "Conta",
        icon: LogOut,
        action: () => setIsLogoutModalOpen(true),
      },
    );

    return cmds;
  }, [isProfessional, userId, router]);

  const serviceCommands = useMemo<PaletteCommand[]>(() => {
    return services.map((s) => ({
      id: `svc-${s.id}`,
      label: s.name,
      sublabel: `${s.durationMinutes} min · R$ ${s.price}${s.description ? ` · ${s.description}` : ""}`,
      section: "Serviços Disponíveis",
      icon: Sparkles,
      action: () => router.push(`/services/details/${s.id}`),
    }));
  }, [services, router]);

  const filteredCommands = useMemo<PaletteCommand[]>(() => {
    const query = normalizeText(searchQuery.trim());
    if (!query) return baseCommands;

    const matchedServices = serviceCommands.filter(
      (cmd) =>
        normalizeText(cmd.label).includes(query) ||
        (cmd.sublabel && normalizeText(cmd.sublabel).includes(query)),
    );

    const matchedNav = baseCommands.filter(
      (cmd) =>
        normalizeText(cmd.label).includes(query) ||
        normalizeText(cmd.section).includes(query) ||
        (cmd.sublabel && normalizeText(cmd.sublabel).includes(query)),
    );

    return [...matchedServices, ...matchedNav];
  }, [baseCommands, serviceCommands, searchQuery]);

  const activeIndex =
    filteredCommands.length === 0
      ? 0
      : Math.min(selectedIndex, filteredCommands.length - 1);

  // Rolagem suave do item selecionado para a visão
  useEffect(() => {
    if (!isSearchOpen) return;
    const currentEl = itemRefs.current[activeIndex];
    if (currentEl) {
      currentEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, isSearchOpen]);

  const roleSubtitle = isProfessional ? "Painel Profissional" : "Área do Cliente";

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (filteredCommands.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredCommands.length - 1 : prev - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredCommands[activeIndex];
      if (selected) {
        selected.action();
        setIsSearchOpen(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {!isDashboardActive && <Header />}

      <div className="flex flex-1 min-h-0">
        {isDashboardActive && user && (
          <>
            {/* Sidebar Desktop (recolhível) */}
            <div
              className={`hidden md:block sticky top-0 h-screen transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-sidebar border-r border-sidebar-border ${
                isDesktopOpen ? "w-[260px] opacity-100" : "w-0 opacity-0 border-none"
              }`}
            >
              <Suspense
                fallback={
                  <SidebarNav
                    className="w-[260px] border-none bg-transparent"
                    groups={navGroups}
                    bottomItems={bottomItems}
                    activeId=""
                    onSelect={handleSidebarSelect}
                    brandSubtitle={roleSubtitle}
                    user={user}
                    onLogout={() => setIsLogoutModalOpen(true)}
                  />
                }
              >
                <ActiveSidebarNav
                  className="w-[260px] border-none bg-transparent"
                  groups={navGroups}
                  bottomItems={bottomItems}
                  isProfessional={isProfessional}
                  onSelect={handleSidebarSelect}
                  brandSubtitle={roleSubtitle}
                  user={user}
                  onLogout={() => setIsLogoutModalOpen(true)}
                />
              </Suspense>
            </div>

            {/* Sidebar Mobile (drawer) */}
            {isMobileOpen && (
              <div className="fixed inset-0 z-50 md:hidden flex">
                <div
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                  onClick={() => setIsMobileOpen(false)}
                />
                <div className="relative z-10 h-full w-[260px] bg-sidebar shadow-xl">
                  <Suspense
                    fallback={
                      <SidebarNav
                        className="w-[260px]"
                        groups={navGroups}
                        bottomItems={bottomItems}
                        activeId=""
                        onSelect={handleSidebarSelect}
                        brandSubtitle={roleSubtitle}
                        user={user}
                        onLogout={() => setIsLogoutModalOpen(true)}
                      />
                    }
                  >
                    <ActiveSidebarNav
                      className="w-[260px]"
                      groups={navGroups}
                      bottomItems={bottomItems}
                      isProfessional={isProfessional}
                      onSelect={handleSidebarSelect}
                      brandSubtitle={roleSubtitle}
                      user={user}
                      onLogout={() => setIsLogoutModalOpen(true)}
                    />
                  </Suspense>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          {isDashboardActive && user && (
            <header className="sticky top-0 z-30 h-14 border-b border-border flex items-center px-4 sm:px-6 justify-between bg-card/95 backdrop-blur-md shrink-0 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {/* Botão Mobile */}
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(true)}
                  aria-label="Abrir menu lateral"
                  className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
                >
                  <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>

                {/* Botão Desktop */}
                <button
                  type="button"
                  onClick={() => setIsDesktopOpen((prev) => !prev)}
                  aria-label={
                    isDesktopOpen ? "Recolher menu lateral" : "Expandir menu lateral"
                  }
                  title={
                    isDesktopOpen ? "Recolher menu lateral" : "Expandir menu lateral"
                  }
                  className="hidden md:inline-flex p-2 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
                >
                  {isDesktopOpen ? (
                    <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  ) : (
                    <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  )}
                </button>

                <nav
                  aria-label="Localização"
                  className="flex items-center gap-2 text-sm text-muted-foreground min-w-0"
                >
                  <span className="hidden sm:inline truncate">{roleSubtitle}</span>
                  <span aria-hidden="true" className="hidden sm:inline">
                    /
                  </span>
                  <Suspense
                    fallback={
                      <span className="font-medium text-foreground truncate">
                        Painel
                      </span>
                    }
                  >
                    <ActiveBreadcrumbTitle isProfessional={isProfessional} />
                  </Suspense>
                </nav>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(true);
                  }}
                  className="flex items-center justify-between w-48 sm:w-60 lg:w-64 h-9 px-3 rounded-xl bg-muted border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Search
                      aria-hidden="true"
                      className="w-3.5 h-3.5 shrink-0"
                      strokeWidth={1.5}
                    />
                    <span className="truncate">Buscar serviços ou ações...</span>
                  </span>
                  <kbd className="inline-flex items-center justify-center h-4 px-1.5 text-[10px] font-mono bg-background border border-border rounded-sm shrink-0">
                    {shortcutHint}
                  </kbd>
                </button>
              </div>
            </header>
          )}

          <div
            className={
              isDashboardActive
                ? "flex-1 bg-muted/30 p-6 md:p-8"
                : "flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            }
          >
            <div className={isDashboardActive ? "max-w-5xl mx-auto w-full" : ""}>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Paleta de Comandos & Busca Rápida (Ctrl+K / ⌘K) */}
      {isDashboardActive && isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/50 backdrop-blur-xs px-4">
          <div
            className="fixed inset-0"
            onClick={() => setIsSearchOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar serviços ou executar ação"
            className="relative z-10 w-full max-w-xl bg-popover text-popover-foreground border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 border-b border-border">
              <Search
                aria-hidden="true"
                className="w-[18px] h-[18px] text-muted-foreground mr-3 shrink-0"
                strokeWidth={1.5}
              />
              <input
                autoFocus
                type="text"
                aria-label="Buscar serviços ou executar ação"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handlePaletteKeyDown}
                className="flex-1 bg-transparent py-3.5 outline-none text-[14px] text-foreground placeholder:text-muted-foreground"
                placeholder="Buscar serviços, páginas ou ações..."
              />
              <kbd
                onClick={() => setIsSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground bg-muted border border-border rounded-sm cursor-pointer hover:text-foreground transition-colors"
              >
                ESC
              </kbd>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Fechar busca"
                className="ml-2 p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            </div>

            <div
              role="listbox"
              aria-label="Resultados da busca"
              className="max-h-80 overflow-y-auto p-2"
            >
              {filteredCommands.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Command
                    className="w-6 h-6 text-muted-foreground mb-2"
                    strokeWidth={1.5}
                  />
                  <p className="text-[13px] text-muted-foreground font-medium">
                    Nenhum serviço ou ação encontrado para &ldquo;{searchQuery}&rdquo;.
                  </p>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {filteredCommands.map((cmd, index) => {
                    const Icon = cmd.icon;
                    const isSelected = index === activeIndex;
                    return (
                      <li key={cmd.id} role="none">
                        <button
                          ref={(el) => {
                            itemRefs.current[index] = el;
                          }}
                          role="option"
                          aria-selected={isSelected}
                          type="button"
                          onMouseEnter={() => setSelectedIndex(index)}
                          onClick={() => {
                            cmd.action();
                            setIsSearchOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-[13px] transition-colors cursor-pointer group",
                            isSelected
                              ? "bg-accent text-accent-foreground font-medium"
                              : "text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                          )}
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground group-hover:text-foreground",
                              )}
                            >
                              <Icon className="w-4 h-4" strokeWidth={1.5} />
                            </span>
                            <span className="flex flex-col min-w-0">
                              <span className="truncate">{cmd.label}</span>
                              {cmd.sublabel && (
                                <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                                  {cmd.sublabel}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-3 shrink-0">
                            {cmd.section}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-background border border-border font-mono text-[9px]">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 rounded bg-background border border-border font-mono text-[9px]">
                    ↓
                  </kbd>{" "}
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-[9px]">
                    Enter
                  </kbd>{" "}
                  selecionar
                </span>
              </div>
              {isLoadingServices && (
                <span className="text-primary text-[10px] animate-pulse">
                  Atualizando serviços...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de Logout */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            className="w-full max-w-sm rounded-2xl bg-popover text-popover-foreground border border-border p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <h2
                id="logout-modal-title"
                className="text-lg font-bold text-popover-foreground"
              >
                Confirmar saída
              </h2>
              <p className="text-sm text-muted-foreground">
                Tem certeza que deseja encerrar sua sessão atual?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                autoFocus
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-destructive-foreground transition-all cursor-pointer"
              >
                {isLoggingOut ? "Saindo..." : "Sim, sair"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
