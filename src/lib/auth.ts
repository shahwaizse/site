import crypto from "node:crypto";

const SESSION_COOKIE = "shahwaiz_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const s =
    import.meta.env.SESSION_SECRET ??
    process.env.SESSION_SECRET ??
    "";
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

function getPassword(): string {
  const p =
    import.meta.env.DASHBOARD_PASSWORD ??
    process.env.DASHBOARD_PASSWORD ??
    "";
  if (!p) throw new Error("DASHBOARD_PASSWORD is not set");
  return p;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyPassword(input: string): boolean {
  const pw = getPassword();
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function makeSessionCookie(): string {
  const issuedAt = Date.now();
  const payload = `v1.${issuedAt}`;
  const sig = sign(payload, getSecret());
  const value = `${payload}.${sig}`;
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function isAuthed(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(/;\s*/)
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return false;
  const value = match.slice(SESSION_COOKIE.length + 1);
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [v, issuedAt, sig] = parts;
  if (v !== "v1") return false;
  const expected = sign(`${v}.${issuedAt}`, getSecret());
  try {
    if (
      !crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))
    ) {
      return false;
    }
  } catch {
    return false;
  }
  const age = Date.now() - Number(issuedAt);
  if (!Number.isFinite(age) || age < 0) return false;
  if (age > MAX_AGE * 1000) return false;
  return true;
}
