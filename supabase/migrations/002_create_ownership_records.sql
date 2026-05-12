-- ============================================================
-- Migration 002 — Create the ownership_records table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ownership_records (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id     UUID        NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  owner_name      TEXT        NOT NULL,
  transfer_date   DATE,
  document_number TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ownership_property_id   ON public.ownership_records (property_id);
CREATE INDEX IF NOT EXISTS idx_ownership_owner_name    ON public.ownership_records (owner_name);
CREATE INDEX IF NOT EXISTS idx_ownership_transfer_date ON public.ownership_records (transfer_date);

-- Row-level security
ALTER TABLE public.ownership_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on ownership_records"
  ON public.ownership_records
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access on ownership_records"
  ON public.ownership_records
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.ownership_records IS
  'Historical ownership transfers for Ontario properties sourced from land registry data.';
