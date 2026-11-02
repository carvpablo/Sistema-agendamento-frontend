"use client";

import Link from "next/link";
import useAuth from "@/store/auth";

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="py-12 sm:py-20">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground border border-primary/20">
          Plataforma de Gestão e Agendamentos
        </span>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
          Agende serviços com{" "}
          <span className="bg-gradient-to-r from-chart-1 via-chart-2 to-chart-4 bg-clip-text text-transparent">
            praticidade e rapidez
          </span>
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Conectamos clientes aos melhores profissionais. Gerencie horários,
          serviços e agendamentos em um único lugar de forma simples e moderna.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/services"
            className="px-6 py-3 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
          >
            Explorar Serviços
          </Link>

          {!user ? (
            <Link
              href="/auth/user/signin"
              className="px-6 py-3 rounded-xl font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-all"
            >
              Criar Conta Grátis
            </Link>
          ) : (
            <Link
              href={`/appointments/${user.id}`}
              className="px-6 py-3 rounded-xl font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-all"
            >
              Ver Meus Agendamentos
            </Link>
          )}
        </div>
      </div>

      {/* Cards de Recursos */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-accent border border-primary/20 flex items-center justify-center text-chart-1 font-bold">
            01
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Catálogo Completo
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Confira preços transparentes e tempo estimado de duração de cada
            serviço antes mesmo de agendar.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-accent border border-primary/20 flex items-center justify-center text-chart-2 font-bold">
            02
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Sem Conflito de Horários
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Validação inteligente de disponibilidade em tempo real para garantir
            que seu horário esteja sempre reservado.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-card text-card-foreground border border-border shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-accent border border-primary/20 flex items-center justify-center text-chart-3 font-bold">
            03
          </div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Painel para Profissionais
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cadastre seus próprios serviços, defina preços e acompanhe sua
            agenda de clientes com facilidade.
          </p>
        </div>
      </div>
    </main>
  );
}
