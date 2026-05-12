/**
 * File parser for property dataset files.
 *
 * Supports:
 *   - CSV  (via PapaParse)
 *   - JSON (array of objects or { data: [...] } envelope)
 *
 * Usage (Node / API route context):
 *   const records = await parseFile(fileBuffer, "text/csv");
 */

import Papa from "papaparse";
import type { RawPropertyRecord } from "./types";

export type SupportedMimeType =
  | "text/csv"
  | "application/csv"
  | "application/json"
  | "text/json";

/**
 * Parse a file buffer / string into an array of raw property records.
 *
 * @param content  - File content as a string (UTF-8)
 * @param mimeType - MIME type hint; falls back to JSON if not CSV
 */
export function parseFileContent(
  content: string,
  mimeType: SupportedMimeType | string
): RawPropertyRecord[] {
  const isCSV =
    mimeType === "text/csv" ||
    mimeType === "application/csv" ||
    content.trimStart().startsWith('"') ||
    !content.trimStart().startsWith("{") && !content.trimStart().startsWith("[");

  if (isCSV) {
    return parseCSV(content);
  }
  return parseJSON(content);
}

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

function parseCSV(content: string): RawPropertyRecord[] {
  const result = Papa.parse<RawPropertyRecord>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) =>
      header.trim().toLowerCase().replace(/\s+/g, "_"),
    transform: (value) => value.trim(),
  });

  if (result.errors.length > 0) {
    const fatal = result.errors.filter((e) => e.type === "Delimiter" || e.type === "Quotes");
    if (fatal.length > 0) {
      throw new Error(
        `CSV parse error: ${fatal.map((e) => e.message).join("; ")}`
      );
    }
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// JSON parser
// ---------------------------------------------------------------------------

function parseJSON(content: string): RawPropertyRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`JSON parse error: ${(err as Error).message}`);
  }

  // Accept bare array or { data: [...] } envelope
  if (Array.isArray(parsed)) {
    return parsed as RawPropertyRecord[];
  }

  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "data" in parsed &&
    Array.isArray((parsed as { data: unknown }).data)
  ) {
    return (parsed as { data: RawPropertyRecord[] }).data;
  }

  throw new Error(
    "JSON file must be an array of records or an object with a `data` array."
  );
}

// ---------------------------------------------------------------------------
// Sample CSV template (exported for documentation / testing)
// ---------------------------------------------------------------------------

export const CSV_TEMPLATE_HEADERS = [
  "address",
  "city",
  "province",
  "postal_code",
  "parcel_id",
  "property_type",
  "assessed_value",
  "year_built",
  "building_size",
  "lot_size",
  "last_sale_date",
  "last_sale_price",
  "owner_name",
  "transfer_date",
  "document_number",
].join(",");

export const CSV_TEMPLATE_EXAMPLE =
  CSV_TEMPLATE_HEADERS +
  "\n" +
  [
    "123 King St W",
    "Toronto",
    "ON",
    "M5H 1A1",
    "PID-001",
    "Duplex",
    "480000",
    "1965",
    "1800",
    "3200",
    "2010-06-15",
    "420000",
    "Mehdi Holdings Inc.",
    "2010-06-15",
    "DOC-2010-0001",
  ].join(",");
