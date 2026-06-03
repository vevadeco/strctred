import { NextResponse } from "next/server";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured } from "@/lib/db";

const DEFAULT_AREAS = [
  { name: "Hamilton", primary: true },
  { name: "Burlington", primary: false },
  { name: "Oakville", primary: false },
  { name: "Stoney Creek", primary: false },
  { name: "Ancaster", primary: false },
  { name: "Dundas", primary: false },
  { name: "Grimsby", primary: false },
  { name: "Brantford", primary: false },
  { name: "Niagara Region", primary: false },
];

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json(DEFAULT_AREAS);
  }

  try {
    await dbReady();
    const { rows } = await sql`SELECT value FROM app_settings WHERE key = 'service_areas'`;
    if (rows.length > 0 && rows[0].value) {
      const areas = JSON.parse(rows[0].value);
      return NextResponse.json(areas);
    }
  } catch {
    // Fall through to defaults
  }

  return NextResponse.json(DEFAULT_AREAS);
}
