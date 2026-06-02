import { NextResponse } from "next/server";
import Stripe from "stripe";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured, InvoiceRow, InvoiceItemRow } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { getSettings } from "@/lib/settings";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await dbReady();
  const { id } = await ctx.params;

  // Fetch invoice
  const { rows: invRows } = await sql<InvoiceRow>`SELECT * FROM invoices WHERE id = ${id}`;
  if (invRows.length === 0) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const invoice = invRows[0];
  if (invoice.type !== "invoice") {
    return NextResponse.json({ error: "Payment links can only be created for invoices, not estimates" }, { status: 400 });
  }

  // Fetch items
  const { rows: items } = await sql<InvoiceItemRow>`
    SELECT * FROM invoice_items WHERE invoice_id = ${id} ORDER BY sort_order ASC
  `;

  // Load Stripe settings
  const settings = await getSettings(["stripe_secret_key", "stripe_enabled", "stripe_publishable_key"]);
  const stripeEnabled = settings.stripe_enabled === "true";
  const stripeSecretKey = settings.stripe_secret_key;

  if (!stripeEnabled || !stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Enable it in Settings." },
      { status: 422 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-05-28.basil" });

  // If a payment link already exists, return it
  if (invoice.stripe_payment_link) {
    return NextResponse.json({
      success: true,
      payment_link: invoice.stripe_payment_link,
      already_existed: true,
    });
  }

  // Build line items for Stripe
  const lineItems: Stripe.PaymentLinkCreateParams.LineItem[] = [];

  for (const item of items) {
    const unitAmountCents = Math.round(Number(item.unit_price) * 100);
    const qty = Math.max(1, Math.round(Number(item.quantity)));

    // Create a price on the fly
    const price = await stripe.prices.create({
      currency: "cad",
      unit_amount: unitAmountCents,
      product_data: {
        name: item.description,
      },
    });

    lineItems.push({ price: price.id, quantity: qty });
  }

  // Add tax as a separate line item if applicable
  if (Number(invoice.tax_amount) > 0) {
    const taxCents = Math.round(Number(invoice.tax_amount) * 100);
    const taxPrice = await stripe.prices.create({
      currency: "cad",
      unit_amount: taxCents,
      product_data: {
        name: `Tax (${Number(invoice.tax_rate)}%)`,
      },
    });
    lineItems.push({ price: taxPrice.id, quantity: 1 });
  }

  // Create the payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: lineItems,
    metadata: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
    },
    ...(invoice.client_email
      ? {
          after_completion: {
            type: "hosted_confirmation",
            hosted_confirmation: {
              custom_message: `Thank you for your payment for ${invoice.invoice_number}. We will be in touch shortly.`,
            },
          },
        }
      : {}),
  });

  // Store the payment link
  await sql`
    UPDATE invoices
    SET stripe_payment_link = ${paymentLink.url},
        stripe_payment_link_id = ${paymentLink.id},
        status = 'sent',
        updated_at = now()
    WHERE id = ${id}
  `;

  return NextResponse.json({
    success: true,
    payment_link: paymentLink.url,
    payment_link_id: paymentLink.id,
  });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth) return auth;

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  await dbReady();
  const { id } = await ctx.params;

  // Deactivate the link in Stripe if possible
  const { rows: invRows } = await sql<InvoiceRow>`SELECT * FROM invoices WHERE id = ${id}`;
  if (invRows.length > 0 && invRows[0].stripe_payment_link_id) {
    const settings = await getSettings(["stripe_secret_key"]);
    if (settings.stripe_secret_key) {
      try {
        const stripe = new Stripe(settings.stripe_secret_key, { apiVersion: "2025-05-28.basil" });
        await stripe.paymentLinks.update(invRows[0].stripe_payment_link_id, { active: false });
      } catch {
        // Non-fatal — continue clearing DB record
      }
    }
  }

  await sql`
    UPDATE invoices
    SET stripe_payment_link = NULL, stripe_payment_link_id = NULL, updated_at = now()
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}
