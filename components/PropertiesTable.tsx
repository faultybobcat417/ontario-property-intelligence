"use client";

/**
 * PropertiesTable — displays a list of properties in a sortable table.
 *
 * Used on the /landlord-opportunities dashboard.
 */

import type { PropertyRow } from "@/types/database";
import { formatCurrency } from "@/utils/propertyAnalytics";

interface PropertiesTableProps {
  properties: PropertyRow[];
  total: number;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  Duplex: "bg-purple-100 text-purple-800",
  Triplex: "bg-indigo-100 text-indigo-800",
  Fourplex: "bg-blue-100 text-blue-800",
  "Apartment Building": "bg-cyan-100 text-cyan-800",
  "Mixed Use": "bg-teal-100 text-teal-800",
  "Single Family": "bg-gray-100 text-gray-700",
  Condo: "bg-pink-100 text-pink-800",
  Townhouse: "bg-orange-100 text-orange-800",
  Commercial: "bg-yellow-100 text-yellow-800",
};

function PropertyTypeBadge({ type }: { type: string }) {
  const colorClass =
    PROPERTY_TYPE_COLORS[type] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {type}
    </span>
  );
}

export default function PropertiesTable({
  properties,
  total,
  page,
  perPage,
  onPageChange,
}: PropertiesTableProps) {
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  if (properties.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-3">🏚️</div>
        <h3 className="text-base font-semibold text-gray-900">
          No properties found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or importing more property data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Results count */}
      <p className="text-sm text-gray-600">
        Showing{" "}
        <span className="font-medium text-gray-900">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-medium text-gray-900">
          {total.toLocaleString("en-CA")}
        </span>{" "}
        properties
      </p>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Address",
                  "City",
                  "Property Type",
                  "Assessed Value",
                  "Year Built",
                  "Last Sale Date",
                ].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {properties.map((property) => (
                <tr
                  key={property.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {property.address}
                        </p>
                        <p className="text-xs text-gray-500">
                          {property.postal_code}
                        </p>
                      </div>
                      {property.is_potential_landlord_property && (
                        <span className="badge-landlord flex-shrink-0 mt-0.5">
                          🔑 Landlord
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {property.city}
                  </td>
                  <td className="px-4 py-3">
                    <PropertyTypeBadge type={property.property_type} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(property.assessed_value)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {property.year_built ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDate(property.last_sale_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="btn-secondary disabled:opacity-40"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`h-8 w-8 rounded text-sm font-medium transition-colors ${
                    pageNum === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 7 && (
              <span className="px-2 text-gray-400">…{totalPages}</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn-secondary disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
