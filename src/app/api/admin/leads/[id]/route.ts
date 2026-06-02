import { NextResponse } from "next/server";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await dbReady();
  const { id } = await ctx.params;
  const { rows } = await sql`SELECT * FROM leads WHERE id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await dbReady();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { notes, priority } = body;

  if (priority !== undefined) {
    const allowedPriorities = new Set(["low", "medium", "high", "urgent"]);
    if (!allowedPriorities.has(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    await sql`UPDATE leads SET priority = ${priority} WHERE id = ${id}`;
  }

  if (notes !== undefined) {
    await sql`UPDATE leads SET notes = ${notes} WHERE id = ${id}`;
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await dbReady();
  const { id } = await ctx.params;
  await sql`DELETE FROM leads WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}

