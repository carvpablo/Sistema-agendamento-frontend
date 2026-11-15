"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Pencil, Search, Trash2 } from "lucide-react";
import useAuth from "@/store/auth";
import { API_URL } from "@/lib/api";
import { formatCurrency, formatDuration } from "@/lib/format";
import { invalidateServicesCache } from "@/app/actions/cacheActions";
import { cn } from "@/lib/utils";
import { type Service } from "../services/page";

const DURATION_PRESETS = [30, 45, 60, 90, 120];

interface EditDraft {
  name: string;
  description: string;
  durationMinutes: string;
  price: string;
}

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function ServiceList({
  serviceList,
  ownerProfessionalId,
}: {
  serviceList: Service[];
  ownerProfessionalId?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [updatedById, setUpdatedById] = useState<
    Record<string, Partial<Service>>
  >({});

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    name: "",
    description: "",
    durationMinutes: "45",
    price: "",
  });
  const [savingId, setSavingId] = useState<string | null>(null);

  const [statusFeedback, setStatusFeedback] = useState<{
    kind: "deleted" | "updated";
    serviceName: string;
  } | null>(null);
  const [cardError, setCardError] = useState<{
    id: string;
    message: string;
  } | null>(null);

  const statusNoticeRef = useRef<HTMLDivElement | null>(null);
  const cardErrorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (statusFeedback) {
      statusNoticeRef.current?.focus();
    }
  }, [statusFeedback]);

  useEffect(() => {
    if (cardError) {
      cardErrorRef.current?.focus();
    }
  }, [cardError]);

  const isProfessional = user?.role === "professional";
  const isOwnCatalogView =
    Boolean(ownerProfessionalId) &&
    isProfessional &&
    user?.id === ownerProfessionalId;

  const canManageService = (service: Service) => {
    if (!isProfessional || !user?.id) return false;
    if (ownerProfessionalId && ownerProfessionalId === user.id) return true;
    return (
      service.professionalServices?.some(
        (ps) => ps.professional.id === user.id,
      ) ?? false
    );
  };

  const startEditing = (service: Service) => {
    setConfirmingId(null);
    setCardError(null);
    setStatusFeedback(null);
    setEditingId(service.id);
    setEditDraft({
      name: service.name,
      description: service.description ?? "",
      durationMinutes: String(service.durationMinutes),
      price: String(Number(service.price)),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setCardError(null);
  };

  const handleUpdateService = async (
    e: React.FormEvent<HTMLFormElement>,
    service: Service,
  ) => {
    e.preventDefault();
    if (!user?.id) return;

    const trimmedName = editDraft.name.trim();
    const trimmedDescription = editDraft.description.trim();
    const parsedDuration = Number(editDraft.durationMinutes);
    const parsedPrice = Number(editDraft.price);

    if (trimmedName.length < 3) {
      setCardError({
        id: service.id,
        message: "O nome do serviço deve ter pelo menos 3 caracteres.",
      });
      return;
    }

    if (trimmedDescription.length > 500) {
      setCardError({
        id: service.id,
        message: "A descrição deve ter no máximo 500 caracteres.",
      });
      return;
    }

    if (!Number.isInteger(parsedDuration) || parsedDuration < 5) {
      setCardError({
        id: service.id,
        message: "A duração deve ser um número inteiro de no mínimo 5 minutos.",
      });
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setCardError({
        id: service.id,
        message: "Informe um valor válido maior que R$ 0,00.",
      });
      return;
    }

    setSavingId(service.id);
    setCardError(null);
    setStatusFeedback(null);

    try {
      const response = await fetch(`${API_URL}/services/${service.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription,
          durationMinutes: parsedDuration,
          price: parsedPrice,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        name?: string;
        description?: string | null;
        durationMinutes?: number;
        price?: number;
      };

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Você não tem permissão para editar este serviço ou sua sessão expirou.",
          );
        }
        throw new Error(
          data.error ||
            data.message ||
            "Não foi possível salvar as alterações do serviço.",
        );
      }

      setUpdatedById((prev) => ({
        ...prev,
        [service.id]: {
          name: data.name ?? trimmedName,
          description:
            data.description !== undefined
              ? data.description
              : trimmedDescription,
          durationMinutes: data.durationMinutes ?? parsedDuration,
          price: data.price !== undefined ? Number(data.price) : parsedPrice,
        },
      }));
      setEditingId(null);
      setStatusFeedback({
        kind: "updated",
        serviceName: data.name ?? trimmedName,
      });
      await invalidateServicesCache(user.id, service.id);
      router.refresh();
    } catch (err: unknown) {
      setCardError({
        id: service.id,
        message:
          err instanceof Error
            ? err.message
            : "Erro ao atualizar o serviço. Tente novamente.",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (!user?.id) return;

    setDeletingId(service.id);
    setCardError(null);
    setStatusFeedback(null);

    try {
      const response = await fetch(`${API_URL}/services/${service.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            "Você não tem permissão para excluir este serviço ou sua sessão expirou.",
          );
        }
        throw new Error(
          data.error ||
            data.message ||
            "Não foi possível excluir o serviço. Tente novamente.",
        );
      }

      setDeletedIds((prev) => [...prev, service.id]);
      setStatusFeedback({
        kind: "deleted",
        serviceName: service.name,
      });
      await invalidateServicesCache(user.id, service.id);
      router.refresh();
    } catch (err: unknown) {
      setCardError({
        id: service.id,
        message:
          err instanceof Error
            ? err.message
            : "Erro ao excluir o serviço. Tente novamente.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const activeServices = useMemo(
    () =>
      serviceList
        .filter((service) => !deletedIds.includes(service.id))
        .map((service) =>
          updatedById[service.id]
            ? { ...service, ...updatedById[service.id] }
            : service,
        ),
    [serviceList, deletedIds, updatedById],
  );

  const filteredServices = useMemo(() => {
    const query = normalizeText(searchQuery.trim());
    if (!query) return activeServices;

    return activeServices.filter((service) => {
      const nameMatch = normalizeText(service.name).includes(query);
      const descriptionMatch = service.description
        ? normalizeText(service.description).includes(query)
        : false;
      const professionalMatch =
        service.professionalServices?.some((ps) =>
          normalizeText(ps.professional.name).includes(query),
        ) ?? false;
      return nameMatch || descriptionMatch || professionalMatch;
    });
  }, [activeServices, searchQuery]);

  const statusNotice = statusFeedback ? (
    <div
      ref={statusNoticeRef}
      tabIndex={-1}
      role="status"
      className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-2.5">
        <CheckCircle2
          aria-hidden="true"
          className="w-4 h-4 shrink-0"
          strokeWidth={2}
        />
        <span>
          {statusFeedback.kind === "deleted" ? (
            <>
              Serviço{" "}
              <span className="font-semibold">
                {statusFeedback.serviceName}
              </span>{" "}
              excluído do seu catálogo.
            </>
          ) : (
            <>
              Alterações em{" "}
              <span className="font-semibold">
                {statusFeedback.serviceName}
              </span>{" "}
              salvas com sucesso.
            </>
          )}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {statusFeedback.kind === "deleted" && (
          <Link
            href="/services/create"
            className="inline-flex items-center justify-center h-8 px-3.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold transition-colors"
          >
            + Criar outro serviço
          </Link>
        )}
        <button
          type="button"
          onClick={() => setStatusFeedback(null)}
          className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-medium transition-colors cursor-pointer"
        >
          Fechar
        </button>
      </div>
    </div>
  ) : null;

  if (activeServices.length === 0) {
    return (
      <div className="space-y-6">
        {statusNotice}
        <div className="rounded-2xl border border-dashed border-border bg-muted p-12 text-center space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              Nenhum serviço encontrado
            </h2>
            <p className="text-sm text-muted-foreground">
              {isProfessional
                ? "Cadastre um serviço para que seus clientes possam agendar horários com você."
                : "Ainda não há serviços cadastrados nesta seção."}
            </p>
          </div>
          {isProfessional && (
            <div className="pt-1">
              <Link
                href="/services/create"
                className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors"
              >
                + Criar Novo Serviço
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {statusNotice}

      <div className="relative max-w-md">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isOwnCatalogView
              ? "Buscar nos seus serviços..."
              : "Buscar por serviço, descrição ou profissional..."
          }
          aria-label="Buscar serviço"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-primary/50 transition-colors"
        />
        <Search
          aria-hidden="true"
          className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          strokeWidth={1.75}
        />
      </div>

      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted p-12 text-center space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              Nenhum serviço encontrado para &ldquo;{searchQuery}&rdquo;
            </h2>
            <p className="text-sm text-muted-foreground">
              Tente buscar por outro termo ou limpe o filtro.
            </p>
          </div>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors cursor-pointer"
            >
              Limpar busca
            </button>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredServices.map((service) => {
            const isOwner = canManageService(service);
            const isEditing = editingId === service.id;
            const isSaving = savingId === service.id;
            const isConfirming =
              confirmingId === service.id && deletingId !== service.id;
            const isDeleting = deletingId === service.id;
            const professionalNames =
              service.professionalServices &&
              service.professionalServices.length > 0
                ? service.professionalServices
                    .map((ps) => ps.professional.name)
                    .join(", ")
                : null;

            return (
              <li
                key={service.id}
                className={cn(
                  "group rounded-2xl bg-card text-card-foreground border p-6 transition-colors flex flex-col justify-between gap-6",
                  isEditing
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40",
                )}
              >
                {isOwner && isEditing ? (
                  /* Modo de edição inline do serviço */
                  <form
                    aria-label={`Editar serviço ${service.name}`}
                    onSubmit={(e) => handleUpdateService(e, service)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && !isSaving) {
                        e.stopPropagation();
                        cancelEditing();
                      }
                    }}
                    noValidate
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-border">
                      <span className="text-xs font-semibold text-primary dark:text-accent-foreground">
                        Editando serviço
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Pressione Esc para cancelar
                      </span>
                    </div>

                    {cardError?.id === service.id && (
                      <div
                        ref={cardErrorRef}
                        tabIndex={-1}
                        role="alert"
                        className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive dark:text-red-400 text-xs flex items-center justify-between gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span>{cardError.message}</span>
                        <button
                          type="button"
                          onClick={() => setCardError(null)}
                          className="px-2 py-1 rounded-md hover:bg-destructive/20 font-semibold shrink-0 transition-colors cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>
                    )}

                    {/* Nome */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor={`edit-name-${service.id}`}
                        className="block text-xs font-semibold text-foreground"
                      >
                        Nome do Serviço
                      </label>
                      <input
                        id={`edit-name-${service.id}`}
                        type="text"
                        autoFocus
                        value={editDraft.name}
                        onChange={(e) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        required
                        className="w-full h-10 px-3.5 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                      />
                    </div>

                    {/* Duração e Valor lado a lado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`edit-duration-${service.id}`}
                          className="block text-xs font-semibold text-foreground"
                        >
                          Duração (minutos)
                        </label>
                        <div className="relative">
                          <input
                            id={`edit-duration-${service.id}`}
                            type="number"
                            min={5}
                            step={5}
                            value={editDraft.durationMinutes}
                            onChange={(e) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                durationMinutes: e.target.value,
                              }))
                            }
                            required
                            className="w-full h-10 pl-3.5 pr-12 rounded-xl bg-background border border-input text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            min
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor={`edit-price-${service.id}`}
                          className="block text-xs font-semibold text-foreground"
                        >
                          Valor Cobrado
                        </label>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                            R$
                          </span>
                          <input
                            id={`edit-price-${service.id}`}
                            type="number"
                            min={0.01}
                            step="0.01"
                            value={editDraft.price}
                            onChange={(e) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                price: e.target.value,
                              }))
                            }
                            required
                            className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-background border border-input text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Chips rápidos de duração */}
                    <div
                      role="group"
                      aria-label="Sugestões de duração"
                      className="flex flex-wrap items-center gap-1.5"
                    >
                      {DURATION_PRESETS.map((minutes) => {
                        const isSelected =
                          Number(editDraft.durationMinutes) === minutes;
                        return (
                          <button
                            key={minutes}
                            type="button"
                            onClick={() =>
                              setEditDraft((prev) => ({
                                ...prev,
                                durationMinutes: String(minutes),
                              }))
                            }
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border-border",
                            )}
                          >
                            {formatDuration(minutes)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Descrição */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <label
                          htmlFor={`edit-description-${service.id}`}
                          className="block text-xs font-semibold text-foreground"
                        >
                          Descrição{" "}
                          <span className="font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        </label>
                        <span
                          className={cn(
                            "text-[11px] tabular-nums",
                            editDraft.description.length > 500
                              ? "text-destructive font-semibold"
                              : "text-muted-foreground",
                          )}
                        >
                          {editDraft.description.length}/500
                        </span>
                      </div>
                      <textarea
                        id={`edit-description-${service.id}`}
                        rows={3}
                        value={editDraft.description}
                        onChange={(e) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Descreva o que está incluso neste serviço..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-y min-h-[84px]"
                      />
                    </div>

                    {/* Botões de ação da edição */}
                    <div className="pt-2 border-t border-border grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={cancelEditing}
                        className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground border border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {isSaving ? "Salvando..." : "Salvar alterações"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Bloco superior: Identificação e descrição do serviço */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-lg font-bold leading-snug text-card-foreground group-hover:text-primary dark:group-hover:text-accent-foreground transition-colors">
                          {service.name}
                        </h3>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border tabular-nums">
                          <Clock
                            aria-hidden="true"
                            className="w-3 h-3 text-muted-foreground"
                            strokeWidth={1.75}
                          />
                          {formatDuration(service.durationMinutes)}
                        </span>
                      </div>

                      {!isOwnCatalogView && professionalNames && (
                        <p className="text-xs text-muted-foreground truncate">
                          Profissional:{" "}
                          <span className="font-medium text-foreground">
                            {professionalNames}
                          </span>
                        </p>
                      )}

                      {service.description ? (
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {service.description}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/70 italic">
                          Sem descrição adicional cadastrada.
                        </p>
                      )}
                    </div>

                    {/* Bloco inferior: Preço separado da barra de ações com alturas uniformes */}
                    <div className="space-y-4">
                      <div className="pt-4 border-t border-border flex items-baseline justify-between gap-4">
                        <span className="text-xs text-muted-foreground">
                          Valor do serviço
                        </span>
                        <span className="text-xl font-extrabold text-foreground tabular-nums">
                          {formatCurrency(service.price)}
                        </span>
                      </div>

                      {cardError?.id === service.id && (
                        <div
                          ref={cardErrorRef}
                          tabIndex={-1}
                          role="alert"
                          className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive dark:text-red-400 text-xs flex items-center justify-between gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span>{cardError.message}</span>
                          <button
                            type="button"
                            onClick={() => setCardError(null)}
                            className="px-2 py-1 rounded-md hover:bg-destructive/20 font-semibold shrink-0 transition-colors cursor-pointer"
                          >
                            Fechar
                          </button>
                        </div>
                      )}

                      {isOwner ? (
                        isConfirming ? (
                          <div
                            role="group"
                            aria-label="Confirmar exclusão do serviço"
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setConfirmingId(null);
                            }}
                            className="rounded-xl bg-muted/60 border border-border p-3.5 space-y-3"
                          >
                            <p className="text-xs text-foreground leading-relaxed">
                              Excluir{" "}
                              <span className="font-semibold">
                                {service.name}
                              </span>
                              ? Ele será removido do seu catálogo de serviços.
                            </p>
                            <div className="grid grid-cols-2 gap-2.5">
                              <button
                                type="button"
                                autoFocus
                                onClick={() => setConfirmingId(null)}
                                className="inline-flex items-center justify-center h-9 px-3 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                Manter serviço
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmingId(null);
                                  handleDeleteService(service);
                                }}
                                className="inline-flex items-center justify-center h-9 px-3 rounded-xl text-xs font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground border border-transparent transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                Confirmar exclusão
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            <Link
                              href={`/services/details/${service.id}`}
                              className="inline-flex items-center justify-center h-10 px-3 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              Ver detalhes
                            </Link>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => startEditing(service)}
                              aria-label={`Editar serviço ${service.name}`}
                              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Pencil
                                aria-hidden="true"
                                className="w-3.5 h-3.5 shrink-0"
                                strokeWidth={1.75}
                              />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => {
                                setCardError(null);
                                setConfirmingId(service.id);
                              }}
                              aria-label={`Excluir serviço ${service.name}`}
                              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive dark:text-red-400 border border-destructive/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <Trash2
                                aria-hidden="true"
                                className="w-3.5 h-3.5 shrink-0"
                                strokeWidth={1.75}
                              />
                              <span>
                                {isDeleting ? "Excluindo..." : "Excluir"}
                              </span>
                            </button>
                          </div>
                        )
                      ) : (
                        <Link
                          href={`/services/details/${service.id}`}
                          className="inline-flex items-center justify-center w-full h-10 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          Ver detalhes
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
