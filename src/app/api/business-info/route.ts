import { NextResponse } from "next/server";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured } from "@/lib/db";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({});
  }

  try {
    await dbReady();
    const { rows } = await sql`
      SELECT key, value FROM app_settings
      WHERE key IN ('business_phone', 'business_email', 'business_address', 'business_name')
    `;
    const result: Record<string, string | null> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({});
  }
}
