"use client";

import { useSyncExternalStore } from "react";
import { type Appointment } from "../appointments/[id]/page";

const subscribeNoop = () => () => {};
const getNow = () => Date.now();
const getServerNow = () => 0;

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-accent text-accent-foreground border-primary/25",
  COMPLETED:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/25",
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
}: {
  appointmentList: Appointment[];
  onCancel?: (id: string) => void;
  cancellingId?: string | null;
}) {
  const now = useSyncExternalStore(subscribeNoop, getNow, getServerNow);

  const canCancelAppointment = (startAt: string) => {
    if (!now) return false;
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    return new Date(startAt).getTime() - now > twentyFourHoursInMs;
  };

  if (appointmentList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted p-12 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Nenhum agendamento encontrado
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Você ainda não possui agendamentos registrados.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {appointmentList.map((appointment) => (
        <li
          key={appointment.id}
          className="rounded-2xl bg-card text-card-foreground border border-border p-6 space-y-4 hover:border-primary/40 transition-all shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-card-foreground">
                {appointment.service?.name || "Serviço Agendado"}
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                #{appointment.id.slice(0, 8)}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                statusStyles[appointment.status] ||
                "bg-secondary text-secondary-foreground border-border"
              }`}
            >
              {statusLabels[appointment.status] || appointment.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
            {appointment.professional && (
              <div className="bg-muted rounded-xl p-3 border border-border">
                <span className="text-xs text-muted-foreground block">
                  Profissional
                </span>
                <span className="font-medium text-foreground">
                  {appointment.professional.name}
                </span>
              </div>
            )}

            {appointment.client && (
              <div className="bg-muted rounded-xl p-3 border border-border">
                <span className="text-xs text-muted-foreground block">
                  Cliente
                </span>
                <span className="font-medium text-foreground">
                  {appointment.client.name}
                </span>
              </div>
            )}
          </div>

          <div className="bg-muted rounded-xl p-3.5 border border-border space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Início:</span>
              <span className="font-medium text-foreground">
                {new Date(appointment.startAt).toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Término:</span>
              <span className="font-medium text-foreground">
                {new Date(appointment.endAt).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Valor do serviço
            </span>
            <span className="text-lg font-extrabold text-foreground dark:text-white">
              R$ {Number(appointment.servicePrice).toFixed(2)}
            </span>
          </div>

          {appointment.status === "SCHEDULED" && onCancel && (
            <div className="pt-2">
              {canCancelAppointment(appointment.startAt) ? (
                <button
                  type="button"
                  disabled={cancellingId === appointment.id}
                  onClick={() => onCancel(appointment.id)}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {cancellingId === appointment.id
                    ? "Cancelando..."
                    : "Cancelar Agendamento"}
                </button>
              ) : (
                <p className="text-xs text-center text-muted-foreground bg-muted border border-border rounded-xl py-2 px-3">
                  Cancelamento disponível apenas com mais de 24h de antecedência
                </p>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
