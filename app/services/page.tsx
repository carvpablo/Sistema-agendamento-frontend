import { Suspense } from "react";
import ServiceList from "../components/ServiceList";
import { cacheLife, cacheTag } from "next/cache";

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  professionalServices?: {
    professional: {
      id: string;
      name: string;
      email?: string;
    };
  }[];
}

async function ServicesFetcher() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });
  cacheTag("services");
  const response = await fetch("http://localhost:3000/services");

  if (!response.ok) {
    throw new Error("Falha ao carregar serviços");
  }

  const services: Service[] = await response.json();

  return <ServiceList serviceList={services} />;
}

export default function Services() {
  return (
    <main className="space-y-8">
      <div className="border-b border-border pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Serviços Disponíveis
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confira todos os serviços cadastrados na plataforma.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-12 text-center text-muted-foreground animate-pulse">
            Carregando catálogo de serviços...
          </div>
        }
      >
        <ServicesFetcher />
      </Suspense>
    </main>
  );
}
