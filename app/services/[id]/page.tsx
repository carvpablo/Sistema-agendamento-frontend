import ServiceList from "@/app/components/ServiceList";
import Link from "next/link";
import { Suspense } from "react";

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
  const { id } = await params;

  const response = await fetch(
    `http://localhost:3000/professionals/${id}/services`,
    {
      cache: "no-store",
    },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Meus Serviços
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Serviços associados ao seu perfil profissional.
          </p>
        </div>

        <Link
          href="/services/create"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
        >
          + Novo Serviço
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="p-12 text-center text-slate-400 animate-pulse">
            Carregando seus serviços...
          </div>
        }
      >
        <MyServicesFetcher params={params} />
      </Suspense>
    </main>
  );
}
