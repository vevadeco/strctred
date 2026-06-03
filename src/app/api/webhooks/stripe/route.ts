import { NextResponse } from "next/server";
import Stripe from "stripe";

import { sql } from "@vercel/postgres";
import { dbReady, isDbConfigured } from "@/lib/db";
import { getSettings } from "@/lib/settings";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const settings = await getSettings(["stripe_secret_key", "stripe_webhook_secret"]);

  if (!settings.stripe_secret_key || !settings.stripe_webhook_secret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 422 });
  }

  const stripe = new Stripe(settings.stripe_secret_key, { apiVersion: "2025-02-24.acacia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, settings.stripe_webhook_secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await dbReady();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId) {
        await sql`
          UPDATE invoices
          SET status = 'paid',
              stripe_payment_intent_id = ${session.payment_intent as string ?? null},
              updated_at = now()
          WHERE id = ${invoiceId}
        `;
      }
      break;
    }
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const invoiceId = pi.metadata?.invoice_id;
      if (invoiceId) {
        await sql`
          UPDATE invoices
          SET status = 'paid',
              stripe_payment_intent_id = ${pi.id},
              updated_at = now()
          WHERE id = ${invoiceId}
        `;
      }
      break;
    }
    case "payment_intent.payment_failed": {
      // Optionally log or alert — no status change needed
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
