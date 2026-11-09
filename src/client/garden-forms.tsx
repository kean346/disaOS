import { useState } from "preact/hooks";
import { useApp } from "./context";
import { api } from "./api";
import {
  PropertyPicker,
  GardenDialog,
  GardenForm,
  Field,
  localDay,
  notify,
  changed,
  zar,
} from "./garden-ui";
const str = (f: FormData, k: string) => String(f.get(k) || "");
const num = (f: FormData, k: string) => Number(f.get(k) || 0);
export function VisitForm({
  data,
  onClose,
  propertyId,
  quoteId,
}: {
  data: any;
  onClose: () => void;
  propertyId?: string;
  quoteId?: string;
}) {
  const [requestKey] = useState(() => crypto.randomUUID());
  return (
    <GardenDialog
      title={
        quoteId ? "Schedule accepted quotation" : "Schedule a garden visit"
      }
      onClose={onClose}
    >
      <GardenForm
        label="Schedule visits"
        onCancel={onClose}
        onSave={async (f) => {
          const payload: any = {
            request_key: requestKey,
            property_id: str(f, "property_id") || propertyId,
            technician_id: str(f, "technician_id") || null,
            service_type_id: str(f, "service_type_id") || null,
            scheduled_date: str(f, "scheduled_date"),
            scheduled_time: str(f, "scheduled_time"),
            duration: num(f, "duration"),
            price: num(f, "price"),
            frequency: str(f, "frequency"),
            count: num(f, "count"),
            notes: str(f, "notes"),
          };
          if (quoteId) {
            delete payload.property_id;
            delete payload.price;
          }
          await api(
            "POST",
            quoteId
              ? `/api/garden/quotes/${quoteId}/convert`
              : "/api/garden/visits",
            payload,
          );
          notify("Visits scheduled");
          changed();
          onClose();
        }}
      >
        <div class="form-grid">
          {!propertyId && <PropertyPicker />}
          <Field label="Assigned crew">
            <select name="technician_id">
              <option value="">Unassigned</option>
              {data.crews
                .filter((t: any) => t.active)
                .map((t: any) => (
                  <option value={t.id}>{t.name}</option>
                ))}
            </select>
          </Field>
          <Field label="Service">
            <select name="service_type_id">
              <option value="">Garden maintenance</option>
              {data.services.map((s: any) => (
                <option value={s.id}>{s.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Visit date">
            <input
              name="scheduled_date"
              type="date"
              required
              defaultValue={localDay()}
            />
          </Field>
          <Field label="Arrival time">
            <input
              name="scheduled_time"
              type="time"
              required
              defaultValue="09:00"
            />
          </Field>
          <Field label="Duration (minutes)">
            <input
              name="duration"
              type="number"
              required
              min="15"
              max="720"
              defaultValue="90"
            />
          </Field>
          {!quoteId && (
            <Field label="Visit price (ZAR)">
              <input
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                defaultValue="650"
              />
            </Field>
          )}
          <Field label="Repeat">
            <select name="frequency">
              <option value="once">One-time visit</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
              <option value="10">Every 10 days</option>
              <option value="21">Every 21 days</option>
            </select>
          </Field>
          <Field label="Number of occurrences">
            <input
              name="count"
              type="number"
              required
              min="1"
              max="52"
              defaultValue="8"
            />
          </Field>
        </div>
        <Field label="Visit notes">
          <textarea class="resize-none" name="notes" rows={3} />
        </Field>
        <p class="field-help">
          Recurring visits are separate appointments. Rescheduling one leaves
          the rest of the plan unchanged. Conflicting crew slots must be
          resolved before saving.
        </p>
      </GardenForm>
    </GardenDialog>
  );
}
export function RescheduleForm({
  jobs,
  data,
  onClose,
}: {
  jobs: any[];
  data: any;
  onClose: () => void;
}) {
  return (
    <GardenDialog
      title={
        jobs.length > 1
          ? `Reschedule ${jobs.length} selected visits`
          : "Reschedule & assign visit"
      }
      onClose={onClose}
    >
      <GardenForm
        label={jobs.length > 1 ? "Confirm schedule changes" : "Save visit"}
        onCancel={onClose}
        onSave={async (f) => {
          await api("POST", "/api/garden/reschedule", {
            ids: jobs.map((j) => j.id),
            date: str(f, "date"),
            time: str(f, "time"),
            technician_id: str(f, "technician_id") || null,
          });
          notify(
            `${jobs.length} visit${jobs.length > 1 ? "s" : ""} rescheduled`,
          );
          changed();
          onClose();
        }}
      >
        <p class="field-help">
          {jobs.length > 1
            ? "Rain planning: move only these selected appointments. Leave bulk visits unassigned, then allocate individual crew slots."
            : `${jobs[0].property_name} · ${jobs[0].suburb}. This changes only this occurrence.`}
        </p>
        <Field label="New date">
          <input
            type="date"
            name="date"
            defaultValue={jobs[0].scheduled_date}
            required
          />
        </Field>
        <Field label="Arrival time">
          <input
            type="time"
            name="time"
            defaultValue={jobs[0].scheduled_time || "09:00"}
            required
          />
        </Field>
        <Field label="Assigned crew">
          <select
            name="technician_id"
            defaultValue={jobs.length === 1 ? jobs[0].technician_id || "" : ""}
          >
            <option value="">Unassigned</option>
            {data.crews
              .filter((c: any) => c.active)
              .map((c: any) => (
                <option value={c.id}>{c.name}</option>
              ))}
          </select>
        </Field>
      </GardenForm>
    </GardenDialog>
  );
}
export function PropertyForm({
  onClose,
  initial,
}: {
  onClose: () => void;
  initial?: any;
}) {
  const { customerLookup, technicianLookup } = useApp();
  return (
    <GardenDialog
      title={initial ? "Edit property" : "Add a property"}
      onClose={onClose}
    >
      <GardenForm
        label="Save property"
        onCancel={onClose}
        onSave={async (f) => {
          await api(
            initial ? "PUT" : "POST",
            initial
              ? `/api/garden/properties/${initial.id}`
              : "/api/garden/properties",
            {
              customer_id: str(f, "customer_id"),
              name: str(f, "name"),
              suburb: str(f, "suburb"),
              property_type: str(f, "property_type"),
              address: str(f, "address"),
              requirements: str(f, "requirements"),
              instructions: str(f, "instructions"),
              frequency: str(f, "frequency"),
              technician_id: str(f, "technician_id") || null,
            },
          );
          notify("Property saved");
          changed();
          onClose();
        }}
      >
        <div class="form-grid">
          <Field label="Client">
            <select
              name="customer_id"
              required
              defaultValue={initial?.customer_id || ""}
            >
              <option value="">Choose client</option>
              {customerLookup.map((c) => (
                <option value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Property name">
            <input name="name" required defaultValue={initial?.name} />
          </Field>
          <Field label="Suburb">
            <input name="suburb" required defaultValue={initial?.suburb} />
          </Field>
          <Field label="Property type">
            <select
              name="property_type"
              defaultValue={initial?.property_type || "Residential"}
            >
              <option>Residential</option>
              <option>Large property</option>
              <option>Commercial</option>
            </select>
          </Field>
          <Field label="Frequency">
            <select
              name="frequency"
              defaultValue={initial?.frequency || "weekly"}
            >
              <option value="once">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <Field label="Preferred crew">
            <select
              name="technician_id"
              defaultValue={initial?.technician_id || ""}
            >
              <option value="">Unassigned</option>
              {technicianLookup.map((t) => (
                <option value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Address">
          <input name="address" defaultValue={initial?.address} />
        </Field>
        <Field label="Maintenance requirements">
          <textarea
            class="resize-none"
            name="requirements"
            defaultValue={initial?.requirements}
            rows={3}
          />
        </Field>
        <Field label="Access & special instructions">
          <textarea
            class="resize-none"
            name="instructions"
            defaultValue={initial?.instructions}
            rows={3}
          />
        </Field>
        <p class="field-help">
          Need a new client? Add them under Client records first.
        </p>
      </GardenForm>
    </GardenDialog>
  );
}
export function QuoteForm({
  data,
  onClose,
}: {
  data: any;
  onClose: () => void;
}) {
  const [lines, setLines] = useState([
    { description: "Garden maintenance", quantity: 1, unit_price: 650 },
  ]);
  const [vat, setVat] = useState(15),
    [discount, setDiscount] = useState(0);
  const subtotal =
    lines.reduce((s, l) => s + Math.round(l.quantity * l.unit_price * 100), 0) /
      100 -
    discount;
  return (
    <GardenDialog title="Prepare an enquiry or quotation" onClose={onClose}>
      <GardenForm
        label="Save quotation"
        onCancel={onClose}
        onSave={async (f) => {
          await api("POST", "/api/garden/quotes", {
            property_id: str(f, "property_id"),
            requested_service: str(f, "requested_service"),
            consultation_status: str(f, "consultation_status"),
            follow_up: str(f, "follow_up"),
            status: str(f, "status"),
            lines,
            discount,
            tax_rate: vat,
            notes: str(f, "notes"),
            valid_until: str(f, "valid_until"),
          });
          notify("Quotation saved");
          changed();
          onClose();
        }}
      >
        <div class="form-grid">
          <PropertyPicker />
          <Field label="Requested service">
            <input
              name="requested_service"
              required
              defaultValue="Garden maintenance"
            />
          </Field>
          <Field label="Stage">
            <select name="status">
              <option value="enquiry">Enquiry</option>
              <option value="prepared">Quote prepared</option>
            </select>
          </Field>
          <Field label="Consultation">
            <select name="consultation_status">
              <option>Not booked</option>
              <option>Site visit booked</option>
              <option>Site visit completed</option>
            </select>
          </Field>
          <Field label="Follow-up date">
            <input type="date" name="follow_up" />
          </Field>
          <Field label="Valid until">
            <input type="date" name="valid_until" />
          </Field>
        </div>
        <h3>Service lines</h3>
        {lines.map((line, i) => (
          <div class="quote-line">
            <Field label="Description">
              <input
                value={line.description}
                required
                onInput={(e) => {
                  const value = e.currentTarget.value;
                  setLines((ls) =>
                    ls.map((l, n) =>
                      n === i ? { ...l, description: value } : l,
                    ),
                  );
                }}
              />
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={line.quantity}
                required
                onInput={(e) => {
                  const value = Number(e.currentTarget.value);
                  setLines((ls) =>
                    ls.map((l, n) => (n === i ? { ...l, quantity: value } : l)),
                  );
                }}
              />
            </Field>
            <Field label="Unit price (R)">
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.unit_price}
                required
                onInput={(e) => {
                  const value = Number(e.currentTarget.value);
                  setLines((ls) =>
                    ls.map((l, n) =>
                      n === i ? { ...l, unit_price: value } : l,
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
          Add service line
        </button>
        <div class="form-grid">
          <Field label="Discount (R)">
            <input
              type="number"
              value={discount}
              min="0"
              step="0.01"
              required
              onInput={(e) => setDiscount(Number(e.currentTarget.value))}
            />
          </Field>
          <Field label="VAT (%)">
            <input
              type="number"
              value={vat}
              min="0"
              max="100"
              step="0.01"
              required
              onInput={(e) => setVat(Number(e.currentTarget.value))}
            />
          </Field>
        </div>
        <div class="quote-total">
          Estimated total{" "}
          <strong>
            {zar(Math.round(subtotal * (1 + vat / 100) * 100) / 100)}
          </strong>
        </div>
        <Field label="Notes">
          <textarea class="resize-none" name="notes" rows={3} />
        </Field>
        <p class="field-help">
          Fictional demonstration pricing. These are not Disa Tuine’s official
          rates.
        </p>
      </GardenForm>
    </GardenDialog>
  );
}
