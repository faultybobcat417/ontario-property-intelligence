/**
 * Types used exclusively by the property data importer service.
 */

/** Raw row shape coming from a CSV / JSON dataset file */
export interface RawPropertyRecord {
  // Address fields (various naming conventions seen in Ontario datasets)
  address?: string;
  street_address?: string;
  full_address?: string;
  city?: string;
  municipality?: string;
  province?: string;
  postal_code?: string;
  postalcode?: string;
  zip?: string;

  // Parcel / assessment identifiers
  parcel_id?: string;
  pin?: string;           // Ontario Land Registry PIN
  roll_number?: string;   // MPAC assessment roll number

  // Property characteristics
  property_type?: string;
  property_class?: string;
  use_code?: string;
  assessed_value?: string | number;
  assessment?: string | number;
  year_built?: string | number;
  building_size?: string | number;
  floor_area?: string | number;
  lot_size?: string | number;
  lot_area?: string | number;

  // Sale history
  last_sale_date?: string;
  sale_date?: string;
  last_sale_price?: string | number;
  sale_price?: string | number;

  // Ownership (may be present in combined exports)
  owner_name?: string;
  owner?: string;
  transfer_date?: string;
  document_number?: string;
  instrument_number?: string;

  // Allow any extra columns
  [key: string]: unknown;
}

/** Result returned after a full import run */
export interface ImportResult {
  propertiesInserted: number;
  propertiesSkipped: number;
  ownershipRecordsInserted: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  message: string;
  rawData?: unknown;
}

/** Options that control importer behaviour */
export interface ImportOptions {
  /** Skip rows that already exist (matched by parcel_id). Default: true */
  skipDuplicates?: boolean;
  /** Batch size for Supabase upserts. Default: 100 */
  batchSize?: number;
  /** If true, re-run landlord flag refresh after import. Default: true */
  refreshLandlordFlags?: boolean;
}
