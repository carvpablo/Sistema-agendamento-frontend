"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  Calendar,
  Clock,
  Command,
  FolderKanban,
  Hash,
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
  useAppointmentFilter,
  type AppointmentStatusFilter,
} from "@/store/appointmentFilter";
import {
  SidebarNav,
  type SidebarNavProps,
  type NavGroupData,
  type NavItemData,
  type WorkspaceMenuAction,
} from "@/components/ui/dashboard-sidebar";
import Header from "./Header";

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function resolveActiveRoute(
  pathname: string,
  isProfessional: boolean,
  statusFilter: AppointmentStatusFilter,
) {
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
    const baseLabel = isProfessional
      ? "Agenda de Clientes"
      : "Meus Agendamentos";
    if (statusFilter === "COMPLETED") {
      return {
        activeId: "appointments-completed",
        activeTitle: `${baseLabel} · Concluídos`,
      };
    }
    if (statusFilter === "CANCELLED") {
      return {
        activeId: "appointments-cancelled",
        activeTitle: `${baseLabel} · Cancelados`,
      };
    }
    if (statusFilter === "ALL") {
      return {
        activeId: "appointments-all",
        activeTitle: `${baseLabel} · Todos`,
      };
    }
    return {
      activeId: "appointments-scheduled",
      activeTitle: `${baseLabel} · Agendados`,
    };
  }
  return { activeId: "home", activeTitle: "Painel" };
}

function ActiveSidebarNav({
  isProfessional,
  statusFilter,
  ...sidebarProps
}: Omit<SidebarNavProps, "activeId"> & {
  isProfessional: boolean;
  statusFilter: AppointmentStatusFilter;
}) {
  const pathname = usePathname();
  const { activeId } = resolveActiveRoute(pathname, isProfessional, statusFilter);
  return <SidebarNav {...sidebarProps} activeId={activeId} />;
}

function ActiveBreadcrumbTitle({
  isProfessional,
  statusFilter,
}: {
  isProfessional: boolean;
  statusFilter: AppointmentStatusFilter;
}) {
  const pathname = usePathname();
  const { activeTitle } = resolveActiveRoute(
    pathname,
    isProfessional,
    statusFilter,
  );
  return (
    <span className="font-medium text-foreground truncate">{activeTitle}</span>
  );
}

interface QuickCommand {
  id: string;
  label: string;
  section: string;
  icon: React.ElementType;
  action: () => void;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { statusFilter, setStatusFilter } = useAppointmentFilter();

  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isDashboardActive = Boolean(user);
  const isProfessional = user?.role === "professional";

  useEffect(() => {
    if (!user) return;
    router.prefetch("/services");
    router.prefetch(`/appointments/${user.id}`);
    if (user.role === "professional") {
      router.prefetch(`/services/${user.id}`);
      router.prefetch("/services/create");
      router.prefetch("/availability");
    }
  }, [user, router]);

  useEffect(() => {
    if (!isDashboardActive) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsMobileOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDashboardActive]);

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

  function navigateToAppointmentsWithFilter(filter: AppointmentStatusFilter) {
    if (!user) return;
    setStatusFilter(filter);
    router.push(`/appointments/${user.id}`);
    setIsMobileOpen(false);
  }

  function handleSidebarSelect(id: string) {
    if (!user) return;

    switch (id) {
      case "search":
        setSearchQuery("");
        setIsSearchOpen(true);
        setIsMobileOpen(false);
        break;
      case "home":
        router.push("/");
        setIsMobileOpen(false);
        break;
      case "services":
        router.push("/services");
        setIsMobileOpen(false);
        break;
      case "appointments-scheduled":
        navigateToAppointmentsWithFilter("SCHEDULED");
        break;
      case "appointments-completed":
        navigateToAppointmentsWithFilter("COMPLETED");
        break;
      case "appointments-cancelled":
        navigateToAppointmentsWithFilter("CANCELLED");
        break;
      case "appointments-all":
        navigateToAppointmentsWithFilter("ALL");
        break;
      case "my-services":
        router.push(`/services/${user.id}`);
        setIsMobileOpen(false);
        break;
      case "create-service":
        router.push("/services/create");
        setIsMobileOpen(false);
        break;
      case "availability":
        router.push("/availability");
        setIsMobileOpen(false);
        break;
      case "theme":
        handleToggleTheme();
        break;
      case "logout":
        setIsMobileOpen(false);
        setIsLogoutModalOpen(true);
        break;
      default:
        break;
    }
  }

  const navGroups = useMemo<NavGroupData[]>(() => {
    const appointmentChildren: NavItemData[] = [
      { id: "appointments-scheduled", title: "Agendados", icon: Hash },
      { id: "appointments-completed", title: "Concluídos", icon: Hash },
      { id: "appointments-cancelled", title: "Cancelados", icon: Hash },
      { id: "appointments-all", title: "Todos", icon: Hash },
    ];

    if (isProfessional) {
      return [
        {
          items: [
            { id: "search", title: "Buscar...", icon: Search, shortcut: "⌘K" },
            { id: "home", title: "Visão Geral", icon: LayoutDashboard },
            { id: "services", title: "Catálogo Público", icon: Sparkles },
          ],
        },
        {
          heading: "Gestão Profissional",
          items: [
            {
              id: "appointments-group",
              title: "Agenda de Clientes",
              icon: Calendar,
              children: appointmentChildren,
            },
            {
              id: "pro-services-group",
              title: "Serviços",
              icon: FolderKanban,
              children: [
                { id: "my-services", title: "Meus Serviços", icon: Briefcase },
                { id: "create-service", title: "Criar Serviço", icon: Plus },
              ],
            },
            { id: "availability", title: "Disponibilidade", icon: Clock },
          ],
        },
      ];
    }

    return [
      {
        items: [
          { id: "search", title: "Buscar...", icon: Search, shortcut: "⌘K" },
          { id: "home", title: "Visão Geral", icon: LayoutDashboard },
          { id: "services", title: "Explorar Serviços", icon: Sparkles },
        ],
      },
      {
        heading: "Minha Agenda",
        items: [
          {
            id: "appointments-group",
            title: "Meus Agendamentos",
            icon: Calendar,
            children: appointmentChildren,
          },
        ],
      },
    ];
  }, [isProfessional]);

  const bottomItems = useMemo<NavItemData[]>(
    () => [
      { id: "theme", title: "Alternar Tema", icon: SunMoon },
      { id: "logout", title: "Sair da conta", icon: LogOut },
    ],
    [],
  );

  const workspaceActions = useMemo<WorkspaceMenuAction[]>(() => {
    const base: WorkspaceMenuAction[] = [
      {
        id: "ws-home",
        label: "Visão Geral",
        icon: LayoutDashboard,
        onSelect: () => handleSidebarSelect("home"),
      },
      {
        id: "ws-services",
        label: isProfessional ? "Catálogo Público" : "Explorar Serviços",
        icon: Sparkles,
        onSelect: () => handleSidebarSelect("services"),
      },
    ];

    if (isProfessional) {
      base.push({
        id: "ws-create-service",
        label: "Novo Serviço",
        icon: Plus,
        onSelect: () => handleSidebarSelect("create-service"),
      });
    }

    base.push({
      id: "ws-logout",
      label: "Sair da conta",
      icon: LogOut,
      destructive: true,
      onSelect: () => setIsLogoutModalOpen(true),
    });

    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfessional, user?.id]);

  const quickCommands = useMemo<QuickCommand[]>(() => {
    const cmds: QuickCommand[] = [
      {
        id: "cmd-home",
        label: "Ir para Visão Geral",
        section: "Navegação",
        icon: LayoutDashboard,
        action: () => handleSidebarSelect("home"),
      },
      {
        id: "cmd-services",
        label: isProfessional
          ? "Abrir Catálogo Público de Serviços"
          : "Explorar Serviços Disponíveis",
        section: "Navegação",
        icon: Sparkles,
        action: () => handleSidebarSelect("services"),
      },
      {
        id: "cmd-appt-scheduled",
        label: "Ver Agendamentos Agendados",
        section: "Agenda",
        icon: Calendar,
        action: () => handleSidebarSelect("appointments-scheduled"),
      },
      {
        id: "cmd-appt-completed",
        label: "Ver Agendamentos Concluídos",
        section: "Agenda",
        icon: Calendar,
        action: () => handleSidebarSelect("appointments-completed"),
      },
      {
        id: "cmd-appt-cancelled",
        label: "Ver Agendamentos Cancelados",
        section: "Agenda",
        icon: Calendar,
        action: () => handleSidebarSelect("appointments-cancelled"),
      },
      {
        id: "cmd-appt-all",
        label: "Ver Todos os Agendamentos",
        section: "Agenda",
        icon: Calendar,
        action: () => handleSidebarSelect("appointments-all"),
      },
    ];

    if (isProfessional) {
      cmds.push(
        {
          id: "cmd-my-services",
          label: "Gerenciar Meus Serviços",
          section: "Profissional",
          icon: Briefcase,
          action: () => handleSidebarSelect("my-services"),
        },
        {
          id: "cmd-create-service",
          label: "Criar Novo Serviço",
          section: "Profissional",
          icon: Plus,
          action: () => handleSidebarSelect("create-service"),
        },
        {
          id: "cmd-availability",
          label: "Configurar Horários de Disponibilidade",
          section: "Profissional",
          icon: Clock,
          action: () => handleSidebarSelect("availability"),
        },
      );
    }

    cmds.push(
      {
        id: "cmd-theme",
        label: "Alternar Tema Claro / Escuro",
        section: "Preferências",
        icon: SunMoon,
        action: () => handleToggleTheme(),
      },
      {
        id: "cmd-logout",
        label: "Sair da Conta",
        section: "Conta",
        icon: LogOut,
        action: () => setIsLogoutModalOpen(true),
      },
    );

    return cmds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfessional, user?.id]);

  const filteredCommands = useMemo(() => {
    const query = normalizeText(searchQuery.trim());
    if (!query) return quickCommands;
    return quickCommands.filter(
      (cmd) =>
        normalizeText(cmd.label).includes(query) ||
        normalizeText(cmd.section).includes(query),
    );
  }, [quickCommands, searchQuery]);

  const roleSubtitle = isProfessional ? "Painel Profissional" : "Área do Cliente";
  const defaultExpanded = ["appointments-group", "pro-services-group"];

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
                    activeWorkspace={user.name}
                    workspaceSubtitle={roleSubtitle}
                    workspaceEmail={user.email}
                    workspaceActions={workspaceActions}
                    defaultExpandedIds={defaultExpanded}
                  />
                }
              >
                <ActiveSidebarNav
                  className="w-[260px] border-none bg-transparent"
                  groups={navGroups}
                  bottomItems={bottomItems}
                  isProfessional={isProfessional}
                  statusFilter={statusFilter}
                  onSelect={handleSidebarSelect}
                  activeWorkspace={user.name}
                  workspaceSubtitle={roleSubtitle}
                  workspaceEmail={user.email}
                  workspaceActions={workspaceActions}
                  defaultExpandedIds={defaultExpanded}
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
                        activeWorkspace={user.name}
                        workspaceSubtitle={roleSubtitle}
                        workspaceEmail={user.email}
                        workspaceActions={workspaceActions}
                        defaultExpandedIds={defaultExpanded}
                      />
                    }
                  >
                    <ActiveSidebarNav
                      className="w-[260px]"
                      groups={navGroups}
                      bottomItems={bottomItems}
                      isProfessional={isProfessional}
                      statusFilter={statusFilter}
                      onSelect={handleSidebarSelect}
                      activeWorkspace={user.name}
                      workspaceSubtitle={roleSubtitle}
                      workspaceEmail={user.email}
                      workspaceActions={workspaceActions}
                      defaultExpandedIds={defaultExpanded}
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
                  className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
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
                  className="hidden md:inline-flex p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
                >
                  {isDesktopOpen ? (
                    <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  ) : (
                    <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  )}
                </button>

                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                  <span className="hidden sm:inline truncate">{roleSubtitle}</span>
                  <span className="hidden sm:inline">/</span>
                  <Suspense
                    fallback={
                      <span className="font-medium text-foreground truncate">
                        Painel
                      </span>
                    }
                  >
                    <ActiveBreadcrumbTitle
                      isProfessional={isProfessional}
                      statusFilter={statusFilter}
                    />
                  </Suspense>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchOpen(true);
                  }}
                  className="hidden sm:flex items-center justify-between w-56 lg:w-64 h-8 px-3 rounded-md bg-muted border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    <span>Buscar ou ir para...</span>
                  </span>
                  <kbd className="inline-flex items-center justify-center h-4 px-1 text-[10px] font-mono bg-background border border-border rounded-[4px]">
                    ⌘K
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

      {/* Paleta de Comandos / Busca Rápida (⌘K / Ctrl+K) */}
      {isDashboardActive && isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] bg-black/50 backdrop-blur-xs px-4">
          <div
            className="fixed inset-0"
            onClick={() => setIsSearchOpen(false)}
          />
          <div className="relative z-10 w-full max-w-xl bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center px-4 border-b border-border">
              <Search
                className="w-[18px] h-[18px] text-muted-foreground mr-3 shrink-0"
                strokeWidth={1.5}
              />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredCommands.length > 0) {
                    e.preventDefault();
                    filteredCommands[0].action();
                    setIsSearchOpen(false);
                  }
                }}
                className="flex-1 bg-transparent py-3.5 outline-none text-[14px] text-foreground placeholder:text-muted-foreground"
                placeholder="Buscar páginas, agendamentos ou ações..."
              />
              <kbd
                onClick={() => setIsSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground bg-muted border border-border rounded-[4px] cursor-pointer hover:text-foreground transition-colors"
              >
                ESC
              </kbd>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Fechar busca"
                className="ml-2 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filteredCommands.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <Command
                    className="w-6 h-6 text-muted-foreground mb-2"
                    strokeWidth={1.5}
                  />
                  <p className="text-[13px] text-muted-foreground font-medium">
                    Nenhuma ação encontrada para &ldquo;{searchQuery}&rdquo;.
                  </p>
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {filteredCommands.map((cmd) => {
                    const Icon = cmd.icon;
                    return (
                      <li key={cmd.id}>
                        <button
                          type="button"
                          onClick={() => {
                            cmd.action();
                            setIsSearchOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-[13px] text-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group"
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className="w-4 h-4 text-muted-foreground group-hover:text-accent-foreground shrink-0"
                              strokeWidth={1.5}
                            />
                            <span className="font-medium truncate">
                              {cmd.label}
                            </span>
                          </span>
                          <span className="text-[11px] text-muted-foreground group-hover:text-accent-foreground/80 ml-3 shrink-0">
                            {cmd.section}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
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
