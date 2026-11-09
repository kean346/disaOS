// Run only against an isolated fictional demo workspace; this resets its demo records.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const base = process.env.GARDEN_TEST_URL || "http://localhost:5173";
async function api(method, path, body) {
  const r = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const d = await r.json();
  assert.ok(r.ok, JSON.stringify(d));
  return d;
}
(async () => {
  fs.mkdirSync("verification", { recursive: true });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
  }).format(new Date());
  const mon = new Date(today + "T12:00:00Z");
  mon.setUTCDate(mon.getUTCDate() - ((mon.getUTCDay() + 6) % 7));
  const sun = new Date(mon);
  sun.setUTCDate(sun.getUTCDate() + 6);
  let d = await api(
    "GET",
    `/api/garden/overview?start=${mon.toISOString().slice(0, 10)}&end=${sun.toISOString().slice(0, 10)}`,
  );
  assert.ok(d.demo, "Browser checks require fictional demo data");
  await api("POST", "/api/garden/demo/reset", { confirmation: "RESET DEMO" });
  d = await api("GET", `/api/garden/overview?start=${d.start}&end=${d.end}`);
  const target = d.visits.find(
    (j) => j.suburb === "Wonderboom" && j.status === "scheduled",
  );
  assert.ok(target);
  const crew = d.crews.find((c) => c.id !== target.technician_id && c.active);
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "en-ZA",
    timezoneId: "Africa/Johannesburg",
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const consoleErrors = [];
  let expectedOffline = false;
  page.on("console", (message) => {
    if (message.type() === "error")
      consoleErrors.push({
        message: message.text(),
        expected: expectedOffline,
      });
  });
  const checked = [];
  const mark = (s) => {
    checked.push(s);
    console.log("PASS", s);
  };
  try {
    await page.goto(base);
    await page
      .getByRole("heading", { name: "Operations Overview", exact: true })
      .waitFor();
    await page.screenshot({
      path: "verification/overview-desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    mark("Overview renders database metrics");
    await page
      .getByRole("link", { name: "Weekly Schedule", exact: false })
      .click();
    await page
      .getByRole("heading", { name: "Weekly Schedule", exact: true })
      .waitFor();
    await page
      .getByRole("searchbox", { name: "Search property, client or service…" })
      .fill(target.property_name);
    const slip = page
      .locator("article.visit-slip")
      .filter({ hasText: target.property_name })
      .first();
    await slip.getByRole("button", { name: "Move / assign" }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("New date").fill(d.today);
    await dialog.getByLabel("Arrival time").fill("15:00");
    await dialog.getByLabel("Assigned crew").selectOption(crew.id);
    await dialog
      .getByRole("button", { name: "Save visit", exact: true })
      .click();
    await dialog.waitFor({ state: "hidden" });
    let persisted = await api("GET", "/api/jobs/" + target.id);
    assert.equal(persisted.job.scheduled_date, d.today);
    assert.equal(persisted.job.technician_id, crew.id);
    mark("Calendar rescheduling and crew assignment persist");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base + "/crew/" + target.id);
    await page
      .getByRole("heading", { name: target.property_name, exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Start garden visit" }).click();
    for (const checkbox of await page
      .locator(".field-checklist input[type=checkbox]")
      .all()) {
      await checkbox.waitFor({ state: "visible" });
      await page.waitForFunction(
        () => !document.querySelector(".field-checklist input:disabled"),
      );
      await checkbox.click();
      await page.waitForFunction(
        (el) => el.checked,
        await checkbox.elementHandle(),
      );
    }
    await page
      .getByLabel("Add a note", { exact: true })
      .fill("Demo crew: gate closed and beds cleared.");
    await page.getByRole("button", { name: "Save note", exact: true }).click();
    await page.waitForFunction(
      () => !document.querySelector(".photo-upload input").disabled,
    );
    const image = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 400;
      c.height = 240;
      const x = c.getContext("2d");
      x.fillStyle = "#8FA978";
      x.fillRect(0, 0, 400, 240);
      x.fillStyle = "#183D2D";
      x.font = "22px sans-serif";
      x.fillText("FICTIONAL DEMO PHOTO", 35, 120);
      return c.toDataURL("image/png").split(",")[1];
    });
    await page
      .getByLabel("Choose completion photo", { exact: true })
      .setInputFiles({
        name: "fictional-garden-completion.png",
        mimeType: "image/png",
        buffer: Buffer.from(image, "base64"),
      });
    await page.locator(".photo-grid img").waitFor();
    await page
      .getByLabel("Completion summary")
      .fill("All garden maintenance tasks completed for this fictional demo.");
    await page
      .getByRole("button", { name: "Complete visit & save report" })
      .click();
    await page
      .getByRole("heading", { name: "All done. A garden well cared for." })
      .waitFor();
    await page.reload();
    await page.getByRole("button", { name: "View service report" }).waitFor();
    await page.screenshot({
      path: "verification/crew-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    mark(
      "Mobile checklist, note, compressed photo and permanent completion survive refresh",
    );
    await page.getByRole("button", { name: "Generate linked invoice" }).click();
    await page.waitForURL(/\/invoices\//);
    await page
      .getByRole("button", { name: "Record payment", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Receipt reference").fill("DEMO BROWSER RECEIPT");
    await dialog
      .getByRole("button", { name: "Confirm recorded payment" })
      .click();
    await dialog.waitFor({ state: "hidden" });
    await page
      .locator(".billing-row")
      .filter({ hasText: "DEMO BROWSER RECEIPT" })
      .waitFor();
    mark("Linked invoice and recorded payment persist");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + "/properties/" + target.property_id);
    await page
      .getByRole("heading", { name: target.property_name, exact: true })
      .waitFor();
    await page
      .getByRole("button")
      .filter({ hasText: target.identifier })
      .click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("heading", { name: "Recorded tasks" }).waitFor();
    assert.equal(await dialog.locator(".photo-grid img").count(), 1);
    await page.emulateMedia({ media: "print" });
    assert.ok(await dialog.locator(".service-report").isVisible());
    await page.pdf({
      path: "verification/service-report.pdf",
      format: "A4",
      printBackground: true,
    });
    await page.screenshot({
      path: "verification/service-report-print.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.emulateMedia({ media: "screen" });
    await page.keyboard.press("Escape");
    mark(
      "Property history opens retained proof of service with photo and printable layout",
    );
    const updated = await api(
      "GET",
      `/api/garden/overview?start=${d.start}&end=${d.end}`,
    );
    assert.equal(updated.metrics.completed, d.metrics.completed + 1);
    assert.equal(
      updated.metrics.revenue_cents,
      d.metrics.revenue_cents + Math.round(target.price * 100),
    );
    mark("Overview completion and recorded revenue update from records");
    await page.goto(base + "/properties");
    await page
      .getByRole("button", { name: "Add property", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Save property" }).click();
    assert.ok(await dialog.isVisible());
    assert.equal(await page.locator("[aria-invalid=true]").count(), 1);
    await page.keyboard.press("Escape");
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent.trim()),
      "Add property",
    );
    mark("Required-field error, dialog Escape and trigger focus restoration");
    await page
      .getByRole("searchbox", { name: "Search property or suburb…" })
      .fill("no-such-fictional-property");
    await page
      .getByRole("heading", { name: "No matching properties" })
      .waitFor();
    await page
      .getByRole("button", { name: "Clear search", exact: true })
      .last()
      .click();
    await page.locator(".property-card").first().waitFor();
    mark("Empty search and clear recovery");
    await page.goto(base + "/schedule");
    await page
      .getByRole("heading", { name: "Weekly Schedule", exact: true })
      .waitFor();
    await page.screenshot({
      path: "verification/schedule-desktop.png",
      fullPage: true,
      animations: "disabled",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base);
    await page
      .getByRole("heading", { name: "Operations Overview", exact: true })
      .waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: "verification/overview-mobile.png",
      fullPage: true,
      animations: "disabled",
    });
    mark("Overview narrow layout has no document overflow");
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(
        () =>
          getComputedStyle(document.querySelector(".garden-page"))
            .animationName,
      ),
      "none",
    );
    mark("Reduced motion respected");
    const scrollbar = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarColor,
    );
    assert.notEqual(scrollbar, "auto");
    mark("Global scrollbar tokens applied");
    expectedOffline = true;
    await context.setOffline(true);
    await page.getByRole("link", { name: "Quotations", exact: true }).click();
    await page
      .getByRole("heading", { name: "Unable to load garden data" })
      .waitFor();
    await context.setOffline(false);
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await page
      .getByRole("heading", { name: "Quotations & enquiries" })
      .waitFor();
    expectedOffline = false;
    mark("Offline error and reconnect retry recover");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole("button", { name: "New quotation / enquiry" }).click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Property", { exact: true })
      .selectOption(target.property_id);
    await dialog.getByLabel("Requested service").fill("Browser seasonal care");
    await dialog.getByLabel("Quantity", { exact: true }).fill("2");
    await dialog.getByLabel("Unit price (R)", { exact: true }).fill("125.25");
    await dialog.getByLabel("Discount (R)", { exact: true }).fill("10");
    await dialog.getByRole("button", { name: "Save quotation" }).click();
    await dialog.waitFor({ state: "hidden" });
    let row = page
      .locator("tbody tr")
      .filter({ hasText: "Browser seasonal care" });
    await row.getByRole("button", { name: "Prepare quote" }).click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "Record prepared", exact: true })
      .click();
    await dialog.waitFor({ state: "hidden" });
    await row.getByRole("button", { name: "Mark as sent" }).click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "Record sent", exact: true })
      .click();
    await dialog.waitFor({ state: "hidden" });
    await row.getByRole("button", { name: "Record acceptance" }).click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "Record accepted", exact: true })
      .click();
    await dialog.waitFor({ state: "hidden" });
    const quoted = await api(
      "GET",
      `/api/garden/overview?start=${d.start}&end=${d.end}`,
    );
    assert.equal(
      quoted.quotes.find((q) => q.requested_service === "Browser seasonal care")
        .total_cents,
      27658,
    );
    await row.getByRole("button", { name: "Schedule visits" }).click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByRole("button", { name: "Schedule visits", exact: true })
      .click();
    await dialog.waitFor({ state: "hidden" });
    await row.getByRole("button", { name: "Visits created" }).waitFor();
    mark(
      "Quotation builder, VAT total, stage confirmations and accepted-quote scheduling",
    );
    await page.goto(base + "/customers");
    await page
      .getByRole("button", { name: "New Customer", exact: true })
      .click();
    dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Name *", { exact: true })
      .fill("Browser Fictional Client");
    await dialog
      .getByLabel("Email", { exact: true })
      .fill("browser@example.com");
    await dialog
      .getByRole("button", { name: "Create Customer", exact: true })
      .click();
    await dialog.waitFor({ state: "hidden" });
    await page
      .getByRole("button", { name: "Browser Fictional Client", exact: true })
      .waitFor();
    mark("Original client creation preserved with shared accessible dialog");
    for (const route of [
      "/dispatch",
      "/crew",
      "/properties",
      "/quotes",
      "/invoices",
      "/reports",
      "/services",
      "/settings",
      "/technicians",
      "/materials",
    ]) {
      await page.goto(base + route);
      await page.locator("main h1").waitFor();
      assert.equal(
        await page
          .getByRole("heading", { name: "Unable to load garden data" })
          .count(),
        0,
      );
    }
    mark("All office and field routes render after shared-shell migration");
    assert.deepEqual(errors, []);
    assert.deepEqual(
      consoleErrors.filter((e) => !e.expected),
      [],
    );
    mark("No browser runtime errors");
    fs.writeFileSync(
      "verification/browser-results.json",
      JSON.stringify(
        { passed: checked.length, checks: checked, errors, consoleErrors },
        null,
        2,
      ),
    );
    await api("POST", "/api/garden/demo/reset", { confirmation: "RESET DEMO" });
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
