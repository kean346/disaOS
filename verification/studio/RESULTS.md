# Browser-only studio demo validation

- TypeScript check passed.
- Vite production build passed.
- Static premium UI audit: zero findings.
- Desktop and 390px mobile screenshots inspected; mobile document has no horizontal overflow.
- Properties renders all 30 fictional properties.
- Overview, properties, schedule, dispatch, crew, quotations, invoices, reports, settings, clients and services render without browser runtime errors.
- Browser request monitoring recorded zero /api network calls across the checked screens.
- An individual visit was rescheduled to 16:30 through the browser adapter; the saved localStorage survived a browser reload.

These checks cover the new browser-only adapter and visual revision. The earlier 19-test backend suite remains separate; the previous full backend workflow results do not establish complete browser-adapter parity. Browser storage is device-local, can be cleared, and has image-storage capacity limits. The retained backend can be enabled explicitly with VITE_USE_BACKEND=true.
