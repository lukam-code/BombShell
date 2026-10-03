// Edge Function: email obaveštenja (Resend) – salonu za nove/otkazane termine i recenzije,
// klijentkinji potvrda sa .ics prilogom. Poziva je trigger u bazi (pg_net).
import { createDb } from "../_shared/db.ts";
import { type EmailPayload, handleEmail } from "../_shared/emails.ts";
import { readEnv } from "../_shared/env.ts";
import { authorize, json } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const env = readEnv();
  const denied = authorize(req, env);
  if (denied) return denied;

  try {
    const payload = (await req.json()) as EmailPayload;
    if (!payload?.type) return json({ error: "type je obavezan" }, 400);
    const result = await handleEmail({ env, db: createDb(env) }, payload);
    return json(result, "error" in result ? 404 : 200);
  } catch (e) {
    console.error("send-email-notification:", e);
    return json({ error: e instanceof Error ? e.message : "Greška" }, 500);
  }
});
