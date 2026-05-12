/**
 * Property Data Importer — main entry point
 *
 * Orchestrates parsing → normalizing → upserting into Supabase.
 *
 * Usage (from an API route or script):
 *
 *   import { importPropertyData } from "@/services/propertyDataImporter";
 *
 *   const result = await importPropertyData(fileContent, "text/csv", adminClient);
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = any;

import { parseFileContent, type SupportedMimeType } from "./parser";
import { normalizeProperty } from "./normalizer";
import type { ImportResult, ImportOptions } from "./types";
import type { PropertyInsert } from "@/types/database";

const DEFAULT_OPTIONS: Required<ImportOptions> = {
  skipDuplicates: true,
  batchSize: 100,
  refreshLandlordFlags: true,
};

/**
 * Import property data from a CSV or JSON file content string.
 *
 * @param content    - Raw file content (UTF-8 string)
 * @param mimeType   - "text/csv" | "application/json" etc.
 * @param supabase   - Supabase admin client (service role)
 * @param options    - Optional import configuration
 */
export async function importPropertyData(
  content: string,
  mimeType: SupportedMimeType | string,
  supabase: AnySupabaseClient,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const result: ImportResult = {
    propertiesInserted: 0,
    propertiesSkipped: 0,
    ownershipRecordsInserted: 0,
    errors: [],
  };

  // ── 1. Parse ──────────────────────────────────────────────────────────────
  let rawRecords;
  try {
    rawRecords = parseFileContent(content, mimeType);
  } catch (err) {
    result.errors.push({ row: 0, message: `File parse failed: ${(err as Error).message}` });
    return result;
  }

  // ── 2. Normalize ──────────────────────────────────────────────────────────
  const propertyBatch: Array<{ index: number; record: PropertyInsert }> = [];
  const ownershipMap = new Map<
    number,
    { owner_name: string; transfer_date: string | null; document_number: string | null }
  >();

  for (let i = 0; i < rawRecords.length; i++) {
    const raw = rawRecords[i];
    const normalized = normalizeProperty(raw);

    if (!normalized) {
      result.errors.push({
        row: i + 1,
        message: "Skipped: missing required fields (address, city, or postal_code)",
        rawData: raw,
      });
      result.propertiesSkipped++;
      continue;
    }

    propertyBatch.push({ index: i, record: normalized });

    // Capture ownership data keyed by batch index
    const ownerName = (
      (raw.owner_name as string | undefined) ??
      (raw.owner as string | undefined) ??
      ""
    ).trim();
    if (ownerName) {
      ownershipMap.set(i, {
        owner_name: ownerName,
        transfer_date: normalizeDate(
          (raw.transfer_date as string | undefined) ??
          (raw.last_sale_date as string | undefined) ??
          (raw.sale_date as string | undefined)
        ),
        document_number:
          (
            (raw.document_number as string | undefined) ??
            (raw.instrument_number as string | undefined) ??
            ""
          ).trim() || null,
      });
    }
  }

  // ── 3. Upsert properties in batches ───────────────────────────────────────
  for (let start = 0; start < propertyBatch.length; start += opts.batchSize) {
    const chunk = propertyBatch.slice(start, start + opts.batchSize);
    const records: PropertyInsert[] = chunk.map((c) => c.record);

    const { data: inserted, error } = await supabase
      .from("properties")
      .upsert(records, {
        onConflict: opts.skipDuplicates ? "parcel_id" : undefined,
        ignoreDuplicates: opts.skipDuplicates,
      })
      .select("id, parcel_id");

    if (error) {
      result.errors.push({
        row: start + 1,
        message: `Supabase upsert error: ${error.message}`,
      });
      continue;
    }

    const insertedRows = (inserted ?? []) as Array<{ id: string; parcel_id: string | null }>;
    result.propertiesInserted += insertedRows.length;

    // ── 4. Insert ownership records for this batch ─────────────────────────
    if (insertedRows.length > 0) {
      const ownershipInserts: Array<{
        property_id: string;
        owner_name: string;
        transfer_date: string | null;
        document_number: string | null;
      }> = [];

      for (let ci = 0; ci < chunk.length; ci++) {
        const originalIndex = chunk[ci].index;
        const ownerData = ownershipMap.get(originalIndex);
        const insertedProp = insertedRows[ci];

        if (ownerData && insertedProp?.id) {
          ownershipInserts.push({
            property_id: insertedProp.id,
            owner_name: ownerData.owner_name,
            transfer_date: ownerData.transfer_date,
            document_number: ownerData.document_number,
          });
        }
      }

      if (ownershipInserts.length > 0) {
        const { data: ownerInserted, error: ownerError } = await supabase
          .from("ownership_records")
          .insert(ownershipInserts)
          .select("id");

        if (ownerError) {
          result.errors.push({
            row: start + 1,
            message: `Ownership insert error: ${ownerError.message}`,
          });
        } else {
          result.ownershipRecordsInserted += (ownerInserted ?? []).length;
        }
      }
    }
  }

  // ── 5. Refresh landlord flags ─────────────────────────────────────────────
  if (opts.refreshLandlordFlags && result.propertiesInserted > 0) {
    const { error: fnError } = await supabase.rpc("refresh_landlord_flags");
    if (fnError) {
      result.errors.push({
        row: 0,
        message: `refresh_landlord_flags RPC error: ${fnError.message}`,
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------
function normalizeDate(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

// Re-export sub-modules for consumers who need them directly
export { parseFileContent } from "./parser";
export { normalizeProperty, normalizeOwnershipRecord } from "./normalizer";
export type { ImportResult, ImportOptions, ImportError, RawPropertyRecord } from "./types";
export { CSV_TEMPLATE_EXAMPLE, CSV_TEMPLATE_HEADERS } from "./parser";
