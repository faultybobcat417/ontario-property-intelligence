-- ============================================================
-- Migration 003 — DB function to refresh landlord flags
-- ============================================================
-- This function can be called after bulk imports to re-evaluate
-- the is_potential_landlord_property flag for all properties.

CREATE OR REPLACE FUNCTION public.refresh_landlord_flags()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Rule 1: Multi-unit property types
  UPDATE public.properties
  SET is_potential_landlord_property = TRUE
  WHERE property_type IN (
    'Duplex', 'Triplex', 'Fourplex', 'Apartment Building', 'Mixed Use'
  );

  -- Rule 2: Same owner appears in 2+ ownership records across different properties
  UPDATE public.properties p
  SET is_potential_landlord_property = TRUE
  WHERE p.id IN (
    SELECT DISTINCT o.property_id
    FROM public.ownership_records o
    WHERE o.owner_name IN (
      SELECT owner_name
      FROM public.ownership_records
      GROUP BY owner_name
      HAVING COUNT(DISTINCT property_id) >= 2
    )
  );

  -- Rule 3: Properties held for more than 10 years
  -- (last_sale_date more than 10 years ago)
  UPDATE public.properties
  SET is_potential_landlord_property = TRUE
  WHERE last_sale_date IS NOT NULL
    AND last_sale_date < (CURRENT_DATE - INTERVAL '10 years');
END;
$$;

COMMENT ON FUNCTION public.refresh_landlord_flags IS
  'Re-evaluates is_potential_landlord_property for all properties based on multi-unit type, repeat ownership, and long hold periods.';
