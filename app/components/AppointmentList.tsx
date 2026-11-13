"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useNow } from "@/lib/useNow";
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  getAppointmentWhen,
  getRelativeLabel,
} from "@/lib/format";
import { type Appointment } from "../appointments/[id]/page";
import DateLeaf from "./DateLeaf";

const CANCEL_NOTICE_MS = 24 * 60 * 60 * 1000;

function getCancelDeadline(startAt: string) {
  return new Date(startAt).getTime() - CANCEL_NOTICE_MS;
}

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-accent text-accent-foreground border-primary/25",
  COMPLETED:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  CANCELLED:
    "bg-destructive/10 text-destructive dark:text-red-400 border-destructive/25",
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export default function AppointmentList({
  appointmentList,
  onCancel,
  cancellingId,
  cancelError = null,
  onDismissCancelError,
  highlightId = null,
  isProfessional = false,
  isFiltered = false,
  onResetFilter,
  emptyActionHref,
  emptyActionLabel,
}: {
  appointmentList: Appointment[];
  onCancel?: (id: string) => void;
  cancellingId?: string | null;
  cancelError?: { id: string; message: string } | null;
  onDismissCancelError?: () => void;
  highlightId?: string | null;
  isProfessional?: boolean;
  isFiltered?: boolean;
  onResetFilter?: () => void;
  emptyActionHref?: string;
  emptyActionLabel?: string;
}) {
  const now = useNow();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const scrolledToRef = useRef<string | null>(null);
  const cancelErrorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (cancelError) {
      cancelErrorRef.current?.focus();
    }
  }, [cancelError]);

  // Leva o card vindo da home para o centro da tela, uma vez por destaque
  useEffect(() => {
    if (!highlightId || scrolledToRef.current === highlightId) return;
    const card = document.getElementById(`appointment-${highlightId}`);
    if (!card) return;
    scrolledToRef.current = highlightId;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    card.scrollIntoView({
      block: "center",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [highlightId, appointmentList]);

  const canCancelAppointment = (startAt: string) => {
    if (!now) return false;
    return new Date(startAt).getTime() - now > CANCEL_NOTICE_MS;
  };

  if (appointmentList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted p-12 text-center space-y-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            {isFiltered
              ? "Nenhum agendamento com este filtro"
              : "Nenhum agendamento encontrado"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isFiltered
              ? "Tente exibir todos os agendamentos para consultar outros status."
              : "Escolha um serviço no catálogo quando quiser reservar um horário."}
          </p>
        </div>
        {isFiltered && onResetFilter ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={onResetFilter}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors cursor-pointer"
            >
              Ver todos os agendamentos
            </button>
          </div>
        ) : emptyActionHref && emptyActionLabel ? (
          <div className="pt-1">
            <Link
              href={emptyActionHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors"
            >
              {emptyActionLabel}
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {appointmentList.map((appointment) => {
        const when = getAppointmentWhen(appointment.startAt, appointment.endAt);
        const durationMin =
          appointment.service?.durationMinutes ?? when.durationMin;
        const counterpart = isProfessional
          ? appointment.client
            ? { label: "Cliente", name: appointment.client.name }
            : null
          : appointment.professional
            ? { label: "Profissional", name: appointment.professional.name }
            : null;
        const isHighlighted = appointment.id === highlightId;
        const isOverdue =
          now > 0 &&
          appointment.status === "SCHEDULED" &&
          new Date(appointment.endAt).getTime() < now;
        const relativeLabel =
          appointment.status === "SCHEDULED" && !isOverdue
            ? getRelativeLabel(appointment.startAt, appointment.endAt, now)
            : null;

        return (
          <li
            key={appointment.id}
            id={`appointment-${appointment.id}`}
            aria-current={isHighlighted ? "true" : undefined}
            className={`scroll-mt-24 rounded-2xl bg-card text-card-foreground border p-5 space-y-4 transition-colors ${
              isHighlighted
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-start gap-4">
              <DateLeaf
                weekday={when.weekday}
                day={when.day}
                month={when.month}
                longDate={when.longDate}
                emphasized={appointment.status === "SCHEDULED" && !isOverdue}
              />

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-card-foreground truncate">
                    {appointment.service?.name || "Serviço Agendado"}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${
                      statusStyles[appointment.status] ||
                      "bg-secondary text-secondary-foreground border-border"
                    }`}
                  >
                    {statusLabels[appointment.status] || appointment.status}
                  </span>
                </div>

                <p className="text-sm text-foreground tabular-nums">
                  <span className="font-medium">{when.timeRange}</span>
                  {durationMin ? (
                    <span className="text-muted-foreground">
                      {" · "}
                      {formatDuration(durationMin)}
                    </span>
                  ) : null}
                  {relativeLabel ? (
                    <span className="text-accent-foreground font-medium">
                      {" · "}
                      {relativeLabel}
                    </span>
                  ) : null}
                </p>

                {counterpart ? (
                  <p className="text-xs text-muted-foreground truncate">
                    {counterpart.label}: {counterpart.name}
                  </p>
                ) : null}

                {isOverdue ? (
                  <p className="text-xs text-muted-foreground">
                    {isProfessional
                      ? "Horário encerrado — registrado no histórico como agendado."
                      : "Horário encerrado — aguarda confirmação de conclusão pelo profissional."}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Valor do serviço
              </span>
              <span className="text-lg font-extrabold text-foreground tabular-nums">
                {formatCurrency(appointment.servicePrice)}
              </span>
            </div>

            {appointment.status === "SCHEDULED" && onCancel && now > 0 && (
              <div className="space-y-2">
                {cancelError?.id === appointment.id && (
                  <div
                    ref={cancelErrorRef}
                    tabIndex={-1}
                    role="alert"
                    className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive dark:text-red-400 text-xs flex items-center justify-between gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>{cancelError.message}</span>
                    {onDismissCancelError && (
                      <button
                        type="button"
                        onClick={onDismissCancelError}
                        className="px-2 py-1 rounded-md hover:bg-destructive/20 font-semibold shrink-0 transition-colors cursor-pointer"
                      >
                        Fechar
                      </button>
                    )}
                  </div>
                )}
                {canCancelAppointment(appointment.startAt) ? (
                  <>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Cancelável até{" "}
                      {formatDateTime(getCancelDeadline(appointment.startAt))}
                    </p>
                    {confirmingId === appointment.id &&
                    cancellingId !== appointment.id ? (
                      <div
                        role="group"
                        aria-label="Confirmar cancelamento"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setConfirmingId(null);
                        }}
                        className="space-y-2.5"
                      >
                        <p className="text-sm text-foreground">
                          Cancelar{" "}
                          <span className="font-semibold">
                            {appointment.service?.name || "este agendamento"}
                          </span>{" "}
                          em{" "}
                          <span className="tabular-nums">
                            {formatDateTime(appointment.startAt)}
                          </span>
                          ? O horário será liberado.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            autoFocus
                            onClick={() => setConfirmingId(null)}
                            className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors cursor-pointer"
                          >
                            Manter agendamento
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmingId(null);
                              onCancel(appointment.id);
                            }}
                            className="py-2.5 px-3 rounded-xl text-sm font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors cursor-pointer"
                          >
                            Confirmar cancelamento
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={cancellingId === appointment.id}
                        onClick={() => {
                          onDismissCancelError?.();
                          setConfirmingId(appointment.id);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive dark:text-red-400 border border-destructive/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {cancellingId === appointment.id
                          ? "Cancelando..."
                          : "Cancelar agendamento"}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    O prazo para cancelar terminou em{" "}
                    {formatDateTime(getCancelDeadline(appointment.startAt))}{" "}
                    (mínimo de 24h antes do início).
                  </p>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
