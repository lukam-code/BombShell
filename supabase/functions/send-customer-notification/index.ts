// Edge Function: SMS/Viber obaveštenje klijentkinji (potvrda, otkazivanje, podsetnik).
// Poziva je trigger u bazi (pg_net) posle create_booking i promene statusa u 'cancelled'.
import { notifyCustomer } from "../_shared/customer.ts";
import { createDb } from "../_shared/db.ts";
import { readEnv } from "../_shared/env.ts";
import { authorize, json } from "../_shared/http.ts";
import type { CustomerMessageType } from "../_shared/messages.ts";

const TYPES: CustomerMessageType[] = ["confirmation", "reminder", "cancellation"];

Deno.serve(async (req) => {
  const env = readEnv();
  const denied = authorize(req, env);
  if (denied) return denied;

  try {
    const { booking_id, type } = (await req.json()) as { booking_id?: string; type?: CustomerMessageType };
    if (!booking_id || !type || !TYPES.includes(type)) return json({ error: "booking_id i type su obavezni" }, 400);
    const db = createDb(env);
    const booking = await db.getBooking(booking_id);
    if (!booking) return json({ error: "Termin nije pronađen" }, 404);
    const result = await notifyCustomer({ env, db }, booking, type);
    return json(result);
  } catch (e) {
    console.error("send-customer-notification:", e);
    return json({ error: e instanceof Error ? e.message : "Greška" }, 500);
  }
});
