/**
 * Bloco de data no formato "folha de calendário" usado nas linhas e nos cards
 * de agendamento. A data completa fica disponível para leitores de tela.
 */
export default function DateLeaf({
  weekday,
  day,
  month,
  longDate,
  emphasized = false,
}: {
  weekday: string;
  day: string;
  month: string;
  longDate: string;
  emphasized?: boolean;
}) {
  return (
    <>
      <span className="sr-only">{longDate}. </span>
      <div
        aria-hidden="true"
        className={`w-14 shrink-0 rounded-lg py-2 flex flex-col items-center leading-none tabular-nums ${
          emphasized
            ? "bg-accent text-accent-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <span className="text-[11px] font-medium uppercase">{weekday}</span>
        <span
          className={`mt-1 text-xl font-bold ${
            emphasized ? "text-accent-foreground" : "text-foreground"
          }`}
        >
          {day}
        </span>
        <span className="mt-1 text-[11px] font-medium">{month}</span>
      </div>
    </>
  );
}

