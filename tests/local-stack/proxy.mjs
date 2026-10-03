// Imitacija Supabase API gateway-a: /rest/v1 → PostgREST, /auth/v1 → mini auth.
import http from "node:http";
import crypto from "node:crypto";
import { ANON_KEY, sign, verify } from "./jwt.mjs";

const PGRST = "http://127.0.0.1:3001";
const ADMIN = { id: "00000000-0000-0000-0000-00000000a001", email: "admin@bombshell.rs", password: "Bombshell2026!" };

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*, authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "Content-Range, X-Total-Count");
}

function userJson() {
  return { id: ADMIN.id, aud: "authenticated", role: "authenticated", email: ADMIN.email, app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
}

function session() {
  const now = Math.floor(Date.now() / 1000);
  const access_token = sign({ sub: ADMIN.id, role: "authenticated", aud: "authenticated", email: ADMIN.email, iat: now, exp: now + 3600 });
  return { access_token, token_type: "bearer", expires_in: 3600, expires_at: now + 3600, refresh_token: crypto.randomUUID(), user: userJson() };
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  const url = new URL(req.url, "http://x");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks);

  if (url.pathname.startsWith("/auth/v1/")) {
    res.setHeader("Content-Type", "application/json");
    if (url.pathname === "/auth/v1/token") {
      const grant = url.searchParams.get("grant_type");
      const data = body.length ? JSON.parse(body.toString()) : {};
      if (grant === "password" && (data.email !== ADMIN.email || data.password !== ADMIN.password)) {
        return res.writeHead(400).end(JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials", code: "invalid_credentials", msg: "Invalid login credentials" }));
      }
      return res.writeHead(200).end(JSON.stringify(session()));
    }
    if (url.pathname === "/auth/v1/user") {
      const token = (req.headers.authorization || "").replace(/^Bearer /, "");
      const claims = token && verify(token);
      if (!claims || claims.role !== "authenticated") return res.writeHead(401).end(JSON.stringify({ msg: "invalid JWT", code: 401 }));
      return res.writeHead(200).end(JSON.stringify(userJson()));
    }
    if (url.pathname === "/auth/v1/logout") return res.writeHead(204).end();
    return res.writeHead(404).end(JSON.stringify({ msg: "not implemented in local stack" }));
  }

  if (url.pathname.startsWith("/rest/v1")) {
    const target = PGRST + url.pathname.replace(/^\/rest\/v1/, "") + url.search;
    const headers = { ...req.headers };
    delete headers.host;
    delete headers["content-length"];
    if (!headers.authorization) headers.authorization = `Bearer ${ANON_KEY}`;
    try {
      const r = await fetch(target, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : body });
      const out = Buffer.from(await r.arrayBuffer());
      r.headers.forEach((v, k) => {
        if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) res.setHeader(k, v);
      });
      return res.writeHead(r.status).end(out);
    } catch (e) {
      return res.writeHead(502).end(String(e));
    }
  }

  if (url.pathname.startsWith("/functions/v1/")) {
    // FUNCTIONS_PORTS="send-customer-notification=9001,send-email-notification=9002,send-reminders=9003"
    const ports = Object.fromEntries((process.env.FUNCTIONS_PORTS || "").split(",").filter(Boolean).map((p) => p.split("=")));
    const name = url.pathname.split("/")[3];
    if (!ports[name]) {
      res.setHeader("Content-Type", "application/json");
      return res.writeHead(503).end(JSON.stringify({ error: "Edge function nije pokrenuta lokalno" }));
    }
    const headers = { ...req.headers };
    delete headers.host;
    delete headers["content-length"];
    try {
      const r = await fetch(`http://127.0.0.1:${ports[name]}/`, { method: req.method, headers, body: body.length ? body : undefined });
      res.setHeader("Content-Type", "application/json");
      return res.writeHead(r.status).end(Buffer.from(await r.arrayBuffer()));
    } catch (e) {
      return res.writeHead(502).end(String(e));
    }
  }
  res.writeHead(404).end();
});

server.listen(54321, () => console.log("Local Supabase proxy na http://localhost:54321"));
