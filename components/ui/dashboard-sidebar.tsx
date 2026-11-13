"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  href?: string;
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

export interface SidebarUser {
  name: string;
  email: string;
  role?: string;
}

function BrandHeader({
  subtitle = "Gestão de Horários",
}: {
  subtitle?: string;
}) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 px-2.5 py-2.5 mb-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      <div
        aria-hidden="true"
        className="w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center font-bold shadow-xs shrink-0 group-hover:scale-105 transition-transform"
      >
        <Calendar className="w-4 h-4" strokeWidth={2} />
      </div>
      <div className="flex flex-col overflow-hidden min-w-0">
        <span className="text-[14px] font-bold tracking-tight text-sidebar-foreground truncate group-hover:text-sidebar-primary transition-colors">
          Agendamentos!
        </span>
        <span className="text-[11px] text-muted-foreground leading-tight truncate">
          {subtitle}
        </span>
      </div>
    </Link>
  );
}

function UserIdentityFooter({
  user,
  onLogout,
}: {
  user: SidebarUser;
  onLogout?: () => void;
}) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel =
    user.role === "professional" ? "Profissional" : "Cliente";

  return (
    <div className="mt-auto pt-3 border-t border-sidebar-border">
      <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-black/5 dark:bg-white/5">
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-sidebar-accent text-sidebar-accent-foreground flex items-center justify-center font-bold text-xs shrink-0"
        >
          {initials || "U"}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[12px] font-semibold text-sidebar-foreground truncate">
              {user.name}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground shrink-0 leading-none">
              {roleLabel}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
            {user.email}
          </span>
        </div>
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sair da conta"
            aria-label="Sair da conta"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </button>
        )}
      </div>
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

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else {
      onSelect(item.id);
    }
  };

  const itemClassName = cn(
    "group w-full flex items-center justify-between px-2.5 py-[7px] rounded-lg cursor-pointer transition-all duration-200 select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : childIsActive
        ? "text-sidebar-foreground font-medium hover:bg-black/5 dark:hover:bg-white/5"
        : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-sidebar-foreground",
  );

  const innerContent = (
    <>
      <div className="flex items-center gap-2.5 min-w-0">
        <item.icon
          aria-hidden="true"
          className={cn(
            "w-[16px] h-[16px] transition-colors shrink-0",
            isActive
              ? "text-sidebar-accent-foreground"
              : childIsActive
                ? "text-sidebar-primary"
                : "text-muted-foreground group-hover:text-sidebar-foreground",
          )}
          strokeWidth={1.5}
        />
        <span className="text-[13px] truncate">{item.title}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {item.shortcut && (
          <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground bg-background border border-sidebar-border rounded-sm">
            {item.shortcut}
          </kbd>
        )}
        {item.badge !== undefined && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-semibold tabular-nums rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
            {item.badge}
          </span>
        )}
        {hasChildren && (
          <ChevronRight
            aria-hidden="true"
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-90",
            )}
            strokeWidth={2}
          />
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col w-full">
      {item.href && !hasChildren ? (
        <Link
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className={itemClassName}
          style={{ paddingLeft: `${level * 12 + 10}px` }}
          onClick={handleClick}
        >
          {innerContent}
        </Link>
      ) : (
        <button
          type="button"
          aria-current={!hasChildren && isActive ? "page" : undefined}
          aria-expanded={hasChildren ? isOpen : undefined}
          className={itemClassName}
          style={{ paddingLeft: `${level * 12 + 10}px` }}
          onClick={handleClick}
        >
          {innerContent}
        </button>
      )}

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
  brandSubtitle?: string;
  user?: SidebarUser;
  onLogout?: () => void;
  // Propriedades retrocompatíveis mantidas para flexibilidade
  activeWorkspace?: string;
  workspaceSubtitle?: string;
  workspaceEmail?: string;
  workspaceActions?: WorkspaceMenuAction[];
  onWorkspaceSelect?: (ws: string) => void;
  defaultExpandedIds?: string[];
}

export function SidebarNav({
  className = "",
  groups = [],
  bottomItems = [],
  activeId,
  onSelect,
  brandSubtitle,
  user,
  onLogout,
  activeWorkspace,
  workspaceSubtitle,
  workspaceEmail,
  defaultExpandedIds,
}: SidebarNavProps) {
  const [internalId, setInternalId] = useState("home");
  const currentId = activeId !== undefined ? activeId : internalId;
  const handleSelect = onSelect || setInternalId;

  const resolvedUser: SidebarUser | undefined =
    user ??
    (activeWorkspace && workspaceEmail
      ? {
          name: activeWorkspace,
          email: workspaceEmail,
        }
      : undefined);

  return (
    <aside
      aria-label="Navegação do painel"
      className={cn(
        "flex flex-col w-[260px] h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-3 font-sans",
        className,
      )}
    >
      <BrandHeader subtitle={brandSubtitle ?? workspaceSubtitle} />

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
        <div className="mt-auto pt-2 border-t border-sidebar-border flex flex-col gap-0.5">
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

      {resolvedUser && (
        <UserIdentityFooter
          user={resolvedUser}
          onLogout={onLogout || (() => handleSelect("logout"))}
        />
      )}
    </aside>
  );
}
