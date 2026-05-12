-- ============================================================
-- Seed data — Ontario sample properties for development/testing
-- ============================================================

-- Clear existing seed data (safe for dev environments only)
TRUNCATE public.ownership_records, public.properties RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------
-- Properties
-- ---------------------------------------------------------------
INSERT INTO public.properties (
  id, address, city, province, postal_code, parcel_id,
  property_type, assessed_value, year_built, building_size,
  lot_size, last_sale_date, last_sale_price, is_potential_landlord_property
) VALUES
  ('11111111-0000-0000-0000-000000000001', '123 King St W',        'Toronto',   'ON', 'M5H 1A1', 'PID-001', 'Duplex',           480000,  1965, 1800, 3200, '2010-06-15', 420000, FALSE),
  ('11111111-0000-0000-0000-000000000002', '456 Queen St E',       'Toronto',   'ON', 'M4M 1T1', 'PID-002', 'Triplex',          620000,  1958, 2400, 4000, '2008-03-22', 510000, FALSE),
  ('11111111-0000-0000-0000-000000000003', '789 Dundas St W',      'Toronto',   'ON', 'M6J 1T4', 'PID-003', 'Single Family',    750000,  1990, 2100, 3500, '2019-11-01', 700000, FALSE),
  ('11111111-0000-0000-0000-000000000004', '22 Main St N',         'Hamilton',  'ON', 'L8R 1A1', 'PID-004', 'Apartment Building',1200000, 1972, 8500, 9000, '2005-07-30', 900000, FALSE),
  ('11111111-0000-0000-0000-000000000005', '88 Elm Ave',           'Hamilton',  'ON', 'L8P 2K3', 'PID-005', 'Single Family',    390000,  2001, 1600, 2800, '2021-04-10', 375000, FALSE),
  ('11111111-0000-0000-0000-000000000006', '14 Rideau St',         'Ottawa',    'ON', 'K1N 5X7', 'PID-006', 'Duplex',           510000,  1978, 1950, 3100, '2011-09-05', 440000, FALSE),
  ('11111111-0000-0000-0000-000000000007', '300 Commissioners Rd', 'London',    'ON', 'N6J 1Y4', 'PID-007', 'Triplex',          430000,  1969, 2200, 3800, '2009-12-18', 360000, FALSE),
  ('11111111-0000-0000-0000-000000000008', '55 Park St',           'Kitchener', 'ON', 'N2G 1N1', 'PID-008', 'Mixed Use',        680000,  1985, 3200, 5000, '2013-02-27', 580000, FALSE),
  ('11111111-0000-0000-0000-000000000009', '9 Lakeshore Blvd',     'Toronto',   'ON', 'M8V 1A3', 'PID-009', 'Condo',            420000,  2005, 900,  NULL, '2022-07-14', 415000, FALSE),
  ('11111111-0000-0000-0000-000000000010', '77 Barton St E',       'Hamilton',  'ON', 'L8L 2W9', 'PID-010', 'Fourplex',         560000,  1962, 3000, 4200, '2007-05-03', 480000, FALSE);

-- ---------------------------------------------------------------
-- Ownership records
-- ---------------------------------------------------------------
INSERT INTO public.ownership_records (property_id, owner_name, transfer_date, document_number) VALUES
  -- 123 King St W — held by same owner as 456 Queen St E (repeat owner)
  ('11111111-0000-0000-0000-000000000001', 'Mehdi Holdings Inc.',    '2010-06-15', 'DOC-2010-0001'),
  ('11111111-0000-0000-0000-000000000001', 'Previous Owner A',       '1995-03-10', 'DOC-1995-0042'),

  -- 456 Queen St E — same owner as above
  ('11111111-0000-0000-0000-000000000002', 'Mehdi Holdings Inc.',    '2008-03-22', 'DOC-2008-0017'),
  ('11111111-0000-0000-0000-000000000002', 'Previous Owner B',       '1980-11-01', 'DOC-1980-0099'),

  -- 789 Dundas St W — single owner, recent sale
  ('11111111-0000-0000-0000-000000000003', 'Jane Smith',             '2019-11-01', 'DOC-2019-0334'),

  -- 22 Main St N — apartment building, old sale (>10 years)
  ('11111111-0000-0000-0000-000000000004', 'Lakeview Properties Ltd.','2005-07-30', 'DOC-2005-0211'),
  ('11111111-0000-0000-0000-000000000004', 'Original Developer Corp.','1972-01-15', 'DOC-1972-0003'),

  -- 88 Elm Ave
  ('11111111-0000-0000-0000-000000000005', 'Robert & Mary Chen',     '2021-04-10', 'DOC-2021-0089'),

  -- 14 Rideau St — same owner as 300 Commissioners Rd
  ('11111111-0000-0000-0000-000000000006', 'Capital Region Rentals', '2011-09-05', 'DOC-2011-0156'),

  -- 300 Commissioners Rd
  ('11111111-0000-0000-0000-000000000007', 'Capital Region Rentals', '2009-12-18', 'DOC-2009-0278'),
  ('11111111-0000-0000-0000-000000000007', 'Previous Owner C',       '1969-06-01', 'DOC-1969-0011'),

  -- 55 Park St
  ('11111111-0000-0000-0000-000000000008', 'Waterloo Commercial Inc.','2013-02-27', 'DOC-2013-0045'),

  -- 9 Lakeshore Blvd
  ('11111111-0000-0000-0000-000000000009', 'Alice Nguyen',           '2022-07-14', 'DOC-2022-0501'),

  -- 77 Barton St E — fourplex, old sale
  ('11111111-0000-0000-0000-000000000010', 'Barton Street Holdings', '2007-05-03', 'DOC-2007-0188'),
  ('11111111-0000-0000-0000-000000000010', 'Previous Owner D',       '1962-09-20', 'DOC-1962-0007');

-- Apply landlord flags based on the rules
SELECT public.refresh_landlord_flags();
