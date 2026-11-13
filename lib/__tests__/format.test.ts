import { describe, expect, it } from "vitest";
import {
  formatDuration,
  getAppointmentWhen,
  getRelativeLabel,
} from "../format";

describe("format helpers", () => {
  it("formats durations in minutes and hours", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1h");
    expect(formatDuration(90)).toBe("1h30");
  });

  it("computes appointment time range and duration", () => {
    const when = getAppointmentWhen(
      "2026-11-12T14:00:00.000Z",
      "2026-11-12T15:30:00.000Z",
    );
    expect(when.durationMin).toBe(90);
    expect(when.timeRange).toContain("–");
  });

  it("returns relative labels for past, ongoing, today, tomorrow, and upcoming days", () => {
    const now = new Date("2026-11-11T12:00:00").getTime();

    expect(
      getRelativeLabel(
        "2026-11-11T10:00:00",
        "2026-11-11T11:00:00",
        now,
      ),
    ).toBe("Horário já passou");

    expect(
      getRelativeLabel(
        "2026-11-11T11:30:00",
        "2026-11-11T12:30:00",
        now,
      ),
    ).toBe("Em andamento");

    expect(
      getRelativeLabel(
        "2026-11-11T15:00:00",
        "2026-11-11T16:00:00",
        now,
      ),
    ).toBe("Hoje");

    expect(
      getRelativeLabel(
        "2026-11-12T09:00:00",
        "2026-11-12T10:00:00",
        now,
      ),
    ).toBe("Amanhã");

    expect(
      getRelativeLabel(
        "2026-11-14T09:00:00",
        "2026-11-14T10:00:00",
        now,
      ),
    ).toBe("Em 3 dias");
  });
});
