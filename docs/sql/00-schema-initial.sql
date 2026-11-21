-- ============================================================
-- SCHEMA: La Tanière du médic
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: settings
-- Universe-specific key/value configuration
-- ============================================================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  universe TEXT NOT NULL CHECK (universe IN ('fivem', 'redm')),
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, universe, key)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_settings" ON settings
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- TABLE: templates
-- ============================================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  universe TEXT NOT NULL CHECK (universe IN ('fivem', 'redm')),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  body TEXT NOT NULL DEFAULT '',  -- Template body with {{field.KEY}} variables
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, universe, slug)
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_templates" ON templates
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- TABLE: template_fields
-- Dynamic fields attached to templates
-- ============================================================
CREATE TABLE template_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  key TEXT NOT NULL,            -- variable name used in body
  label TEXT NOT NULL,          -- display label
  field_type TEXT NOT NULL CHECK (field_type IN (
    'short_text', 'long_text', 'number', 'datetime',
    'select', 'checkbox', 'multi_select', 'table'
  )),
  required BOOLEAN DEFAULT FALSE,
  options JSONB,                -- For select/multi_select: ["opt1","opt2"]
  table_columns JSONB,          -- For table: [{"key":"col1","label":"Column 1"}]
  default_value TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, key)
);

ALTER TABLE template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_template_fields" ON template_fields
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- TABLE: template_models (saved form prefills)
-- ============================================================
CREATE TABLE template_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_values JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE template_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_template_models" ON template_models
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- TABLE: archives
-- Permanent PDF archive records
-- ============================================================
CREATE TABLE archives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  universe TEXT NOT NULL CHECK (universe IN ('fivem', 'redm')),
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,     -- snapshot at time of creation
  patient_name TEXT NOT NULL DEFAULT 'Unknown Patient',
  storage_path TEXT NOT NULL,      -- path in Supabase Storage
  filename TEXT NOT NULL,
  field_values JSONB NOT NULL DEFAULT '{}',  -- snapshot of all field values
  rendered_body TEXT,              -- snapshot of rendered text
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- NO updated_at, NO delete — archives are permanent
);

ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_archives" ON archives
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Prevent deletion via RLS (no DELETE policy)
CREATE POLICY "no_delete_archives" ON archives
  AS RESTRICTIVE
  FOR DELETE
  USING (FALSE);

-- ============================================================
-- TABLE: docs
-- PDF document library (uploads, references)
-- ============================================================
CREATE TABLE docs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  universe TEXT CHECK (universe IN ('fivem', 'redm')),
  name TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_docs" ON docs
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- TABLE: pages
-- Custom admin-created pages
-- ============================================================
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  universe TEXT CHECK (universe IN ('fivem', 'redm')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',  -- Markdown or HTML
  published BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, slug)
);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only_pages" ON pages
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- UPDATED_AT trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_template_models_updated_at
  BEFORE UPDATE ON template_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_docs_updated_at
  BEFORE UPDATE ON docs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_templates_universe ON templates(owner_id, universe);
CREATE INDEX idx_templates_published ON templates(owner_id, published);
CREATE INDEX idx_template_fields_template ON template_fields(template_id);
CREATE INDEX idx_archives_universe ON archives(owner_id, universe);
CREATE INDEX idx_archives_template ON archives(owner_id, template_id);
CREATE INDEX idx_archives_created ON archives(owner_id, created_at DESC);
CREATE INDEX idx_pages_slug ON pages(owner_id, slug);