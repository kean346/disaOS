# Disa GardenOS

An independent paceIT concept for Disa Tuine, built directly on the imported OpenFieldService application. All supplied customers, addresses, prices, visits and receipts are fictional. Required upstream MIT attribution remains in LICENSE. The locally hosted Plus Jakarta Sans font includes its OFL licence in public/fonts/OFL.txt.

## Run locally in this cloud environment

Use the existing /workspace/disaOS checkout; do not create a worktree unless explicitly requested. Node 24.22.1 and pnpm 11.25.0 were validated. Node 24 is recommended for the TypeScript domain tests and built-in SQLite tests.

```bash
cd /workspace/disaOS
pnpm install --frozen-lockfile --store-dir /workspace/.pnpm-store
bash scripts/start-cloud.sh
```

The startup script sets a writable Wrangler configuration directory, disables telemetry, applies the additive schema and starts Vite plus local Wrangler/D1. The UI uses port 5173; the API uses 8787 through Vite's /api proxy. Local records persist in .wrangler/state. No Cloudflare credentials are required for local development. Cloud onboarding does not provide user-facing loopback preview links.

pnpm 11's automatic script dependency check tries to write into an unavailable home directory in this image. Use the direct commands below; dependency installation uses the explicit writable store. Do not disable TLS or package verification.

## Validation

```bash
export XDG_CONFIG_HOME=/workspace/.config WRANGLER_SEND_METRICS=false CI=true
node --test tests/*.test.mjs
node_modules/.bin/tsc --noEmit
node_modules/.bin/vite build
node scripts/verify-garden-browser.cjs
```

The browser command requires Playwright and Chromium, already available in this environment. It deliberately resets the fictional dataset and must only run in an isolated demo workspace. CHROMIUM_PATH and GARDEN_TEST_URL can select another installed Chromium and local test server. Automated API tests create and remove separate temporary databases, never use a remote database, and cover original equipment behavior alongside the new garden flows.

Verification evidence is in verification/: desktop/mobile overview, scheduler, mobile completion, printable report, PDF and browser check results. The premium UI audit and design token lint are additional static checks; they do not replace the running app tests.

## Audit and architecture

The baseline build, original 17 tests, UI server and real local D1 API were verified before implementation. Preact, TypeScript, Vite, Hono, the SQLite/D1 binding, UUIDs, route identifiers, offline field reads, equipment lifecycle, inventory and original CRUD remain. No Next.js or separate application was introduced.

The old recurrence fields stored intent without generating occurrences. GardenOS adds finite weekly, fortnightly, monthly and custom-interval plans with separate job records. Monthly anchors clamp to the month's final day. Unique plan/occurrence keys and persisted request keys prevent duplicate retries; generated visits remain independently reschedulable. The planner offers day/week/month summary, search, crew/suburb/date filters, explicit move controls, optional drag-and-drop, conflict indications, and a confirmed rain rescheduling flow. Bulk rain moves leave visits unassigned until individually allocated to prevent overlapping crew slots.

## Data changes and migration

src/server/schema.sql adds garden_properties, garden_plans, garden_visits, garden_photos, garden_records, garden_quotes, garden_payments, garden_demo_members and garden_requests. Existing job/customer/crew/service/invoice/checklist tables remain the working records. Links use UUIDs and foreign keys. There are no destructive table replacements in ordinary setup.

Run node scripts/setup-db.mjs to add the schema to an existing UUID database. The existing integer-to-UUID migration remains explicit: stop the application, back up .wrangler/state and run node scripts/setup-db.mjs --migrate-uuids. The migration builder now knows the additional tables and relationships; preservation and rollback tests remain enabled. Custom schemas still require explicit inspection, not a database reset.

Completion triggers capture the property, customer, crew, date, tasks, recorded notes, compressed photographs and actual recording timestamp. Snapshot records remain unchanged if the source job is later edited; completed garden jobs cannot be deleted through the original cascade. Reports are visible in property history and printable. No customer signature or GPS verification is invented.

Photos are raster-only, signature-checked and compressed in the browser before saving to D1. Each visit allows six images, up to 500 KB each after compression (15 MB original picker limit). Photos must be added before completion. This bounded local-demo storage is not a production media-storage strategy.

## Connected operational workflow

Overview → schedule → move an individual Wonderboom visit and select another crew → Crew View → start visit → check tasks → add notes/photo → complete → property history/service report → linked invoice → record a demo receipt → updated overview/reports. All actions persist through the real API and survive refreshes. Refresh/revisit retrieves updates; there is no claim of real-time synchronization.

Enquiries preserve property/client, requested service, consultation stage, follow-up and notes. Quotes include lines, quantities, unit prices, discounts, VAT and validity; stages are enquiry → prepared → sent → accepted/declined. Marking a stage records an office action and sends no message. Accepted quotes convert once into visits or a finite recurring plan; for recurring plans the quoted subtotal applies per occurrence. Linked invoice generation reuses an existing invoice and carries the quote's VAT into billing.

Amounts round in cents. Invoices support editable unpaid lines/VAT, manual receipt references, partial payments and outstanding balances. Receipt IDs make retries idempotent, overpayments are rejected, and only persisted receipts count as collected revenue. Marking work complete or attempting a paid status does not invent a payment. No card charge, bank transfer or external payment processing takes place.

## Demonstration data and reset

Overview can load three fictional crews, 30 properties, 60 visits, sample enquiries/quotes, six invoices and three demo receipts only into an empty client/job workspace. Weekly and fortnightly visits are based on the current Johannesburg week. The prepared environment contains this fictional dataset.

New records in an active demo workspace are explicitly tracked as demo records. Use Settings → Reset fictional demo and type RESET DEMO to replace that dataset. Reset deletes only registered demo membership; non-demo client records stop reset before deletion. Records outside membership remain protected by foreign-key constraints. Never import real client information into the demo workspace.

## Design and references

DESIGN.md records the forest/pine navigation, ivory workspace, sage/lime accents, local Jakarta typography, borders, density, motion and runtime token ownership. UX-CONTRACT.md records shared controls, modal behavior, feedback, locale and workflow consistency. The crew-by-day calendar with compact visit slips is the signature composition. Existing dialogs and destructive actions use shared modal and confirmation behavior.

Landscape Pro by Octet Design was the requested visual reference and MHDev's trades demo the workflow reference. Both URLs returned network-policy denials during setup. The implementation follows the user's supplied design/operational principles; it does not claim direct visual inspection, copy proprietary images or reuse their code.

## Changed areas

- Shell/routing: app.tsx, sidebar.tsx, use-router.ts, types.ts, main.tsx and index.html.
- Shared visual system: tokens.css, garden.css, garden-ui.tsx, DESIGN.md, UX-CONTRACT.md and premium-ui.json.
- Office/field screens: garden-operations.tsx, garden-records.tsx, garden-finance.tsx and garden-forms.tsx.
- Existing components/hooks: shared dialogs, labeled client forms, keyboard-accessible table links, delete confirmations, ZAR display, garden-property links and refreshed app data.
- Data layer: server/garden.ts, garden-domain.ts, index.ts, schema.sql and scripts/uuid-migration.mjs.
- Validation/startup: tests/garden.test.mjs, updated equipment/migration expectations, verify-garden-browser.cjs and start-cloud.sh.

## Deployment and known limits

This is a working local concept, not a production security boundary. There is no authentication, office/crew authorization, tenant separation, payment gateway, live weather, route optimization, background recurrence worker or customer messaging. Existing offline support preserves selected field reads; garden mutations require connectivity and are not queued.

New atomic garden operations require a real D1 binding. Choose persistent D1 on a compatible Worker deployment, or deliberately adapt the data layer for a persistent Node/SQLite host. Do not place a local SQLite database on ephemeral hosting and assume it survives. Backups, access controls, object storage for photos, monitoring, privacy/retention policy and production data migration review are required before real-client use. Deployment and publication have not been performed.

The planner bounds a request to 93 days and 2,000 visits. Properties/quotations/invoices use 50-record pages; property visit history is capped at its latest 200 visits, retained reports at 100, and linked billing/history panels at 50. These visible bounded views are appropriate for the local concept, not an unlimited reporting export. Reports label all-time financial/quotation metrics separately from date-filtered visits. Physical-device touch, assistive-technology certification, cross-browser and multi-user load testing remain outside this local validation.
