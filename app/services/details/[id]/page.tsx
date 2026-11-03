import Link from "next/link";
import { type ProfessionalServicesProps } from "../../[id]/page";
import { cacheLife, cacheTag } from "next/cache";
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
  cacheTag("services", `service:${id}`);
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
          className="inline-flex items-center text-xs font-medium text-primary hover:opacity-80 transition-opacity"
        >
          ← Voltar para Serviços
        </Link>
      </div>

      {/* Card principal de detalhes */}
      <div className="rounded-2xl bg-card text-card-foreground border border-border p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground border border-primary/20">
              Detalhes do Serviço
            </span>
            <h1 className="text-3xl font-extrabold text-card-foreground tracking-tight">
              {service.name}
            </h1>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-xs text-muted-foreground block">Preço</span>
            <span className="text-3xl font-extrabold text-foreground dark:text-white">
              R$ {Number(service.price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Informações em destaque */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted rounded-xl p-4 border border-border space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">
              Duração Estimada
            </span>
            <p className="text-lg font-bold text-foreground">
              {service.durationMinutes} minutos
            </p>
          </div>

          <div className="bg-muted rounded-xl p-4 border border-border space-y-1">
            <span className="text-xs text-muted-foreground block font-medium">
              Profissional Responsável
            </span>
            {professionals.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {professionals.map((prof) => (
                  <span
                    key={prof.id}
                    className="inline-flex items-center gap-1.5 text-foreground font-bold text-base"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {prof.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Nenhum profissional vinculado
              </p>
            )}
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sobre o Serviço
          </h2>
          <div className="bg-muted rounded-xl p-5 border border-border text-foreground leading-relaxed text-sm">
            {service.description ? (
              <p>{service.description}</p>
            ) : (
              <p className="text-muted-foreground italic">
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
