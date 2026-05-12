/**
 * Address and field normalizer for Ontario property datasets.
 *
 * Different data sources use different column names and value formats.
 * This module maps raw records to the canonical PropertyInsert shape.
 */

import type { RawPropertyRecord } from "./types";
import type { PropertyInsert, OwnershipRecordInsert } from "@/types/database";
import { MULTI_UNIT_TYPES } from "@/types/database";

// ---------------------------------------------------------------------------
// Property type mapping
// ---------------------------------------------------------------------------

const PROPERTY_TYPE_MAP: Record<string, string> = {
  // MPAC use codes → canonical types
  "301": "Single Family",
  "302": "Single Family",
  "310": "Duplex",
  "311": "Triplex",
  "312": "Fourplex",
  "340": "Apartment Building",
  "400": "Commercial",
  "500": "Mixed Use",
  "600": "Vacant Land",

  // Free-text aliases
  "single family": "Single Family",
  "single-family": "Single Family",
  "sfr": "Single Family",
  "detached": "Single Family",
  "semi-detached": "Single Family",
  "duplex": "Duplex",
  "two-unit": "Duplex",
  "triplex": "Triplex",
  "three-unit": "Triplex",
  "fourplex": "Fourplex",
  "four-unit": "Fourplex",
  "apartment": "Apartment Building",
  "apartment building": "Apartment Building",
  "multi-family": "Apartment Building",
  "multifamily": "Apartment Building",
  "condo": "Condo",
  "condominium": "Condo",
  "townhouse": "Townhouse",
  "row house": "Townhouse",
  "commercial": "Commercial",
  "mixed use": "Mixed Use",
  "mixed-use": "Mixed Use",
  "vacant land": "Vacant Land",
  "land": "Vacant Land",
};

function normalizePropertyType(raw: string | undefined): string {
  if (!raw) return "Other";
  const key = raw.trim().toLowerCase();
  return PROPERTY_TYPE_MAP[key] ?? "Other";
}

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

function toNumber(val: string | number | undefined | null): number | null {
  if (val === undefined || val === null || val === "") return null;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/[$,\s]/g, ""));
  return isNaN(n) ? null : n;
}

function toInteger(val: string | number | undefined | null): number | null {
  const n = toNumber(val);
  return n === null ? null : Math.round(n);
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function normalizeDate(raw: string | undefined | null): string | null {
  if (!raw) return null;
  // Accept YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, etc.
  const cleaned = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Address normalizer
// ---------------------------------------------------------------------------

function normalizeAddress(raw: RawPropertyRecord): {
  address: string;
  city: string;
  province: string;
  postal_code: string;
} {
  const address = (
    raw.address ??
    raw.street_address ??
    raw.full_address ??
    ""
  ).trim();

  const city = (raw.city ?? raw.municipality ?? "").trim();
  const province = (raw.province ?? "ON").trim().toUpperCase();

  const postal_code = (
    raw.postal_code ??
    raw.postalcode ??
    raw.zip ??
    ""
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

  return { address, city, province, postal_code };
}

// ---------------------------------------------------------------------------
// Main normalizer functions
// ---------------------------------------------------------------------------

/**
 * Convert a raw dataset row into a PropertyInsert record.
 * Returns null if the row is missing required fields (address, city, postal_code).
 */
export function normalizeProperty(
  raw: RawPropertyRecord
): PropertyInsert | null {
  const { address, city, province, postal_code } = normalizeAddress(raw);

  if (!address || !city || !postal_code) return null;

  const parcel_id =
    (raw.parcel_id ?? raw.pin ?? raw.roll_number ?? "").trim() || null;

  const rawType = raw.property_type ?? raw.property_class ?? raw.use_code;
  const property_type = normalizePropertyType(rawType);

  const assessed_value = toNumber(raw.assessed_value ?? raw.assessment);
  const year_built = toInteger(raw.year_built);
  const building_size = toNumber(raw.building_size ?? raw.floor_area);
  const lot_size = toNumber(raw.lot_size ?? raw.lot_area);
  const last_sale_date = normalizeDate(raw.last_sale_date ?? raw.sale_date);
  const last_sale_price = toNumber(raw.last_sale_price ?? raw.sale_price);

  // Pre-flag multi-unit types immediately on import
  const is_potential_landlord_property = (
    MULTI_UNIT_TYPES as string[]
  ).includes(property_type);

  return {
    address,
    city,
    province,
    postal_code,
    parcel_id,
    property_type,
    assessed_value,
    year_built,
    building_size,
    lot_size,
    last_sale_date,
    last_sale_price,
    is_potential_landlord_property,
  };
}

/**
 * Extract an ownership record from a raw row if owner data is present.
 * property_id must be filled in by the caller after the property is inserted.
 */
export function normalizeOwnershipRecord(
  raw: RawPropertyRecord,
  property_id: string
): OwnershipRecordInsert | null {
  const owner_name = (raw.owner_name ?? raw.owner ?? "").trim();
  if (!owner_name) return null;

  const transfer_date = normalizeDate(
    raw.transfer_date ?? raw.last_sale_date ?? raw.sale_date
  );
  const document_number = (
    raw.document_number ??
    raw.instrument_number ??
    ""
  ).trim() || null;

  return {
    property_id,
    owner_name,
    transfer_date,
    document_number,
  };
}
