import { useEffect, useState } from "preact/hooks";
import {
  Plus,
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  Leaf,
  Check,
  Camera,
  Printer,
  FileText,
  Users,
  RefreshCw,
} from "lucide-preact";
import { api } from "./api";
import { useApp } from "./context";
import {
  useGarden,
  PageHeading,
  LoadState,
  Empty,
  SearchBox,
  Pager,
  Badge,
  CrewLabel,
  zar,
  dayLabel,
  localDay,
  notify,
  changed,
  GardenDialog,
  GardenForm,
  Field,
} from "./garden-ui";
import { PropertyForm, VisitForm, QuoteForm } from "./garden-forms";
import { VisitTable } from "./garden-operations";

export function Properties({ id }: { id?: string | null }) {
  const { navigate } = useApp();
  const [page, setPage] = useState(
      Math.max(
        1,
        Number(new URLSearchParams(location.search).get("page")) || 1,
      ),
    ),
    [search, setSearch] = useState(
      new URLSearchParams(location.search).get("search") || "",
    ),
    [create, setCreate] = useState(false);
  const {
    data: d,
    error,
    retry,
  } = useGarden(undefined, undefined, page, search);
  useEffect(() => {
    if (!id)
      history.replaceState(
        null,
        "",
        "/properties?" + new URLSearchParams({ search, page: String(page) }),
      );
  }, [id, page, search]);
  if (id) return <PropertyDetail id={id} />;
  if (!d) return <LoadState error={error} retry={retry} />;
  return (
    <div class="garden-page">
      <PageHeading
        title="Properties & Clients"
        description="Every garden has a story. Keep yours in one place."
      >
        <button class="btn" onClick={() => navigate("/customers")}>
          Client records <ArrowUpRight size={15} />
        </button>
        <button class="btn btn-primary" onClick={() => setCreate(true)}>
          <Plus size={16} /> Add property
        </button>
      </PageHeading>
      <section class="garden-panel">
        <div class="panel-heading">
          <SearchBox
            value={search}
            onChange={(s) => {
              setSearch(s);
              setPage(1);
              history.replaceState(
                null,
                "",
                "/properties?" + new URLSearchParams({ search: s, page: "1" }),
              );
            }}
            placeholder="Search property or suburb…"
          />
          <span class="text-muted">{d.properties_total} properties</span>
        </div>
        {error && <LoadState error={error} retry={retry} />}
        <div class="property-grid">
          {d.properties.length ? (
            d.properties.map((p: any, i: number) => (
              <a
                class="property-card"
                href={"/properties/" + p.id}
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/properties/" + p.id);
                }}
              >
                <div class={`property-illustration tone-${i % 3}`}>
                  <div class="garden-house">
                    <i />
                    <span />
                    <b />
                  </div>
                  <Leaf size={40} />
                  <span class="property-type">{p.property_type}</span>
                </div>
                <div class="property-card-body">
                  <small>
                    <MapPin size={12} /> {p.suburb}
                  </small>
                  <h2>
                    {p.name}
                    <ArrowUpRight size={17} />
                  </h2>
                  <p>{p.customer_name}</p>
                  <footer>
                    <span>
                      <b>{p.frequency}</b> maintenance
                    </span>
                    <span>
                      Next:{" "}
                      {p.next_service ? dayLabel(p.next_service) : "Not booked"}
                    </span>
                  </footer>
                </div>
              </a>
            ))
          ) : (
            <Empty
              title="No matching properties"
              text="Clear your search or add a property."
            />
          )}
        </div>
        <Pager page={page} total={d.properties_total} onPage={setPage} />
      </section>
      {create && <PropertyForm onClose={() => setCreate(false)} />}
    </div>
  );
}
function PropertyDetail({ id }: { id: string }) {
  const { navigate } = useApp();
  const [details, setDetails] = useState<any>(null),
    [error, setError] = useState(""),
    [edit, setEdit] = useState(false),
    [create, setCreate] = useState(false),
    [report, setReport] = useState<any>(null),
    [revision, setRevision] = useState(0);
  const { data: d } = useGarden();
  useEffect(() => {
    let active = true;
    api("GET", "/api/garden/properties/" + id)
      .then((v) => {
        if (active) setDetails(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, revision]);
  useEffect(() => {
    const fn = () => setRevision((n) => n + 1);
    window.addEventListener("garden:changed", fn);
    return () => window.removeEventListener("garden:changed", fn);
  }, []);
  if (!details)
    return <LoadState error={error} retry={() => setRevision((n) => n + 1)} />;
  const { property: p, visits, records, invoices, quotes } = details;
  const upcoming = visits
    .filter(
      (j: any) =>
        j.status !== "completed" &&
        j.status !== "cancelled" &&
        j.scheduled_date >= localDay(),
    )
    .sort((a: any, b: any) =>
      a.scheduled_date.localeCompare(b.scheduled_date),
    )[0];
  return (
    <div class="garden-page">
      <button class="text-button" onClick={() => navigate("/properties")}>
        <ArrowLeft size={16} /> All properties
      </button>
      <PageHeading
        eyebrow={p.suburb.toUpperCase()}
        title={p.name}
        description={`${p.property_type} · ${p.address}`}
      >
        <button class="btn" onClick={() => setEdit(true)}>
          Edit property
        </button>
        <button class="btn btn-primary" onClick={() => setCreate(true)}>
          <Plus size={16} /> Schedule visit
        </button>
      </PageHeading>
      <div class="property-summary">
        <div>
          <small>Maintenance plan</small>
          <strong>{p.frequency}</strong>
        </div>
        <div>
          <small>Next visit</small>
          <strong>
            {upcoming ? dayLabel(upcoming.scheduled_date) : "Not scheduled"}
          </strong>
        </div>
        <div>
          <small>Service records</small>
          <strong>{records.length}</strong>
        </div>
        <div>
          <small>Linked invoices</small>
          <strong>{invoices.length}</strong>
        </div>
      </div>
      <div class="overview-grid">
        <section class="garden-panel">
          <div class="panel-heading">
            <h2>Property care notes</h2>
            <Leaf size={18} />
          </div>
          <div class="panel-body">
            <h3>Maintenance requirements</h3>
            <p>{p.requirements || "No requirements recorded."}</p>
            <h3>Access & special instructions</h3>
            <p>{p.instructions || "No instructions recorded."}</p>
            <button
              class="text-button"
              onClick={() => navigate("/customers/" + p.customer_id)}
            >
              Open client profile <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
        <section class="garden-panel next-visit">
          <div class="panel-heading">
            <h2>Next garden visit</h2>
            <CalendarIcon />
          </div>
          <div class="panel-body">
            {upcoming ? (
              <>
                <h2>
                  {dayLabel(upcoming.scheduled_date, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </h2>
                <p>
                  {upcoming.scheduled_time} · {upcoming.duration} minutes
                </p>
                <CrewLabel
                  name={upcoming.technician_name}
                  color={upcoming.technician_color}
                />
                <button
                  class="btn btn-primary"
                  onClick={() => navigate("/jobs/" + upcoming.id)}
                >
                  Open visit <ArrowUpRight size={15} />
                </button>
              </>
            ) : (
              <Empty
                title="Ready for the next visit"
                text="Schedule this property's next service."
              />
            )}
          </div>
        </section>
      </div>
      <section class="garden-panel">
        <div class="panel-heading">
          <div>
            <h2>Permanent service history</h2>
            <p>Recorded completion reports, tasks, notes and photographs</p>
          </div>
        </div>
        <div class="service-timeline">
          {records.length ? (
            records.map((r: any) => {
              const s = JSON.parse(r.snapshot);
              return (
                <button onClick={() => setReport(r)}>
                  <span class="timeline-check">
                    <Check size={16} />
                  </span>
                  <span>
                    <strong>
                      {s.identifier} · {s.property}
                    </strong>
                    <p>
                      {s.crew || "Unassigned"} · Service date {dayLabel(s.date)}
                    </p>
                    <small>
                      Recorded{" "}
                      {new Date(r.created_at + "Z").toLocaleString("en-ZA", {
                        timeZone: "Africa/Johannesburg",
                      })}{" "}
                      SAST
                    </small>
                  </span>
                  <span>
                    <Badge status="completed" />
                    <ArrowUpRight size={16} />
                  </span>
                </button>
              );
            })
          ) : (
            <Empty
              title="The first chapter is still growing"
              text="Completed visits will create permanent care records here."
            />
          )}
        </div>
      </section>
      <section class="garden-panel">
        <div class="panel-heading">
          <h2>Visit history</h2>
          <span>Latest 200 visits</span>
        </div>
        <VisitTable jobs={visits} onOpen={(j) => navigate("/jobs/" + j.id)} />
      </section>
      <div class="overview-grid">
        <section class="garden-panel">
          <div class="panel-heading">
            <h2>Quotations</h2>
          </div>
          {quotes.map((q: any) => (
            <button class="billing-row" onClick={() => navigate("/quotes")}>
              <span>
                {q.requested_service}
                <small>{q.status}</small>
              </span>
              <b>{zar(q.total_cents / 100)}</b>
            </button>
          ))}
          {!quotes.length && <Empty title="No quotations recorded" />}
        </section>
        <section class="garden-panel">
          <div class="panel-heading">
            <h2>Billing history</h2>
          </div>
          {invoices.map((i: any) => (
            <button
              class="billing-row"
              onClick={() => navigate("/invoices/" + i.id)}
            >
              <span>
                {i.identifier}
                <small>{i.status}</small>
              </span>
              <b>{zar(i.total)}</b>
            </button>
          ))}
          {!invoices.length && <Empty title="No invoices recorded" />}
        </section>
      </div>
      {edit && <PropertyForm initial={p} onClose={() => setEdit(false)} />}
      {create && d && (
        <VisitForm
          data={d}
          propertyId={p.id}
          onClose={() => setCreate(false)}
        />
      )}
      {report && (
        <ServiceReport record={report} onClose={() => setReport(null)} />
      )}
    </div>
  );
}
function CalendarIcon() {
  return <Leaf size={18} />;
}
export function ServiceReport({
  record,
  onClose,
}: {
  record: any;
  onClose: () => void;
}) {
  const s = JSON.parse(record.snapshot);
  return (
    <GardenDialog title="Proof of garden service" onClose={onClose}>
      <article class="service-report">
        <div class="report-brand">
          <Leaf size={24} />
          <strong>Disa GardenOS</strong>
          <span>PROOF OF SERVICE</span>
        </div>
        <h2>{s.property}</h2>
        <p>
          {s.customer} · {s.suburb}
        </p>
        <div class="property-summary">
          <div>
            <small>Visit</small>
            <strong>{s.identifier}</strong>
          </div>
          <div>
            <small>Service date</small>
            <strong>{dayLabel(s.date)}</strong>
          </div>
          <div>
            <small>Crew</small>
            <strong>{s.crew || "Unassigned"}</strong>
          </div>
        </div>
        <Badge status={s.status} />
        <h3>Recorded tasks</h3>
        {s.tasks.map((t: any) => (
          <p>
            {t.checked ? "✓" : "—"} {t.label}
          </p>
        ))}
        <h3>Visit notes</h3>
        {s.activity?.map((n: any) => (
          <p>
            {n.content}
            <small> · {n.created_at} UTC</small>
          </p>
        ))}
        <h3>Completion notes</h3>
        <p>{s.notes || "No completion notes recorded."}</p>
        <div class="photo-grid">
          {s.photos.map((p: any) => (
            <figure>
              <img src={p.data} alt={p.name} />
              <figcaption>{p.name}</figcaption>
            </figure>
          ))}
        </div>
        <small>
          Recorded{" "}
          {new Date(record.created_at + "Z").toLocaleString("en-ZA", {
            timeZone: "Africa/Johannesburg",
          })}{" "}
          SAST. No customer sign-off or GPS verification recorded.
        </small>
        <button class="btn" onClick={() => window.print()}>
          <Printer size={16} /> Print service report
        </button>
      </article>
    </GardenDialog>
  );
}

async function compressPhoto(file: File) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 15000000
  )
    throw new Error("Choose a JPEG, PNG or WebP image smaller than 15 MB.");
  const image = await createImageBitmap(file);
  const ratio = Math.min(1, 1400 / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));
  canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();
  const data = canvas.toDataURL("image/jpeg", 0.65);
  if (data.length > 666000)
    throw new Error(
      "This photo is too detailed. Choose a smaller photo (compressed limit 500 KB).",
    );
  return data;
}
export function CrewVisit({ id }: { id: string }) {
  const { navigate } = useApp();
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [report, setReport] = useState(false);
  async function load() {
    const [j, extra] = await Promise.all([
      api<any>("GET", "/api/jobs/" + id),
      api<any>("GET", "/api/garden/visits/" + id),
    ]);
    setData({ ...j, ...extra, job: { ...j.job, ...extra.job } });
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id]);
  const mutate = async (fn: () => Promise<unknown>, message: string) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      changed();
      notify(message);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!data) return <LoadState error={error} retry={() => load()} />;
  const j = data.job;
  const completed = j.status === "completed",
    count = j.checklist?.filter((t: any) => t.checked).length || 0;
  return (
    <div class="garden-page crew-job-page">
      <button class="text-button" onClick={() => navigate("/crew")}>
        <ArrowLeft size={16} /> Back to crew visits
      </button>
      <PageHeading
        eyebrow={j.identifier}
        title={j.property_name || j.customer_name || "Garden visit"}
        description={`${dayLabel(j.scheduled_date, { weekday: "long", day: "numeric", month: "long" })} · ${j.scheduled_time} · ${j.duration} minutes`}
      >
        <Badge status={j.status} />
        <button class="btn" onClick={() => navigate("/jobs/" + id)}>
          Office view
        </button>
      </PageHeading>
      <section class="garden-panel">
        <div class="panel-body">
          <h2>
            <MapPin size={20} /> {j.address}
          </h2>
          <p>
            {j.instructions || "No special property instructions recorded."}
          </p>
          <p>{j.notes || "No additional visit notes."}</p>
          <CrewLabel name={j.technician_name} color={j.technician_color} />
        </div>
      </section>
      {error && (
        <div class="inline-error" role="alert">
          {error}
        </div>
      )}
      {!completed && j.status !== "in_progress" && (
        <button
          class="btn btn-primary crew-start"
          disabled={busy}
          onClick={() =>
            mutate(
              () => api("PUT", "/api/jobs/" + id, { status: "in_progress" }),
              "Visit started",
            )
          }
        >
          Start garden visit <ArrowUpRight size={17} />
        </button>
      )}
      <section class="garden-panel">
        <div class="panel-heading">
          <div>
            <h2>Garden care checklist</h2>
            <p>
              {count} of {j.checklist?.length || 0} tasks completed
            </p>
          </div>
          <Leaf size={20} />
        </div>
        <div class="field-checklist">
          {j.checklist?.map((t: any) => (
            <label class={t.checked ? "done" : ""}>
              <input
                type="checkbox"
                checked={!!t.checked}
                disabled={busy || completed}
                onChange={() =>
                  mutate(
                    () => api("PUT", "/api/checklist/" + t.id),
                    "Checklist saved",
                  )
                }
              />
              <span>{t.label}</span>
              {!!t.checked && <Check size={18} />}
            </label>
          ))}
        </div>
        {!completed && (
          <form
            noValidate
            class="inline-note-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const label = String(new FormData(form).get("task") || "").trim();
              if (label)
                void mutate(
                  () => api("POST", `/api/jobs/${id}/checklist`, { label }),
                  "Task added",
                ).then(() => form.reset());
            }}
          >
            <label>
              Add a configurable task
              <input
                name="task"
                maxLength={200}
                placeholder="e.g. Irrigation inspection"
              />
            </label>
            <button class="btn" disabled={busy}>
              Add task
            </button>
          </form>
        )}
      </section>
      <section class="garden-panel">
        <div class="panel-heading">
          <h2>Visit notes</h2>
          <FileText size={18} />
        </div>
        <div class="panel-body">
          {j.job_notes?.map((n: any) => (
            <p class="visit-note">
              {n.content}
              <small>{n.created_at} UTC</small>
            </p>
          ))}
          {!completed && (
            <form
              noValidate
              class="inline-note-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const content = String(
                  new FormData(form).get("note") || "",
                ).trim();
                if (content)
                  void mutate(
                    () => api("POST", `/api/jobs/${id}/notes`, { content }),
                    "Note saved",
                  ).then(() => form.reset());
              }}
            >
              <label>
                Add a note
                <textarea
                  class="resize-none"
                  name="note"
                  rows={3}
                  maxLength={5000}
                />
              </label>
              <button class="btn" disabled={busy}>
                Save note
              </button>
            </form>
          )}
        </div>
      </section>
      <section class="garden-panel">
        <div class="panel-heading">
          <div>
            <h2>Completion photographs</h2>
            <p>
              JPEG, PNG or WebP · up to six photos · compressed before upload
            </p>
          </div>
          <Camera size={20} />
        </div>
        <div class="panel-body">
          <div class="photo-grid">
            {data.photos.map((p: any) => (
              <figure>
                <img src={p.data} alt={p.name} />
                <figcaption>{p.name}</figcaption>
              </figure>
            ))}
          </div>
          {!completed && (
            <label class="photo-upload">
              <Camera size={22} />
              <strong>
                {busy ? "Saving photo…" : "Choose completion photo"}
              </strong>
              <span>
                Maximum original size 15 MB; saved image up to 500 KB.
              </span>
              <input
                type="file"
                aria-label="Choose completion photo"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file)
                    void mutate(
                      async () =>
                        api("POST", `/api/garden/visits/${id}/photos`, {
                          name: file.name,
                          data: await compressPhoto(file),
                        }),
                      "Photo saved",
                    );
                  e.currentTarget.value = "";
                }}
              />
            </label>
          )}
        </div>
      </section>
      {!completed ? (
        <section class="garden-panel">
          <div class="panel-heading">
            <h2>Complete this garden visit</h2>
          </div>
          <div class="panel-body">
            <p>
              Completion saves a permanent report of the crew, tasks, notes and
              photographs recorded now.
            </p>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                const notes = String(
                  new FormData(e.currentTarget).get("completion_notes") || "",
                );
                void mutate(
                  () =>
                    api("PUT", "/api/jobs/" + id, {
                      status: "completed",
                      completion_notes: notes,
                    }),
                  "Visit completed. Service report saved.",
                );
              }}
            >
              <Field label="Completion summary">
                <textarea
                  class="resize-none"
                  name="completion_notes"
                  rows={3}
                />
              </Field>
              <button
                class="btn btn-primary"
                disabled={busy || j.status === "cancelled"}
              >
                <Check size={17} /> Complete visit & save report
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section class="garden-panel">
          <div class="panel-body">
            <h2>All done. A garden well cared for.</h2>
            <p>
              The permanent service report is available in the property’s
              history.
            </p>
            <div class="heading-actions">
              {data.record && (
                <button class="btn" onClick={() => setReport(true)}>
                  <Printer size={16} /> View service report
                </button>
              )}
              <button
                class="btn btn-primary"
                disabled={busy}
                onClick={() =>
                  mutate(async () => {
                    const result = await api<any>(
                      "POST",
                      `/api/jobs/${id}/invoice`,
                    );
                    navigate("/invoices/" + result.invoice_id);
                  }, "Linked invoice ready")
                }
              >
                Generate linked invoice
              </button>
            </div>
          </div>
        </section>
      )}
      {report && (
        <ServiceReport record={data.record} onClose={() => setReport(false)} />
      )}
    </div>
  );
}

export function Quotations() {
  const { data: d, error, retry } = useGarden();
  const [page, setPage] = useState(
      Math.max(
        1,
        Number(new URLSearchParams(location.search).get("page")) || 1,
      ),
    ),
    [create, setCreate] = useState(false),
    [convert, setConvert] = useState<any>(null),
    [detail, setDetail] = useState<any>(null),
    [transition, setTransition] = useState<any>(null),
    [actionError, setError] = useState("");
  const paged = useGarden(undefined, undefined, page);
  const data = paged.data || d;
  if (!data) return <LoadState error={error} retry={retry} />;
  return (
    <div class="garden-page">
      <PageHeading
        title="Quotations & enquiries"
        description="From the first conversation to the first garden visit."
      >
        <button class="btn btn-primary" onClick={() => setCreate(true)}>
          <Plus size={16} /> New quotation / enquiry
        </button>
      </PageHeading>
      <div class="quote-stages">
        {["enquiry", "prepared", "sent", "accepted"].map((s, i) => (
          <div>
            <span>{i + 1}</span>
            <strong>{s === "prepared" ? "Quote prepared" : s}</strong>
            <ArrowUpRight size={17} />
          </div>
        ))}
      </div>
      {actionError && (
        <p class="inline-error" role="alert">
          {actionError}
        </p>
      )}
      <section class="garden-panel">
        <div class="panel-heading">
          <h2>Conversations in progress</h2>
          <p>Demonstration pricing · ZAR</p>
        </div>
        <div class="table-scroll">
          <table class="garden-table">
            <thead>
              <tr>
                <th>Property / request</th>
                <th>Consultation</th>
                <th>Follow-up</th>
                <th>Total incl. VAT</th>
                <th>Stage</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {data.quotes.map((q: any) => (
                <tr>
                  <td>
                    <button class="record-link" onClick={() => setDetail(q)}>
                      {q.property_name}
                    </button>
                    <small>{q.requested_service}</small>
                  </td>
                  <td>{q.consultation_status}</td>
                  <td>{q.follow_up ? dayLabel(q.follow_up) : "Not set"}</td>
                  <td>{zar(q.total_cents / 100)}</td>
                  <td>
                    <Badge status={q.status} />
                  </td>
                  <td>
                    {q.status === "accepted" ? (
                      <button
                        class="btn btn-sm"
                        disabled={!!q.job_id}
                        onClick={() => setConvert(q)}
                      >
                        {q.job_id ? "Visits created" : "Schedule visits"}
                      </button>
                    ) : q.status !== "declined" ? (
                      <div class="heading-actions">
                        <button
                          class="btn btn-sm"
                          onClick={() =>
                            setTransition({
                              q,
                              status: (
                                {
                                  enquiry: "prepared",
                                  prepared: "sent",
                                  sent: "accepted",
                                } as any
                              )[q.status],
                            })
                          }
                        >
                          {
                            (
                              {
                                enquiry: "Prepare quote",
                                prepared: "Mark as sent",
                                sent: "Record acceptance",
                              } as any
                            )[q.status]
                          }
                        </button>
                        {q.status === "sent" && (
                          <button
                            class="btn btn-sm"
                            onClick={() =>
                              setTransition({ q, status: "declined" })
                            }
                          >
                            Declined
                          </button>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.quotes.length && (
            <Empty
              title="Room for something new"
              text="Record an enquiry or prepare a quotation."
            />
          )}
        </div>
        <Pager page={page} total={data.quotes_total} onPage={setPage} />
      </section>
      {create && <QuoteForm data={data} onClose={() => setCreate(false)} />}
      {convert && (
        <VisitForm
          data={data}
          propertyId={convert.property_id}
          quoteId={convert.id}
          onClose={() => setConvert(null)}
        />
      )}
      {detail && (
        <GardenDialog title="Quotation detail" onClose={() => setDetail(null)}>
          <div class="panel-body">
            <h2>{detail.property_name}</h2>
            <p>{detail.requested_service}</p>
            <Badge status={detail.status} />
            {JSON.parse(detail.lines_json).map((l: any) => (
              <div class="billing-row">
                <span>
                  {l.description}
                  <small>
                    {l.quantity} × {zar(l.unit_price)}
                  </small>
                </span>
                <strong>{zar(l.quantity * l.unit_price)}</strong>
              </div>
            ))}
            <p>Discount: {zar(detail.discount_cents / 100)}</p>
            <p>Subtotal: {zar(detail.subtotal_cents / 100)}</p>
            <p>
              VAT ({detail.tax_rate}%): {zar(detail.tax_cents / 100)}
            </p>
            <h3>Total: {zar(detail.total_cents / 100)}</h3>
            <p>Valid until: {detail.valid_until || "Not recorded"}</p>
            <p>{detail.notes}</p>
            <p class="field-help">
              Fictional demo pricing. Not an official Disa Tuine rate.
            </p>
          </div>
        </GardenDialog>
      )}
      {transition && (
        <GardenDialog
          title="Update quotation stage"
          onClose={() => setTransition(null)}
        >
          <GardenForm
            label={`Record ${transition.status}`}
            onCancel={() => setTransition(null)}
            onSave={async () => {
              await api("PUT", `/api/garden/quotes/${transition.q.id}/status`, {
                status: transition.status,
              });
              changed();
              notify("Quotation stage saved");
              setTransition(null);
            }}
          >
            <p>
              Record this quotation for {transition.q.property_name} as{" "}
              <strong>{transition.status}</strong>. This records an office
              action; no email or customer message is sent.
            </p>
          </GardenForm>
        </GardenDialog>
      )}
    </div>
  );
}
export function CustomerGardens({ id }: { id: string }) {
  const { navigate } = useApp();
  const [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let current = true;
    api("GET", "/api/garden/customers/" + id)
      .then((d) => {
        if (current) setData(d);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [id]);
  return (
    <section class="garden-panel">
      <div class="panel-heading">
        <h2>Garden properties & service plans</h2>
        <button class="text-button" onClick={() => navigate("/properties")}>
          Manage properties <ArrowUpRight size={15} />
        </button>
      </div>
      {error ? (
        <p role="alert" class="inline-error">
          {error}
        </p>
      ) : data ? (
        <>
          <div class="panel-body">
            {data.properties.length ? (
              data.properties.map((p: any) => (
                <button
                  class="billing-row"
                  onClick={() => navigate("/properties/" + p.id)}
                >
                  <span>
                    {p.name}
                    <small>
                      {p.suburb} · {p.frequency} care
                    </small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))
            ) : (
              <p>No garden properties linked yet.</p>
            )}
            <p class="field-help">
              {data.quotes.length} recent quotations · {data.payments.length}{" "}
              recent recorded receipts. Open billing for the full invoice
              record.
            </p>
          </div>
        </>
      ) : (
        <p class="panel-body" role="status">
          Loading garden properties…
        </p>
      )}
    </section>
  );
}
