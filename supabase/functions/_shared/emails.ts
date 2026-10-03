// Logika email obaveštenja. Nikada ne baca grešku – ishod ide u notification_log.
import { type Env, siteUrl } from "./env.ts";
import { buildIcs, toBase64 } from "./ics.ts";
import { resendConfigured, sendEmail } from "./resend.ts";
import { SALON } from "./salon.ts";
import { customerConfirmation, salonCancelledBooking, salonNewBooking, salonNewReview } from "./emailTemplates.ts";
import type { Db, LogEntry } from "./types.ts";

type FetchFn = typeof fetch;
type Deps = { env: Env; db: Db; fetch?: FetchFn };

export type EmailPayload =
  | { type: "booking_created"; booking_id: string; notify_salon?: boolean; notify_customer?: boolean }
  | { type: "booking_cancelled"; booking_id: string }
  | { type: "review_created"; review_id: string };

async function deliver(
  deps: Deps,
  entry: Omit<LogEntry, "status" | "error" | "channel">,
  email: Parameters<typeof sendEmail>[1] | null,
  skipReason?: string,
) {
  const { env, db } = deps;
  if (!email || skipReason) {
    await db.log({ ...entry, channel: "email", status: "skipped", error: skipReason ?? null });
    return "skipped";
  }
  if (!resendConfigured(env)) {
    await db.log({ ...entry, channel: "email", status: "skipped", error: "Resend nije podešen (RESEND_API_KEY)." });
    return "skipped";
  }
  const res = await sendEmail(env, email, deps.fetch ?? fetch);
  await db.log({ ...entry, channel: "email", status: res.ok ? "sent" : "failed", error: res.error ?? null });
  return res.ok ? "sent" : "failed";
}

export async function handleEmail(deps: Deps, payload: EmailPayload) {
  const { env, db } = deps;
  const site = siteUrl(env);
  const salonTo = env.SALON_NOTIFICATION_EMAIL;
  const results: Record<string, string> = {};

  if (payload.type === "review_created") {
    const review = await db.getReview(payload.review_id);
    if (!review) return { error: "Recenzija nije pronađena" };
    const t = salonNewReview(review, `${site}/admin/recenzije`);
    results.salon = await deliver(
      deps,
      { booking_id: null, type: "salon_review", recipient: salonTo ?? null },
      salonTo ? { to: salonTo, ...t } : null,
      salonTo ? undefined : "SALON_NOTIFICATION_EMAIL nije podešen.",
    );
    return results;
  }

  const booking = await db.getBooking(payload.booking_id);
  if (!booking) return { error: "Termin nije pronađen" };
  const adminUrl = `${site}/admin/termini?id=${booking.id}`;

  if (payload.type === "booking_created") {
    if (payload.notify_salon !== false) {
      const t = salonNewBooking(booking, adminUrl);
      results.salon = await deliver(
        deps,
        { booking_id: booking.id, type: "salon_new", recipient: salonTo ?? null },
        salonTo ? { to: salonTo, ...t, replyTo: booking.customer_email ?? undefined } : null,
        salonTo ? undefined : "SALON_NOTIFICATION_EMAIL nije podešen.",
      );
    }
    if (payload.notify_customer !== false && booking.customer_email) {
      const cancelUrl = `${site}/otkazivanje/${booking.cancel_token}`;
      const t = customerConfirmation(booking, cancelUrl);
      const ics = buildIcs({
        uid: booking.id,
        start: booking.start_time,
        end: booking.end_time,
        title: `BOMBSHELL – ${booking.services?.name ?? "termin"}`,
        description: `Adresa: ${SALON.addressFull}\nTelefon: ${SALON.phoneDisplay}\nOtkazivanje: ${cancelUrl}`,
        url: cancelUrl,
      });
      results.customer = await deliver(deps, { booking_id: booking.id, type: "confirmation", recipient: booking.customer_email }, {
        to: booking.customer_email,
        ...t,
        replyTo: salonTo,
        attachments: [{ filename: "bombshell-termin.ics", content: toBase64(ics), content_type: "text/calendar; charset=utf-8" }],
      });
    }
    return results;
  }

  if (payload.type === "booking_cancelled") {
    const t = salonCancelledBooking(booking, adminUrl);
    results.salon = await deliver(
      deps,
      { booking_id: booking.id, type: "salon_cancelled", recipient: salonTo ?? null },
      salonTo ? { to: salonTo, ...t } : null,
      salonTo ? undefined : "SALON_NOTIFICATION_EMAIL nije podešen.",
    );
    return results;
  }
  return { error: "Nepoznat tip" };
}
