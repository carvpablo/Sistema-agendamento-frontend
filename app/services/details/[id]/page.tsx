import Link from "next/link";
import { type ProfessionalServicesProps } from "../../[id]/page";
import { cacheLife } from "next/cache";
import BookServiceSection from "@/app/components/BookServiceSection";

export interface ServiceDetail {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  professionalServices?: {
    professional: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

export default async function ServiceDetails({
  params,
}: ProfessionalServicesProps) {
  "use cache";
  cacheLife("minutes");
  const { id } = await params;
  const response = await fetch(`http://localhost:3000/services/${id}`);

  if (!response.ok) {
    throw new Error("Falha ao carregar dados do serviço");
  }

  const service: ServiceDetail = await response.json();
  const professionals =
    service.professionalServices?.map((ps) => ps.professional) || [];

  return (
    <main className="py-8 max-w-3xl mx-auto space-y-6">
      {/* Botão de voltar */}
      <div>
        <Link
          href="/services"
          className="inline-flex items-center text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          ← Voltar para Serviços
        </Link>
      </div>

      {/* Card principal de detalhes */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Detalhes do Serviço
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {service.name}
            </h1>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-xs text-slate-400 block">Preço</span>
            <span className="text-3xl font-extrabold text-emerald-400">
              R$ {Number(service.price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Informações em destaque */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-1">
            <span className="text-xs text-slate-400 block font-medium">
              Duração Estimada
            </span>
            <p className="text-lg font-bold text-slate-200">
              {service.durationMinutes} minutos
            </p>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 space-y-1">
            <span className="text-xs text-slate-400 block font-medium">
              Profissional Responsável
            </span>
            {professionals.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {professionals.map((prof) => (
                  <span
                    key={prof.id}
                    className="inline-flex items-center gap-1.5 text-slate-200 font-bold text-base"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {prof.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">
                Nenhum profissional vinculado
              </p>
            )}
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Sobre o Serviço
          </h2>
          <div className="bg-slate-950/40 rounded-xl p-5 border border-slate-800/60 text-slate-300 leading-relaxed text-sm">
            {service.description ? (
              <p>{service.description}</p>
            ) : (
              <p className="text-slate-500 italic">
                Nenhuma descrição detalhada fornecida para este serviço.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Seção interativa de agendamento por dias e slots de horário */}
      <BookServiceSection
        serviceId={service.id}
        serviceName={service.name}
        durationMinutes={service.durationMinutes}
        price={Number(service.price)}
        professionals={professionals}
      />
    </main>
  );
}
