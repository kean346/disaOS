# Verification evidence

Validated in the managed cloud instance on 9 November 2026. This reports local development and saved configuration, not deployment or publication.

- Original baseline before editing: production build, 17 existing tests and direct/proxied API smoke checks passed.
- Final automated suite: 19 tests passed, 0 failed, 0 skipped. This includes the original equipment lifecycle, calendar, offline, service-worker, preview and UUID preservation/rollback checks, plus garden recurrence/money tests and the complete persistent API journey.
- Garden API coverage: new client/property creation, finite recurring plans, idempotent scheduling retries, conflict rejection, individual rescheduling, checklists, notes, validated photos, retained service reports, linked invoice reuse, editable invoice lines and VAT, partial/final receipts, duplicate receipt replay, overpayment rejection, quotations and accepted-quote conversion, typed demo reset and protection of records outside demo membership.
- Browser: all 16 checks in browser-results.json passed in Chromium, with no unexpected console or runtime errors. Expected resource errors during the deliberate offline test are recorded separately. Desktop and 390px mobile layouts, no document overflow, reduced motion, scrollbars, empty search, reconnect recovery, required fields, modal Escape/focus restoration, quotation stages, original client creation and all primary routes were exercised.
- The proof-of-service print view was inspected and exported to service-report.pdf. Screenshots cover the overview, weekly planner, mobile completion and printable report.
- TypeScript: node_modules/.bin/tsc --noEmit passed.
- Production: node_modules/.bin/vite build passed.
- Static UI audit: premium-audit.json reports 0 errors, 0 warnings, 0 unresolved owners.
- DESIGN.md lint: 0 errors, 5 advisory orphan-token warnings; this document mirrors runtime CSS ownership rather than generating component styles. Exact output is retained in design-lint.json.
- git diff --check passed. package.json, pnpm-lock.yaml, pnpm-workspace.yaml and LICENSE were not changed.
- The saved startup command bash scripts/start-cloud.sh was executed after stopping the development supervisor started during setup. Both services restarted, schema setup remained repeatable, and the browser journey ran against that restart.
- After testing, the fictional dataset was restored to 30 properties, 3 crews, 6 quotations, 6 invoices and 3 recorded demo receipts. The final local smoke check returned the expected counts and R2,242.50 of recorded demo receipts.

API integration tests use isolated temporary databases. The browser script explicitly resets the fictional local dataset at its start and restores it after success. Do not run that script against real-client data.

Not verified: production hosting, authentication/crew permissions, cross-browser and physical-device testing, multi-user load/concurrency certification or a fresh task restored from a published snapshot. No production deployment or environment publication was performed. See DEVELOPMENT.md for the remaining limitations and deployment requirements.
