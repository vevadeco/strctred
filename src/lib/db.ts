import { sql } from "@vercel/postgres";

let schemaReady: Promise<void> | null = null;

export function isDbConfigured() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL
  );
}

/** Run a single SQL statement, logging but never throwing on failure. */
async function trySQL(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[db] ${label} failed: ${msg}`);
  }
}

async function ensureSchema() {
  // ── Core tables ─────────────────────────────────────────────────────────────
  // These must succeed — throw on failure so the caller knows DB is broken.
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      name TEXT,
      email TEXT,
      phone TEXT,
      service_type TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      source TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS pageviews (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      session_id TEXT NOT NULL,
      page TEXT,
      referrer TEXT
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS promo_settings (
      id INTEGER PRIMARY KEY,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      title TEXT,
      subtitle TEXT,
      discount_text TEXT,
      cta_text TEXT,
      deadline_date DATE
    );
  `;

  // ── Optional tables — non-fatal if they fail ────────────────────────────────
  await trySQL("create invoices table", () => sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      lead_id TEXT,
      type TEXT NOT NULL DEFAULT 'invoice',
      invoice_number TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      due_date DATE,
      subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
      tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
      tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      total NUMERIC(10,2) NOT NULL DEFAULT 0,
      notes TEXT,
      client_name TEXT,
      client_email TEXT,
      client_phone TEXT,
      client_address TEXT
    );
  `);

  await trySQL("create invoice_items table", () => sql`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
      unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
      amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  await trySQL("create app_settings table", () => sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // ── Indexes — all non-fatal ─────────────────────────────────────────────────
  await trySQL("index leads_created_at", () => sql`CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);`);
  await trySQL("index leads_status", () => sql`CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);`);
  await trySQL("index pageviews_created_at", () => sql`CREATE INDEX IF NOT EXISTS pageviews_created_at_idx ON pageviews(created_at DESC);`);
  await trySQL("index pageviews_session_id", () => sql`CREATE INDEX IF NOT EXISTS pageviews_session_id_idx ON pageviews(session_id);`);
  await trySQL("index invoices_lead_id", () => sql`CREATE INDEX IF NOT EXISTS invoices_lead_id_idx ON invoices(lead_id);`);
  await trySQL("index invoices_status", () => sql`CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);`);
  await trySQL("index invoices_type", () => sql`CREATE INDEX IF NOT EXISTS invoices_type_idx ON invoices(type);`);
  await trySQL("index invoice_items_invoice_id", () => sql`CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON invoice_items(invoice_id);`);

  // ── Column migrations — all non-fatal ──────────────────────────────────────
  await trySQL("add leads.priority", () => sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';`);
  await trySQL("add leads.notes", () => sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;`);
  await trySQL("add leads.contacted_at", () => sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;`);
  await trySQL("add leads.closed_at", () => sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;`);
  await trySQL("add invoices.stripe_payment_intent_id", () => sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;`);
  await trySQL("add invoices.stripe_payment_link", () => sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT;`);
  await trySQL("add invoices.stripe_payment_link_id", () => sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_link_id TEXT;`);

  // ── FK constraints — add if not already present, non-fatal ─────────────────
  await trySQL("fk invoices.lead_id", () => sql`
    ALTER TABLE invoices ADD CONSTRAINT IF NOT EXISTS invoices_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
  `);
  await trySQL("fk invoice_items.invoice_id", () => sql`
    ALTER TABLE invoice_items ADD CONSTRAINT IF NOT EXISTS invoice_items_invoice_id_fkey
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
  `);
}

export async function dbReady() {
  if (!schemaReady) {
    schemaReady = ensureSchema().catch((err) => {
      schemaReady = null; // reset so next cold-start retries
      throw err;
    });
  }
  return schemaReady;
}

export type LeadRow = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  service_type: string | null;
  message: string | null;
  status: string;
  source: string | null;
  priority: string | null;
  notes: string | null;
  contacted_at: string | null;
  closed_at: string | null;
};

export type PromoSettingsRow = {
  id: number;
  enabled: boolean;
  title: string | null;
  subtitle: string | null;
  discount_text: string | null;
  cta_text: string | null;
  deadline_date: string | null;
};

export type InvoiceRow = {
  id: string;
  created_at: string;
  updated_at: string;
  lead_id: string | null;
  type: string;
  invoice_number: string;
  status: string;
  due_date: string | null;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  notes: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  stripe_payment_intent_id: string | null;
  stripe_payment_link: string | null;
  stripe_payment_link_id: string | null;
};

export type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
  sort_order: number;
};

export type AppSettingRow = {
  key: string;
  value: string | null;
  updated_at: string;
};
