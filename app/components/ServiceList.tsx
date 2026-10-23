import Link from "next/link";
import { type Service } from "../services/page";

export default function ServiceList({
  serviceList,
}: {
  serviceList: Service[];
}) {
  if (serviceList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
        <h2 className="text-lg font-semibold text-slate-300">
          Nenhum serviço encontrado
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ainda não há serviços cadastrados nesta seção.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {serviceList.map((service) => (
        <li
          key={service.id}
          className="group rounded-2xl bg-slate-900/70 border border-slate-800/80 p-6 hover:border-indigo-500/40 hover:bg-slate-900 transition-all flex flex-col justify-between gap-4 shadow-sm"
        >
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                {service.name}
              </h3>
              <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {service.durationMinutes} min
              </span>
            </div>

            {service.description && (
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                {service.description}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-slate-400 block">Valor</span>
              <span className="text-xl font-extrabold text-emerald-400">
                R$ {Number(service.price).toFixed(2)}
              </span>
            </div>

            <Link
              href={`/services/details/${service.id}`}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 transition-all"
            >
              Ver detalhes
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
