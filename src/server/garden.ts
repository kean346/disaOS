import { OpenAPIHono, z } from "@clawnify/app";
import type { DBEnv } from "@clawnify/db";
import { get, query } from "./db";
import { occurrences, quoteTotals, money } from "./garden-domain";

export const gardenApp = new OpenAPIHono<{ Bindings: DBEnv }>();
const uuid = z.string().uuid();
const date = z.string().date();
const txt = z.string().trim().max(5000);
const property = z
  .object({
    customer_id: uuid,
    name: txt.min(1),
    suburb: txt.min(1),
    property_type: txt.default("Residential"),
    address: txt.default(""),
    requirements: txt.default(""),
    instructions: txt.default(""),
    frequency: z
      .enum(["once", "weekly", "fortnightly", "monthly"])
      .default("weekly"),
    technician_id: uuid.nullable().default(null),
  })
  .strict();
const visit = z
  .object({
    request_key: uuid.optional(),
    property_id: uuid,
    technician_id: uuid.nullable(),
    service_type_id: uuid.nullable(),
    scheduled_date: date,
    scheduled_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    duration: z.number().int().min(15).max(720),
    price: z.number().min(0).max(1000000),
    frequency: z
      .enum(["once", "weekly", "fortnightly", "monthly", "10", "21"])
      .default("once"),
    count: z.number().int().min(1).max(52).default(1),
    notes: txt.default(""),
  })
  .strict();
const quote = z
  .object({
    property_id: uuid,
    requested_service: txt.min(1),
    consultation_status: txt.default("Not booked"),
    follow_up: z.union([date, z.literal("")]).default(""),
    status: z
      .enum(["enquiry", "prepared", "sent", "accepted", "declined"])
      .default("prepared"),
    lines: z
      .array(
        z.object({
          description: txt.min(1),
          quantity: z.number().positive().max(1000),
          unit_price: z.number().min(0).max(1000000),
        }),
      )
      .min(1)
      .max(30),
    discount: z.number().min(0).max(1000000).default(0),
    tax_rate: z.number().min(0).max(100).default(15),
    notes: txt.default(""),
    valid_until: z.union([date, z.literal("")]).default(""),
  })
  .strict();
class DomainError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
type Row = Record<string, any>;
// New multi-record writes require D1's atomic batch rather than partial sequential writes.
function db(c: any) {
  if (!c.env.DB)
    throw new DomainError(
      "Garden operations require the configured D1 binding.",
      503,
    );
  return c.env.DB;
}
const stmt = (c: any, sql: string, args: unknown[] = []) =>
  db(c)
    .prepare(sql)
    .bind(...args);
const batch = (c: any, items: any[]) => db(c).batch(items);
async function body(c: any, schema: any) {
  const parsed = schema.safeParse(await c.req.json());
  if (!parsed.success)
    throw new DomainError(
      parsed.error.issues
        .map((i: any) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    );
  return parsed.data;
}
async function found(table: string, id: string) {
  if (!uuid.safeParse(id).success) throw new DomainError("Invalid record ID");
  const row = await get<Row>(`SELECT * FROM ${table} WHERE id=?`, [id]);
  if (!row) throw new DomainError("Record not found", 404);
  return row;
}
const selectVisits = `SELECT j.*,v.property_id,v.plan_id,COALESCE(p.name,c.name) property_name,COALESCE(p.suburb,c.city) suburb,p.instructions,p.requirements,c.name customer_name,t.name technician_name,t.color technician_color,s.name service_type_name FROM jobs j LEFT JOIN garden_visits v ON v.job_id=j.id LEFT JOIN garden_properties p ON p.id=v.property_id JOIN customers c ON c.id=j.customer_id LEFT JOIN technicians t ON t.id=j.technician_id LEFT JOIN service_types s ON s.id=j.service_type_id`;
gardenApp.onError((err, c) => {
  if (err instanceof DomainError)
    return c.json({ error: err.message }, err.status as any);
  if (/constraint|Payment exceeds|Completed garden/.test(err.message))
    return c.json(
      {
        error:
          "This action conflicts with an existing record or outstanding balance. Refresh and try again.",
      },
      409,
    );
  console.error(err);
  return c.json(
    { error: "Garden data could not be saved. Please retry." },
    500,
  );
});

async function visitStatements(
  c: any,
  data: z.infer<typeof visit>,
  quoteId: string | null = null,
) {
  const p = await found("garden_properties", data.property_id);
  if (data.technician_id) {
    const t = await found("technicians", data.technician_id);
    if (!t.active) throw new DomainError("Choose an available crew");
  }
  if (data.service_type_id) await found("service_types", data.service_type_id);
  const plan = data.frequency !== "once" ? crypto.randomUUID() : null;
  const dates = occurrences(
    data.scheduled_date,
    data.frequency,
    data.frequency === "once" ? 1 : data.count,
  );
  const ids = dates.map(() => crypto.randomUUID());
  const statements: any[] = [];
  if (plan)
    statements.push(
      stmt(
        c,
        "INSERT INTO garden_plans(id,property_id,frequency,start_date,occurrences) VALUES(?,?,?,?,?)",
        [plan, p.id, data.frequency, data.scheduled_date, dates.length],
      ),
    );
  for (let i = 0; i < dates.length; i++) {
    const conflicts = data.technician_id
      ? await query<Row>(
          `SELECT identifier FROM jobs WHERE technician_id=? AND scheduled_date=? AND status NOT IN ('completed','cancelled') AND (CAST(substr(scheduled_time,1,2) AS INTEGER)*60+CAST(substr(scheduled_time,4,2) AS INTEGER)) < ? AND (CAST(substr(scheduled_time,1,2) AS INTEGER)*60+CAST(substr(scheduled_time,4,2) AS INTEGER)+duration) > ?`,
          [
            data.technician_id,
            dates[i],
            minutes(data.scheduled_time) + data.duration,
            minutes(data.scheduled_time),
          ],
        )
      : [];
    if (conflicts.length)
      throw new DomainError(
        `Crew conflict on ${dates[i]} with ${conflicts[0].identifier}`,
        409,
      );
    statements.push(
      stmt(
        c,
        `INSERT INTO jobs(id,identifier,customer_id,technician_id,service_type_id,scheduled_date,scheduled_time,duration,price,address,notes,is_recurring,recurrence_interval) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          ids[i],
          "VIS-" + ids[i].slice(0, 8).toUpperCase(),
          p.customer_id,
          data.technician_id,
          data.service_type_id,
          dates[i],
          data.scheduled_time,
          data.duration,
          data.price,
          p.address,
          data.notes,
          plan ? 1 : 0,
          data.frequency,
        ],
      ),
    );
    statements.push(
      stmt(
        c,
        "INSERT INTO garden_visits(job_id,property_id,plan_id,occurrence_date,quote_id) VALUES(?,?,?,?,?)",
        [ids[i], p.id, plan, dates[i], i === 0 ? quoteId : null],
      ),
    );
    for (const [n, label] of [
      "Lawn mowing",
      "Edge trimming",
      "Flower-bed maintenance",
      "Pruning",
      "Debris removal",
      "Final inspection",
    ].entries())
      statements.push(
        stmt(
          c,
          "INSERT INTO job_checklist(job_id,label,sort_order) VALUES(?,?,?)",
          [ids[i], label, n],
        ),
      );
  }
  return { statements, ids, plan };
}
function minutes(time: string) {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
}

gardenApp.get("/api/garden/overview", async (c) => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
  }).format(new Date());
  const start = c.req.query("start") || today,
    end = c.req.query("end") || today;
  if (
    !date.safeParse(start).success ||
    !date.safeParse(end).success ||
    end < start ||
    (+new Date(end) - +new Date(start)) / 86400000 > 93
  )
    throw new DomainError("Choose a date range of up to 93 days");
  const page = Math.max(1, Math.min(100000, Number(c.req.query("page")) || 1));
  const search = (c.req.query("search") || "").slice(0, 200);
  const properties = await query<Row>(
    `SELECT p.*,c.name customer_name,t.name technician_name,(SELECT MAX(j.scheduled_date) FROM jobs j JOIN garden_visits v ON v.job_id=j.id WHERE v.property_id=p.id AND j.status='completed') last_service,(SELECT MIN(j.scheduled_date) FROM jobs j JOIN garden_visits v ON v.job_id=j.id WHERE v.property_id=p.id AND j.status IN ('scheduled','confirmed','in_progress') AND j.scheduled_date>=?) next_service FROM garden_properties p JOIN customers c ON c.id=p.customer_id LEFT JOIN technicians t ON t.id=p.technician_id WHERE p.name LIKE ? OR p.suburb LIKE ? ORDER BY p.name LIMIT 50 OFFSET ?`,
    [today, "%" + search + "%", "%" + search + "%", (page - 1) * 50],
  );
  const visits = await query<Row>(
    selectVisits +
      " WHERE j.scheduled_date BETWEEN ? AND ? ORDER BY j.scheduled_date,j.scheduled_time LIMIT 2000",
    [start, end],
  );
  const totalVisits = await get<Row>(
    "SELECT COUNT(*) n FROM jobs WHERE scheduled_date BETWEEN ? AND ?",
    [start, end],
  );
  if (totalVisits!.n > 2000)
    throw new DomainError(
      "This range contains more than 2,000 visits. Choose a narrower date range.",
      400,
    );
  const metrics = await get<Row>(
    `SELECT COUNT(*) scheduled,COALESCE(SUM(status='completed'),0) completed,COALESCE(SUM(technician_id IS NULL AND status NOT IN ('completed','cancelled')),0) unassigned,COALESCE(SUM(scheduled_date<? AND status NOT IN ('completed','cancelled')),0) overdue FROM jobs WHERE scheduled_date BETWEEN ? AND ? AND status!='cancelled'`,
    [today, start, end],
  );
  const finance = await get<Row>(
    `SELECT (SELECT COALESCE(SUM(amount_cents),0) FROM garden_payments) revenue_cents,(SELECT COUNT(*) FROM garden_quotes WHERE status IN ('enquiry','prepared','sent')) pending_quotes,(SELECT COUNT(*) FROM invoices WHERE status NOT IN ('paid','cancelled')) outstanding_invoices,(SELECT COUNT(*) FROM garden_quotes) quotes,(SELECT COUNT(*) FROM garden_quotes WHERE status='accepted') accepted_quotes,(SELECT COUNT(DISTINCT property_id) FROM garden_plans) recurring_properties`,
  );
  return c.json({
    today,
    start,
    end,
    visits,
    properties,
    properties_total: (
      await get<Row>(
        "SELECT COUNT(*) n FROM garden_properties WHERE name LIKE ? OR suburb LIKE ?",
        ["%" + search + "%", "%" + search + "%"],
      )
    )?.n,
    metrics: { ...metrics, ...finance },
    crews: await query("SELECT * FROM technicians ORDER BY name"),
    services: await query("SELECT * FROM service_types ORDER BY name"),
    quotes: await query(
      `SELECT q.*,p.name property_name,c.name customer_name FROM garden_quotes q JOIN garden_properties p ON p.id=q.property_id JOIN customers c ON c.id=q.customer_id ORDER BY q.created_at DESC LIMIT 50 OFFSET ?`,
      [(page - 1) * 50],
    ),
    quotes_total: (await get<Row>("SELECT COUNT(*) n FROM garden_quotes"))?.n,
    invoices: await query(
      `SELECT i.*,c.name customer_name,COALESCE((SELECT SUM(amount_cents) FROM garden_payments WHERE invoice_id=i.id),0) paid_cents FROM invoices i JOIN customers c ON c.id=i.customer_id ORDER BY i.created_at DESC LIMIT 50 OFFSET ?`,
      [(page - 1) * 50],
    ),
    invoices_total: (await get<Row>("SELECT COUNT(*) n FROM invoices"))?.n,
    invoice_status: await query(
      "SELECT status,COUNT(*) count FROM invoices GROUP BY status ORDER BY status",
    ),
    activity: await query(
      `SELECT r.id,r.created_at,json_extract(r.snapshot,'$.property') name,'Visit completed' action FROM garden_records r UNION ALL SELECT id,created_at,reference,'Payment recorded' FROM garden_payments ORDER BY created_at DESC LIMIT 8`,
    ),
    demo: !!(await get("SELECT key FROM _meta WHERE key='garden_demo'")),
  });
});
gardenApp.post("/api/garden/properties", async (c) => {
  const data = await body(c, property);
  await found("customers", data.customer_id);
  if (data.technician_id) await found("technicians", data.technician_id);
  const id = crypto.randomUUID();
  await stmt(
    c,
    `INSERT INTO garden_properties(id,${Object.keys(data).join(",")}) VALUES(?,${Object.keys(
      data,
    )
      .map(() => "?")
      .join(",")})`,
    [id, ...Object.values(data)],
  ).run();
  return c.json({ id }, 201);
});
gardenApp.put("/api/garden/properties/:id", async (c) => {
  await found("garden_properties", c.req.param("id"));
  const data = await body(c, property);
  await found("customers", data.customer_id);
  if (data.technician_id) await found("technicians", data.technician_id);
  if (
    await get(
      "SELECT v.id FROM garden_visits v JOIN jobs j ON j.id=v.job_id WHERE v.property_id=? AND j.customer_id!=?",
      [c.req.param("id"), data.customer_id],
    )
  )
    throw new DomainError(
      "Property ownership cannot change after visits exist",
    );
  await stmt(
    c,
    `UPDATE garden_properties SET ${Object.keys(data)
      .map((k) => k + "=?")
      .join(",")} WHERE id=?`,
    [...Object.values(data), c.req.param("id")],
  ).run();
  return c.json({ ok: true });
});
gardenApp.get("/api/garden/properties/:id", async (c) => {
  const p = await found("garden_properties", c.req.param("id"));
  return c.json({
    property: p,
    visits: await query(
      selectVisits +
        " WHERE v.property_id=? ORDER BY j.scheduled_date DESC LIMIT 200",
      [p.id],
    ),
    records: await query(
      "SELECT * FROM garden_records WHERE property_id=? ORDER BY created_at DESC LIMIT 100",
      [p.id],
    ),
    quotes: await query(
      "SELECT * FROM garden_quotes WHERE property_id=? ORDER BY created_at DESC LIMIT 50",
      [p.id],
    ),
    invoices: await query(
      "SELECT i.* FROM invoices i JOIN garden_visits v ON v.job_id=i.job_id WHERE v.property_id=? ORDER BY i.created_at DESC LIMIT 50",
      [p.id],
    ),
  });
});
gardenApp.post("/api/garden/visits", async (c) => {
  const data = await body(c, visit);
  if (data.request_key) {
    const prior = await get<Row>("SELECT * FROM garden_requests WHERE id=?", [
      data.request_key,
    ]);
    if (prior) {
      if (prior.body_json !== JSON.stringify(data))
        throw new DomainError(
          "This request key was already used with different visit details",
          409,
        );
      return c.json(JSON.parse(prior.result_json), 201);
    }
  }
  const made = await visitStatements(c, data);
  const result = { ids: made.ids, plan_id: made.plan };
  const statements = [...made.statements];
  if (data.request_key)
    statements.push(
      stmt(
        c,
        "INSERT INTO garden_requests(id,body_json,result_json) VALUES(?,?,?)",
        [data.request_key, JSON.stringify(data), JSON.stringify(result)],
      ),
    );
  await batch(c, statements);
  return c.json(result, 201);
});
gardenApp.post("/api/garden/reschedule", async (c) => {
  const data = await body(
    c,
    z.object({
      ids: z.array(uuid).min(1).max(100),
      date,
      technician_id: uuid.nullable(),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    }),
  );
  if (new Set(data.ids).size !== data.ids.length)
    throw new DomainError("Duplicate visit selection");
  if (data.technician_id) {
    const t = await found("technicians", data.technician_id);
    if (!t.active) throw new DomainError("Crew is unavailable");
  }
  const selected: Row[] = [];
  for (const id of data.ids) {
    const job = await found("jobs", id);
    if (["completed", "cancelled"].includes(job.status))
      throw new DomainError(
        "Completed or cancelled visits cannot be rescheduled",
      );
    selected.push(job);
  }
  if (data.technician_id) {
    const existing = await query<Row>(
      "SELECT * FROM jobs WHERE technician_id=? AND scheduled_date=? AND status NOT IN ('completed','cancelled')",
      [data.technician_id, data.date],
    );
    for (const job of selected) {
      if (
        existing.some(
          (j) =>
            !data.ids.includes(j.id) &&
            minutes(j.scheduled_time) < minutes(data.time) + job.duration &&
            minutes(j.scheduled_time) + j.duration > minutes(data.time),
        )
      )
        throw new DomainError(
          "Crew conflict. Choose another crew or time.",
          409,
        );
    }
    if (selected.length > 1)
      throw new DomainError(
        "Assign bulk visits individually to avoid overlapping slots. Use Unassigned for rain rescheduling.",
      );
  }
  await batch(
    c,
    data.ids.map((id: string) =>
      stmt(
        c,
        "UPDATE jobs SET scheduled_date=?,scheduled_time=?,technician_id=?,updated_at=datetime('now') WHERE id=?",
        [data.date, data.time, data.technician_id, id],
      ),
    ),
  );
  return c.json({ ok: true, count: data.ids.length });
});
gardenApp.get("/api/garden/visits/:id", async (c) => {
  const job = await found("jobs", c.req.param("id"));
  const detailed = await get(selectVisits + " WHERE j.id=?", [job.id]);
  return c.json({
    job: detailed || job,
    photos: await query("SELECT * FROM garden_photos WHERE job_id=?", [job.id]),
    record: await get("SELECT * FROM garden_records WHERE job_id=?", [job.id]),
  });
});
gardenApp.post("/api/garden/visits/:id/photos", async (c) => {
  const job = await found("jobs", c.req.param("id"));
  if (job.status === "completed")
    throw new DomainError(
      "The completed service record is permanent. Upload photos before completion.",
    );
  const d = await body(
    c,
    z.object({ name: txt.min(1).max(200), data: z.string().max(700000) }),
  );
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(d.data))
    throw new DomainError("Use a JPEG, PNG or WebP photo");
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(d.data.split(",")[1]), (v) => v.charCodeAt(0));
  } catch {
    throw new DomainError("Invalid image encoding");
  }
  const valid =
    (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
    (bytes[0] === 137 &&
      bytes[1] === 80 &&
      bytes[2] === 78 &&
      bytes[3] === 71) ||
    (new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP");
  if (!valid || bytes.length > 500000)
    throw new DomainError("Invalid image or image exceeds 500 KB");
  if (
    (await get<Row>("SELECT COUNT(*) n FROM garden_photos WHERE job_id=?", [
      job.id,
    ]))!.n >= 6
  )
    throw new DomainError("Maximum six photos per visit");
  await stmt(c, "INSERT INTO garden_photos(job_id,name,data) VALUES(?,?,?)", [
    job.id,
    d.name,
    d.data,
  ]).run();
  return c.json({ ok: true }, 201);
});
gardenApp.post("/api/garden/quotes", async (c) => {
  const data = await body(c, quote);
  const p = await found("garden_properties", data.property_id);
  const totals = quoteTotals(data.lines, data.discount, data.tax_rate);
  if (
    money(data.discount) >
    data.lines.reduce(
      (s: number, l: any) => s + Math.round(l.quantity * money(l.unit_price)),
      0,
    )
  )
    throw new DomainError("Discount exceeds line subtotal");
  const id = crypto.randomUUID();
  await stmt(
    c,
    `INSERT INTO garden_quotes(id,customer_id,property_id,requested_service,consultation_status,follow_up,status,lines_json,discount_cents,subtotal_cents,tax_rate,tax_cents,total_cents,notes,valid_until) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      p.customer_id,
      p.id,
      data.requested_service,
      data.consultation_status,
      data.follow_up,
      data.status,
      JSON.stringify(data.lines),
      money(data.discount),
      totals.subtotal_cents,
      data.tax_rate,
      totals.tax_cents,
      totals.total_cents,
      data.notes,
      data.valid_until,
    ],
  ).run();
  return c.json({ id, ...totals }, 201);
});
gardenApp.put("/api/garden/quotes/:id/status", async (c) => {
  const q = await found("garden_quotes", c.req.param("id"));
  const d = await body(
    c,
    z.object({ status: z.enum(["prepared", "sent", "accepted", "declined"]) }),
  );
  const next: Record<string, string[]> = {
    enquiry: ["prepared"],
    prepared: ["sent"],
    sent: ["accepted", "declined"],
    accepted: [],
    declined: [],
  };
  if (!next[q.status].includes(d.status))
    throw new DomainError("Use the next step in the quotation workflow", 409);
  await stmt(c, "UPDATE garden_quotes SET status=? WHERE id=? AND status=?", [
    d.status,
    q.id,
    q.status,
  ]).run();
  return c.json({ ok: true });
});
gardenApp.post("/api/garden/quotes/:id/convert", async (c) => {
  const q = await found("garden_quotes", c.req.param("id"));
  if (q.status !== "accepted" || q.job_id)
    throw new DomainError(
      "Only an accepted, unconverted quote can create visits",
      409,
    );
  const d = await body(c, visit.omit({ property_id: true, price: true }));
  const made = await visitStatements(
    c,
    { ...d, property_id: q.property_id, price: q.subtotal_cents / 100 },
    q.id,
  );
  await batch(c, [
    ...made.statements,
    stmt(c, "UPDATE garden_quotes SET job_id=? WHERE id=? AND job_id IS NULL", [
      made.ids[0],
      q.id,
    ]),
  ]);
  return c.json({ ids: made.ids }, 201);
});
gardenApp.get("/api/garden/invoices/:id/payments", async (c) => {
  await found("invoices", c.req.param("id"));
  return c.json({
    payments: await query(
      "SELECT * FROM garden_payments WHERE invoice_id=? ORDER BY created_at",
      [c.req.param("id")],
    ),
  });
});
gardenApp.post("/api/garden/invoices/:id/payments", async (c) => {
  const invoice = await found("invoices", c.req.param("id"));
  const d = await body(
    c,
    z.object({
      id: uuid,
      amount: z.number().positive().max(10000000),
      reference: txt.min(1).max(200),
    }),
  );
  const existing = await get<Row>("SELECT * FROM garden_payments WHERE id=?", [
    d.id,
  ]);
  if (existing) {
    if (
      existing.invoice_id !== invoice.id ||
      existing.amount_cents !== money(d.amount) ||
      existing.reference !== d.reference
    )
      throw new DomainError("Receipt key already used", 409);
    return c.json({ ok: true });
  }
  if (money(d.amount) < 1) throw new DomainError("Minimum payment is R0.01");
  await stmt(
    c,
    "INSERT INTO garden_payments(id,invoice_id,amount_cents,reference) VALUES(?,?,?,?)",
    [d.id, invoice.id, money(d.amount), d.reference],
  ).run();
  return c.json({ ok: true }, 201);
});

function addDaysForSeed(base: Date, n: number) {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const demoTables = [
  "customers",
  "technicians",
  "service_types",
  "jobs",
  "job_notes",
  "job_checklist",
  "materials",
  "job_materials",
  "invoices",
  "invoice_lines",
  "garden_properties",
  "garden_plans",
  "garden_visits",
  "garden_photos",
  "garden_records",
  "garden_quotes",
  "garden_payments",
];
async function seedDemo(c: any) {
  const statements: any[] = [
    stmt(c, "INSERT OR IGNORE INTO _meta(key,value) VALUES('garden_demo','1')"),
  ];
  const crewIds = Array.from({ length: 3 }, () => crypto.randomUUID()),
    serviceIds = Array.from({ length: 3 }, () => crypto.randomUUID());
  for (const [i, name] of ["Fern Crew", "Olive Crew", "Cedar Crew"].entries())
    statements.push(
      stmt(c, "INSERT INTO technicians(id,name,color) VALUES(?,?,?)", [
        crewIds[i],
        name,
        ["#47745B", "#8D7847", "#697A9C"][i],
      ]),
    );
  for (const [i, name] of [
    "Garden maintenance",
    "Lawn & edge care",
    "Seasonal garden care",
  ].entries())
    statements.push(
      stmt(
        c,
        "INSERT INTO service_types(id,name,description,default_duration,default_price,color) VALUES(?,?,?,?,?,?)",
        [
          serviceIds[i],
          name,
          "Fictional demonstration service",
          90,
          [650, 450, 950][i],
          ["#47745B", "#8D7847", "#697A9C"][i],
        ],
      ),
    );
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
  }).format(new Date());
  const monday = new Date(today + "T12:00:00Z");
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const names = [
    "Botha",
    "Mokoena",
    "Naidoo",
    "Meyer",
    "Nkosi",
    "Van der Merwe",
    "Jacobs",
    "Pillay",
    "Smit",
    "Dlamini",
    "De Vries",
    "Molefe",
    "Williams",
    "Du Plessis",
    "Khumalo",
    "Visser",
    "Adams",
    "Ndlovu",
    "Nel",
    "Pretorius",
    "Mahlangu",
    "Daniels",
    "Steyn",
    "Radebe",
    "Coetzee",
    "Maseko",
    "Fourie",
    "Govender",
    "Joubert",
    "Mabena",
  ];
  for (let i = 0; i < 30; i++) {
    const customer = crypto.randomUUID(),
      prop = crypto.randomUUID(),
      plan = crypto.randomUUID();
    const suburb = ["Wonderboom", "Magalieskruin", "Annlin", "Doornpoort"][
      i % 4
    ];
    statements.push(
      stmt(
        c,
        "INSERT INTO customers(id,name,email,phone,address,city,notes) VALUES(?,?,?,?,?,?,?)",
        [
          customer,
          `${names[i]} family (Demo)`,
          `garden${i + 1}@example.com`,
          "",
          `${i + 10} Example Lane`,
          suburb,
          "Fictional demonstration client; not a real address.",
        ],
      ),
    );
    statements.push(
      stmt(
        c,
        "INSERT INTO garden_properties(id,customer_id,name,suburb,property_type,address,requirements,instructions,frequency,technician_id) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [
          prop,
          customer,
          `${names[i]} ${i % 5 === 0 ? "Estate" : "Garden"}`,
          suburb,
          i % 5 === 0 ? "Large property" : "Residential",
          `${i + 10} Example Lane, ${suburb}`,
          "Lawn, edges, beds and seasonal pruning.",
          "Close the side gate. Keep clippings away from the pool.",
          "weekly",
          crewIds[i % 3],
        ],
      ),
    );
    statements.push(
      stmt(
        c,
        "INSERT INTO garden_plans(id,property_id,frequency,start_date,occurrences) VALUES(?,?,?,?,?)",
        [
          plan,
          prop,
          i % 3 === 0 ? "fortnightly" : "weekly",
          addDaysForSeed(monday, Math.floor(i / 6)),
          2,
        ],
      ),
    );
    for (let week = 0; week < 2; week++) {
      const d = new Date(monday);
      d.setUTCDate(
        d.getUTCDate() + Math.floor(i / 6) + week * (i % 3 === 0 ? 14 : 7),
      );
      const day = d.toISOString().slice(0, 10);
      const id = crypto.randomUUID();
      const done = week === 0 && i < 8;
      statements.push(
        stmt(
          c,
          "INSERT INTO jobs(id,identifier,customer_id,technician_id,service_type_id,scheduled_date,scheduled_time,duration,price,address,is_recurring,recurrence_interval,notes) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
            id,
            "VIS-" + id.slice(0, 8).toUpperCase(),
            customer,
            i === 5 ? null : crewIds[i % 3],
            serviceIds[i % 3],
            day,
            `${String(8 + Math.floor((i % 6) / 3) * 3).padStart(2, "0")}:00`,
            90,
            [650, 450, 950][i % 3],
            `${i + 10} Example Lane, ${suburb}`,
            1,
            i % 3 === 0 ? "fortnightly" : "weekly",
            "Fictional demo visit.",
          ],
        ),
      );
      statements.push(
        stmt(
          c,
          "INSERT INTO garden_visits(job_id,property_id,plan_id,occurrence_date) VALUES(?,?,?,?)",
          [id, prop, plan, day],
        ),
      );
      for (const [n, label] of [
        "Lawn mowing",
        "Edge trimming",
        "Flower-bed maintenance",
        "Pruning",
        "Debris removal",
        "Final inspection",
      ].entries())
        statements.push(
          stmt(
            c,
            "INSERT INTO job_checklist(job_id,label,checked,sort_order) VALUES(?,?,?,?)",
            [id, label, done ? 1 : 0, n],
          ),
        );
      if (done)
        statements.push(
          stmt(
            c,
            "UPDATE jobs SET status='completed',completion_notes='Demonstration completion: all garden tasks recorded.' WHERE id=?",
            [id],
          ),
        );
      if (week === 0 && i < 6) {
        const inv = crypto.randomUUID();
        statements.push(
          stmt(
            c,
            "INSERT INTO invoices(id,identifier,customer_id,job_id,status,subtotal,tax_rate,tax_amount,total,due_date,notes) VALUES(?,?,?,?,'sent',650,15,97.5,747.5,?,'Fictional demo invoice')",
            [inv, "INV-DEMO-" + (i + 1), customer, id, today],
          ),
        );
        statements.push(
          stmt(
            c,
            "INSERT INTO invoice_lines(invoice_id,description,quantity,unit_price,total) VALUES(?,?,1,650,650)",
            [inv, "Garden maintenance — fictional pricing"],
          ),
        );
        if (i < 3)
          statements.push(
            stmt(
              c,
              "INSERT INTO garden_payments(invoice_id,amount_cents,reference) VALUES(?,74750,?)",
              [inv, "DEMO RECEIPT " + (i + 1)],
            ),
          );
      }
    }
    if (i < 6)
      statements.push(
        stmt(
          c,
          `INSERT INTO garden_quotes(customer_id,property_id,requested_service,status,lines_json,subtotal_cents,tax_rate,tax_cents,total_cents,valid_until,notes) VALUES(?,?,?,?,?,65000,15,9750,74750,?,'Fictional demonstration pricing')`,
          [
            customer,
            prop,
            "Weekly garden maintenance",
            ["sent", "prepared", "enquiry", "accepted", "declined", "sent"][i],
            JSON.stringify([
              {
                description: "Garden maintenance",
                quantity: 1,
                unit_price: 650,
              },
            ]),
            today,
          ],
        ),
      );
  }
  await batch(c, statements);
}
gardenApp.post("/api/garden/demo", async (c) => {
  if (await get("SELECT key FROM _meta WHERE key='garden_demo'"))
    throw new DomainError("Demo already loaded", 409);
  if (
    (await get<Row>("SELECT COUNT(*) n FROM customers"))!.n ||
    (await get<Row>("SELECT COUNT(*) n FROM jobs"))!.n
  )
    throw new DomainError(
      "Demo data can only be loaded into an empty workspace. Existing records were preserved.",
      409,
    );
  await seedDemo(c);
  return c.json({ ok: true }, 201);
});
gardenApp.post("/api/garden/demo/reset", async (c) => {
  const d = await body(c, z.object({ confirmation: z.literal("RESET DEMO") }));
  if (!d || !(await get("SELECT key FROM _meta WHERE key='garden_demo'")))
    throw new DomainError("No demo dataset to reset");
  if (
    await get(
      "SELECT id FROM customers WHERE id NOT IN (SELECT record_id FROM garden_demo_members WHERE entity='customers') LIMIT 1",
    )
  )
    throw new DomainError(
      "Non-demo client records exist. Reset was stopped to keep datasets separate.",
      409,
    );
  const order = [
    "garden_records",
    "garden_photos",
    "garden_payments",
    "invoice_lines",
    "invoices",
    "garden_quotes",
    "garden_visits",
    "garden_plans",
    "job_materials",
    "job_checklist",
    "job_notes",
    "jobs",
    "garden_properties",
    "customers",
    "technicians",
    "service_types",
    "materials",
  ];
  await batch(c, [
    ...order.map((table) =>
      stmt(
        c,
        `DELETE FROM ${table} WHERE id IN (SELECT record_id FROM garden_demo_members WHERE entity=?)`,
        [table],
      ),
    ),
    stmt(c, "DELETE FROM garden_demo_members"),
    stmt(c, "DELETE FROM garden_requests"),
  ]);
  await seedDemo(c);
  return c.json({ ok: true });
});
gardenApp.put("/api/garden/invoices/:id/lines", async (c) => {
  const inv = await found("invoices", c.req.param("id"));
  if (
    !["draft", "sent"].includes(inv.status) ||
    (await get("SELECT id FROM garden_payments WHERE invoice_id=?", [inv.id]))
  )
    throw new DomainError(
      "Only unpaid draft or sent invoices can be edited",
      409,
    );
  const d = await body(
    c,
    z.object({
      lines: z
        .array(
          z.object({
            description: txt.min(1),
            quantity: z.number().positive().max(1000),
            unit_price: z.number().min(0).max(1000000),
          }),
        )
        .min(1)
        .max(30),
      tax_rate: z.number().min(0).max(100),
    }),
  );
  const totals = quoteTotals(d.lines, 0, d.tax_rate);
  await batch(c, [
    stmt(c, "DELETE FROM invoice_lines WHERE invoice_id=?", [inv.id]),
    ...d.lines.map((l: any) =>
      stmt(
        c,
        "INSERT INTO invoice_lines(invoice_id,description,quantity,unit_price,total) VALUES(?,?,?,?,?)",
        [
          inv.id,
          l.description,
          l.quantity,
          l.unit_price,
          Math.round(l.quantity * money(l.unit_price)) / 100,
        ],
      ),
    ),
    stmt(
      c,
      "UPDATE invoices SET subtotal=?,tax_rate=?,tax_amount=?,total=?,updated_at=datetime('now') WHERE id=?",
      [
        totals.subtotal_cents / 100,
        d.tax_rate,
        totals.tax_cents / 100,
        totals.total_cents / 100,
        inv.id,
      ],
    ),
  ]);
  return c.json({ ok: true });
});
gardenApp.get("/api/garden/customers/:id", async (c) => {
  const customer = await found("customers", c.req.param("id"));
  return c.json({
    properties: await query(
      "SELECT * FROM garden_properties WHERE customer_id=? ORDER BY name LIMIT 100",
      [customer.id],
    ),
    quotes: await query(
      "SELECT * FROM garden_quotes WHERE customer_id=? ORDER BY created_at DESC LIMIT 50",
      [customer.id],
    ),
    payments: await query(
      "SELECT p.* FROM garden_payments p JOIN invoices i ON i.id=p.invoice_id WHERE i.customer_id=? ORDER BY p.created_at DESC LIMIT 50",
      [customer.id],
    ),
  });
});
gardenApp.get("/api/garden/property-options", async (c) => {
  const search = (c.req.query("search") || "").slice(0, 200),
    page = Math.max(1, Number(c.req.query("page")) || 1);
  return c.json({
    properties: await query(
      "SELECT id,name,suburb FROM garden_properties WHERE name LIKE ? OR suburb LIKE ? ORDER BY name LIMIT 50 OFFSET ?",
      ["%" + search + "%", "%" + search + "%", (page - 1) * 50],
    ),
    total:
      (
        await get<Row>(
          "SELECT COUNT(*) n FROM garden_properties WHERE name LIKE ? OR suburb LIKE ?",
          ["%" + search + "%", "%" + search + "%"],
        )
      )?.n || 0,
  });
});
