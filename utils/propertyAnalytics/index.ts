/**
 * Property Analytics — Landlord Opportunity Detection
 *
 * This module implements the three core detection rules:
 *
 *   Rule 1 — Multi-unit property types (Duplex, Triplex, Fourplex, Apartment, Mixed Use)
 *   Rule 2 — Same owner appears in 2+ ownership records across different properties
 *   Rule 3 — Property held for more than 10 years (last_sale_date > 10 years ago)
 *
 * It can be used:
 *   a) In-memory: evaluate a set of PropertyWithOwnership objects (e.g. for UI preview)
 *   b) Via Supabase: call the refresh_landlord_flags() DB function after bulk imports
 */

import { differenceInYears, parseISO } from "date-fns";
import type { PropertyRow, PropertyWithOwnership, OwnershipRecordRow } from "@/types/database";
import { MULTI_UNIT_TYPES } from "@/types/database";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of years a property must be held to trigger Rule 3 */
export const LONG_HOLD_YEARS = 10;

// ---------------------------------------------------------------------------
// Individual rule evaluators
// ---------------------------------------------------------------------------

/**
 * Rule 1: Is this a multi-unit property type?
 */
export function isMultiUnitType(property: Pick<PropertyRow, "property_type">): boolean {
  return (MULTI_UNIT_TYPES as string[]).includes(property.property_type);
}

/**
 * Rule 2: Does this owner appear in multiple properties?
 *
 * Pass the full set of ownership records across all properties so the
 * function can count how many distinct properties each owner holds.
 */
export function isRepeatOwner(
  property: Pick<PropertyRow, "id">,
  allOwnershipRecords: OwnershipRecordRow[]
): boolean {
  // Find all owner names associated with this property
  const ownersOfThisProperty = allOwnershipRecords
    .filter((r) => r.property_id === property.id)
    .map((r) => r.owner_name.toLowerCase().trim());

  if (ownersOfThisProperty.length === 0) return false;

  // For each owner, count how many distinct properties they appear in
  for (const ownerName of ownersOfThisProperty) {
    const distinctProperties = new Set(
      allOwnershipRecords
        .filter((r) => r.owner_name.toLowerCase().trim() === ownerName)
        .map((r) => r.property_id)
    );
    if (distinctProperties.size >= 2) return true;
  }

  return false;
}

/**
 * Rule 3: Has the property been held for more than LONG_HOLD_YEARS years?
 */
export function isLongHoldProperty(
  property: Pick<PropertyRow, "last_sale_date">,
  referenceDate: Date = new Date()
): boolean {
  if (!property.last_sale_date) return false;
  try {
    const saleDate = parseISO(property.last_sale_date);
    return differenceInYears(referenceDate, saleDate) > LONG_HOLD_YEARS;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Composite evaluator
// ---------------------------------------------------------------------------

export interface LandlordAnalysisResult {
  is_potential_landlord_property: boolean;
  reasons: LandlordReason[];
}

export type LandlordReason =
  | "multi_unit_type"
  | "repeat_owner"
  | "long_hold_period";

/**
 * Evaluate all three rules for a single property.
 *
 * @param property          - The property to evaluate
 * @param allOwnershipRecords - All ownership records in the dataset (for Rule 2)
 * @param referenceDate     - Date to use as "today" for Rule 3 (defaults to now)
 */
export function analyzeProperty(
  property: PropertyWithOwnership,
  allOwnershipRecords: OwnershipRecordRow[],
  referenceDate: Date = new Date()
): LandlordAnalysisResult {
  const reasons: LandlordReason[] = [];

  if (isMultiUnitType(property)) {
    reasons.push("multi_unit_type");
  }

  if (isRepeatOwner(property, allOwnershipRecords)) {
    reasons.push("repeat_owner");
  }

  if (isLongHoldProperty(property, referenceDate)) {
    reasons.push("long_hold_period");
  }

  return {
    is_potential_landlord_property: reasons.length > 0,
    reasons,
  };
}

/**
 * Evaluate all properties in a dataset and return them with updated flags.
 *
 * This is the in-memory equivalent of the refresh_landlord_flags() SQL function.
 * Useful for previewing results before committing to the database.
 */
export function analyzeAllProperties(
  properties: PropertyWithOwnership[],
  referenceDate: Date = new Date()
): Array<PropertyWithOwnership & LandlordAnalysisResult> {
  // Flatten all ownership records for cross-property owner lookup
  const allOwnershipRecords: OwnershipRecordRow[] = properties.flatMap(
    (p) => p.ownership_records
  );

  return properties.map((property) => {
    const analysis = analyzeProperty(property, allOwnershipRecords, referenceDate);
    return {
      ...property,
      is_potential_landlord_property: analysis.is_potential_landlord_property,
      reasons: analysis.reasons,
    };
  });
}

// ---------------------------------------------------------------------------
// Summary statistics
// ---------------------------------------------------------------------------

export interface PropertySummaryStats {
  total: number;
  flaggedAsLandlord: number;
  byPropertyType: Record<string, number>;
  byCity: Record<string, number>;
  flaggedByCity: Record<string, number>;
  averageAssessedValue: number | null;
  averageYearBuilt: number | null;
}

/**
 * Compute summary statistics for a set of properties.
 * Useful for dashboard header cards.
 */
export function computeSummaryStats(properties: PropertyRow[]): PropertySummaryStats {
  const total = properties.length;
  const flagged = properties.filter((p) => p.is_potential_landlord_property);

  const byPropertyType: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  const flaggedByCity: Record<string, number> = {};

  let totalAssessedValue = 0;
  let assessedValueCount = 0;
  let totalYearBuilt = 0;
  let yearBuiltCount = 0;

  for (const p of properties) {
    // Property type counts
    byPropertyType[p.property_type] = (byPropertyType[p.property_type] ?? 0) + 1;

    // City counts
    byCity[p.city] = (byCity[p.city] ?? 0) + 1;

    // Assessed value average
    if (p.assessed_value !== null) {
      totalAssessedValue += p.assessed_value;
      assessedValueCount++;
    }

    // Year built average
    if (p.year_built !== null) {
      totalYearBuilt += p.year_built;
      yearBuiltCount++;
    }
  }

  for (const p of flagged) {
    flaggedByCity[p.city] = (flaggedByCity[p.city] ?? 0) + 1;
  }

  return {
    total,
    flaggedAsLandlord: flagged.length,
    byPropertyType,
    byCity,
    flaggedByCity,
    averageAssessedValue: assessedValueCount > 0 ? totalAssessedValue / assessedValueCount : null,
    averageYearBuilt: yearBuiltCount > 0 ? Math.round(totalYearBuilt / yearBuiltCount) : null,
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/** Human-readable label for a landlord detection reason */
export function reasonLabel(reason: LandlordReason): string {
  switch (reason) {
    case "multi_unit_type":
      return "Multi-unit property type";
    case "repeat_owner":
      return "Owner holds multiple properties";
    case "long_hold_period":
      return `Held for more than ${LONG_HOLD_YEARS} years`;
  }
}

/** Format a dollar amount as a Canadian currency string */
export function formatCurrency(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}
