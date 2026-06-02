import { NextResponse } from "next/server";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured, InvoiceRow, InvoiceItemRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await dbReady();
  const { id } = await ctx.params;

  // Get the estimate
  const { rows: invoices } = await sql<InvoiceRow>`SELECT * FROM invoices WHERE id = ${id} AND type = 'estimate'`;
  if (invoices.length === 0) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  const estimate = invoices[0];

  // Get items
  const { rows: items } = await sql<InvoiceItemRow>`
    SELECT * FROM invoice_items WHERE invoice_id = ${id} ORDER BY sort_order ASC
  `;

  // Generate new invoice number
  const countResult = await sql`SELECT COUNT(*) as count FROM invoices WHERE type = 'invoice'`;
  const count = Number(countResult.rows[0].count) + 1;
  const invoiceNumber = `INV-${String(count).padStart(4, "0")}`;

  // Create new invoice from estimate
  const newId = crypto.randomUUID();
  await sql`
    INSERT INTO invoices (id, lead_id, type, invoice_number, status, due_date, subtotal, tax_rate, tax_amount, total, notes, client_name, client_email, client_phone, client_address)
    VALUES (
      ${newId},
      ${estimate.lead_id},
      'invoice',
      ${invoiceNumber},
      'draft',
      ${estimate.due_date},
      ${estimate.subtotal},
      ${estimate.tax_rate},
      ${estimate.tax_amount},
      ${estimate.total},
      ${estimate.notes},
      ${estimate.client_name},
      ${estimate.client_email},
      ${estimate.client_phone},
      ${estimate.client_address}
    )
  `;

  // Copy items
  for (const item of items) {
    const itemId = crypto.randomUUID();
    await sql`
      INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, sort_order)
      VALUES (${itemId}, ${newId}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${item.amount}, ${item.sort_order})
    `;
  }

  // Mark estimate as accepted
  await sql`UPDATE invoices SET status = 'accepted', updated_at = now() WHERE id = ${id}`;

  return NextResponse.json({ success: true, id: newId, invoice_number: invoiceNumber }, { status: 201 });
}
