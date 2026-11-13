"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNow } from "@/lib/useNow";

const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function isSameDay(a?: Date, b?: Date): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPastDay(cellDate: Date, today: Date): boolean {
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();

  const startOfCell = new Date(
    cellDate.getFullYear(),
    cellDate.getMonth(),
    cellDate.getDate(),
  ).getTime();

  return startOfCell < startOfToday;
}

export interface CalendarProps {
  mode?: "single";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  markedDates?: Date[];
  disablePast?: boolean;
  className?: string;
}

export function Calendar({
  selected,
  onSelect,
  markedDates = [],
  disablePast = false,
  className,
}: CalendarProps) {
  const nowMs = useNow();

  const clientToday = React.useMemo(
    () => (nowMs > 0 ? new Date(nowMs) : null),
    [nowMs],
  );

  const [userViewDate, setUserViewDate] = React.useState<Date | null>(null);

  const viewDate = React.useMemo(() => {
    if (userViewDate) return userViewDate;
    if (selected) {
      return new Date(selected.getFullYear(), selected.getMonth(), 1);
    }
    if (clientToday) {
      return new Date(clientToday.getFullYear(), clientToday.getMonth(), 1);
    }
    return new Date(2026, 10, 1);
  }, [userViewDate, selected, clientToday]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarCells = React.useMemo(() => {
    const cells: { date: Date; inCurrentMonth: boolean }[] = [];

    // Dias do mês anterior para preencher a primeira semana
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        inCurrentMonth: false,
      });
    }

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        date: new Date(year, month, day),
        inCurrentMonth: true,
      });
    }

    // Dias do próximo mês para fechar 42 células (6 semanas completas)
    const remaining = 42 - cells.length;
    for (let day = 1; day <= remaining; day++) {
      cells.push({
        date: new Date(year, month + 1, day),
        inCurrentMonth: false,
      });
    }

    return cells;
  }, [year, month, daysInMonth, firstDayOfWeek, prevMonthDays]);

  function handlePrevMonth() {
    setUserViewDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setUserViewDate(new Date(year, month + 1, 1));
  }

  function handleDayClick(cellDate: Date, inCurrentMonth: boolean) {
    if (!inCurrentMonth) {
      setUserViewDate(new Date(cellDate.getFullYear(), cellDate.getMonth(), 1));
    }
    onSelect?.(cellDate);
  }

  return (
    <div
      data-slot="calendar"
      className={cn("p-3 select-none w-[280px]", className)}
    >
      {/* Cabeçalho do mês/ano */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Mês anterior"
          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
        </button>

        <span className="text-sm font-semibold text-foreground tracking-tight">
          {MONTHS_PT[month]} {year}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          aria-label="Próximo mês"
          className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS_PT.map((dayName) => (
          <div
            key={dayName}
            className="h-8 flex items-center justify-center text-[11px] font-medium text-muted-foreground"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-y-1">
        {calendarCells.map(({ date: cellDate, inCurrentMonth }) => {
          const isSelected = isSameDay(cellDate, selected);
          const isToday = clientToday ? isSameDay(cellDate, clientToday) : false;
          const isDisabled =
            disablePast && clientToday
              ? isPastDay(cellDate, clientToday)
              : false;
          const hasAvailability = markedDates.some((d) =>
            isSameDay(d, cellDate),
          );

          return (
            <button
              key={cellDate.toISOString()}
              type="button"
              disabled={isDisabled}
              aria-disabled={isDisabled || undefined}
              onClick={() =>
                !isDisabled && handleDayClick(cellDate, inCurrentMonth)
              }
              className={cn(
                "relative h-9 w-9 mx-auto flex flex-col items-center justify-center rounded-lg text-xs font-medium tabular-nums transition-colors",
                isDisabled
                  ? "opacity-30 cursor-not-allowed text-muted-foreground"
                  : cn(
                      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : isToday
                          ? "bg-accent text-accent-foreground font-semibold"
                          : inCurrentMonth
                            ? "text-foreground hover:bg-accent hover:text-accent-foreground"
                            : "text-muted-foreground/40 hover:bg-muted hover:text-muted-foreground",
                    ),
              )}
            >
              <span>{cellDate.getDate()}</span>
              {hasAvailability && (
                <span
                  className={cn(
                    "w-1 h-1 rounded-full mt-0.5",
                    isSelected && !isDisabled
                      ? "bg-primary-foreground"
                      : "bg-primary",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

