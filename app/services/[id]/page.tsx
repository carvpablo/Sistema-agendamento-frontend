import ServiceList from "@/app/components/ServiceList";
import Link from "next/link";
import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { API_URL } from "@/lib/api";

export interface ProfessionalServicesProps {
  params: Promise<{
    id: string;
  }>;
}

async function MyServicesFetcher({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });
  const { id } = await params;
  cacheTag("services", `professional-services:${id}`);

  const response = await fetch(
    `${API_URL}/professionals/${id}/services`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch services");
  }

  const result = await response.json();

  return <ServiceList serviceList={result} />;
}

export default function MyServices({ params }: ProfessionalServicesProps) {
  return (
    <main className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Meus Serviços
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Serviços associados ao seu perfil profissional.
          </p>
        </div>

        <Link
          href="/services/create"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all"
        >
          + Novo Serviço
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="p-12 text-center text-muted-foreground animate-pulse">
            Carregando seus serviços...
          </div>
        }
      >
        <MyServicesFetcher params={params} />
      </Suspense>
    </main>
  );
}
