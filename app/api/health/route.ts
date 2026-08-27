import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Configuration health check.
 *
 * Reports only WHETHER each secret is present — never any value — so it is
 * safe to hit from a browser. Exists because "the upload failed" could mean a
 * bad file or a missing env var, and there was no way to tell them apart on a
 * deployed build without another round of guessing.
 */
export async function GET(_req: NextRequest) {
  const has = (k: string) => Boolean(process.env[k] && process.env[k]!.trim().length > 0);

  const config = {
    NEXT_PUBLIC_SUPABASE_URL:      has("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: has("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    DATABASE_URL:                  has("DATABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY:     has("SUPABASE_SERVICE_ROLE_KEY"),
    NEXT_PUBLIC_SITE_URL:          has("NEXT_PUBLIC_SITE_URL"),
    // email — any one of these being configured is enough
    SMTP_HOST:                     has("SMTP_HOST"),
    SMTP_USER:                     has("SMTP_USER"),
    SMTP_PASS:                     has("SMTP_PASS"),
    GMAIL_USER:                    has("GMAIL_USER"),
    GMAIL_APP_PASSWORD:            has("GMAIL_APP_PASSWORD"),
  };

  // Can storage actually be written to? This is what receipt uploads depend on.
  let storage: { ok: boolean; detail: string };
  if (!config.SUPABASE_SERVICE_ROLE_KEY) {
    storage = { ok: false, detail: "SUPABASE_SERVICE_ROLE_KEY is not set — uploads cannot work." };
  } else {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/bucket/payment-screenshots`, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        cache: "no-store",
      });
      storage = r.ok
        ? { ok: true, detail: "payment-screenshots bucket reachable" }
        : { ok: false, detail: `storage responded ${r.status}: ${(await r.text()).slice(0, 120)}` };
    } catch (e) {
      storage = { ok: false, detail: `storage unreachable: ${(e as Error).message}` };
    }
  }

  const emailReady =
    (config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS) ||
    (config.GMAIL_USER && config.GMAIL_APP_PASSWORD);

  return Response.json(
    {
      config,
      storage,
      emailConfigured: Boolean(emailReady),
      uploadsWillWork: storage.ok,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
