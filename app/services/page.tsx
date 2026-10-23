import { Suspense } from "react";
import ServiceList from "../components/ServiceList";
import { cacheLife } from "next/cache";

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
}

async function ServicesFetcher() {
  "use cache";
  cacheLife({ stale: 60, expire: 3600 });
  const response = await fetch("http://localhost:3000/services", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar serviços");
  }

  const services: Service[] = await response.json();

  return <ServiceList serviceList={services} />;
}

export default function Services() {
  return (
    <main className="space-y-8">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Serviços Disponíveis
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Confira todos os serviços cadastrados na plataforma.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-400 animate-pulse">
            Carregando catálogo de serviços...
          </div>
        }
      >
        <ServicesFetcher />
      </Suspense>
    </main>
  );
}
