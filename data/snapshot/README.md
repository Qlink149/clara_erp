# Data snapshot — Clara ERP

A point-in-time JSON export of every table in the app, so the data travels with the code.

- Exported: 2026-11-21T08:14:38.076Z
- Tables: 31
- Total records: 617

## Files
- `<EntityName>.json` — one file per table, an array of raw records (all fields, including `id`, `created_date`, `updated_date`, `created_by_id`).
- `manifest.json` — export timestamp and record count per table.

## Re-importing
- Per table: open the app dashboard → Data → the table → Import (CSV). Convert the JSON to CSV first, or
- From code: `await base44.entities.Client.bulkCreate(records)` with the array from the matching JSON file.

Schema definitions live in `base44/entities/*.jsonc`, so table structure travels with the code already.
Uploaded files (document URLs, images) are stored separately in file storage and are not part of this snapshot — the records still hold their URLs.
