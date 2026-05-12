-- ============================================================
-- Migration 001 — Create the properties table
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.properties (
  id                            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  address                       TEXT          NOT NULL,
  city                          TEXT          NOT NULL,
  province                      TEXT          NOT NULL DEFAULT 'ON',
  postal_code                   TEXT          NOT NULL,
  parcel_id                     TEXT,
  property_type                 TEXT          NOT NULL DEFAULT 'Other',
  assessed_value                NUMERIC(15,2),
  year_built                    INTEGER,
  building_size                 NUMERIC(10,2),
  lot_size                      NUMERIC(12,2),
  last_sale_date                DATE,
  last_sale_price               NUMERIC(15,2),
  is_potential_landlord_property BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at                    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes for common filter/search patterns
CREATE INDEX IF NOT EXISTS idx_properties_city          ON public.properties (city);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties (property_type);
CREATE INDEX IF NOT EXISTS idx_properties_assessed_value ON public.properties (assessed_value);
CREATE INDEX IF NOT EXISTS idx_properties_landlord_flag  ON public.properties (is_potential_landlord_property);
CREATE INDEX IF NOT EXISTS idx_properties_parcel_id     ON public.properties (parcel_id);

-- Row-level security (enable but allow all reads for now — tighten per auth requirements)
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on properties"
  ON public.properties
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role full access on properties"
  ON public.properties
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.properties IS
  'Ontario property records imported from land registry / MPAC assessment datasets.';
