import { describe, expect, it } from "vitest";
import { buildCustomerMessage, messageLinks } from "../lib/customerMessages";
import type { Booking } from "../lib/types";

const b = {
  id: "1",
  customer_name: "Jelena Marković",
  customer_phone: "+381651234567",
  start_time: "2026-10-12T13:00:00Z",
  cancel_token: "tok",
  services: { name: "Šišanje", duration_minutes: 45, price_rsd: null },
} as Booking;

describe("ručne poruke klijentkinji", () => {
  it("potvrda", () => {
    const t = buildCustomerMessage("confirmation", b);
    expect(t).toContain("Poštovana Jelena");
    expect(t).toContain("Šišanje, ponedeljak 12.10. u 15:00");
    expect(t).toContain("/otkazivanje/tok");
  });
  it("otkazivanje i podsetnik", () => {
    expect(buildCustomerMessage("cancellation", b)).toContain("je otkazan");
    expect(buildCustomerMessage("reminder", b)).toContain("podsetnik");
  });
  it("linkovi", () => {
    const l = messageLinks("+381651234567", "Ćao šta");
    expect(l.sms).toBe("sms:+381651234567?&body=%C4%86ao%20%C5%A1ta");
    expect(l.whatsapp).toBe("https://wa.me/381651234567?text=%C4%86ao%20%C5%A1ta");
    expect(l.viber).toBe("viber://chat?number=%2B381651234567&draft=%C4%86ao%20%C5%A1ta");
  });
});
