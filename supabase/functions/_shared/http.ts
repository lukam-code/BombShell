import type { Env } from "./env.ts";

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** Edge Functions poziva samo baza (pg_net / pg_cron) sa deljenom tajnom. */
export function authorize(req: Request, env: Env): Response | null {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const secret = req.headers.get("x-webhook-secret");
  if (!env.NOTIFY_WEBHOOK_SECRET) {
    console.error("NOTIFY_WEBHOOK_SECRET nije podešen – zahtev odbijen.");
    return json({ error: "Not configured" }, 503);
  }
  if (!secret || !timingSafeEqual(secret, env.NOTIFY_WEBHOOK_SECRET)) return json({ error: "Unauthorized" }, 401);
  return null;
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
