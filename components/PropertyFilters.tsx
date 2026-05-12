"use client";

/**
 * PropertyFilters — filter bar for the landlord opportunities dashboard.
 *
 * Controlled component: reads filter state from URL search params and
 * pushes updates back via router.push().
 */

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";

interface PropertyFiltersProps {
  cities: string[];
  propertyTypes: string[];
}

export default function PropertyFilters({
  cities,
  propertyTypes,
}: PropertyFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset to page 1 whenever filters change
      params.delete("page");
      return params.toString();
    },
    [searchParams]
  );

  const handleChange = (key: string, value: string) => {
    startTransition(() => {
      router.push(`${pathname}?${createQueryString({ [key]: value || null })}`);
    });
  };

  const handleReset = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const currentCity = searchParams.get("city") ?? "";
  const currentType = searchParams.get("property_type") ?? "";
  const currentMin = searchParams.get("min_value") ?? "";
  const currentMax = searchParams.get("max_value") ?? "";

  const hasActiveFilters = currentCity || currentType || currentMin || currentMax;

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* City filter */}
        <div className="min-w-[160px] flex-1">
          <label
            htmlFor="filter-city"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            City
          </label>
          <select
            id="filter-city"
            className="select-field"
            value={currentCity}
            onChange={(e) => handleChange("city", e.target.value)}
            disabled={isPending}
          >
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Property type filter */}
        <div className="min-w-[180px] flex-1">
          <label
            htmlFor="filter-type"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Property Type
          </label>
          <select
            id="filter-type"
            className="select-field"
            value={currentType}
            onChange={(e) => handleChange("property_type", e.target.value)}
            disabled={isPending}
          >
            <option value="">All types</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Assessed value range */}
        <div className="min-w-[140px] flex-1">
          <label
            htmlFor="filter-min"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Min Value (CAD)
          </label>
          <input
            id="filter-min"
            type="number"
            min={0}
            step={10000}
            placeholder="e.g. 200000"
            className="input-field"
            value={currentMin}
            onChange={(e) => handleChange("min_value", e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="min-w-[140px] flex-1">
          <label
            htmlFor="filter-max"
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Max Value (CAD)
          </label>
          <input
            id="filter-max"
            type="number"
            min={0}
            step={10000}
            placeholder="e.g. 1000000"
            className="input-field"
            value={currentMax}
            onChange={(e) => handleChange("max_value", e.target.value)}
            disabled={isPending}
          />
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
              disabled={isPending}
            >
              {isPending ? "Updating…" : "Clear Filters"}
            </button>
          </div>
        )}
      </div>

      {isPending && (
        <p className="mt-2 text-xs text-blue-600 animate-pulse">
          Applying filters…
        </p>
      )}
    </div>
  );
}
