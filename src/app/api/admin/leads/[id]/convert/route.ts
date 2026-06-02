import { NextResponse } from "next/server";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured, LeadRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

/**
 * POST /api/admin/leads/:id/convert
 * Creates a blank draft estimate linked to this lead, pre-filled with the lead's contact details.
 * Returns the new estimate id and number.
 */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await dbReady();
  const { id } = await ctx.params;

  // Fetch lead
  const { rows } = await sql<LeadRow>`SELECT * FROM leads WHERE id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const lead = rows[0];

  // Generate estimate number
  const countResult = await sql`SELECT COUNT(*) as count FROM invoices WHERE type = 'estimate'`;
  const count = Number(countResult.rows[0].count) + 1;
  const estimateNumber = `EST-${String(count).padStart(4, "0")}`;

  const newId = crypto.randomUUID();

  await sql`
    INSERT INTO invoices (
      id, lead_id, type, invoice_number, status,
      subtotal, tax_rate, tax_amount, total,
      client_name, client_email, client_phone
    )
    VALUES (
      ${newId},
      ${lead.id},
      'estimate',
      ${estimateNumber},
      'draft',
      0, 0, 0, 0,
      ${lead.name ?? null},
      ${lead.email ?? null},
      ${lead.phone ?? null}
    )
  `;

  // Update lead status to 'qualified' if it's still 'new' or 'contacted'
  if (lead.status === "new" || lead.status === "contacted") {
    await sql`UPDATE leads SET status = 'qualified' WHERE id = ${id}`;
  }

  return NextResponse.json(
    { success: true, id: newId, estimate_number: estimateNumber },
    { status: 201 }
  );
}
