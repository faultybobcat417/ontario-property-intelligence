/**
 * GET /api/landlord-opportunities
 *
 * Returns properties flagged as potential landlord properties,
 * with optional filters and pagination.
 *
 * This is a convenience wrapper around /api/properties with
 * landlord_only=true always set.
 *
 * Query params:
 *   city             - filter by city
 *   property_type    - filter by property type
 *   min_value        - minimum assessed_value
 *   max_value        - maximum assessed_value
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
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") ?? "20", 10)));

  const supabase = await createClient();

  let query = supabase
    .from("properties")
    .select("id, address, city, province, postal_code, property_type, assessed_value, year_built, last_sale_date, last_sale_price, is_potential_landlord_property, created_at", { count: "exact" })
    .eq("is_potential_landlord_property", true)
    .order("assessed_value", { ascending: false });

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

  const from = (page - 1) * per_page;
  const to = from + per_page - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Distinct cities and property types for filter dropdowns
  const { data: cities } = await supabase
    .from("properties")
    .select("city")
    .eq("is_potential_landlord_property", true)
    .order("city");

  const { data: types } = await supabase
    .from("properties")
    .select("property_type")
    .eq("is_potential_landlord_property", true)
    .order("property_type");

  const uniqueCities = Array.from(new Set((cities ?? []).map((r: { city: string }) => r.city)));
  const uniqueTypes = Array.from(new Set((types ?? []).map((r: { property_type: string }) => r.property_type)));

  return NextResponse.json({
    data,
    filters: {
      cities: uniqueCities,
      property_types: uniqueTypes,
    },
    meta: {
      total: count ?? 0,
      page,
      per_page,
      total_pages: Math.ceil((count ?? 0) / per_page),
    },
  });
}
