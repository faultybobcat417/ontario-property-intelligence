/**
 * Home / Dashboard page
 *
 * Shows high-level stats and quick links to the main features.
 */

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/utils/propertyAnalytics";

export const dynamic = "force-dynamic";

async function getStats() {
  // Guard: if env vars are placeholders, return zeros instead of crashing
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key || key === "PASTE_SUPABASE_ANON_KEY_HERE") {
    return { total: 0, landlord: 0, cities: 0, unconfigured: true };
  }

  try {
    const supabase = await createClient();

    const [totalResult, landlordResult, cityResult] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }),
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("is_potential_landlord_property", true),
      supabase
        .from("properties")
        .select("city")
        .eq("is_potential_landlord_property", true),
    ]);

    const cities = new Set((cityResult.data ?? []).map((r: { city: string }) => r.city));

    return {
      total: totalResult.count ?? 0,
      landlord: landlordResult.count ?? 0,
      cities: cities.size,
      unconfigured: false,
    };
  } catch {
    return { total: 0, landlord: 0, cities: 0, unconfigured: true };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  const statCards = [
    {
      label: "Total Properties",
      value: stats.total.toLocaleString("en-CA"),
      icon: "🏘️",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
    },
    {
      label: "Landlord Opportunities",
      value: stats.landlord.toLocaleString("en-CA"),
      icon: "🔑",
      color: "bg-amber-50 border-amber-200",
      textColor: "text-amber-700",
    },
    {
      label: "Cities Covered",
      value: stats.cities.toLocaleString("en-CA"),
      icon: "🏙️",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Property Intelligence Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ontario property data — identify potential landlord-owned properties
          using land registry and assessment datasets.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`card border p-6 ${card.color}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{card.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900">
            🔍 Landlord Opportunities
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Browse properties flagged as potential landlord-owned based on
            property type, ownership patterns, and hold duration.
          </p>
          <div className="mt-4">
            <Link href="/landlord-opportunities" className="btn-primary">
              View Opportunities
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900">
            📥 Import Property Data
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Upload Ontario property datasets in CSV or JSON format. The system
            will normalize, deduplicate, and flag landlord properties
            automatically.
          </p>
          <div className="mt-4">
            <Link href="/import" className="btn-primary">
              Import Dataset
            </Link>
          </div>
        </div>
      </div>

      {/* Detection rules info */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          🧠 Landlord Detection Rules
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              rule: "Rule 1",
              title: "Multi-Unit Property Type",
              desc: "Duplex, Triplex, Fourplex, Apartment Building, or Mixed Use properties are automatically flagged.",
              icon: "🏢",
            },
            {
              rule: "Rule 2",
              title: "Repeat Ownership",
              desc: "Properties where the same owner name appears in ownership records for 2 or more distinct properties.",
              icon: "👤",
            },
            {
              rule: "Rule 3",
              title: "Long Hold Period",
              desc: "Properties with a last sale date more than 10 years ago — indicating long-term investment ownership.",
              icon: "📅",
            },
          ].map((item) => (
            <div key={item.rule} className="rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {item.rule}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-xs text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Future extensions */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          🔮 Future Dataset Extensions
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          The system is designed to integrate additional Ontario datasets to
          improve landlord opportunity detection:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Property Permits",
            "Zoning Changes",
            "Rental Listings",
            "Building Inspections",
            "Tax Assessment History",
            "Severance Applications",
          ].map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
