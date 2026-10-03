// Resend email API: https://resend.com/docs/api-reference/emails/send-email
import type { Env } from "./env.ts";
import type { SendResult } from "./infobip.ts";

type FetchFn = typeof fetch;

export function resendConfigured(env: Env) {
  return Boolean(env.RESEND_API_KEY);
}

export function fromAddress(env: Env) {
  // Za testiranje Resend dozvoljava onboarding@resend.dev (samo ka adresi vlasnika naloga)
  return env.RESEND_FROM_EMAIL || "BOMBSHELL <onboarding@resend.dev>";
}

export async function sendEmail(
  env: Env,
  email: {
    to: string;
    subject: string;
    html: string;
    text: string;
    replyTo?: string;
    attachments?: Array<{ filename: string; content: string; content_type?: string }>;
  },
  fetchFn: FetchFn = fetch,
): Promise<SendResult> {
  try {
    const res = await fetchFn("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromAddress(env),
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
        ...(email.attachments?.length ? { attachments: email.attachments } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${json.message ?? "Resend greška"}` };
    return { ok: true, messageId: json.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
