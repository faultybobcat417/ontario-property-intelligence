/**
 * /landlord-opportunities — Server Component page
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import PropertyFilters from "@/components/PropertyFilters";
import LandlordOpportunitiesClient from "@/components/LandlordOpportunitiesClient";
import StatCard from "@/components/StatCard";
import { formatCurrency } from "@/utils/propertyAnalytics";
import type { PropertyRow } from "@/types/database";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

interface PageProps {
  searchParams: Promise<{
    city?: string;
    property_type?: string;
    min_value?: string;
    max_value?: string;
    page?: string;
  }>;
}

async function fetchOpportunities(params: Awaited<PageProps["searchParams"]>) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !key || key === "PASTE_SUPABASE_ANON_KEY_HERE") {
    return {
      properties: [],
      total: 0,
      page: 1,
      cities: [],
      propertyTypes: [],
      stats: { totalFlagged: 0, avgValue: null, topType: "—", citiesCount: 0 },
      error:
        "Supabase is not configured. Add your NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    };
  }

  const supabase = await createClient();

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PER_PAGE;
  const to = from + PER_PAGE - 1;

  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_potential_landlord_property", true)
    .range(from, to);

  if (params.city) {
    query = query.ilike("city", `%${params.city}%`);
  }

  if (params.property_type) {
    query = query.eq("property_type", params.property_type);
  }

  if (params.min_value) {
    query = query.gte("assessed_value", parseFloat(params.min_value));
  }

  if (params.max_value) {
    query = query.lte("assessed_value", parseFloat(params.max_value));
  }

  const { data, count, error } = await query;

  const [citiesResult, typesResult, statsResult] = await Promise.all([
    supabase
      .from("properties")
      .select("city")
      .eq("is_potential_landlord_property", true)
      .order("city"),

    supabase
      .from("properties")
      .select("property_type")
      .eq("is_potential_landlord_property", true)
      .order("property_type"),

    supabase
      .from("properties")
      .select("assessed_value, property_type")
      .eq("is_potential_landlord_property", true),
  ]);

  const uniqueCities = Array.from(
    new Set((citiesResult.data ?? []).map((r: { city: string }) => r.city))
  );

  const uniqueTypes = Array.from(
    new Set(
      (typesResult.data ?? []).map(
        (r: { property_type: string }) => r.property_type
      )
    )
  );

  const allFlagged = statsResult.data ?? [];
  const totalFlagged = allFlagged.length;

  const avgValue =
    totalFlagged > 0
      ? allFlagged.reduce(
          (sum: number, r: { assessed_value: number | null }) =>
            sum + (r.assessed_value ?? 0),
          0
        ) / totalFlagged
      : null;

  const typeBreakdown: Record<string, number> = {};

  for (const r of allFlagged as { property_type: string }[]) {
    typeBreakdown[r.property_type] =
      (typeBreakdown[r.property_type] ?? 0) + 1;
  }

  const topType =
    Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return {
    properties: (data ?? []) as PropertyRow[],
    total: count ?? 0,
    page,
    cities: uniqueCities,
    propertyTypes: uniqueTypes,
    stats: {
      totalFlagged,
      avgValue,
      topType,
      citiesCount: uniqueCities.length,
    },
    error: error?.message,
  };
}

export default async function LandlordOpportunitiesPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const {
    properties,
    total,
    page,
    cities,
    propertyTypes,
    stats,
    error,
  } = await fetchOpportunities(params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          🔑 Landlord Opportunities
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Properties flagged as potential landlord-owned based on property type,
          ownership patterns, and hold duration.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Flagged Properties"
          value={stats.totalFlagged}
          icon="🔑"
        />

        <StatCard label="Cities" value={stats.citiesCount} icon="🏙️" />

        <StatCard
          label="Avg. Assessed Value"
          value={formatCurrency(stats.avgValue)}
          icon="💰"
        />

        <StatCard label="Top Property Type" value={stats.topType} icon="🏢" />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            ⚠️ Error loading properties: {error}
          </p>
        </div>
      )}

      <Suspense fallback={<div className="card p-4 animate-pulse h-20" />}>
        <PropertyFilters cities={cities} propertyTypes={propertyTypes} />
      </Suspense>

      {(params.city ||
        params.property_type ||
        params.min_value ||
        params.max_value) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {params.city && <span>City: {params.city}</span>}
          {params.property_type && <span>Type: {params.property_type}</span>}
        </div>
      )}

      <Suspense fallback={<div>Loading properties…</div>}>
        <LandlordOpportunitiesClient
          initialProperties={properties}
          total={total}
          perPage={PER_PAGE}
          initialPage={page}
        />
      </Suspense>
    </div>
  );
}