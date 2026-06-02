import { NextResponse } from "next/server";
import { z } from "zod";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured, InvoiceRow, InvoiceItemRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await dbReady();
  const { id } = await ctx.params;

  const { rows: invoices } = await sql<InvoiceRow>`SELECT * FROM invoices WHERE id = ${id}`;
  if (invoices.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { rows: items } = await sql<InvoiceItemRow>`
    SELECT * FROM invoice_items WHERE invoice_id = ${id} ORDER BY sort_order ASC
  `;

  return NextResponse.json({ ...invoices[0], items });
}

const InvoiceItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
});

const InvoiceUpdateSchema = z.object({
  due_date: z.string().trim().optional().nullable(),
  tax_rate: z.number().min(0).max(100).optional(),
  notes: z.string().trim().optional().nullable(),
  client_name: z.string().trim().min(1).optional(),
  client_email: z.string().trim().email().optional().nullable(),
  client_phone: z.string().trim().optional().nullable(),
  client_address: z.string().trim().optional().nullable(),
  items: z.array(InvoiceItemSchema).min(1).optional(),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = InvoiceUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", issues: parsed.error.issues }, { status: 400 });
  }

  await dbReady();
  const { id } = await ctx.params;
  const data = parsed.data;

  // Check invoice exists
  const { rows } = await sql<InvoiceRow>`SELECT * FROM invoices WHERE id = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Update fields
  if (data.client_name !== undefined) {
    await sql`UPDATE invoices SET client_name = ${data.client_name}, updated_at = now() WHERE id = ${id}`;
  }
  if (data.client_email !== undefined) {
    await sql`UPDATE invoices SET client_email = ${data.client_email ?? null}, updated_at = now() WHERE id = ${id}`;
  }
  if (data.client_phone !== undefined) {
    await sql`UPDATE invoices SET client_phone = ${data.client_phone ?? null}, updated_at = now() WHERE id = ${id}`;
  }
  if (data.client_address !== undefined) {
    await sql`UPDATE invoices SET client_address = ${data.client_address ?? null}, updated_at = now() WHERE id = ${id}`;
  }
  if (data.due_date !== undefined) {
    await sql`UPDATE invoices SET due_date = ${data.due_date ?? null}, updated_at = now() WHERE id = ${id}`;
  }
  if (data.notes !== undefined) {
    await sql`UPDATE invoices SET notes = ${data.notes ?? null}, updated_at = now() WHERE id = ${id}`;
  }
  if (data.tax_rate !== undefined) {
    await sql`UPDATE invoices SET tax_rate = ${data.tax_rate}, updated_at = now() WHERE id = ${id}`;
  }

  // Update items if provided
  if (data.items) {
    // Delete existing items
    await sql`DELETE FROM invoice_items WHERE invoice_id = ${id}`;

    // Insert new items
    let subtotal = 0;
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const itemId = crypto.randomUUID();
      const amount = item.quantity * item.unit_price;
      subtotal += amount;
      await sql`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, sort_order)
        VALUES (${itemId}, ${id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${amount}, ${i})
      `;
    }

    const taxRate = data.tax_rate ?? Number(rows[0].tax_rate);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    await sql`UPDATE invoices SET subtotal = ${subtotal}, tax_amount = ${taxAmount}, total = ${total}, updated_at = now() WHERE id = ${id}`;
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
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
