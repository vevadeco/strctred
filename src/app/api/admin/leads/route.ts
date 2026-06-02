import { NextResponse } from "next/server";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured, LeadRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json([], { status: 200 });
  }

  await dbReady();

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || "100") || 100, 250);
  const offset = Math.max(Number(url.searchParams.get("offset") || "0") || 0, 0);

  const statusFilter = url.searchParams.get("status") || "";
  const priorityFilter = url.searchParams.get("priority") || "";

  let query;
  if (statusFilter && priorityFilter) {
    query = await sql<LeadRow>`
      SELECT id, created_at, name, email, phone, service_type, message, status, source, priority, notes, contacted_at, closed_at
      FROM leads
      WHERE status = ${statusFilter} AND priority = ${priorityFilter}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (statusFilter) {
    query = await sql<LeadRow>`
      SELECT id, created_at, name, email, phone, service_type, message, status, source, priority, notes, contacted_at, closed_at
      FROM leads
      WHERE status = ${statusFilter}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (priorityFilter) {
    query = await sql<LeadRow>`
      SELECT id, created_at, name, email, phone, service_type, message, status, source, priority, notes, contacted_at, closed_at
      FROM leads
      WHERE priority = ${priorityFilter}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    query = await sql<LeadRow>`
      SELECT id, created_at, name, email, phone, service_type, message, status, source, priority, notes, contacted_at, closed_at
      FROM leads
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const out = query.rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    name: r.name,
    email: r.email,
    phone: r.phone,
    service_type: r.service_type,
    message: r.message,
    status: r.status,
    source: r.source,
    priority: r.priority,
    notes: r.notes,
    contacted_at: r.contacted_at,
    closed_at: r.closed_at
  }));

  return NextResponse.json(out);
}

