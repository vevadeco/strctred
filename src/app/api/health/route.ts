import { NextResponse } from "next/server";
import { isDbConfigured, dbReady } from "@/lib/db";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    await dbReady();
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[health] DB error:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
