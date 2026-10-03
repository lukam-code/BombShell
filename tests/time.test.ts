import { describe, expect, it } from "vitest";
import { belgradeToUtc, formatPrice, formatTime, formatDuration, todayInBelgrade } from "../lib/time";

describe("vreme (Europe/Belgrade)", () => {
  it("leto: UTC+2", () => {
    expect(belgradeToUtc("2026-07-10", "09:00").toISOString()).toBe("2026-07-10T07:00:00.000Z");
  });
  it("zima: UTC+1", () => {
    expect(belgradeToUtc("2026-12-10", "09:00").toISOString()).toBe("2026-12-10T08:00:00.000Z");
  });
  it("prikazuje lokalno vreme", () => {
    expect(formatTime("2026-12-10T08:00:00Z")).toBe("09:00");
  });
  it("današnji datum posle ponoći u Beogradu", () => {
    expect(todayInBelgrade(new Date("2026-10-03T22:30:00Z"))).toBe("2026-10-04");
  });
  it("cena i trajanje", () => {
    expect(formatPrice(null)).toBe("Cena na upit");
    expect(formatPrice(2500)).toMatch(/^od 2\.500 RSD$/);
    expect(formatDuration(90)).toBe("1 h 30 min");
  });
});
