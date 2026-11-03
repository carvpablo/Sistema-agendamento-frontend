"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type Service } from "../services/page";

function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function ServiceList({
  serviceList,
}: {
  serviceList: Service[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredServices = useMemo(() => {
    const query = normalizeText(searchQuery.trim());
    if (!query) return serviceList;

    return serviceList.filter((service) => {
      const nameMatch = normalizeText(service.name).includes(query);
      const descriptionMatch = service.description
        ? normalizeText(service.description).includes(query)
        : false;
      const professionalMatch =
        service.professionalServices?.some((ps) =>
          normalizeText(ps.professional.name).includes(query),
        ) ?? false;
      return nameMatch || descriptionMatch || professionalMatch;
    });
  }, [serviceList, searchQuery]);

  if (serviceList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted p-12 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Nenhum serviço encontrado
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ainda não há serviços cadastrados nesta seção.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por serviço, descrição ou profissional..."
          aria-label="Buscar serviço"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-primary/50 transition-all shadow-xs"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted p-12 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Nenhum serviço encontrado para &ldquo;{searchQuery}&rdquo;
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tente buscar por outro termo ou limpe o filtro.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <li
              key={service.id}
              className="group rounded-2xl bg-card text-card-foreground border border-border p-6 hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between gap-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-card-foreground group-hover:text-primary transition-colors">
                    {service.name}
                  </h3>
                  <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                    {service.durationMinutes} min
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground">Profissional:</span>
                  <span className="font-semibold text-card-foreground truncate">
                    {service.professionalServices &&
                    service.professionalServices.length > 0
                      ? service.professionalServices
                          .map((ps) => ps.professional.name)
                          .join(", ")
                      : "Não informado"}
                  </span>
                </div>

                {service.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {service.description}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-muted-foreground block">
                    Valor
                  </span>
                  <span className="text-xl font-extrabold text-foreground dark:text-white">
                    R$ {Number(service.price).toFixed(2)}
                  </span>
                </div>

                <Link
                  href={`/services/details/${service.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-all"
                >
                  Ver detalhes
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
