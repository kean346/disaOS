import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { once } from "node:events";
import { occurrences, quoteTotals } from "../src/server/garden-domain.ts";
const require = createRequire(import.meta.url),
  wrangler = require.resolve("wrangler/bin/wrangler.js");
const directory = mkdtempSync(join(tmpdir(), "garden-integration-"));
const env = { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "true" };
let base,
  server,
  logs = "";
async function api(method, path, body, status = 200) {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json();
  assert.equal(r.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}
before(async () => {
  execFileSync(process.execPath, ["scripts/setup-db.mjs", directory], {
    env,
    stdio: "pipe",
  });
  const socket = createServer().listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((r) => socket.close(r));
  base = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [
      wrangler,
      "dev",
      "--local",
      "--port",
      String(port),
      "--persist-to",
      directory,
      "--inspector-port",
      "0",
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (d) => (logs += d));
  server.stderr.on("data", (d) => (logs += d));
  for (let i = 0; i < 160; i++) {
    try {
      const r = await fetch(base + "/api/stats");
      if (r.ok) return;
    } catch {}
    if (server.exitCode !== null) throw new Error(logs);
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(logs);
});
after(async () => {
  if (server && server.exitCode === null) {
    const done = once(server, "exit");
    server.kill();
    await done;
  }
  rmSync(directory, { recursive: true, force: true });
});
test("monthly anchors, fortnightly dates and quote money round in cents", () => {
  assert.deepEqual(occurrences("2028-01-31", "monthly", 3), [
    "2028-01-31",
    "2028-02-29",
    "2028-03-31",
  ]);
  assert.deepEqual(occurrences("2026-12-25", "fortnightly", 2), [
    "2026-12-25",
    "2027-01-08",
  ]);
  assert.deepEqual(quoteTotals([{ quantity: 3, unit_price: 0.1 }], 0, 15), {
    subtotal_cents: 30,
    tax_cents: 5,
    total_cents: 35,
  });
});
test("persistent garden journey, receipts, quote conversion, recurrence, validation and safe reset", async (t) => {
  const overview = () =>
    api("GET", "/api/garden/overview?start=2026-11-09&end=2026-11-15");
  await api("POST", "/api/garden/demo", {}, 201);
  await api("POST", "/api/garden/demo", {}, 409);
  const d = await overview();
  assert.equal(d.properties_total, 30);
  assert.equal(d.crews.length, 3);
  assert.equal(d.metrics.revenue_cents, 224250);
  const client = await api(
    "POST",
    "/api/customers",
    { name: "Fictional new client", email: "fictional@example.com" },
    201,
  );
  const newProperty = await api(
    "POST",
    "/api/garden/properties",
    {
      customer_id: client.id,
      name: "Fictional new garden",
      suburb: "Annlin",
      requirements: "Lawn and pruning",
      instructions: "Close the gate",
    },
    201,
  );
  assert.equal(
    (await api("GET", "/api/garden/properties/" + newProperty.id)).property
      .customer_id,
    client.id,
  );
  const property = d.properties.find((p) => p.suburb === "Wonderboom");
  const payload = {
    request_key: crypto.randomUUID(),
    property_id: property.id,
    technician_id: d.crews[0].id,
    service_type_id: d.services[0].id,
    scheduled_date: "2027-02-01",
    scheduled_time: "09:00",
    duration: 60,
    price: 700,
    frequency: "weekly",
    count: 3,
    notes: "Integration garden visit",
  };
  const result = await api("POST", "/api/garden/visits", payload, 201);
  assert.equal(result.ids.length, 3);
  const replay = await api("POST", "/api/garden/visits", payload, 201);
  assert.deepEqual(replay.ids, result.ids);
  await api("POST", "/api/garden/visits", { ...payload, price: 701 }, 409);
  const conflicting = { ...payload };
  delete conflicting.request_key;
  await api("POST", "/api/garden/visits", conflicting, 409);
  const jobId = result.ids[0];
  await api("POST", "/api/garden/reschedule", {
    ids: [jobId],
    date: "2026-11-09",
    time: "15:00",
    technician_id: d.crews[1].id,
  });
  const other = (await api("GET", "/api/jobs/" + result.ids[1])).job;
  assert.equal(other.scheduled_date, "2027-02-08");
  await api("PUT", "/api/jobs/" + jobId, { status: "in_progress" });
  const job = (await api("GET", "/api/jobs/" + jobId)).job;
  assert.equal(job.checklist.length, 6);
  for (const item of job.checklist)
    await api("PUT", "/api/checklist/" + item.id);
  await api(
    "POST",
    `/api/jobs/${jobId}/notes`,
    { content: "Gate closed. Beds cleared." },
    201,
  );
  const photo =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aTT0AAAAASUVORK5CYII=";
  await api(
    "POST",
    `/api/garden/visits/${jobId}/photos`,
    { name: "completion.png", data: photo },
    201,
  );
  await api(
    "POST",
    `/api/garden/visits/${jobId}/photos`,
    { name: "bad.png", data: "data:image/png;base64,aGVsbG8=" },
    400,
  );
  const before = await overview();
  await api("PUT", "/api/jobs/" + jobId, {
    status: "completed",
    completion_notes: "All garden tasks complete.",
  });
  const after = await overview();
  assert.equal(after.metrics.completed, before.metrics.completed + 1);
  const persisted = await api("GET", `/api/garden/visits/${jobId}`);
  assert.equal(persisted.photos.length, 1);
  const snap = JSON.parse(persisted.record.snapshot);
  assert.equal(snap.tasks.filter((t) => t.checked).length, 6);
  assert.equal(snap.photos.length, 1);
  assert.equal(snap.notes, "All garden tasks complete.");
  assert.equal(snap.property, property.name);
  await api(
    "POST",
    `/api/garden/visits/${jobId}/photos`,
    { name: "late.png", data: photo },
    400,
  );
  const history = await api("GET", `/api/garden/properties/${property.id}`);
  assert.ok(history.records.some((r) => r.job_id === jobId));
  const invoiceResult = await api(
    "POST",
    `/api/jobs/${jobId}/invoice`,
    undefined,
    201,
  );
  const duplicate = await api(
    "POST",
    `/api/jobs/${jobId}/invoice`,
    undefined,
    201,
  );
  assert.equal(duplicate.invoice_id, invoiceResult.invoice_id);
  const invoiceId = invoiceResult.invoice_id;
  await api("PUT", `/api/garden/invoices/${invoiceId}/lines`, {
    lines: [
      { description: "Maintenance", quantity: 1, unit_price: 700 },
      { description: "Compost", quantity: 2, unit_price: 50 },
    ],
    tax_rate: 15,
  });
  const inv = (await api("GET", `/api/invoices/${invoiceId}`)).invoice;
  assert.equal(inv.total, 920);
  assert.equal(inv.tax_amount, 120);
  await api("PUT", `/api/invoices/${invoiceId}`, { status: "paid" }, 409);
  const receipt = {
    id: crypto.randomUUID(),
    amount: 300,
    reference: "DEMO PARTIAL",
  };
  await api("POST", `/api/garden/invoices/${invoiceId}/payments`, receipt, 201);
  await api("POST", `/api/garden/invoices/${invoiceId}/payments`, receipt);
  await api(
    "POST",
    `/api/garden/invoices/${invoiceId}/payments`,
    { id: crypto.randomUUID(), amount: 621, reference: "Too much" },
    409,
  );
  await api(
    "POST",
    `/api/garden/invoices/${invoiceId}/payments`,
    { id: crypto.randomUUID(), amount: 620, reference: "DEMO FINAL" },
    201,
  );
  assert.equal(
    (await api("GET", `/api/invoices/${invoiceId}`)).invoice.status,
    "paid",
  );
  assert.equal((await overview()).metrics.revenue_cents, 224250 + 92000);
  await api(
    "PUT",
    `/api/garden/invoices/${invoiceId}/lines`,
    {
      lines: [{ description: "Changed", quantity: 1, unit_price: 1 }],
      tax_rate: 0,
    },
    409,
  );
  const q = await api(
    "POST",
    "/api/garden/quotes",
    {
      property_id: property.id,
      requested_service: "New garden plan",
      lines: [{ description: "Care", quantity: 2, unit_price: 100.1 }],
      discount: 10,
      tax_rate: 15,
    },
    201,
  );
  assert.equal(q.total_cents, 21873);
  await api(
    "PUT",
    `/api/garden/quotes/${q.id}/status`,
    { status: "accepted" },
    409,
  );
  await api("PUT", `/api/garden/quotes/${q.id}/status`, { status: "sent" });
  await api("PUT", `/api/garden/quotes/${q.id}/status`, { status: "accepted" });
  const conversion = {
    ...payload,
    scheduled_date: "2028-01-31",
    frequency: "monthly",
    technician_id: null,
    count: 3,
  };
  delete conversion.property_id;
  delete conversion.price;
  const converted = await api(
    "POST",
    `/api/garden/quotes/${q.id}/convert`,
    conversion,
    201,
  );
  assert.equal(converted.ids.length, 3);
  await api("POST", `/api/garden/quotes/${q.id}/convert`, conversion, 409);
  await api(
    "POST",
    "/api/garden/reschedule",
    { ids: [jobId], date: "2026-11-10", time: "15:00", technician_id: null },
    400,
  );
  await api("POST", "/api/garden/demo/reset", { confirmation: "wrong" }, 400);
  await api("POST", "/api/garden/demo/reset", { confirmation: "RESET DEMO" });
  const reset = await overview();
  assert.equal(reset.properties_total, 30);
  assert.equal(reset.metrics.revenue_cents, 224250);
  assert.ok(!reset.visits.some((j) => j.id === jobId));
  const outsider = await api(
    "POST",
    "/api/customers",
    { name: "Preserve outside demo" },
    201,
  );
  execFileSync(
    process.execPath,
    [
      wrangler,
      "d1",
      "execute",
      "open-fieldservice-db",
      "--local",
      "--persist-to",
      directory,
      "--command",
      `DELETE FROM garden_demo_members WHERE entity='customers' AND record_id='${outsider.id}'`,
    ],
    { env, stdio: "pipe" },
  );
  await api(
    "POST",
    "/api/garden/demo/reset",
    { confirmation: "RESET DEMO" },
    409,
  );
  assert.equal(
    (await api("GET", "/api/customers/" + outsider.id)).customer.name,
    "Preserve outside demo",
  );
  assert.equal((await overview()).properties_total, 30);
});
