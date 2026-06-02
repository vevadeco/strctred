import { sql } from "@vercel/postgres";

let schemaReady: Promise<void> | null = null;

export function isDbConfigured() {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL
  );
}

async function ensureSchema() {
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
      source TEXT,
      priority TEXT NOT NULL DEFAULT 'medium',
      notes TEXT,
      contacted_at TIMESTAMPTZ,
      closed_at TIMESTAMPTZ
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

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
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
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
      unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
      amount NUMERIC(10,2) NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads(created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);`;
  await sql`CREATE INDEX IF NOT EXISTS leads_priority_idx ON leads(priority);`;
  await sql`CREATE INDEX IF NOT EXISTS pageviews_created_at_idx ON pageviews(created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS pageviews_session_id_idx ON pageviews(session_id);`;
  await sql`CREATE INDEX IF NOT EXISTS invoices_lead_id_idx ON invoices(lead_id);`;
  await sql`CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);`;
  await sql`CREATE INDEX IF NOT EXISTS invoices_type_idx ON invoices(type);`;
  await sql`CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON invoice_items(invoice_id);`;

  // Migrations for existing tables
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;`;
  await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;`;
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;`;
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT;`;
  await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_link_id TEXT;`;
}

export async function dbReady() {
  if (!schemaReady) {
    schemaReady = ensureSchema();
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
  priority: string;
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

