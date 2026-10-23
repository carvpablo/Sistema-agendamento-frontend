import { type Appointment } from "../appointments/[id]/page";

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const statusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export default function AppointmentList({
  appointmentList,
}: {
  appointmentList: Appointment[];
}) {
  if (appointmentList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
        <h2 className="text-lg font-semibold text-slate-300">
          Nenhum agendamento encontrado
        </h2>
        <p className="mt-1 text-sm text-slate-500">
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
          className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-6 space-y-4 hover:border-slate-700 transition-all shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-white">
                {appointment.service?.name || "Serviço Agendado"}
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                #{appointment.id.slice(0, 8)}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                statusStyles[appointment.status] ||
                "bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              {statusLabels[appointment.status] || appointment.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-sm">
            {appointment.professional && (
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
                <span className="text-xs text-slate-400 block">
                  Profissional
                </span>
                <span className="font-medium text-slate-200">
                  {appointment.professional.name}
                </span>
              </div>
            )}

            {appointment.client && (
              <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/60">
                <span className="text-xs text-slate-400 block">Cliente</span>
                <span className="font-medium text-slate-200">
                  {appointment.client.name}
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-950/40 rounded-xl p-3.5 border border-slate-800/60 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Início:</span>
              <span className="font-medium text-slate-200">
                {new Date(appointment.startAt).toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Término:</span>
              <span className="font-medium text-slate-200">
                {new Date(appointment.endAt).toLocaleString("pt-BR")}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Valor do serviço</span>
            <span className="text-lg font-extrabold text-emerald-400">
              R$ {Number(appointment.servicePrice).toFixed(2)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
