// Slanje SMS/Viber obaveštenja klijentu. Nikada ne baca grešku – svaki ishod ide u notification_log.
import { type Env, siteUrl } from "./env.ts";
import { infobipConfigured, sendSms, sendViber } from "./infobip.ts";
import { type CustomerMessageType, smsText, viberText } from "./messages.ts";
import type { BookingRow, Db } from "./types.ts";

type FetchFn = typeof fetch;

export async function notifyCustomer(
  deps: { env: Env; db: Db; fetch?: FetchFn },
  booking: BookingRow,
  type: CustomerMessageType,
): Promise<{ status: "sent" | "failed" | "skipped"; channel?: "viber" | "sms"; reason?: string }> {
  const { env, db } = deps;
  const fetchFn = deps.fetch ?? fetch;
  const base = { booking_id: booking.id, type, recipient: booking.customer_phone } as const;

  const skip = async (reason: string) => {
    await db.log({ ...base, channel: "sms", status: "skipped", error: reason });
    return { status: "skipped" as const, reason };
  };

  if (!booking.notifications_opt_in) return skip("Klijentkinja nije želela SMS/Viber obaveštenja.");
  if (type === "cancellation" && booking.status !== "cancelled") return skip("Termin nije otkazan.");
  if (type !== "cancellation" && !["pending", "confirmed"].includes(booking.status)) return skip(`Termin je u statusu "${booking.status}".`);
  if (!infobipConfigured(env)) return skip("Infobip nije podešen (INFOBIP_API_KEY / INFOBIP_BASE_URL).");

  const site = siteUrl(env);
  const input = {
    serviceName: booking.services?.name ?? "usluga",
    startTime: booking.start_time,
    cancelUrl: `${site}/otkazivanje/${booking.cancel_token}`,
    siteUrl: site,
  };
  const sms = smsText(type, input);

  // 1) Viber (ako je registrovan pošiljalac), 2) SMS kao rezerva
  if (env.INFOBIP_VIBER_SENDER) {
    const viber = await sendViber(env, booking.customer_phone, viberText(type, input), sms, fetchFn);
    await db.log({ ...base, channel: "viber", status: viber.ok ? "sent" : "failed", error: viber.error ?? null });
    if (viber.ok) return { status: "sent", channel: "viber" };
  }

  const res = await sendSms(env, booking.customer_phone, sms, fetchFn);
  await db.log({ ...base, channel: "sms", status: res.ok ? "sent" : "failed", error: res.error ?? null });
  return res.ok ? { status: "sent", channel: "sms" } : { status: "failed", channel: "sms", reason: res.error };
}
