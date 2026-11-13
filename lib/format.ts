const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Valor monetário em pt-BR, ex.: `R$ 250,00`. */
export function formatCurrency(value: number | string): string {
  return currencyFormatter.format(Number(value));
}

/** Data e hora em pt-BR sem segundos, ex.: `24/10/2026, 11:30`. */
export function formatDateTime(value: string | number | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

/** Duração curta, ex.: `45 min`, `1h`, `1h30`. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** Partes de data e horário de um agendamento, no vocabulário da agenda. */
export function getAppointmentWhen(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const time = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return {
    weekday: start
      .toLocaleDateString("pt-BR", { weekday: "short" })
      .replace(".", ""),
    day: start.toLocaleDateString("pt-BR", { day: "2-digit" }),
    month: start
      .toLocaleDateString("pt-BR", { month: "short" })
      .replace(".", ""),
    longDate: start.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    timeRange: `${time(start)}–${time(end)}`,
    durationMin: Math.round((end.getTime() - start.getTime()) / 60000),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(timestamp: number) {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Rótulo temporal relativo ao relógio atual (`Hoje`, `Amanhã`, `Em X dias`, `Em andamento`, `Horário já passou`). */
export function getRelativeLabel(
  startAt: string,
  endAt: string,
  now: number | null,
): string | null {
  if (!now) return null;
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (end < now) return "Horário já passou";
  if (start <= now) return "Em andamento";
  const dayDiff = Math.round((startOfDay(start) - startOfDay(now)) / DAY_MS);
  if (dayDiff === 0) return "Hoje";
  if (dayDiff === 1) return "Amanhã";
  if (dayDiff <= 7) return `Em ${dayDiff} dias`;
  return null;
}


