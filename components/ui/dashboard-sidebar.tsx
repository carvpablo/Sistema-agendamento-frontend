"use client";

import React, { useState } from "react";
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Hash,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  Sparkles,
  SunMoon,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: number | string;
  shortcut?: string;
  children?: NavItemData[];
};

export type NavGroupData = {
  heading?: string;
  items: NavItemData[];
};

export type WorkspaceMenuAction = {
  id: string;
  label: string;
  icon?: React.ElementType;
  destructive?: boolean;
  onSelect: () => void;
};

const defaultNavGroups: NavGroupData[] = [
  {
    items: [
      { id: "search", title: "Buscar", icon: Search, shortcut: "⌘K" },
      { id: "home", title: "Visão Geral", icon: LayoutDashboard },
      { id: "services", title: "Catálogo de Serviços", icon: Sparkles },
    ],
  },
  {
    heading: "Minha Agenda",
    items: [
      {
        id: "appointments-group",
        title: "Meus Agendamentos",
        icon: Calendar,
        children: [
          { id: "appointments-scheduled", title: "Agendados", icon: Hash },
          { id: "appointments-completed", title: "Concluídos", icon: Hash },
          { id: "appointments-cancelled", title: "Cancelados", icon: Hash },
          { id: "appointments-all", title: "Todos", icon: Hash },
        ],
      },
      {
        id: "pro-services-group",
        title: "Gestão de Serviços",
        icon: FolderKanban,
        children: [
          { id: "my-services", title: "Meus Serviços", icon: Hash },
          { id: "create-service", title: "Criar Serviço", icon: Hash },
        ],
      },
      { id: "availability", title: "Disponibilidade", icon: Clock },
    ],
  },
];

const defaultBottomItems: NavItemData[] = [
  { id: "theme", title: "Alternar Tema", icon: SunMoon },
  { id: "logout", title: "Sair da conta", icon: LogOut },
];

function WorkspaceSwitcher({
  selected,
  subtitle = "Agendamentos!",
  email,
  actions,
  onSelect,
}: {
  selected?: string;
  subtitle?: string;
  email?: string;
  actions?: WorkspaceMenuAction[];
  onSelect?: (ws: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState("Agendamentos!");

  const current = selected || internalSelected;
  const handleSelect = onSelect || setInternalSelected;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-2 mb-4 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors select-none group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-[6px] bg-primary text-primary-foreground flex items-center justify-center font-semibold text-[13px] shrink-0">
            {current.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="text-[13px] font-semibold leading-none mb-1 text-foreground truncate max-w-[145px]">
              {current}
            </span>
            <span className="text-[11px] text-muted-foreground leading-none truncate">
              {subtitle}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform duration-200 shrink-0",
            isOpen && "rotate-180",
          )}
          strokeWidth={1.5}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-[52px] left-0 w-full bg-popover text-popover-foreground border border-border rounded-lg shadow-lg z-50 py-1.5 flex flex-col gap-0.5">
            {email && (
              <>
                <div className="px-3 py-1.5 mx-1">
                  <p className="text-[11px] font-medium text-muted-foreground truncate">
                    Conectado como
                  </p>
                  <p className="text-[12px] font-semibold text-foreground truncate mt-0.5">
                    {email}
                  </p>
                </div>
                <div className="h-px bg-border my-1 mx-2" />
              </>
            )}

            {actions && actions.length > 0 ? (
              actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => {
                      action.onSelect();
                      setIsOpen(false);
                    }}
                    className={cn(
                      "px-3 py-2 mx-1 text-[13px] rounded-md cursor-pointer transition-colors flex items-center gap-2 text-left",
                      action.destructive
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                    )}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />}
                    <span className="truncate">{action.label}</span>
                  </button>
                );
              })
            ) : (
              ["Painel Principal", "Catálogo Público"].map((ws) => (
                <button
                  key={ws}
                  type="button"
                  onClick={() => {
                    handleSelect(ws);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "px-3 py-2 mx-1 text-[13px] rounded-md cursor-pointer transition-colors text-left",
                    current === ws
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-black/5 dark:hover:bg-white/5",
                  )}
                >
                  {ws}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function hasActiveDescendant(item: NavItemData, activeId: string): boolean {
  if (!item.children) return false;
  return item.children.some(
    (child) => child.id === activeId || hasActiveDescendant(child, activeId),
  );
}

function NavItem({
  item,
  activeId,
  onSelect,
  level = 0,
  defaultExpandedIds,
}: {
  item: NavItemData;
  activeId: string;
  onSelect: (id: string) => void;
  level?: number;
  defaultExpandedIds?: string[];
}) {
  const isActive = activeId === item.id;
  const hasChildren = Boolean(item.children && item.children.length > 0);
  const childIsActive = hasActiveDescendant(item, activeId);
  const [isOpen, setIsOpen] = useState(
    () =>
      childIsActive || Boolean(defaultExpandedIds?.includes(item.id)),
  );
  const [prevChildIsActive, setPrevChildIsActive] = useState(childIsActive);

  if (childIsActive !== prevChildIsActive) {
    setPrevChildIsActive(childIsActive);
    if (childIsActive) {
      setIsOpen(true);
    }
  }

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen((prev) => !prev);
    } else {
      onSelect(item.id);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <button
        type="button"
        className={cn(
          "group w-full flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-200 select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : childIsActive
              ? "text-foreground font-medium hover:bg-black/5 dark:hover:bg-white/5"
              : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground",
        )}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <item.icon
            className={cn(
              "w-[16px] h-[16px] transition-colors shrink-0",
              isActive
                ? "text-accent-foreground"
                : childIsActive
                  ? "text-primary"
                  : "text-muted-foreground group-hover:text-foreground",
            )}
            strokeWidth={1.5}
          />
          <span className="text-[13px] tracking-wide truncate">
            {item.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {item.shortcut && (
            <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground bg-background border border-border rounded-[4px]">
              {item.shortcut}
            </kbd>
          )}
          {item.badge !== undefined && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold tabular-nums rounded-full bg-accent text-accent-foreground">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-90",
              )}
              strokeWidth={2}
            />
          )}
        </div>
      </button>

      {hasChildren && (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div
              className="absolute top-0 bottom-0 border-l border-border"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children!.map((child) => (
              <NavItem
                key={child.id}
                item={child}
                activeId={activeId}
                onSelect={onSelect}
                level={level + 1}
                defaultExpandedIds={defaultExpandedIds}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export interface SidebarNavProps {
  className?: string;
  groups?: NavGroupData[];
  bottomItems?: NavItemData[];
  activeId?: string;
  onSelect?: (id: string) => void;
  activeWorkspace?: string;
  workspaceSubtitle?: string;
  workspaceEmail?: string;
  workspaceActions?: WorkspaceMenuAction[];
  onWorkspaceSelect?: (ws: string) => void;
  defaultExpandedIds?: string[];
}

export function SidebarNav({
  className = "",
  groups = defaultNavGroups,
  bottomItems = defaultBottomItems,
  activeId,
  onSelect,
  activeWorkspace,
  workspaceSubtitle,
  workspaceEmail,
  workspaceActions,
  onWorkspaceSelect,
  defaultExpandedIds,
}: SidebarNavProps) {
  const [internalId, setInternalId] = useState("home");
  const currentId = activeId !== undefined ? activeId : internalId;
  const handleSelect = onSelect || setInternalId;

  return (
    <aside
      aria-label="Navegação do painel"
      className={cn(
        "flex flex-col w-[260px] h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-3 font-sans",
        className,
      )}
    >
      <WorkspaceSwitcher
        selected={activeWorkspace}
        subtitle={workspaceSubtitle}
        email={workspaceEmail}
        actions={workspaceActions}
        onSelect={onWorkspaceSelect}
      />

      <nav className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-1">
        {groups.map((group, idx) => (
          <div key={group.heading ?? idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                activeId={currentId}
                onSelect={handleSelect}
                defaultExpandedIds={defaultExpandedIds}
              />
            ))}
          </div>
        ))}
      </nav>

      {bottomItems.length > 0 && (
        <div className="mt-auto pt-3 border-t border-sidebar-border flex flex-col gap-0.5">
          {bottomItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              activeId={currentId}
              onSelect={handleSelect}
              defaultExpandedIds={defaultExpandedIds}
            />
          ))}
        </div>
      )}
    </aside>
  );
}

const flattenItems = (items: NavItemData[]): NavItemData[] => {
  return items.reduce((acc, item) => {
    acc.push(item);
    if (item.children) acc.push(...flattenItems(item.children));
    return acc;
  }, [] as NavItemData[]);
};

export default function SidebarNavPreview() {
  const [isOpen, setIsOpen] = useState(true);
  const [activeId, setActiveId] = useState("home");
  const [activeWorkspace, setActiveWorkspace] = useState("Agendamentos!");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const flatData = flattenItems([
    ...defaultNavGroups.flatMap((g) => g.items),
    ...defaultBottomItems,
  ]);
  const activeItem = flatData.find((i) => i.id === activeId);
  const activeTitle = activeItem ? activeItem.title : "Visão Geral";

  const handleSelect = (id: string) => {
    if (id === "search") {
      setIsSearchOpen(true);
      return;
    }
    setActiveId(id);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[700px] bg-background p-4 md:p-8">
      <div className="relative w-full max-w-4xl h-[700px] bg-card rounded-xl border border-border flex overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out shrink-0 overflow-hidden bg-sidebar border-r border-sidebar-border",
            isOpen ? "w-[260px] opacity-100" : "w-0 opacity-0 border-none",
          )}
        >
          <SidebarNav
            className="w-[260px] border-none bg-transparent"
            activeId={activeId}
            onSelect={handleSelect}
            activeWorkspace={activeWorkspace}
            onWorkspaceSelect={setActiveWorkspace}
          />
        </div>

        <div className="flex-1 bg-muted/40 flex flex-col min-w-0 transition-all duration-300">
          <div className="h-14 border-b border-border flex items-center px-4 justify-between bg-card shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Recolher menu lateral" : "Abrir menu lateral"}
                className="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer"
              >
                {isOpen ? (
                  <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} />
                ) : (
                  <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />
                )}
              </button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">{activeWorkspace}</span>
                <span>/</span>
                <span className="font-medium text-foreground truncate">
                  {activeTitle}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto flex-1">
            <h2 className="text-xl font-bold text-foreground">{activeTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione uma opção na barra lateral para navegar.
            </p>
          </div>
        </div>

        {isSearchOpen && (
          <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/60 backdrop-blur-sm px-4">
            <div
              className="absolute inset-0"
              onClick={() => setIsSearchOpen(false)}
            />
            <div className="relative w-full max-w-xl bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
              <div className="flex items-center px-4 border-b border-border">
                <Search
                  className="w-[18px] h-[18px] text-muted-foreground mr-3 shrink-0"
                  strokeWidth={1.5}
                />
                <input
                  autoFocus
                  className="flex-1 bg-transparent py-4 outline-none text-[14px] text-foreground placeholder:text-muted-foreground"
                  placeholder="Buscar páginas ou ações..."
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
                  className="ml-3 p-1 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </button>
              </div>
              <div className="p-2 py-8 flex flex-col items-center justify-center">
                <Command
                  className="w-6 h-6 text-muted-foreground mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-[13px] text-muted-foreground font-medium">
                  Digite um comando ou termo para buscar...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
