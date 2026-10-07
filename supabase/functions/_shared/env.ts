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

/** Vault ključ (mala slova) → naziv promenljive */
const VAULT_KEYS: Record<string, keyof Env> = {
  notify_secret: "NOTIFY_WEBHOOK_SECRET",
  site_url: "SITE_URL",
  salon_notification_email: "SALON_NOTIFICATION_EMAIL",
  resend_api_key: "RESEND_API_KEY",
  resend_from_email: "RESEND_FROM_EMAIL",
  infobip_api_key: "INFOBIP_API_KEY",
  infobip_base_url: "INFOBIP_BASE_URL",
  infobip_sms_sender: "INFOBIP_SMS_SENDER",
  infobip_viber_sender: "INFOBIP_VIBER_SENDER",
  infobip_viber_sms_failover: "INFOBIP_VIBER_SMS_FAILOVER",
};

let cache: { env: Env; at: number } | null = null;

/**
 * Edge secrets imaju prednost; ono što tamo nije podešeno čita se iz Supabase Vault-a
 * (RPC get_notification_config, dostupan samo service_role ulozi). Keš traje 60 s.
 */
export async function loadEnv(fetchFn: typeof fetch = fetch): Promise<Env> {
  if (cache && Date.now() - cache.at < 60_000) return cache.env;
  const env = readEnv();
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const res = await fetchFn(`${env.SUPABASE_URL}/rest/v1/rpc/get_notification_config`, {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        const vault = (await res.json()) as Record<string, string | null>;
        for (const [name, key] of Object.entries(VAULT_KEYS)) {
          const v = vault?.[name]?.trim();
          if (v && !env[key]) env[key] = v;
        }
      } else {
        console.error("Vault podešavanja nisu dostupna:", res.status);
      }
    } catch (e) {
      console.error("Vault podešavanja nisu dostupna:", e instanceof Error ? e.message : e);
    }
  }
  cache = { env, at: Date.now() };
  return env;
}

export function siteUrl(env: Env) {
  return (env.SITE_URL || "https://www.bomb-shell.com").replace(/\/$/, "");
}
