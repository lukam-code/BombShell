// deno test --allow-env supabase/functions/_shared/env.test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { loadEnv } from "./env.ts";

Deno.test("loadEnv: Edge secrets imaju prednost, ostalo se čita iz Vault-a", async () => {
  Deno.env.set("SUPABASE_URL", "https://x.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "service-key");
  Deno.env.set("SITE_URL", "https://iz-env.rs");
  let called = "";
  const fakeFetch = (async (url: string | URL | Request, init?: RequestInit) => {
    called = `${url} ${new Headers(init?.headers).get("authorization")}`;
    return new Response(JSON.stringify({ notify_secret: "tajna", site_url: "https://iz-vaulta.rs", resend_api_key: "re_123", infobip_api_key: null }));
  }) as typeof fetch;
  const env = await loadEnv(fakeFetch);
  assertEquals(called, "https://x.supabase.co/rest/v1/rpc/get_notification_config Bearer service-key");
  assertEquals(env.NOTIFY_WEBHOOK_SECRET, "tajna");
  assertEquals(env.RESEND_API_KEY, "re_123");
  assertEquals(env.SITE_URL, "https://iz-env.rs");
  assertEquals(env.INFOBIP_API_KEY, undefined);
});
