/**
 * /import — Data import page
 *
 * Allows uploading a CSV or JSON property dataset file.
 * Calls POST /api/import and displays the result.
 */

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { CSV_TEMPLATE_EXAMPLE } from "@/services/propertyDataImporter";
import type { ImportResult } from "@/services/propertyDataImporter";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function ImportPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "json"].includes(ext ?? "")) {
      setErrorMessage("Only CSV and JSON files are supported.");
      setState("error");
      return;
    }

    setState("uploading");
    setResult(null);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error ?? "Import failed.");
        setState("error");
        return;
      }

      setResult(json.result as ImportResult);
      setState("success");
    } catch (err) {
      setErrorMessage((err as Error).message ?? "Network error.");
      setState("error");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE_EXAMPLE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ontario_property_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setState("idle");
    setResult(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📥 Import Property Data</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload an Ontario property dataset in CSV or JSON format. The system
          will parse, normalize, and insert records into the database, then
          automatically flag potential landlord properties.
        </p>
      </div>

      {/* Template download */}
      <div className="card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            📄 Download CSV Template
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Use this template to format your property dataset correctly.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="btn-secondary flex-shrink-0"
        >
          Download Template
        </button>
      </div>

      {/* Upload area */}
      {state === "idle" || state === "error" ? (
        <div
          className={`card border-2 border-dashed p-10 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="text-4xl mb-3">📂</div>
          <p className="text-sm font-medium text-gray-900">
            Drop your CSV or JSON file here
          </p>
          <p className="text-xs text-gray-500 mt-1">
            or click to browse — max 50 MB
          </p>

          {state === "error" && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-left">
              <p className="text-sm font-medium text-red-800">
                ⚠️ {errorMessage}
              </p>
            </div>
          )}
        </div>
      ) : state === "uploading" ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3 animate-bounce">⏳</div>
          <p className="text-sm font-medium text-gray-900">
            Importing property data…
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Parsing, normalizing, and inserting records. This may take a moment
            for large files.
          </p>
        </div>
      ) : (
        /* Success state */
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✅</span>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Import Complete
                </h2>
                <p className="text-xs text-gray-500">
                  The dataset has been processed successfully.
                </p>
              </div>
            </div>

            {result && (
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">
                    {result.propertiesInserted.toLocaleString("en-CA")}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Properties Inserted
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {result.ownershipRecordsInserted.toLocaleString("en-CA")}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Ownership Records
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-700">
                    {result.propertiesSkipped.toLocaleString("en-CA")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Skipped / Dupes</p>
                </div>
              </div>
            )}

            {result && result.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-amber-700 mb-2">
                  ⚠️ {result.errors.length} row(s) had issues:
                </p>
                <div className="max-h-40 overflow-y-auto rounded-lg bg-amber-50 border border-amber-200 p-3 space-y-1">
                  {result.errors.slice(0, 20).map((err, i) => (
                    <p key={i} className="text-xs text-amber-800">
                      Row {err.row}: {err.message}
                    </p>
                  ))}
                  {result.errors.length > 20 && (
                    <p className="text-xs text-amber-600">
                      …and {result.errors.length - 20} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={reset} className="btn-secondary">
              Import Another File
            </button>
            <Link href="/landlord-opportunities" className="btn-primary">
              View Landlord Opportunities →
            </Link>
          </div>
        </div>
      )}

      {/* Supported columns reference */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          📋 Supported Column Names
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          The importer accepts various column naming conventions from Ontario
          datasets. Columns are matched case-insensitively.
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
          {[
            ["address / street_address / full_address", "Street address"],
            ["city / municipality", "City name"],
            ["province", "Province (defaults to ON)"],
            ["postal_code / postalcode / zip", "Postal code"],
            ["parcel_id / pin / roll_number", "Parcel identifier"],
            ["property_type / property_class / use_code", "Property type"],
            ["assessed_value / assessment", "Assessed value ($)"],
            ["year_built", "Year of construction"],
            ["building_size / floor_area", "Building size (sq ft)"],
            ["lot_size / lot_area", "Lot size (sq ft)"],
            ["last_sale_date / sale_date", "Last sale date"],
            ["last_sale_price / sale_price", "Last sale price ($)"],
            ["owner_name / owner", "Owner name"],
            ["transfer_date", "Ownership transfer date"],
            ["document_number / instrument_number", "Registry document #"],
          ].map(([col, desc]) => (
            <div key={col} className="flex gap-2 py-0.5">
              <code className="font-mono text-blue-700 flex-shrink-0">{col.split(" / ")[0]}</code>
              <span className="text-gray-500">— {desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
