import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured } from "@/lib/db";

/**
 * Get a single app setting value (raw, unmasked) — server-side only.
 */
export async function getSetting(key: string): Promise<string | null> {
  if (!isDbConfigured()) return null;
  await dbReady();
  const { rows } = await sql`SELECT value FROM app_settings WHERE key = ${key}`;
  return rows[0]?.value ?? null;
}

/**
 * Get multiple settings at once.
 */
export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  if (!isDbConfigured() || keys.length === 0) {
    return Object.fromEntries(keys.map((k) => [k, null]));
  }
  await dbReady();
  const result: Record<string, string | null> = Object.fromEntries(keys.map((k) => [k, null]));
  for (const key of keys) {
    const { rows } = await sql`SELECT value FROM app_settings WHERE key = ${key}`;
    result[key] = rows[0]?.value ?? null;
  }
  return result;
}
