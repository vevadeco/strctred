import { NextResponse } from "next/server";
import { z } from "zod";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured, AppSettingRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

// Keys we expose through the settings API (never return secret keys to the client)
const PUBLIC_KEYS = new Set([
  "stripe_publishable_key",
  "stripe_enabled",
  "business_name",
  "business_email",
  "business_phone",
  "business_address",
]);

// Keys that are stored but redacted when returned
const SECRET_KEYS = new Set([
  "stripe_secret_key",
  "stripe_webhook_secret",
]);

const ALL_ALLOWED_KEYS = new Set([...PUBLIC_KEYS, ...SECRET_KEYS]);

export async function GET(_req: Request) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({}, { status: 200 });
  }

  await dbReady();

  const { rows } = await sql<AppSettingRow>`SELECT key, value, updated_at FROM app_settings`;

  const result: Record<string, string | null> = {};
  for (const row of rows) {
    if (SECRET_KEYS.has(row.key)) {
      // Return a masked indicator so the UI knows a key is set, without revealing the value
      result[row.key] = row.value ? "••••••••" : null;
    } else {
      result[row.key] = row.value;
    }
  }

  return NextResponse.json(result);
}

const SettingsUpdateSchema = z.object({
  stripe_publishable_key: z.string().trim().optional(),
  stripe_secret_key: z.string().trim().optional(),
  stripe_webhook_secret: z.string().trim().optional(),
  stripe_enabled: z.enum(["true", "false"]).optional(),
  business_name: z.string().trim().optional(),
  business_email: z.string().trim().optional(),
  business_phone: z.string().trim().optional(),
  business_address: z.string().trim().optional(),
});

export async function PUT(req: Request) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = SettingsUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  await dbReady();

  const data = parsed.data;
  for (const [key, value] of Object.entries(data)) {
    if (!ALL_ALLOWED_KEYS.has(key) || value === undefined) continue;
    // Don't overwrite secret keys if the masked placeholder is sent back
    if (SECRET_KEYS.has(key) && value === "••••••••") continue;
    await sql`
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (${key}, ${value}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
  }

  return NextResponse.json({ success: true });
}
