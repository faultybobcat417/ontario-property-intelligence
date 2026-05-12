# Ontario Property Intelligence Platform


🎥 [Watch demo walkthrough](demo-walkthrough.mov)
A Next.js 14 + Supabase property intelligence system that stores Ontario property data and identifies potential landlord-owned properties using publicly available property datasets.

> **Privacy note:** This system works exclusively with property-level data. No personal contact information is scraped, stored, or displayed.

---

## Features

- **Property Database** — Supabase-backed storage for Ontario property records (address, assessment, sale history, etc.)
- **Ownership History** — Tracks ownership transfers linked to each property
- **Data Importer** — Parses CSV/JSON property datasets, normalizes fields, and bulk-inserts into Supabase
- **Landlord Detection** — Three-rule algorithm flags potential landlord properties:
  1. Multi-unit property types (Duplex, Triplex, Fourplex, Apartment Building, Mixed Use)
  2. Same owner appears in 2+ ownership records across different properties
  3. Property held for more than 10 years (last sale date > 10 years ago)
- **Opportunities Dashboard** — `/landlord-opportunities` page with filters by city, property type, and assessed value range
- **REST API** — JSON endpoints for properties, landlord opportunities, and data import

---

## Project Structure

```
.
├── app/
│   ├── layout.tsx                        # Root layout with nav
│   ├── page.tsx                          # Home dashboard
│   ├── landlord-opportunities/
│   │   └── page.tsx                      # Landlord opportunities dashboard
│   ├── import/
│   │   └── page.tsx                      # Data import UI
│   └── api/
│       ├── properties/route.ts           # GET /api/properties
│       ├── properties/[id]/route.ts      # GET /api/properties/:id
│       ├── landlord-opportunities/route.ts # GET /api/landlord-opportunities
│       └── import/route.ts              # POST /api/import
│
├── components/
│   ├── PropertyFilters.tsx               # Filter bar (city, type, value range)
│   ├── PropertiesTable.tsx               # Paginated property table
│   ├── StatCard.tsx                      # Metric display card
│   └── LandlordOpportunitiesClient.tsx   # Client pagination wrapper
│
├── services/
│   └── propertyDataImporter/
│       ├── index.ts                      # Main importer orchestrator
│       ├── parser.ts                     # CSV/JSON file parser
│       ├── normalizer.ts                 # Field normalization
│       └── types.ts                      # Importer-specific types
│
├── utils/
│   └── propertyAnalytics/
│       └── index.ts                      # Landlord detection algorithms + stats
│
├── lib/
│   └── supabase/
│       ├── client.ts                     # Browser Supabase client
│       └── server.ts                     # Server + admin Supabase clients
│
├── types/
│   └── database.ts                       # TypeScript types for DB schema
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_properties.sql
│   │   ├── 002_create_ownership_records.sql
│   │   └── 003_landlord_flag_function.sql
│   └── seed.sql                          # Sample Ontario property data
│
└── data/
    └── sample_ontario_properties.csv     # 20-row sample dataset for testing
```

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Apply database migrations

In the Supabase SQL Editor, run the migrations in order:

1. `supabase/migrations/001_create_properties.sql`
2. `supabase/migrations/002_create_ownership_records.sql`
3. `supabase/migrations/003_landlord_flag_function.sql`

Optionally, run `supabase/seed.sql` to populate 10 sample Ontario properties.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Importing Property Data

### Via the UI

1. Navigate to `/import`
2. Download the CSV template
3. Fill in your property data
4. Upload the file — the system will parse, normalize, insert, and flag automatically

### Via the API

```bash
curl -X POST http://localhost:3000/api/import \
  -F "file=@data/sample_ontario_properties.csv"
```

### Supported CSV/JSON column names

| Canonical field | Accepted column names |
|---|---|
| address | `address`, `street_address`, `full_address` |
| city | `city`, `municipality` |
| postal_code | `postal_code`, `postalcode`, `zip` |
| parcel_id | `parcel_id`, `pin`, `roll_number` |
| property_type | `property_type`, `property_class`, `use_code` |
| assessed_value | `assessed_value`, `assessment` |
| year_built | `year_built` |
| building_size | `building_size`, `floor_area` |
| lot_size | `lot_size`, `lot_area` |
| last_sale_date | `last_sale_date`, `sale_date` |
| last_sale_price | `last_sale_price`, `sale_price` |
| owner_name | `owner_name`, `owner` |
| transfer_date | `transfer_date` |
| document_number | `document_number`, `instrument_number` |

MPAC use codes (301–600) are automatically mapped to canonical property types.

---

## API Reference

### `GET /api/properties`

Returns paginated properties with optional filters.

| Param | Description |
|---|---|
| `city` | Filter by city (partial match) |
| `property_type` | Filter by exact property type |
| `min_value` | Minimum assessed value |
| `max_value` | Maximum assessed value |
| `landlord_only` | `true` to return only flagged properties |
| `page` | Page number (default: 1) |
| `per_page` | Results per page (default: 20, max: 100) |

### `GET /api/properties/:id`

Returns a single property with full ownership history.

### `GET /api/landlord-opportunities`

Returns only flagged properties with filter options and pagination.

### `POST /api/import`

Accepts `multipart/form-data` with a `file` field (CSV or JSON).

Returns:
```json
{
  "result": {
    "propertiesInserted": 18,
    "propertiesSkipped": 2,
    "ownershipRecordsInserted": 18,
    "errors": []
  }
}
```

---

## Future Extensions

The system is structured to integrate additional Ontario datasets:

- **Property Permits** — flag properties with recent renovation/conversion permits
- **Zoning Changes** — identify properties rezoned for higher density
- **Rental Listings** — cross-reference active rental listings to confirm landlord status
- **Building Inspections** — flag properties with multiple unit inspection records
- **Tax Assessment History** — track assessment trends over time

To add a new dataset, create a new normalizer in `services/propertyDataImporter/` and extend the `RawPropertyRecord` interface in `services/propertyDataImporter/types.ts`.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **CSV Parsing:** PapaParse
- **Date Utilities:** date-fns
- **Language:** TypeScript
