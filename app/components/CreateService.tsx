"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { type CreateServiceFormType } from "@/types/types";
import { invalidateServicesCache } from "@/app/actions/cacheActions";
import useAuth, { useAuthHydrated } from "@/store/auth";
import { API_URL } from "@/lib/api";
import { formatCurrency, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CreateServiceProps {
  onSuccess?: () => void;
}

const DURATION_PRESETS = [30, 45, 60, 90, 120];

export default function CreateService({ onSuccess }: CreateServiceProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdServiceName, setCreatedServiceName] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const statusRef = useRef<HTMLDivElement | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const { user } = useAuth();
  const isAuthHydrated = useAuthHydrated();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateServiceFormType>({
    defaultValues: {
      name: "",
      description: "",
      durationMinutes: 45,
      price: undefined,
    },
  });

  const watchedName = useWatch({ control, name: "name" }) ?? "";
  const watchedDescription = useWatch({ control, name: "description" }) ?? "";
  const watchedDuration = useWatch({ control, name: "durationMinutes" });
  const watchedPrice = useWatch({ control, name: "price" });

  useEffect(() => {
    if (createdServiceName) {
      statusRef.current?.focus();
    }
  }, [createdServiceName]);

  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.focus();
    }
  }, [errorMessage]);

  async function handleCreateService(data: CreateServiceFormType) {
    setIsLoading(true);
    setErrorMessage(null);
    setCreatedServiceName(null);

    try {
      const response = await fetch(`${API_URL}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          durationMinutes: Number(data.durationMinutes),
          price: Number(data.price),
        }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        name?: string;
      };

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setErrorMessage(
            "Sua sessão expirou ou você não tem permissão para criar serviços. Entre novamente como profissional.",
          );
          return;
        }
        setErrorMessage(result.error || "Não foi possível criar o serviço.");
        return;
      }

      setCreatedServiceName(result.name || data.name.trim());
      reset({
        name: "",
        description: "",
        durationMinutes: 45,
        price: undefined,
      });
      await invalidateServicesCache(user?.id);
      router.refresh();

      if (onSuccess) {
        onSuccess();
      }
    } catch {
      setErrorMessage(
        "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Espera hidratação da sessão para evitar flash de acesso restrito
  if (!isAuthHydrated && !user) {
    return (
      <div
        aria-busy="true"
        aria-label="Carregando formulário de criação de serviço"
        className="space-y-8 animate-pulse"
      >
        <div className="border-b border-border pb-5 space-y-2">
          <div className="h-8 w-56 rounded bg-muted" />
          <div className="h-4 w-80 max-w-full rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 h-96 rounded-2xl bg-card border border-border" />
          <div className="lg:col-span-2 h-64 rounded-2xl bg-card border border-border" />
        </div>
      </div>
    );
  }

  // Bloqueia acesso caso não seja um profissional autenticado
  if (!user || user.role !== "professional") {
    return (
      <div className="rounded-2xl bg-card text-card-foreground border border-border p-10 text-center max-w-lg mx-auto space-y-4">
        <h1 className="text-xl font-bold text-foreground">
          Acesso restrito a profissionais
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Entre com uma conta profissional para cadastrar e gerenciar serviços
          no catálogo da plataforma.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/auth/professional/login"
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            Entrar como Profissional
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors"
          >
            Ver Catálogo Público
          </Link>
        </div>
      </div>
    );
  }

  const previewDuration =
    Number.isFinite(Number(watchedDuration)) && Number(watchedDuration) >= 5
      ? Number(watchedDuration)
      : 45;
  const previewPrice =
    Number.isFinite(Number(watchedPrice)) && Number(watchedPrice) > 0
      ? Number(watchedPrice)
      : 0;
  const descriptionLength = watchedDescription.length;

  return (
    <div className="space-y-8">
      {/* Cabeçalho padronizado com o restante do painel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Criar Novo Serviço
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure o nome, tempo de atendimento e valor que aparecerão para
            seus clientes no catálogo.
          </p>
        </div>

        <Link
          href={`/services/${user.id}`}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft
            aria-hidden="true"
            className="w-3.5 h-3.5"
            strokeWidth={1.75}
          />
          Meus Serviços
        </Link>
      </div>

      {/* Feedback de sucesso com atalhos diretos para o próximo passo */}
      {createdServiceName && (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              aria-hidden="true"
              className="w-4 h-4 shrink-0"
              strokeWidth={2}
            />
            <span>
              Serviço{" "}
              <span className="font-semibold">{createdServiceName}</span>{" "}
              publicado com sucesso no seu catálogo.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/services/${user.id}`}
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold transition-colors"
            >
              Ver Meus Serviços
            </Link>
            <Link
              href="/availability"
              className="inline-flex items-center justify-center h-8 px-3.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold transition-colors"
            >
              Configurar Disponibilidade
            </Link>
            <button
              type="button"
              onClick={() => setCreatedServiceName(null)}
              className="inline-flex items-center justify-center h-8 px-2.5 rounded-lg hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive dark:text-red-400 text-sm flex items-center justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="px-2.5 py-1 rounded-lg hover:bg-destructive/20 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Coluna Principal: Formulário de cadastro */}
        <section
          aria-label="Dados do serviço"
          className="lg:col-span-3 rounded-2xl bg-card text-card-foreground border border-border p-6 sm:p-8"
        >
          <form
            onSubmit={handleSubmit(handleCreateService)}
            noValidate
            className="space-y-6"
          >
            {/* Nome do Serviço */}
            <div className="space-y-2">
              <label
                htmlFor="service-name"
                className="block text-sm font-semibold text-foreground"
              >
                Nome do Serviço
              </label>
              <input
                id="service-name"
                type="text"
                placeholder="Ex: Corte Degradê e Finalização"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={
                  errors.name ? "service-name-error" : "service-name-hint"
                }
                className={cn(
                  "w-full h-11 px-4 rounded-xl bg-background border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors",
                  errors.name ? "border-destructive" : "border-input",
                )}
                {...register("name", {
                  required: "Informe o nome do serviço.",
                  minLength: {
                    value: 3,
                    message: "O nome deve ter pelo menos 3 caracteres.",
                  },
                })}
              />
              {errors.name ? (
                <p
                  id="service-name-error"
                  role="alert"
                  className="text-xs font-medium text-destructive dark:text-red-400"
                >
                  {errors.name.message}
                </p>
              ) : (
                <p
                  id="service-name-hint"
                  className="text-xs text-muted-foreground"
                >
                  Use um título direto para facilitar a busca no catálogo.
                </p>
              )}
            </div>

            {/* Descrição com contador de caracteres */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <label
                  htmlFor="service-description"
                  className="block text-sm font-semibold text-foreground"
                >
                  Descrição{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </label>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    descriptionLength > 500
                      ? "text-destructive font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {descriptionLength}/500
                </span>
              </div>
              <textarea
                id="service-description"
                rows={4}
                placeholder="Explique o que está incluso no atendimento, técnicas utilizadas ou recomendações ao cliente."
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "service-description-error" : undefined
                }
                className={cn(
                  "w-full px-4 py-3 rounded-xl bg-background border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-y min-h-[104px]",
                  errors.description ? "border-destructive" : "border-input",
                )}
                {...register("description", {
                  maxLength: {
                    value: 500,
                    message: "A descrição deve ter no máximo 500 caracteres.",
                  },
                })}
              />
              {errors.description && (
                <p
                  id="service-description-error"
                  role="alert"
                  className="text-xs font-medium text-destructive dark:text-red-400"
                >
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Duração e Preço */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-border">
              {/* Duração */}
              <div className="space-y-2.5">
                <label
                  htmlFor="service-duration"
                  className="block text-sm font-semibold text-foreground"
                >
                  Duração do Atendimento
                </label>
                <div className="relative">
                  <input
                    id="service-duration"
                    type="number"
                    min={5}
                    step={5}
                    placeholder="45"
                    aria-invalid={Boolean(errors.durationMinutes)}
                    aria-describedby={
                      errors.durationMinutes
                        ? "service-duration-error"
                        : undefined
                    }
                    className={cn(
                      "w-full h-11 pl-4 pr-20 rounded-xl bg-background border text-sm text-foreground tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors",
                      errors.durationMinutes
                        ? "border-destructive"
                        : "border-input",
                    )}
                    {...register("durationMinutes", {
                      required: "Informe a duração em minutos.",
                      valueAsNumber: true,
                      min: {
                        value: 5,
                        message: "A duração mínima é de 5 minutos.",
                      },
                      validate: (val) =>
                        Number.isInteger(val) ||
                        "Informe um número inteiro de minutos.",
                    })}
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    minutos
                  </span>
                </div>

                {/* Atalhos rápidos de duração */}
                <div
                  role="group"
                  aria-label="Sugestões de duração"
                  className="flex flex-wrap items-center gap-1.5"
                >
                  {DURATION_PRESETS.map((minutes) => {
                    const isSelected = Number(watchedDuration) === minutes;
                    return (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() =>
                          setValue("durationMinutes", minutes, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border-border",
                        )}
                      >
                        {formatDuration(minutes)}
                      </button>
                    );
                  })}
                </div>

                {errors.durationMinutes && (
                  <p
                    id="service-duration-error"
                    role="alert"
                    className="text-xs font-medium text-destructive dark:text-red-400"
                  >
                    {errors.durationMinutes.message}
                  </p>
                )}
              </div>

              {/* Preço */}
              <div className="space-y-2.5">
                <label
                  htmlFor="service-price"
                  className="block text-sm font-semibold text-foreground"
                >
                  Valor Cobrado
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    R$
                  </span>
                  <input
                    id="service-price"
                    type="number"
                    min={0.01}
                    step="0.01"
                    placeholder="60,00"
                    aria-invalid={Boolean(errors.price)}
                    aria-describedby={
                      errors.price
                        ? "service-price-error"
                        : "service-price-hint"
                    }
                    className={cn(
                      "w-full h-11 pl-10 pr-4 rounded-xl bg-background border text-sm text-foreground tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors",
                      errors.price ? "border-destructive" : "border-input",
                    )}
                    {...register("price", {
                      required: "Informe o valor do serviço.",
                      valueAsNumber: true,
                      min: {
                        value: 0.01,
                        message: "O valor deve ser maior que R$ 0,00.",
                      },
                    })}
                  />
                </div>
                {errors.price ? (
                  <p
                    id="service-price-error"
                    role="alert"
                    className="text-xs font-medium text-destructive dark:text-red-400"
                  >
                    {errors.price.message}
                  </p>
                ) : (
                  <p
                    id="service-price-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Valor integral exibido aos clientes antes da confirmação.
                  </p>
                )}
              </div>
            </div>

            {/* Ações do Formulário */}
            <div className="pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setErrorMessage(null);
                  reset({
                    name: "",
                    description: "",
                    durationMinutes: 45,
                    price: undefined,
                  });
                }}
                className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-xs font-semibold bg-secondary hover:bg-accent text-secondary-foreground hover:text-accent-foreground border border-border transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Limpar campos
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isLoading ? "Publicando serviço..." : "Publicar Serviço"}
              </button>
            </div>
          </form>
        </section>

        {/* Coluna Lateral: Pré-visualização em tempo real do card no catálogo */}
        <aside
          aria-label="Pré-visualização do serviço no catálogo"
          className="lg:col-span-2 space-y-4 lg:sticky lg:top-20"
        >
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-muted-foreground">
              Pré-visualização no Catálogo
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              Tempo real
            </span>
          </div>

          {/* Card idêntico ao exibido em ServiceList */}
          <div className="rounded-2xl bg-card text-card-foreground border border-border p-6 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-lg font-bold leading-snug text-card-foreground break-words">
                  {watchedName.trim() || "Nome do seu serviço"}
                </h3>
                <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border tabular-nums">
                  <Clock
                    aria-hidden="true"
                    className="w-3 h-3 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  {formatDuration(previewDuration)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground truncate">
                Profissional:{" "}
                <span className="font-medium text-foreground">{user.name}</span>
              </p>

              {watchedDescription.trim() ? (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words">
                  {watchedDescription.trim()}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/70 italic">
                  A descrição informada aparecerá aqui para orientar o cliente.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="pt-4 border-t border-border flex items-baseline justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  Valor do serviço
                </span>
                <span className="text-xl font-extrabold text-foreground tabular-nums">
                  {formatCurrency(previewPrice)}
                </span>
              </div>

              <div
                aria-hidden="true"
                className="inline-flex items-center justify-center w-full h-10 px-4 rounded-xl text-xs font-semibold bg-primary/15 text-primary dark:text-accent-foreground border border-primary/25 select-none"
              >
                Ver detalhes
              </div>
            </div>
          </div>

          {/* Contexto operacional sobre como a duração afeta os slots */}
          <div className="rounded-xl bg-muted/60 border border-border p-4 flex items-start gap-3">
            <CalendarClock
              aria-hidden="true"
              className="w-4 h-4 text-primary dark:text-accent-foreground shrink-0 mt-0.5"
              strokeWidth={1.75}
            />
            <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground">
                Cálculo automático de horários livres
              </p>
              <p>
                O sistema divide suas janelas de{" "}
                <Link
                  href="/availability"
                  className="font-semibold text-primary dark:text-accent-foreground hover:underline underline-offset-4"
                >
                  Disponibilidade
                </Link>{" "}
                em blocos de{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {formatDuration(previewDuration)}
                </span>
                , garantindo que nenhum agendamento ultrapasse seu expediente.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
