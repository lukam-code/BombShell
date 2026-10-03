// Edge Function: podsetnici 24h pre termina. Poziva je pg_cron svakih 15 minuta.
// claim_due_reminders() atomično upisuje reminder_sent_at, pa se podsetnik nikad ne šalje dvaput.
import { notifyCustomer } from "../_shared/customer.ts";
import { createDb } from "../_shared/db.ts";
import { readEnv } from "../_shared/env.ts";
import { authorize, json } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const env = readEnv();
  const denied = authorize(req, env);
  if (denied) return denied;

  try {
    const db = createDb(env);
    const due = await db.claimDueReminders();
    const results = [];
    for (const booking of due) {
      results.push({ id: booking.id, ...(await notifyCustomer({ env, db }, booking, "reminder")) });
    }
    return json({ processed: due.length, results });
  } catch (e) {
    console.error("send-reminders:", e);
    return json({ error: e instanceof Error ? e.message : "Greška" }, 500);
  }
});
