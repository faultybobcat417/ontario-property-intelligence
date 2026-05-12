/**
 * POST /api/import
 *
 * Accepts a multipart/form-data upload with a CSV or JSON property dataset file
 * and runs the property data importer pipeline.
 *
 * Form fields:
 *   file  - The dataset file (CSV or JSON)
 *
 * Returns:
 *   { result: ImportResult }
 *
 * Security: This route uses the Supabase service role key and should be
 * protected by authentication middleware in production.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { importPropertyData } from "@/services/propertyDataImporter";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Request must be multipart/form-data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "A `file` field is required" },
      { status: 400 }
    );
  }

  const mimeType = file.type || "text/csv";
  const content = await file.text();

  if (!content.trim()) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const result = await importPropertyData(content, mimeType, supabase, {
    skipDuplicates: true,
    batchSize: 100,
    refreshLandlordFlags: true,
  });

  const status = result.errors.length > 0 && result.propertiesInserted === 0 ? 422 : 200;

  return NextResponse.json({ result }, { status });
}
