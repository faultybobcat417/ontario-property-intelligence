/**
 * GET /api/properties
 *
 * Returns a paginated, filtered list of properties.
 *
 * Query params:
 *   city             - filter by city (case-insensitive)
 *   property_type    - filter by property type
 *   min_value        - minimum assessed_value
 *   max_value        - maximum assessed_value
 *   landlord_only    - "true" to return only flagged properties
 *   page             - page number (default: 1)
 *   per_page         - results per page (default: 20, max: 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const city = searchParams.get("city") ?? undefined;
  const property_type = searchParams.get("property_type") ?? undefined;
  const min_value = searchParams.get("min_value");
  const max_value = searchParams.get("max_value");
  const landlord_only = searchParams.get("landlord_only") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") ?? "20", 10)));

  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (city) {
    query = query.ilike("city", `%${city}%`);
  }

  if (property_type) {
    query = query.eq("property_type", property_type);
  }

  if (min_value) {
    query = query.gte("assessed_value", parseFloat(min_value));
  }

  if (max_value) {
    query = query.lte("assessed_value", parseFloat(max_value));
  }

  if (landlord_only) {
    query = query.eq("is_potential_landlord_property", true);
  }

  // Pagination
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    meta: {
      total: count ?? 0,
      page,
      per_page,
      total_pages: Math.ceil((count ?? 0) / per_page),
    },
  });
}
