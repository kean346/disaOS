# Disa GardenOS interaction contract

Source: user-provided Disa GardenOS master build brief (2026-11-09), existing Hono API, UUID migration and equipment tests. Existing architecture stays Preact/Vite + Hono + SQLite/D1. Concept demonstration, no authentication or role security claim; production exposure requires access control. English en-ZA; date-only schedules interpreted in Africa/Johannesburg, 24-hour times, ZAR. No external charges, messages, or dispatch side effects.

## Canonical UI Map

| Capability      | Canonical owner                        | Source of truth      | Allowed variants                    | Verification             |
| --------------- | -------------------------------------- | -------------------- | ----------------------------------- | ------------------------ |
| Table Selection | garden shared selection state          | this contract        | explicit loaded visits only         | bulk-reschedule test     |
| Select/Listbox  | native select                          | DESIGN.md            | platform popup                      | browser keyboard         |
| Date            | native date/time + garden date utility | this contract        | date-only/time                      | recurrence tests         |
| Form            | GardenForm + Field in garden-ui.tsx    | this contract        | create/edit                         | browser + API validation |
| Scrollbar       | garden.css global baseline             | DESIGN.md            | planner horizontal                  | browser computed style   |
| Toast           | shared Notice live region              | this contract        | success/error                       | browser workflow         |
| CRUD            | existing api.ts and garden API         | existing API + brief | inline stay, create returns to list | integration test         |
| Dialog          | GardenDialog native showModal          | this contract        | confirmation/form                   | Escape/focus/browser     |

## Behavior ledger

Create/edit: labeled form → disabled pending commit → confirmed server result → close and refresh owning list → shared status. Failure retains values and provides inline correction. Search is local only over a complete bounded date-range response or server-paged data; never imply completeness over a truncated response. Filters reset pagination. Native form bubbles are disabled; GardenForm owns validation and first-error focus. Native date/select popup geometry is accepted. Legacy dialogs migrate when touched.

Recurring visits: finite generated horizon, unique plan/occurrence keys; individual moves affect one visit only. Monthly anchors clamp to the last day. Completed records are retained snapshots, with recorded timestamps only. Photo uploads are compressed, validated raster images stored in local D1, never external third-party URLs. Demo reset touches explicit demo membership only and requires confirmation; real records are never reset. Quotes convert once after acceptance. Money rounds to cents; VAT is configurable and demonstration pricing is labeled. Payments are manual recorded receipts, not bank processing; only persisted payments count as collected revenue. No paid transition may invent receipts.

List/detail links remain bookmarkable; browser Back works. Existing source list pagination stays server-owned. New planner uses bounded date window; properties and quotes are paged. No-results, initial loading, refresh, errors, retry and offline-unavailable states remain explicit. Offline mutations are blocked, never silently queued. Bulk actions show exact selected count and require confirmation. Conflicts are reported before committing overlapping visits unless the manager resolves the assignment/time.

## Migration ledger

Original CRUD retained. Shared tokens and shell migrate first; garden screens reuse existing jobs, customers, sites, technicians, invoices and checklists. Equipment/inventory remain available from Services/Settings. MIT license retained. Test existing core plus full garden workflow; document any unverified production capability.

## Browser-only demo override
The user explicitly selected no database. api.ts routes requests to demo/store.ts by default; VITE_USE_BACKEND=true opts into the retained server. Fictional seed data loads immediately and mutations persist in this browser’s localStorage. This is a local concept with no shared synchronization or real financial processing. The shared Field, dialog, toast and native date/select owners remain unchanged.
