"use client";

/**
 * LandlordOpportunitiesClient
 *
 * Client-side wrapper that manages pagination state for the
 * landlord opportunities dashboard. Filters are handled server-side
 * via URL search params; pagination is handled client-side here.
 */

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PropertiesTable from "./PropertiesTable";
import type { PropertyRow } from "@/types/database";

interface LandlordOpportunitiesClientProps {
  initialProperties: PropertyRow[];
  total: number;
  perPage: number;
  initialPage: number;
}

export default function LandlordOpportunitiesClient({
  initialProperties,
  total,
  perPage,
  initialPage,
}: LandlordOpportunitiesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <PropertiesTable
      properties={initialProperties}
      total={total}
      page={initialPage}
      perPage={perPage}
      onPageChange={handlePageChange}
    />
  );
}
