// Pristup tajnim ključevima (Supabase secrets). Ništa od ovoga ne ide u frontend.
export type Env = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NOTIFY_WEBHOOK_SECRET?: string;
  SITE_URL?: string;
  INFOBIP_API_KEY?: string;
  INFOBIP_BASE_URL?: string;
  INFOBIP_SMS_SENDER?: string;
  INFOBIP_VIBER_SENDER?: string;
  /** "true" → u Viber zahtev se dodaje Infobip smsFailover (SMS ako primalac nema Viber) */
  INFOBIP_VIBER_SMS_FAILOVER?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  SALON_NOTIFICATION_EMAIL?: string;
};

const KEYS: (keyof Env)[] = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NOTIFY_WEBHOOK_SECRET",
  "SITE_URL",
  "INFOBIP_API_KEY",
  "INFOBIP_BASE_URL",
  "INFOBIP_SMS_SENDER",
  "INFOBIP_VIBER_SENDER",
  "INFOBIP_VIBER_SMS_FAILOVER",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "SALON_NOTIFICATION_EMAIL",
];

export function readEnv(): Env {
  const env: Env = {};
  for (const k of KEYS) {
    const v = Deno.env.get(k)?.trim();
    if (v) env[k] = v;
  }
  return env;
}

export function siteUrl(env: Env) {
  return (env.SITE_URL || "https://bombshell.rs").replace(/\/$/, "");
}
