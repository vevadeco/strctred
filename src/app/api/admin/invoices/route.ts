import { NextResponse } from "next/server";
import { z } from "zod";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured, InvoiceRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const InvoiceItemSchema = z.object({
  description: z.string().trim().min(1),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
});

const InvoiceCreateSchema = z.object({
  lead_id: z.string().trim().optional().nullable(),
  type: z.enum(["invoice", "estimate"]),
  due_date: z.string().trim().optional().nullable(),
  tax_rate: z.number().min(0).max(100).default(0),
  notes: z.string().trim().optional().nullable(),
  client_name: z.string().trim().min(1),
  client_email: z.string().trim().email().optional().nullable(),
  client_phone: z.string().trim().optional().nullable(),
  client_address: z.string().trim().optional().nullable(),
  items: z.array(InvoiceItemSchema).min(1),
});

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json([], { status: 200 });
  }

  await dbReady();

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "";
  const status = url.searchParams.get("status") || "";
  const leadId = url.searchParams.get("lead_id") || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || "100") || 100, 250);
  const offset = Math.max(Number(url.searchParams.get("offset") || "0") || 0, 0);

  let query;
  if (type && status && leadId) {
    query = await sql<InvoiceRow>`
      SELECT * FROM invoices WHERE type = ${type} AND status = ${status} AND lead_id = ${leadId}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (type && status) {
    query = await sql<InvoiceRow>`
      SELECT * FROM invoices WHERE type = ${type} AND status = ${status}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (type && leadId) {
    query = await sql<InvoiceRow>`
      SELECT * FROM invoices WHERE type = ${type} AND lead_id = ${leadId}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (status && leadId) {
    query = await sql<InvoiceRow>`
      SELECT * FROM invoices WHERE status = ${status} AND lead_id = ${leadId}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (type) {
    query = await sql<InvoiceRow>`
      SELECT * FROM invoices WHERE type = ${type}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (status) {
    query = await sql<InvoiceRow>`
      SELECT * FROM invoices WHERE status = ${status}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else if (leadId) {
    query = await sql<InvoiceRow>`
      SELECT * FROM invoices WHERE lead_id = ${leadId}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    query = await sql<InvoiceRow>`
      SELECT * FROM invoices
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
  }

  return NextResponse.json(query.rows);
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = InvoiceCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  await dbReady();

  const data = parsed.data;
  const id = crypto.randomUUID();

  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const taxAmount = subtotal * (data.tax_rate / 100);
  const total = subtotal + taxAmount;

  // Generate invoice number
  const prefix = data.type === "invoice" ? "INV" : "EST";
  const countResult = await sql`SELECT COUNT(*) as count FROM invoices WHERE type = ${data.type}`;
  const count = Number(countResult.rows[0].count) + 1;
  const invoiceNumber = `${prefix}-${String(count).padStart(4, "0")}`;

  await sql`
    INSERT INTO invoices (id, lead_id, type, invoice_number, status, due_date, subtotal, tax_rate, tax_amount, total, notes, client_name, client_email, client_phone, client_address)
    VALUES (
      ${id},
      ${data.lead_id ?? null},
      ${data.type},
      ${invoiceNumber},
      'draft',
      ${data.due_date ?? null},
      ${subtotal},
      ${data.tax_rate},
      ${taxAmount},
      ${total},
      ${data.notes ?? null},
      ${data.client_name},
      ${data.client_email ?? null},
      ${data.client_phone ?? null},
      ${data.client_address ?? null}
    )
  `;

  // Insert line items
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const itemId = crypto.randomUUID();
    const amount = item.quantity * item.unit_price;
    await sql`
      INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, amount, sort_order)
      VALUES (${itemId}, ${id}, ${item.description}, ${item.quantity}, ${item.unit_price}, ${amount}, ${i})
    `;
  }

  return NextResponse.json({ success: true, id, invoice_number: invoiceNumber }, { status: 201 });
}
