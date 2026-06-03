import { Resend } from "resend";
import { getSettings } from "@/lib/settings";

export type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/**
 * Send an email via Resend if configured. Returns true on success, false if
 * Resend is not configured or the send fails.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const settings = await getSettings([
    "resend_api_key",
    "resend_enabled",
    "resend_from_email",
    "resend_from_name",
    "business_name",
    "business_email",
  ]);

  if (settings.resend_enabled !== "true" || !settings.resend_api_key) {
    return { ok: false, error: "Resend is not configured" };
  }

  const fromEmail = settings.resend_from_email || settings.business_email || "noreply@example.com";
  const fromName = settings.resend_from_name || settings.business_name || "Strctred Living Spaces";

  const resend = new Resend(settings.resend_api_key);

  const { error } = await resend.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  });

  if (error) {
    console.error("Resend error:", error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

// ─── Email Templates ────────────────────────────────────────────────────────

export function estimateEmailHtml(opts: {
  clientName: string;
  estimateNumber: string;
  total: string;
  items: { description: string; quantity: string; unit_price: string; amount: string }[];
  taxRate: string;
  taxAmount: string;
  subtotal: string;
  dueDate?: string | null;
  notes?: string | null;
  paymentLink?: string | null;
  businessName: string;
  businessPhone?: string | null;
  businessEmail?: string | null;
}) {
  const itemRows = opts.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${Number(item.quantity)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.amount).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#1e2d3d;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Estimate</h1>
      <p style="color:#8fa3b1;margin:4px 0 0;font-size:14px;">${opts.estimateNumber}</p>
    </div>
    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="margin:0 0 24px;color:#333;font-size:15px;">Hi ${opts.clientName},</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;">
        Thank you for your interest. Please find your estimate below.
      </p>

      <!-- Items table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f5f5f0;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;text-transform:uppercase;">Description</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#666;text-transform:uppercase;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;text-transform:uppercase;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;text-transform:uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Totals -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 12px;color:#666;font-size:14px;text-align:right;">Subtotal</td>
          <td style="padding:6px 12px;text-align:right;font-size:14px;width:120px;">$${Number(opts.subtotal).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#666;font-size:14px;text-align:right;">Tax (${Number(opts.taxRate)}%)</td>
          <td style="padding:6px 12px;text-align:right;font-size:14px;">$${Number(opts.taxAmount).toFixed(2)}</td>
        </tr>
        <tr style="background:#f5f5f0;">
          <td style="padding:10px 12px;font-weight:700;font-size:16px;text-align:right;">Total</td>
          <td style="padding:10px 12px;font-weight:700;font-size:16px;text-align:right;">$${Number(opts.total).toFixed(2)}</td>
        </tr>
      </table>

      ${opts.dueDate ? `<p style="color:#555;font-size:14px;"><strong>Valid Until:</strong> ${new Date(opts.dueDate).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</p>` : ""}
      ${opts.notes ? `<div style="background:#f9f9f7;border-left:3px solid #c9a96e;padding:12px 16px;margin:16px 0;"><p style="margin:0;color:#555;font-size:13px;">${opts.notes}</p></div>` : ""}

      <p style="color:#555;font-size:14px;margin-top:24px;">
        If you have any questions or would like to proceed, please reply to this email or give us a call.
      </p>
    </div>
    <!-- Footer -->
    <div style="background:#f5f5f0;padding:20px 40px;border-top:1px solid #e5e5e0;">
      <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
        <strong style="color:#555;">${opts.businessName}</strong><br>
        ${opts.businessPhone ? `${opts.businessPhone} &nbsp;|&nbsp; ` : ""}${opts.businessEmail || ""}
      </p>
    </div>
  </div>
</body>
</html>`;
}

export function invoiceEmailHtml(opts: {
  clientName: string;
  invoiceNumber: string;
  total: string;
  items: { description: string; quantity: string; unit_price: string; amount: string }[];
  taxRate: string;
  taxAmount: string;
  subtotal: string;
  dueDate?: string | null;
  notes?: string | null;
  paymentLink?: string | null;
  businessName: string;
  businessPhone?: string | null;
  businessEmail?: string | null;
}) {
  const itemRows = opts.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${Number(item.quantity)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.unit_price).toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">$${Number(item.amount).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1e2d3d;padding:32px 40px;">
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Invoice</h1>
      <p style="color:#8fa3b1;margin:4px 0 0;font-size:14px;">${opts.invoiceNumber}</p>
    </div>
    <div style="padding:32px 40px;">
      <p style="margin:0 0 24px;color:#333;font-size:15px;">Hi ${opts.clientName},</p>
      <p style="margin:0 0 24px;color:#555;font-size:14px;">
        Please find your invoice below. ${opts.dueDate ? `Payment is due by <strong>${new Date(opts.dueDate).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</strong>.` : ""}
      </p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#f5f5f0;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;text-transform:uppercase;">Description</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#666;text-transform:uppercase;">Qty</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;text-transform:uppercase;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;text-transform:uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 12px;color:#666;font-size:14px;text-align:right;">Subtotal</td>
          <td style="padding:6px 12px;text-align:right;font-size:14px;width:120px;">$${Number(opts.subtotal).toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px;color:#666;font-size:14px;text-align:right;">Tax (${Number(opts.taxRate)}%)</td>
          <td style="padding:6px 12px;text-align:right;font-size:14px;">$${Number(opts.taxAmount).toFixed(2)}</td>
        </tr>
        <tr style="background:#f5f5f0;">
          <td style="padding:10px 12px;font-weight:700;font-size:16px;text-align:right;">Total Due</td>
          <td style="padding:10px 12px;font-weight:700;font-size:16px;text-align:right;">$${Number(opts.total).toFixed(2)}</td>
        </tr>
      </table>

      ${opts.notes ? `<div style="background:#f9f9f7;border-left:3px solid #c9a96e;padding:12px 16px;margin:16px 0;"><p style="margin:0;color:#555;font-size:13px;">${opts.notes}</p></div>` : ""}

      ${opts.paymentLink ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${opts.paymentLink}" style="background:#1e2d3d;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:700;display:inline-block;">
          Pay Now — $${Number(opts.total).toFixed(2)}
        </a>
      </div>` : ""}

      <p style="color:#555;font-size:14px;margin-top:24px;">
        If you have any questions about this invoice, please reply to this email or give us a call.
      </p>
    </div>
    <div style="background:#f5f5f0;padding:20px 40px;border-top:1px solid #e5e5e0;">
      <p style="margin:0;color:#888;font-size:12px;line-height:1.6;">
        <strong style="color:#555;">${opts.businessName}</strong><br>
        ${opts.businessPhone ? `${opts.businessPhone} &nbsp;|&nbsp; ` : ""}${opts.businessEmail || ""}
      </p>
    </div>
  </div>
</body>
</html>`;
}
