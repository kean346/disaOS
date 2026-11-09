-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  state TEXT DEFAULT '',
  zip TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Technicians (field workers)
CREATE TABLE IF NOT EXISTS technicians (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  color TEXT NOT NULL DEFAULT '#16a34a',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Service types (configurable per vertical)
CREATE TABLE IF NOT EXISTS service_types (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  default_duration INTEGER NOT NULL DEFAULT 60,
  default_price REAL NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6b7280',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Jobs (scheduled service visits)
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  identifier TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  asset_id TEXT REFERENCES assets(id) ON DELETE RESTRICT,
  technician_id TEXT REFERENCES technicians(id) ON DELETE SET NULL,
  service_type_id TEXT REFERENCES service_types(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  priority TEXT NOT NULL DEFAULT 'normal',
  scheduled_date TEXT NOT NULL DEFAULT (date('now')),
  scheduled_time TEXT DEFAULT '09:00',
  duration INTEGER NOT NULL DEFAULT 60,
  price REAL NOT NULL DEFAULT 0,
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  completion_notes TEXT DEFAULT '',
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurrence_interval TEXT DEFAULT '',
  next_recurrence_date TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Job history / activity log
CREATE TABLE IF NOT EXISTS job_notes (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Checklist items per job (inspection forms, task lists)
CREATE TABLE IF NOT EXISTS job_checklist (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Materials / inventory used on jobs
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'ea',
  unit_cost REAL NOT NULL DEFAULT 0,
  in_stock REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_materials (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  quantity REAL NOT NULL DEFAULT 1,
  unit_cost REAL NOT NULL DEFAULT 0
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  identifier TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  tax_amount REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  due_date TEXT DEFAULT '',
  paid_date TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invoice_lines (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL DEFAULT 0,
  total REAL NOT NULL DEFAULT 0
);

-- Auto-incrementing identifier counter
CREATE TABLE IF NOT EXISTS _meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- The counter and prefix rows are written by the app (ensureSeeded in
-- src/server/index.ts): a deploy applies this file as DDL only, so a seed
-- row here fails the whole build.

-- Example service types are seeded by the app on first request
-- (ensureSeeded in src/server/index.ts), never here: DDL only.

CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_technician ON jobs(technician_id);
CREATE INDEX IF NOT EXISTS idx_jobs_service_type ON jobs(service_type_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_job_notes_job ON job_notes(job_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_job_checklist_job ON job_checklist(job_id);
CREATE INDEX IF NOT EXISTS idx_job_materials_job ON job_materials(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job ON invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- Example materials are seeded by the app on first request
-- (ensureSeeded in src/server/index.ts), never here: DDL only.

-- Optional equipment lifecycle: records are retained, equipment is retired rather than deleted.
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  access_instructions TEXT NOT NULL DEFAULT '',
  safety_notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_sites_customer ON sites(customer_id, name);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  site_id TEXT NOT NULL,
  name TEXT NOT NULL,
  serial_number TEXT NOT NULL COLLATE NOCASE,
  manufacturer TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'in_service' CHECK(status IN ('in_service', 'out_of_service', 'retired')),
  installation_date TEXT NOT NULL DEFAULT '',
  commissioning_date TEXT NOT NULL DEFAULT '',
  warranty_start TEXT NOT NULL DEFAULT '',
  warranty_end TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(site_id, customer_id) REFERENCES sites(id, customer_id) ON DELETE RESTRICT,
  UNIQUE(customer_id, serial_number)
);
CREATE INDEX IF NOT EXISTS idx_assets_customer ON assets(customer_id, name);
CREATE INDEX IF NOT EXISTS idx_assets_site ON assets(site_id);
CREATE INDEX IF NOT EXISTS idx_jobs_asset ON jobs(asset_id);

-- History is captured in the same statement as a change. job_id is a logical
-- reference: the snapshot survives deletion or reassignment of the original job.
CREATE TABLE IF NOT EXISTS asset_history (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  job_id TEXT,
  summary TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_asset_history_asset ON asset_history(asset_id, created_at);

CREATE TRIGGER IF NOT EXISTS asset_registered AFTER INSERT ON assets BEGIN
  INSERT INTO asset_history(asset_id, summary, details)
  VALUES (NEW.id, 'Equipment registered', NEW.name || ' · ' || NEW.serial_number || ' · ' || (SELECT name FROM sites WHERE id = NEW.site_id));
END;
CREATE TRIGGER IF NOT EXISTS asset_moved AFTER UPDATE OF site_id ON assets
WHEN OLD.site_id != NEW.site_id BEGIN
  INSERT INTO asset_history(asset_id, summary, details)
  VALUES (NEW.id, 'Site changed', (SELECT name FROM sites WHERE id = OLD.site_id) || ' → ' || (SELECT name FROM sites WHERE id = NEW.site_id));
END;
CREATE TRIGGER IF NOT EXISTS asset_status_changed AFTER UPDATE OF status ON assets
WHEN OLD.status != NEW.status BEGIN
  INSERT INTO asset_history(asset_id, summary, details)
  VALUES (NEW.id, 'Equipment status changed', OLD.status || ' → ' || NEW.status);
END;

-- Validate both writes so changing a job's customer cannot cross-link equipment.
CREATE TRIGGER IF NOT EXISTS job_asset_customer_insert BEFORE INSERT ON jobs
WHEN NEW.asset_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM assets WHERE id = NEW.asset_id AND customer_id = NEW.customer_id
) BEGIN SELECT RAISE(ABORT, 'Equipment must belong to the job customer'); END;
CREATE TRIGGER IF NOT EXISTS job_asset_customer_update BEFORE UPDATE OF asset_id, customer_id ON jobs
WHEN NEW.asset_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM assets WHERE id = NEW.asset_id AND customer_id = NEW.customer_id
) BEGIN SELECT RAISE(ABORT, 'Equipment must belong to the job customer'); END;

CREATE TRIGGER IF NOT EXISTS asset_job_created AFTER INSERT ON jobs
WHEN NEW.asset_id IS NOT NULL BEGIN
  INSERT INTO asset_history(asset_id, job_id, summary, details)
  VALUES (NEW.asset_id, NEW.id, NEW.identifier || ' linked', NEW.status || ' · ' || NEW.scheduled_date || ' · ' || COALESCE(NEW.notes, ''));
END;
CREATE TRIGGER IF NOT EXISTS asset_job_updated AFTER UPDATE ON jobs
WHEN NEW.asset_id IS NOT NULL AND (
  OLD.asset_id IS NOT NEW.asset_id OR OLD.status IS NOT NEW.status OR
  OLD.scheduled_date IS NOT NEW.scheduled_date OR OLD.notes IS NOT NEW.notes OR
  OLD.completion_notes IS NOT NEW.completion_notes
) BEGIN
  INSERT INTO asset_history(asset_id, job_id, summary, details)
  VALUES (NEW.asset_id, NEW.id, NEW.identifier || CASE WHEN OLD.asset_id IS NOT NEW.asset_id THEN ' linked' ELSE ' updated' END,
    NEW.status || ' · ' || NEW.scheduled_date || ' · ' || COALESCE(NEW.notes, '') || ' ' || COALESCE(NEW.completion_notes, ''));
END;
CREATE TRIGGER IF NOT EXISTS asset_job_unlinked AFTER UPDATE OF asset_id ON jobs
WHEN OLD.asset_id IS NOT NULL AND OLD.asset_id IS NOT NEW.asset_id BEGIN
  INSERT INTO asset_history(asset_id, job_id, summary, details)
  VALUES (OLD.asset_id, OLD.id, OLD.identifier || ' unlinked', OLD.status || ' · ' || OLD.scheduled_date || ' · ' || COALESCE(OLD.notes, '') || ' ' || COALESCE(OLD.completion_notes, ''));
END;
CREATE TRIGGER IF NOT EXISTS asset_job_deleted BEFORE DELETE ON jobs
WHEN OLD.asset_id IS NOT NULL BEGIN
  INSERT INTO asset_history(asset_id, job_id, summary, details)
  VALUES (OLD.asset_id, OLD.id, OLD.identifier || ' deleted', OLD.status || ' · ' || OLD.scheduled_date || ' · ' || COALESCE(OLD.notes, '') || ' ' || COALESCE(OLD.completion_notes, ''));
END;
CREATE TRIGGER IF NOT EXISTS asset_job_note AFTER INSERT ON job_notes
WHEN (SELECT asset_id FROM jobs WHERE id = NEW.job_id) IS NOT NULL BEGIN
  INSERT INTO asset_history(asset_id, job_id, summary, details)
  SELECT asset_id, id, identifier || ' note added', NEW.content FROM jobs WHERE id = NEW.job_id;
END;

CREATE TABLE IF NOT EXISTS garden_properties (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  suburb TEXT NOT NULL,
  property_type TEXT NOT NULL DEFAULT 'Residential',
  address TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL DEFAULT '',
  frequency TEXT NOT NULL DEFAULT 'weekly',
  technician_id TEXT REFERENCES technicians(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS garden_plans (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  property_id TEXT NOT NULL REFERENCES garden_properties(id) ON DELETE RESTRICT,
  frequency TEXT NOT NULL,
  start_date TEXT NOT NULL,
  occurrences INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS garden_visits (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL REFERENCES garden_properties(id) ON DELETE RESTRICT,
  plan_id TEXT REFERENCES garden_plans(id) ON DELETE RESTRICT,
  occurrence_date TEXT NOT NULL,
  quote_id TEXT UNIQUE,
  UNIQUE(plan_id, occurrence_date)
);

CREATE TABLE IF NOT EXISTS garden_photos (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS garden_records (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  job_id TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS garden_quotes (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  property_id TEXT NOT NULL REFERENCES garden_properties(id) ON DELETE RESTRICT,
  requested_service TEXT NOT NULL DEFAULT '',
  consultation_status TEXT NOT NULL DEFAULT 'Enquiry',
  follow_up TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'enquiry' CHECK(status IN ('enquiry','prepared','sent','accepted','declined')),
  lines_json TEXT NOT NULL DEFAULT '[]',
  discount_cents INTEGER NOT NULL DEFAULT 0,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  valid_until TEXT NOT NULL DEFAULT '',
  job_id TEXT UNIQUE REFERENCES jobs(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS garden_payments (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  reference TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS garden_demo_members (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  entity TEXT NOT NULL,
  record_id TEXT NOT NULL,
  UNIQUE(entity, record_id)
);

CREATE INDEX IF NOT EXISTS idx_garden_visits_property ON garden_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_garden_payments_invoice ON garden_payments(invoice_id);
DROP TRIGGER IF EXISTS garden_completion;
CREATE TRIGGER IF NOT EXISTS garden_completion AFTER UPDATE OF status ON jobs
WHEN NEW.status = 'completed' AND OLD.status != 'completed' AND EXISTS (SELECT 1 FROM garden_visits WHERE job_id = NEW.id) BEGIN
  INSERT OR IGNORE INTO garden_records(job_id,property_id,snapshot)
  SELECT NEW.id,v.property_id,json_object('identifier',NEW.identifier,'customer',c.name,'property',p.name,'suburb',p.suburb,'crew',t.name,'date',NEW.scheduled_date,'notes',NEW.completion_notes,'status',NEW.status,
  'activity',json((SELECT json_group_array(json_object('content',content,'created_at',created_at)) FROM job_notes WHERE job_id=NEW.id)),
  'tasks',json((SELECT json_group_array(json_object('label',label,'checked',checked)) FROM job_checklist WHERE job_id=NEW.id)),
  'photos',json((SELECT json_group_array(json_object('name',name,'data',data)) FROM garden_photos WHERE job_id=NEW.id)))
  FROM garden_visits v JOIN garden_properties p ON p.id=v.property_id JOIN customers c ON c.id=p.customer_id LEFT JOIN technicians t ON t.id=NEW.technician_id WHERE v.job_id=NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS garden_completed_retained BEFORE DELETE ON jobs
WHEN EXISTS(SELECT 1 FROM garden_records WHERE job_id=OLD.id) BEGIN SELECT RAISE(ABORT,'Completed garden visits are retained'); END;
CREATE TRIGGER IF NOT EXISTS garden_payment_limit BEFORE INSERT ON garden_payments
WHEN NEW.amount_cents + COALESCE((SELECT SUM(amount_cents) FROM garden_payments WHERE invoice_id=NEW.invoice_id),0) > (SELECT round(total*100) FROM invoices WHERE id=NEW.invoice_id)
OR (SELECT status FROM invoices WHERE id=NEW.invoice_id) = 'cancelled'
BEGIN SELECT RAISE(ABORT,'Payment exceeds outstanding balance or invoice is cancelled'); END;
CREATE TRIGGER IF NOT EXISTS garden_payment_status AFTER INSERT ON garden_payments BEGIN
 UPDATE invoices SET status=CASE WHEN (SELECT SUM(amount_cents) FROM garden_payments WHERE invoice_id=NEW.invoice_id)>=round(total*100) THEN 'paid' ELSE 'sent' END,
 paid_date=CASE WHEN (SELECT SUM(amount_cents) FROM garden_payments WHERE invoice_id=NEW.invoice_id)>=round(total*100) THEN date('now') ELSE '' END, updated_at=datetime('now') WHERE id=NEW.invoice_id;
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_customers AFTER INSERT ON customers WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('customers',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_technicians AFTER INSERT ON technicians WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('technicians',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_service_types AFTER INSERT ON service_types WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('service_types',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_jobs AFTER INSERT ON jobs WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('jobs',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_job_notes AFTER INSERT ON job_notes WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('job_notes',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_job_checklist AFTER INSERT ON job_checklist WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('job_checklist',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_materials AFTER INSERT ON materials WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('materials',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_job_materials AFTER INSERT ON job_materials WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('job_materials',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_invoices AFTER INSERT ON invoices WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('invoices',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_invoice_lines AFTER INSERT ON invoice_lines WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('invoice_lines',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_garden_properties AFTER INSERT ON garden_properties WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('garden_properties',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_garden_plans AFTER INSERT ON garden_plans WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('garden_plans',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_garden_visits AFTER INSERT ON garden_visits WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('garden_visits',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_garden_photos AFTER INSERT ON garden_photos WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('garden_photos',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_garden_records AFTER INSERT ON garden_records WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('garden_records',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_garden_quotes AFTER INSERT ON garden_quotes WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('garden_quotes',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_demo_garden_payments AFTER INSERT ON garden_payments WHEN EXISTS(SELECT 1 FROM _meta WHERE key='garden_demo') BEGIN
 INSERT OR IGNORE INTO garden_demo_members(entity,record_id) VALUES('garden_payments',NEW.id);
END;

CREATE TRIGGER IF NOT EXISTS garden_insert_conflict BEFORE INSERT ON garden_visits
WHEN EXISTS (
 SELECT 1 FROM jobs j JOIN jobs other ON other.id!=j.id AND other.technician_id=j.technician_id AND other.scheduled_date=j.scheduled_date
 WHERE j.id=NEW.job_id AND j.technician_id IS NOT NULL AND j.status NOT IN ('completed','cancelled') AND other.status NOT IN ('completed','cancelled')
 AND (CAST(substr(j.scheduled_time,1,2) AS INTEGER)*60+CAST(substr(j.scheduled_time,4,2) AS INTEGER)) < (CAST(substr(other.scheduled_time,1,2) AS INTEGER)*60+CAST(substr(other.scheduled_time,4,2) AS INTEGER)+other.duration)
 AND (CAST(substr(j.scheduled_time,1,2) AS INTEGER)*60+CAST(substr(j.scheduled_time,4,2) AS INTEGER)+j.duration) > (CAST(substr(other.scheduled_time,1,2) AS INTEGER)*60+CAST(substr(other.scheduled_time,4,2) AS INTEGER))
) BEGIN SELECT RAISE(ABORT,'Garden crew scheduling constraint conflict'); END;
CREATE TRIGGER IF NOT EXISTS garden_update_conflict BEFORE UPDATE OF scheduled_date,scheduled_time,technician_id,duration,status ON jobs
WHEN EXISTS(SELECT 1 FROM garden_visits WHERE job_id=NEW.id) AND NEW.technician_id IS NOT NULL AND NEW.status NOT IN ('completed','cancelled') AND EXISTS (
 SELECT 1 FROM jobs other WHERE other.id!=NEW.id AND other.technician_id=NEW.technician_id AND other.scheduled_date=NEW.scheduled_date AND other.status NOT IN ('completed','cancelled')
 AND (CAST(substr(NEW.scheduled_time,1,2) AS INTEGER)*60+CAST(substr(NEW.scheduled_time,4,2) AS INTEGER)) < (CAST(substr(other.scheduled_time,1,2) AS INTEGER)*60+CAST(substr(other.scheduled_time,4,2) AS INTEGER)+other.duration)
 AND (CAST(substr(NEW.scheduled_time,1,2) AS INTEGER)*60+CAST(substr(NEW.scheduled_time,4,2) AS INTEGER)+NEW.duration) > (CAST(substr(other.scheduled_time,1,2) AS INTEGER)*60+CAST(substr(other.scheduled_time,4,2) AS INTEGER))
) BEGIN SELECT RAISE(ABORT,'Garden crew scheduling constraint conflict'); END;
CREATE TRIGGER IF NOT EXISTS garden_invoice_unique BEFORE INSERT ON invoices
WHEN NEW.job_id IS NOT NULL AND EXISTS(SELECT 1 FROM garden_visits WHERE job_id=NEW.job_id) AND EXISTS(SELECT 1 FROM invoices WHERE job_id=NEW.job_id AND status!='cancelled')
BEGIN SELECT RAISE(ABORT,'Garden visit already has an invoice'); END;

CREATE TABLE IF NOT EXISTS garden_requests (
  id TEXT PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)), 2) || '-' || substr('89ab', abs(random() % 4) + 1, 1) || substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6)))) CHECK(length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-' AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-' AND length(replace(id, '-', '')) = 32 AND lower(replace(id, '-', '')) NOT GLOB '*[^0-9a-f]*'),
  body_json TEXT NOT NULL,
  result_json TEXT NOT NULL
);
