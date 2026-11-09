import { useEffect, useState } from "preact/hooks";
import {
  Plus,
  ArrowLeft,
  ArrowUpRight,
  Receipt,
  Leaf,
  Users,
  Settings,
  FileText,
  RefreshCw,
} from "lucide-preact";
import { useApp } from "./context";
import { api } from "./api";
import {
  useGarden,
  PageHeading,
  LoadState,
  Empty,
  Pager,
  Badge,
  zar,
  localDay,
  monday,
  addDays,
  GardenDialog,
  GardenForm,
  Field,
  changed,
  notify,
} from "./garden-ui";

export function GardenInvoices({ id }: { id?: string | null }) {
  const { navigate } = useApp();
  const [page, setPage] = useState(1),
    [create, setCreate] = useState(false);
  const { data: d, error, retry } = useGarden(undefined, undefined, page);
  if (id) return <GardenInvoiceDetail id={id} />;
  if (!d) return <LoadState error={error} retry={retry} />;
  return (
    <div class="garden-page">
      <PageHeading
        title="Invoices & payments"
        description="Good work, clearly accounted for. Track every recorded receipt."
      >
        <button class="btn btn-primary" onClick={() => setCreate(true)}>
          <Plus size={17} /> New invoice
        </button>
      </PageHeading>
      <section class="garden-panel">
        <div class="panel-heading">
          <h2>Client billing</h2>
          <span>Amounts in ZAR</span>
        </div>
        <div class="table-scroll">
          <table class="garden-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Status</th>
                <th>Total</th>
                <th>Recorded payments</th>
                <th>Balance</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {d.invoices.map((i: any) => (
                <tr>
                  <td>
                    <button
                      class="record-link"
                      onClick={() => navigate("/invoices/" + i.id)}
                    >
                      {i.identifier}
                    </button>
                  </td>
                  <td>{i.customer_name}</td>
                  <td>
                    <Badge status={i.status} />
                  </td>
                  <td>{zar(i.total)}</td>
                  <td>{zar(i.paid_cents / 100)}</td>
                  <td>{zar(i.total - i.paid_cents / 100)}</td>
                  <td>{i.due_date || "Not set"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!d.invoices.length && (
            <Empty
              title="No invoices yet"
              text="Generate a linked invoice from a completed visit, or create one here."
            />
          )}
        </div>
        <Pager page={page} total={d.invoices_total} onPage={setPage} />
      </section>
      {create && (
        <CreateInvoice
          onClose={() => {
            setCreate(false);
            changed();
          }}
        />
      )}
    </div>
  );
}
function GardenInvoiceDetail({ id }: { id: string }) {
  const { navigate } = useApp();
  const [invoice, setInvoice] = useState<any>(null),
    [payments, setPayments] = useState<any[]>([]),
    [error, setError] = useState(""),
    [pay, setPay] = useState(false),
    [edit, setEdit] = useState(false),
    [receiptId, setReceiptId] = useState("");
  async function load() {
    const [d, p] = await Promise.all([
      api<any>("GET", "/api/invoices/" + id),
      api<any>("GET", `/api/garden/invoices/${id}/payments`),
    ]);
    setInvoice(d.invoice);
    setPayments(p.payments);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id]);
  if (!invoice) return <LoadState error={error} retry={load} />;
  const i = invoice;
  const paid = payments.reduce((s, p) => s + p.amount_cents, 0) / 100;
  const balance = Math.round((i.total - paid) * 100) / 100;
  return (
    <div class="garden-page">
      <button class="text-button" onClick={() => navigate("/invoices")}>
        <ArrowLeft size={16} /> All invoices
      </button>
      <PageHeading
        eyebrow="CLEAR RECORDS. HEALTHY BUSINESS."
        title={i.identifier}
        description={i.customer_name}
      >
        <Badge status={i.status} />
        {i.status === "draft" && (
          <button
            class="btn"
            onClick={async () => {
              try {
                await api("PUT", "/api/invoices/" + id, { status: "sent" });
                await load();
                changed();
                notify("Invoice recorded as sent");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Record as sent
          </button>
        )}
        {!paid && ["draft", "sent"].includes(i.status) && (
          <button class="btn" onClick={() => setEdit(true)}>
            Edit lines & VAT
          </button>
        )}
        {balance > 0 && i.status !== "cancelled" && (
          <button
            class="btn btn-primary"
            onClick={() => {
              setReceiptId(crypto.randomUUID());
              setPay(true);
            }}
          >
            <Receipt size={16} /> Record payment
          </button>
        )}
      </PageHeading>
      {error && (
        <p class="inline-error" role="alert">
          {error}
        </p>
      )}
      <div class="property-summary">
        <div>
          <small>Invoice total</small>
          <strong>{zar(i.total)}</strong>
        </div>
        <div>
          <small>Recorded payments</small>
          <strong>{zar(paid)}</strong>
        </div>
        <div>
          <small>Outstanding balance</small>
          <strong>{zar(balance)}</strong>
        </div>
        <div>
          <small>Due date</small>
          <strong>{i.due_date || "Not set"}</strong>
        </div>
      </div>
      <section class="garden-panel">
        <div class="panel-heading">
          <h2>Service line items</h2>
          {i.job_id && (
            <button
              class="text-button"
              onClick={() => navigate("/jobs/" + i.job_id)}
            >
              Linked garden visit <ArrowUpRight size={15} />
            </button>
          )}
        </div>
        <div class="table-scroll">
          <table class="garden-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {i.lines?.map((l: any) => (
                <tr>
                  <td>{l.description}</td>
                  <td>{l.quantity}</td>
                  <td>{zar(l.unit_price)}</td>
                  <td>{zar(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div class="invoice-totals">
          <p>
            Subtotal <strong>{zar(i.subtotal)}</strong>
          </p>
          <p>
            VAT ({i.tax_rate}%) <strong>{zar(i.tax_amount)}</strong>
          </p>
          <p>
            Total <strong>{zar(i.total)}</strong>
          </p>
        </div>
        <p class="panel-body">{i.notes}</p>
      </section>
      <section class="garden-panel">
        <div class="panel-heading">
          <h2>Recorded receipts</h2>
          <span>Manual records · no bank processing</span>
        </div>
        {payments.length ? (
          payments.map((p) => (
            <div class="billing-row">
              <span>
                {p.reference}
                <small>
                  {new Date(p.created_at + "Z").toLocaleString("en-ZA", {
                    timeZone: "Africa/Johannesburg",
                  })}{" "}
                  SAST
                </small>
              </span>
              <strong>{zar(p.amount_cents / 100)}</strong>
            </div>
          ))
        ) : (
          <Empty
            title="No payment recorded"
            text="Completed work is not counted as collected revenue until a receipt is recorded."
          />
        )}
      </section>
      {pay && (
        <GardenDialog
          title="Record a demo payment"
          onClose={() => setPay(false)}
        >
          <GardenForm
            label="Confirm recorded payment"
            onCancel={() => setPay(false)}
            onSave={async (f) => {
              await api("POST", `/api/garden/invoices/${id}/payments`, {
                id: receiptId,
                amount: Number(f.get("amount")),
                reference: String(f.get("reference")),
              });
              await load();
              changed();
              notify("Payment recorded");
              setPay(false);
            }}
          >
            <p>
              This records a receipt against {i.identifier}. It does not charge
              a customer or move money.
            </p>
            <Field label="Amount received (ZAR)">
              <input
                name="amount"
                type="number"
                min="0.01"
                max={balance}
                step="0.01"
                defaultValue={balance}
                required
              />
            </Field>
            <Field label="Receipt reference">
              <input
                name="reference"
                required
                maxLength={200}
                placeholder="e.g. DEMO EFT 001"
              />
            </Field>
            <p class="field-help">
              Outstanding balance: {zar(balance)}. Check the amount before
              confirming.
            </p>
          </GardenForm>
        </GardenDialog>
      )}
      {edit && (
        <EditInvoice
          invoice={i}
          onClose={() => setEdit(false)}
          onSaved={async () => {
            await load();
            changed();
            notify("Invoice updated");
            setEdit(false);
          }}
        />
      )}
    </div>
  );
}
function EditInvoice({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: any;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [lines, setLines] = useState<any[]>(
    invoice.lines.map((l: any) => ({
      description: l.description,
      quantity: l.quantity,
      unit_price: l.unit_price,
    })),
  );
  return (
    <GardenDialog title="Edit invoice lines & VAT" onClose={onClose}>
      <GardenForm
        onCancel={onClose}
        onSave={async (f) => {
          await api("PUT", `/api/garden/invoices/${invoice.id}/lines`, {
            lines,
            tax_rate: Number(f.get("tax_rate")),
          });
          await onSaved();
        }}
      >
        {lines.map((l, i) => (
          <div class="quote-line">
            <Field label="Description">
              <input
                required
                value={l.description}
                onInput={(e) => {
                  const value = e.currentTarget.value;
                  setLines((ls) =>
                    ls.map((item, n) =>
                      n === i ? { ...item, description: value } : item,
                    ),
                  );
                }}
              />
            </Field>
            <Field label="Quantity">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={l.quantity}
                onInput={(e) => {
                  const value = Number(e.currentTarget.value);
                  setLines((ls) =>
                    ls.map((item, n) =>
                      n === i ? { ...item, quantity: value } : item,
                    ),
                  );
                }}
              />
            </Field>
            <Field label="Unit price (R)">
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={l.unit_price}
                onInput={(e) => {
                  const value = Number(e.currentTarget.value);
                  setLines((ls) =>
                    ls.map((item, n) =>
                      n === i ? { ...item, unit_price: value } : item,
                    ),
                  );
                }}
              />
            </Field>
            <button
              class="btn"
              type="button"
              aria-label={`Remove line ${i + 1}`}
              disabled={lines.length === 1}
              onClick={() => setLines((ls) => ls.filter((_, n) => n !== i))}
            >
              ×
            </button>
          </div>
        ))}
        <button
          class="btn"
          type="button"
          onClick={() =>
            setLines((ls) => [
              ...ls,
              { description: "", quantity: 1, unit_price: 0 },
            ])
          }
        >
          Add line
        </button>
        <Field label="VAT (%)">
          <input
            name="tax_rate"
            type="number"
            min="0"
            max="100"
            step="0.01"
            defaultValue={invoice.tax_rate}
            required
          />
        </Field>
      </GardenForm>
    </GardenDialog>
  );
}
export function Reports() {
  const [start, setStart] = useState(monday()),
    [end, setEnd] = useState(addDays(monday(), 6));
  const { data: d, error, retry } = useGarden(start, end);
  if (!d) return <LoadState error={error} retry={retry} />;
  const m = d.metrics;
  return (
    <div class="garden-page">
      <PageHeading
        title="Operations Reports"
        description="A clearer picture of the work behind every well-kept garden."
      >
        <label class="filter-select">
          From{" "}
          <input
            aria-label="Report start"
            type="date"
            value={start}
            onChange={(e) => {
              if (e.currentTarget.value) setStart(e.currentTarget.value);
            }}
          />
        </label>
        <label class="filter-select">
          To{" "}
          <input
            aria-label="Report end"
            type="date"
            value={end}
            onChange={(e) => {
              if (e.currentTarget.value) setEnd(e.currentTarget.value);
            }}
          />
        </label>
      </PageHeading>
      {error && <LoadState error={error} retry={retry} />}
      <div class="garden-kpis report-kpis">
        {[
          ["Scheduled visits", m.scheduled],
          ["Completed visits", m.completed],
          [
            "Completion rate",
            `${m.scheduled ? Math.round((m.completed / m.scheduled) * 100) : 0}%`,
          ],
          ["Recorded revenue · all time", zar(m.revenue_cents / 100)],
          ["Recurring properties · all time", m.recurring_properties],
          [
            "Quote conversion · all time",
            `${m.quotes ? Math.round((m.accepted_quotes / m.quotes) * 100) : 0}%`,
          ],
        ].map(([label, value]) => (
          <div class="garden-kpi">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div class="overview-grid">
        <section class="garden-panel">
          <div class="panel-heading">
            <h2>Workload by crew</h2>
            <Users size={18} />
          </div>
          <div class="panel-body report-bars">
            {d.crews.map((c: any) => {
              const js = d.visits.filter((j: any) => j.technician_id === c.id),
                completed = js.filter(
                  (j: any) => j.status === "completed",
                ).length;
              return (
                <div>
                  <div>
                    <strong>{c.name}</strong>
                    <span>
                      {completed} completed / {js.length} visits
                    </span>
                  </div>
                  <div class="report-bar-track">
                    <i
                      style={{
                        width: `${(js.length / Math.max(1, d.visits.length)) * 100}%`,
                        background: c.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section class="garden-panel">
          <div class="panel-heading">
            <h2>Visits by suburb</h2>
            <Leaf size={18} />
          </div>
          <div class="panel-body report-bars">
            {[...new Set(d.visits.map((j: any) => j.suburb))].map((s: any) => {
              const count = d.visits.filter((j: any) => j.suburb === s).length;
              return (
                <div>
                  <div>
                    <strong>{s}</strong>
                    <span>{count} visits</span>
                  </div>
                  <div class="report-bar-track">
                    <i
                      style={{
                        width: `${(count / Math.max(1, d.visits.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {!d.visits.length && <Empty />}
          </div>
        </section>
      </div>
      <section class="garden-panel">
        <div class="panel-heading">
          <h2>Invoice status · all time</h2>
        </div>
        <div class="invoice-status-summary">
          {d.invoice_status?.map((row: any) => (
            <div>
              <Badge status={row.status} />
              <strong>{row.count}</strong>
              <span>invoices</span>
            </div>
          ))}
        </div>
      </section>
      <section class="garden-panel">
        <div class="panel-heading">
          <h2>Billing overview · all time</h2>
        </div>
        <div class="property-summary">
          <div>
            <small>Pending quotations</small>
            <strong>{m.pending_quotes}</strong>
          </div>
          <div>
            <small>Outstanding invoices</small>
            <strong>{m.outstanding_invoices}</strong>
          </div>
          <div>
            <small>Unassigned visits · selected period</small>
            <strong>{m.unassigned}</strong>
          </div>
          <div>
            <small>Overdue visits · selected period</small>
            <strong>{m.overdue}</strong>
          </div>
        </div>
        <p class="panel-body field-help">
          Visits use the selected date range (up to 93 days). Financial
          receipts, recurring properties and quote conversion are all-time
          records. No projected revenue is presented as collected payment.
        </p>
      </section>
    </div>
  );
}
export function GardenSettings() {
  const { navigate } = useApp();
  const { data: d, error, retry } = useGarden();
  const [reset, setReset] = useState(false);
  return (
    <div class="garden-page">
      <PageHeading
        title="Workspace Settings"
        description="A thoughtful setup for a well-run garden business."
      />
      <div class="overview-grid">
        <section class="garden-panel">
          <div class="panel-heading">
            <h2>Disa GardenOS</h2>
            <Settings size={19} />
          </div>
          <div class="panel-body">
            <h3>Garden Operations. Simplified.</h3>
            <p>
              Independent interactive concept developed by paceIT for Disa
              Tuine. Fictional Pretoria demonstration data and pricing.
            </p>
            <dl class="settings-list">
              <dt>Currency</dt>
              <dd>South African rand (ZAR)</dd>
              <dt>Scheduling timezone</dt>
              <dd>Africa/Johannesburg · SAST</dd>
              <dt>VAT</dt>
              <dd>Configurable per quote or invoice</dd>
              <dt>Data storage</dt>
              <dd>Local SQLite / D1</dd>
            </dl>
            <p class="field-help">
              This concept has no sign-in, crew permissions, live weather, GPS
              verification or bank payment integration. Add access controls and
              persistent hosted storage before any production use.
            </p>
          </div>
        </section>
        <section class="garden-panel">
          <div class="panel-heading">
            <h2>Manage your workspace</h2>
          </div>
          <div class="settings-actions">
            {[
              [
                "Crew management",
                "Availability, names and colours",
                "/technicians",
              ],
              [
                "Client records",
                "Contacts, addresses and equipment",
                "/customers",
              ],
              [
                "Service catalogue",
                "Configurable services and pricing",
                "/services",
              ],
              [
                "Inventory & materials",
                "Stock and visit materials",
                "/materials",
              ],
            ].map(([title, text, path]) => (
              <button onClick={() => navigate(path)}>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
                <ArrowUpRight size={17} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <section class="garden-panel">
        <div class="panel-heading">
          <h2>Demonstration data</h2>
          <RefreshCw size={18} />
        </div>
        <div class="panel-body">
          <p>
            Reset removes records explicitly registered to this fictional demo
            workspace and loads a fresh dataset. Records outside demo membership
            are preserved; linked non-demo records can prevent a reset.
          </p>
          {d?.demo ? (
            <button class="btn btn-danger" onClick={() => setReset(true)}>
              Reset fictional demo
            </button>
          ) : (
            <p>
              No demo dataset is active. Load it from Overview only in an empty
              workspace.
            </p>
          )}
        </div>
      </section>
      <p class="field-help">
        Built on OpenFieldService. Copyright © 2026 Clawnify. MIT licence
        retained in the repository.
      </p>
      {reset && (
        <GardenDialog
          title="Reset the fictional workspace?"
          onClose={() => setReset(false)}
        >
          <GardenForm
            label="Reset fictional demo"
            onCancel={() => setReset(false)}
            onSave={async (f) => {
              await api("POST", "/api/garden/demo/reset", {
                confirmation: String(f.get("confirmation")),
              });
              changed();
              notify("Fictional demo reset");
              setReset(false);
            }}
          >
            <p>
              This removes demo visits, photos, quotations, invoices and
              recorded demo payments. This action cannot be undone.
            </p>
            <Field label="Type RESET DEMO to confirm">
              <input
                name="confirmation"
                required
                pattern="RESET DEMO"
                autoComplete="off"
              />
            </Field>
          </GardenForm>
        </GardenDialog>
      )}
    </div>
  );
}

function CreateInvoice({ onClose }: { onClose: () => void }) {
  const { customerLookup } = useApp();
  return (
    <GardenDialog title="Create an invoice" onClose={onClose}>
      <GardenForm
        label="Create invoice"
        onCancel={onClose}
        onSave={async (f) => {
          await api("POST", "/api/invoices", {
            customer_id: String(f.get("customer_id")),
            tax_rate: Number(f.get("tax_rate")),
            due_date: String(f.get("due_date")),
            notes: "Fictional demonstration invoice",
            lines: [
              {
                description: String(f.get("description")),
                quantity: Number(f.get("quantity")),
                unit_price: Number(f.get("price")),
              },
            ],
          });
          notify("Invoice created");
          onClose();
        }}
      >
        <Field label="Client">
          <select name="customer_id" required>
            <option value="">Choose client</option>
            {customerLookup.map((c) => (
              <option value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <input name="description" required />
        </Field>
        <div class="form-grid">
          <Field label="Quantity">
            <input
              type="number"
              name="quantity"
              min="0.01"
              step="0.01"
              defaultValue="1"
              required
            />
          </Field>
          <Field label="Unit price (ZAR)">
            <input type="number" name="price" min="0" step="0.01" required />
          </Field>
          <Field label="VAT (%)">
            <input
              type="number"
              name="tax_rate"
              min="0"
              max="100"
              step="0.01"
              defaultValue="15"
              required
            />
          </Field>
          <Field label="Due date">
            <input type="date" name="due_date" />
          </Field>
        </div>
      </GardenForm>
    </GardenDialog>
  );
}
