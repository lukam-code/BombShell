import crypto from "node:crypto";

export const JWT_SECRET = "super-secret-jwt-token-with-at-least-32-characters-long";
const b64 = (o) => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");

export function sign(payload) {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64(payload);
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

export function verify(token) {
  const [h, b, s] = token.split(".");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(`${h}.${b}`).digest("base64url");
  if (sig !== s) return null;
  return JSON.parse(Buffer.from(b, "base64url").toString());
}

export const ANON_KEY = sign({ role: "anon", iss: "supabase-local", iat: 1700000000, exp: 2000000000 });
