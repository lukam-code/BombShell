// Infobip SMS i Viber. Dokumentacija: https://www.infobip.com/docs/api
import type { Env } from "./env.ts";

export type SendResult = { ok: boolean; error?: string; messageId?: string };
type FetchFn = typeof fetch;

const FAILED_GROUPS = new Set(["REJECTED", "UNDELIVERABLE", "EXPIRED"]);

export function infobipConfigured(env: Env) {
  return Boolean(env.INFOBIP_API_KEY && env.INFOBIP_BASE_URL);
}

function baseUrl(env: Env) {
  const b = env.INFOBIP_BASE_URL!.replace(/\/$/, "");
  return b.startsWith("http") ? b : `https://${b}`;
}

/** Infobip očekuje broj bez "+" (npr. 381651234567). */
function destination(e164: string) {
  return e164.replace(/^\+/, "");
}

async function post(env: Env, path: string, body: unknown, fetchFn: FetchFn): Promise<SendResult> {
  try {
    const res = await fetchFn(`${baseUrl(env)}${path}`, {
      method: "POST",
      headers: {
        Authorization: `App ${env.INFOBIP_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(text);
    } catch {
      /* ne-JSON odgovor */
    }
    if (!res.ok) {
      const reqErr = (json as { requestError?: { serviceException?: { text?: string } } }).requestError?.serviceException?.text;
      return { ok: false, error: `HTTP ${res.status}: ${reqErr ?? text.slice(0, 300)}` };
    }
    const msg = (json.messages as Array<{ messageId?: string; status?: { groupName?: string; description?: string } }> | undefined)?.[0];
    const group = msg?.status?.groupName;
    if (group && FAILED_GROUPS.has(group)) {
      return { ok: false, error: `${group}: ${msg?.status?.description ?? ""}`.trim(), messageId: msg?.messageId };
    }
    return { ok: true, messageId: msg?.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function sendSms(env: Env, to: string, text: string, fetchFn: FetchFn = fetch) {
  return post(
    env,
    "/sms/2/text/advanced",
    {
      messages: [
        {
          ...(env.INFOBIP_SMS_SENDER ? { from: env.INFOBIP_SMS_SENDER } : {}),
          destinations: [{ to: destination(to) }],
          text,
        },
      ],
    },
    fetchFn,
  );
}

export function sendViber(env: Env, to: string, text: string, smsFallbackText: string, fetchFn: FetchFn = fetch) {
  const message: Record<string, unknown> = {
    sender: env.INFOBIP_VIBER_SENDER,
    destinations: [{ to: destination(to) }],
    content: { body: { text, type: "TEXT" } },
  };
  // Infobip failover: ako primalac nema Viber, Infobip sam šalje SMS (naplaćuje se samo SMS).
  if (env.INFOBIP_VIBER_SMS_FAILOVER === "true") {
    message.options = {
      smsFailover: {
        ...(env.INFOBIP_SMS_SENDER ? { sender: env.INFOBIP_SMS_SENDER } : {}),
        text: smsFallbackText,
      },
    };
  }
  return post(env, "/viber/2/messages", { messages: [message] }, fetchFn);
}
