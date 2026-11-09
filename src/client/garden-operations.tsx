import { useEffect, useState } from "preact/hooks";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Leaf,
  Users,
  FileText,
  Receipt,
  CloudRain,
  MapPin,
  RotateCw,
  SlidersHorizontal,
  CircleCheck,
  Printer,
} from "lucide-preact";
import { useApp } from "./context";
import { api } from "./api";
import {
  useGarden,
  PageHeading,
  LoadState,
  dayLabel,
  zar,
  addDays,
  monday,
  localDay,
  Empty,
  Badge,
  CrewLabel,
  SearchBox,
  notify,
  changed,
} from "./garden-ui";
import { VisitForm, RescheduleForm } from "./garden-forms";

export function OperationsOverview() {
  const { navigate } = useApp();
  const { data: d, error, retry } = useGarden();
  const [create, setCreate] = useState(false),
    [busy, setBusy] = useState(false),
    [seedError, setSeedError] = useState("");
  if (!d) return <LoadState error={error} retry={retry} />;
  const m = d.metrics;
  const today = d.visits.filter((j: any) => j.scheduled_date === d.today);
  const active = d.crews.filter((c: any) => c.active);
  const cards = [
    ["This week’s visits", m.scheduled, CalendarDays, "/schedule"],
    ["Completed visits", m.completed, CircleCheck, "/reports"],
    ["Active crews", active.length, Users, "/dispatch"],
    [
      "Visits remaining",
      Math.max(0, m.scheduled - m.completed),
      Clock,
      "/jobs",
    ],
    ["Pending quotes", m.pending_quotes, FileText, "/quotes"],
    ["Outstanding invoices", m.outstanding_invoices, Receipt, "/invoices"],
  ] as const;
  const counts = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(d.start, i);
    return {
      day,
      total: d.visits.filter(
        (j: any) => j.scheduled_date === day && j.status !== "cancelled",
      ).length,
      done: d.visits.filter(
        (j: any) => j.scheduled_date === day && j.status === "completed",
      ).length,
    };
  });
  const max = Math.max(1, ...counts.map((x) => x.total));
  return (
    <div class="garden-page overview-v2">
      <PageHeading
        title="Operations Overview"
        description="Schedule, crew allocation and service progress."
      >
        <button class="btn" onClick={() => navigate("/reports")}>
          <ArrowUpRight size={16} /> View reports
        </button>
        <button class="btn btn-primary" onClick={() => setCreate(true)}>
          <Plus size={16} /> Schedule visit
        </button>
      </PageHeading>
      {error && <LoadState error={error} retry={retry} />}
      <section class="command-deck">
        <div class="command-copy"><span class="command-eyebrow">WORKSPACE / {dayLabel(d.today,{day:'numeric',month:'long'})}</span><h2>Your operations,<br/><span>in perspective.</span></h2><p>Review the schedule, allocate your crews,<br/>and keep every visit on track.</p><div class="command-actions"><button class="btn btn-primary" onClick={()=>navigate('/schedule')}>Open schedule <ArrowUpRight size={17}/></button><button class="btn" onClick={()=>navigate('/crew')}>Crew workspace <Users size={16}/></button></div><div class="command-footnote"><span/> FICTIONAL WORKSPACE · YOUR CHANGES STAY IN THIS BROWSER</div></div>
        <div class="orbit-panel"><div class="orbit-caption"><span>WEEKLY COMPLETION</span><ArrowUpRight size={18}/></div><div class="momentum-ring" style={{'--progress':`${m.scheduled?m.completed/m.scheduled*360:0}deg`}}><div><strong>{m.scheduled?Math.round(m.completed/m.scheduled*100):0}<small>%</small></strong><span>visits complete</span></div></div><div class="momentum-counts"><span><b>{m.completed}</b> completed</span><span><b>{m.scheduled-m.completed}</b> remaining</span></div><div class="orbit-label">Scheduled visits · current week</div></div>
      </section>
      <section class="today-strip"><div><span class="today-dot"/><strong>Today at a glance</strong><small>{today.length} garden visits</small></div>{active.map((c:any)=>{const assigned=today.filter((j:any)=>j.technician_id===c.id);return <button onClick={()=>navigate('/crew?crew='+c.id)}><span class="mini-avatar" style={{background:c.color}}>{c.name[0]}</span><span><strong>{c.name}</strong><small>{assigned.length} visits · {assigned.filter((j:any)=>j.status==='completed').length} done</small></span><ArrowUpRight size={15}/></button>;})}</section>
      {!d.demo && d.properties_total === 0 && (
        <section class="garden-panel demo-invite">
          <div>
            <h3>Explore a working garden business</h3>
            <p>
              Load 30 fictional properties, three crews, visits, quotes and demo
              receipts into an empty workspace.
            </p>
            <p class="form-error" role="alert">
              {seedError}
            </p>
          </div>
          <button
            class="btn btn-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await api("POST", "/api/garden/demo", {});
                changed();
                notify("Fictional demonstration workspace loaded");
              } catch (e) {
                setSeedError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Loading demo…" : "Load fictional demo"}
          </button>
        </section>
      )}
      <div class="garden-kpis">
        {cards.map(([label, value, Icon, path]) => (
          <button class="garden-kpi" onClick={() => navigate(path)}>
            <div>
              <Icon size={17} />
              <ArrowUpRight size={13} />
            </div>
            <strong>{value}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
      <div class="overview-grid">
        <section class="garden-panel operations-chart">
          <div class="panel-heading">
            <div>
              <h2>Weekly operations snapshot</h2>
              <p>A clear view of the week’s progress</p>
            </div>
            <span class="date-tag">
              {dayLabel(d.start)} – {dayLabel(d.end)}
            </span>
          </div>
          <div class="chart-legend">
            <span>
              <i /> Scheduled
            </span>
            <span>
              <i /> Completed
            </span>
            <strong>
              {m.scheduled ? Math.round((m.completed / m.scheduled) * 100) : 0}%
              completion
            </strong>
          </div>
          <div
            class="bar-chart"
            role="img"
            aria-label={`${m.scheduled} scheduled, ${m.completed} completed this week`}
          >
            <div class="chart-y">
              <span>{max}</span>
              <span>{Math.round(max / 2)}</span>
              <span>0</span>
            </div>
            {counts.map((x) => (
              <div class={`chart-day ${x.day === d.today ? "today" : ""}`}>
                <div
                  class="bar-pair"
                  title={`${dayLabel(x.day)}: ${x.total} scheduled, ${x.done} completed`}
                >
                  <span style={{ height: `${(x.total / max) * 100}%` }} />
                  <span style={{ height: `${(x.done / max) * 100}%` }} />
                </div>
                <span>{dayLabel(x.day, { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        </section>
        <section class="garden-panel action-panel">
          <div class="panel-heading">
            <div>
              <h2>Action required</h2>
              <p>A few things to keep on your radar</p>
            </div>
            <span class="attention-dot" />
          </div>
          {[
            [
              m.unassigned,
              "Unassigned visits",
              "Choose the right crew",
              "/dispatch",
            ],
            [m.overdue, "Overdue visits", "Review & reschedule", "/schedule"],
            [
              m.pending_quotes,
              "Pending quotations",
              "Keep conversations moving",
              "/quotes",
            ],
            [
              m.outstanding_invoices,
              "Outstanding invoices",
              "Review balances",
              "/invoices",
            ],
          ].map(([count, title, sub, path]) => (
            <button class="action-row" onClick={() => navigate(String(path))}>
              <span class="action-count">{count}</span>
              <span>
                <strong>{title}</strong>
                <small>{sub}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </section>
      </div>
      <div class="panel-heading outside">
        <div>
          <h2>
            Today’s crews <span class="count-chip">{active.length}</span>
          </h2>
          <p>Assignments and completion for today.</p>
        </div>
        <button class="text-button" onClick={() => navigate("/dispatch")}>
          Crew dispatch <ArrowRight size={15} />
        </button>
      </div>
      <div class="crew-cards">
        {active.length ? (
          active.map((c: any, i: number) => {
            const jobs = today.filter((j: any) => j.technician_id === c.id),
              done = jobs.filter((j: any) => j.status === "completed").length;
            return (
              <button
                class="crew-card"
                onClick={() => navigate("/crew?crew=" + c.id)}
              >
                <div class="crew-card-top">
                  <span class="crew-avatar" style={{ "--crew": c.color }}>
                    {c.name.slice(0, 1)}
                    <Leaf size={17} />
                  </span>
                  <span>
                    <strong>{c.name}</strong>
                    <small>
                      {jobs.length
                        ? "Out in the gardens"
                        : "Ready for assignments"}
                    </small>
                  </span>
                  <ArrowUpRight size={16} />
                </div>
                <div class="crew-numbers">
                  <span>
                    <b>{jobs.length}</b> assigned
                  </span>
                  <span>
                    <b>{done}</b> completed
                  </span>
                  <span>
                    <b>{jobs.length - done}</b> remaining
                  </span>
                </div>
                <div class="garden-progress">
                  <i
                    style={{
                      width: `${jobs.length ? (done / jobs.length) * 100 : 0}%`,
                      background: c.color,
                    }}
                  />
                </div>
                <small>
                  {jobs.length ? Math.round((done / jobs.length) * 100) : 0}% of
                  today’s visits complete
                </small>
              </button>
            );
          })
        ) : (
          <Empty
            title="No crews yet"
            text="Add crews in Settings to start assigning visits."
          />
        )}
      </div>
      <div class="overview-grid lower">
        <section class="garden-panel">
          <div class="panel-heading">
            <div>
              <h2>Upcoming visits</h2>
              <p>The next stops on your schedule</p>
            </div>
            <button class="text-button" onClick={() => navigate("/schedule")}>
              View schedule <ArrowUpRight size={14} />
            </button>
          </div>
          <VisitTable
            jobs={d.visits
              .filter(
                (j: any) =>
                  j.status !== "completed" &&
                  j.status !== "cancelled" &&
                  j.scheduled_date >= d.today,
              )
              .slice(0, 5)}
            onOpen={(j) => navigate("/jobs/" + j.id)}
          />
        </section>
        <section class="garden-panel">
          <div class="panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Recorded across your workspace</p>
            </div>
            <RotateCw size={16} />
          </div>
          <div class="activity-list">
            {d.activity.length ? (
              d.activity.slice(0, 4).map((a: any) => (
                <div>
                  <span class="activity-icon">
                    <Check size={13} />
                  </span>
                  <span>
                    <strong>{a.action}</strong>
                    <p>{a.name}</p>
                    <small>
                      {new Date(a.created_at + "Z").toLocaleString("en-ZA", {
                        timeZone: "Africa/Johannesburg",
                      })}{" "}
                      SAST
                    </small>
                  </span>
                </div>
              ))
            ) : (
              <Empty
                title="A fresh start"
                text="Completions and payments will appear here."
              />
            )}
          </div>
        </section>
      </div>
      {create && <VisitForm data={d} onClose={() => setCreate(false)} />}
    </div>
  );
}

export function VisitTable({
  jobs,
  onOpen,
  onMove,
  selection,
  onSelect,
}: {
  jobs: any[];
  onOpen: (j: any) => void;
  onMove?: (j: any) => void;
  selection?: string[];
  onSelect?: (id: string) => void;
}) {
  if (!jobs.length)
    return (
      <Empty
        title="No visits to show"
        text="Try another date, clear filters, or schedule a visit."
      />
    );
  return (
    <div class="table-scroll">
      <table class="garden-table">
        <thead>
          <tr>
            {onSelect && <th>Select</th>}
            <th>Property / client</th>
            <th>Suburb</th>
            <th>Crew</th>
            <th>Visit</th>
            <th>Status</th>
            <th>
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id}>
              {onSelect && (
                <td>
                  <input
                    aria-label={`Select ${j.property_name}`}
                    type="checkbox"
                    disabled={["completed", "cancelled"].includes(j.status)}
                    checked={selection?.includes(j.id)}
                    onChange={() => onSelect(j.id)}
                  />
                </td>
              )}
              <td>
                <button class="record-link" onClick={() => onOpen(j)}>
                  {j.property_name || j.customer_name}
                </button>
                <small>{j.service_type_name || "Garden maintenance"}</small>
              </td>
              <td>{j.suburb || "—"}</td>
              <td>
                <CrewLabel
                  name={j.technician_name}
                  color={j.technician_color}
                />
              </td>
              <td>
                {j.scheduled_time}
                <small>
                  {dayLabel(j.scheduled_date)} · {j.duration} min
                </small>
              </td>
              <td>
                <Badge status={j.status} />
              </td>
              <td>
                {onMove && !["completed", "cancelled"].includes(j.status) ? (
                  <button class="btn btn-sm" onClick={() => onMove(j)}>
                    Reschedule
                  </button>
                ) : (
                  <button
                    class="btn-icon"
                    aria-label={`Open ${j.property_name || j.identifier}`}
                    onClick={() => onOpen(j)}
                  >
                    <ArrowUpRight size={16} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GardenPlanner({
  dispatch = false,
  crewView = false,
}: {
  dispatch?: boolean;
  crewView?: boolean;
}) {
  const { navigate } = useApp();
  const [start, setStart] = useState(
      () =>
        new URLSearchParams(location.search).get("start") ||
        (crewView ? localDay() : monday()),
    ),
    [mode, setMode] = useState(
      new URLSearchParams(location.search).get("mode") ||
        (crewView ? "day" : "week"),
    ),
    [search, setSearch] = useState(
      new URLSearchParams(location.search).get("search") || "",
    ),
    [crew, setCrew] = useState(
      new URLSearchParams(location.search).get("crew") || "",
    ),
    [suburb, setSuburb] = useState(
      new URLSearchParams(location.search).get("suburb") || "",
    ),
    [create, setCreate] = useState(false),
    [move, setMove] = useState<any[] | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    history.replaceState(
      null,
      "",
      location.pathname +
        "?" +
        new URLSearchParams({ start, mode, search, crew, suburb }),
    );
  }, [start, mode, search, crew, suburb]);
  const monthStart = start.slice(0, 7) + "-01";
  const monthDate = new Date(monthStart + "T12:00:00Z");
  monthDate.setUTCMonth(monthDate.getUTCMonth() + 1);
  monthDate.setUTCDate(0);
  const end =
    mode === "month"
      ? monthDate.toISOString().slice(0, 10)
      : addDays(start, mode === "day" ? 0 : 6);
  const shiftMonth = (delta: number) => {
    const d = new Date(monthStart + "T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + delta);
    return d.toISOString().slice(0, 10);
  };
  const { data: d, error, retry } = useGarden(start, end);
  if (!d) return <LoadState error={error} retry={retry} />;
  const jobs = d.visits.filter(
    (j: any) =>
      (!crew || j.technician_id === crew) &&
      (!suburb || j.suburb === suburb) &&
      `${j.property_name} ${j.customer_name} ${j.suburb} ${j.service_type_name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const days = Array.from(
    {
      length:
        mode === "month" ? monthDate.getUTCDate() : mode === "day" ? 1 : 7,
    },
    (_, i) => addDays(start, i),
  );
  const crews = crew ? d.crews.filter((c: any) => c.id === crew) : d.crews;
  const open = (j: any) => navigate((crewView ? "/crew/" : "/jobs/") + j.id);
  return (
    <div class="garden-page">
      <PageHeading
        eyebrow={
          crewView ? "MADE FOR THE FIELD" : "PLAN WELL. GROW BEAUTIFULLY."
        }
        title={
          crewView
            ? "Your garden visits"
            : dispatch
              ? "Crew Dispatch"
              : "Weekly Schedule"
        }
        description={
          crewView
            ? "Your day, your properties, your next step. Updates save when you are online."
            : dispatch
              ? "The right crew, at the right property. A calmer day starts here."
              : "A little planning makes every garden visit count."
        }
      >
        <button
          class="btn"
          onClick={() => {
            setMode("day");
            setStart(localDay());
          }}
        >
          Today
        </button>
        {!crewView && (
          <button class="btn btn-primary" onClick={() => setCreate(true)}>
            <Plus size={16} /> Schedule visit
          </button>
        )}
      </PageHeading>
      {error && <LoadState error={error} retry={retry} />}
      <section class="garden-panel planner-panel">
        <div class="planner-toolbar">
          <div class="date-control">
            <button
              class="btn-icon"
              aria-label="Previous period"
              onClick={() => {
                setStart(
                  mode === "month"
                    ? shiftMonth(-1)
                    : addDays(start, mode === "day" ? -1 : -7),
                );
                setSelected([]);
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <strong>
              {dayLabel(start)} —{" "}
              {dayLabel(end, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </strong>
            <button
              class="btn-icon"
              aria-label="Next period"
              onClick={() => {
                setStart(
                  mode === "month"
                    ? shiftMonth(1)
                    : addDays(start, mode === "day" ? 1 : 7),
                );
                setSelected([]);
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div class="segmented" aria-label="Calendar mode">
            {["day", "week", "month"].map((x) => (
              <button
                aria-pressed={mode === x}
                class={mode === x ? "active" : ""}
                onClick={() => {
                  if (x === "month") setStart(monthStart);
                  setMode(x);
                  setSelected([]);
                }}
              >
                {x === "month"
                  ? "Month summary"
                  : x === "day"
                    ? "Daily"
                    : "Weekly"}
              </button>
            ))}
          </div>
        </div>
        <div class="planner-filters">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search property, client or service…"
          />
          <label class="filter-select">
            <Users size={15} />
            <select
              aria-label="Filter by crew"
              value={crew}
              onChange={(e) => setCrew(e.currentTarget.value)}
            >
              <option value="">All crews</option>
              {d.crews.map((c: any) => (
                <option value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label class="filter-select">
            <MapPin size={15} />
            <select
              aria-label="Filter by suburb"
              value={suburb}
              onChange={(e) => setSuburb(e.currentTarget.value)}
            >
              <option value="">All suburbs</option>
              {[...new Set(d.visits.map((j: any) => j.suburb))].map(
                (s: any) => (
                  <option>{s}</option>
                ),
              )}
            </select>
          </label>
          <label class="filter-select">
            <CalendarDays size={15} />
            <input
              type="date"
              aria-label="Schedule start date"
              value={start}
              onChange={(e) => {
                if (e.currentTarget.value) setStart(e.currentTarget.value);
              }}
            />
          </label>
        </div>
        {dispatch || crewView ? (
          <>
            <div class="dispatch-summary">
              {d.crews.map((c: any) => (
                <button
                  class={`dispatch-crew ${crew === c.id ? "selected" : ""}`}
                  onClick={() => setCrew(crew === c.id ? "" : c.id)}
                >
                  <CrewLabel name={c.name} color={c.color} />
                  <strong>
                    {
                      d.visits.filter((j: any) => j.technician_id === c.id)
                        .length
                    }{" "}
                    visits
                  </strong>
                  <small>{c.active ? "Available" : "Unavailable"}</small>
                </button>
              ))}
            </div>
            {!crewView && (
              <div class="bulk-bar">
                <span>
                  <CloudRain size={17} /> Rain disruption planning ·{" "}
                  {selected.length} selected
                </span>
                <button
                  class="btn"
                  disabled={!selected.length}
                  onClick={() =>
                    setMove(
                      d.visits.filter((j: any) => selected.includes(j.id)),
                    )
                  }
                >
                  Reschedule selected visits
                </button>
              </div>
            )}
            {crewView ? (
              <div class="field-visit-list">
                {jobs.length ? (
                  jobs.map((j: any) => (
                    <button class="field-visit" onClick={() => open(j)}>
                      <div>
                        <span class="field-time">{j.scheduled_time}</span>
                        <Badge status={j.status} />
                      </div>
                      <h2>{j.property_name}</h2>
                      <p>
                        <MapPin size={15} /> {j.suburb} ·{" "}
                        {dayLabel(j.scheduled_date)}
                      </p>
                      <p>
                        {j.instructions ||
                          "No special access instructions recorded."}
                      </p>
                      <footer>
                        <CrewLabel
                          name={j.technician_name}
                          color={j.technician_color}
                        />
                        <ArrowRight size={18} />
                      </footer>
                    </button>
                  ))
                ) : (
                  <Empty />
                )}
              </div>
            ) : (
              <VisitTable
                jobs={jobs}
                onOpen={open}
                onMove={(j) => setMove([j])}
                selection={selected}
                onSelect={(id) =>
                  setSelected((ids) =>
                    ids.includes(id)
                      ? ids.filter((i) => i !== id)
                      : [...ids, id],
                  )
                }
              />
            )}
          </>
        ) : mode === "month" ? (
          <div class="month-summary">
            {days.map((day) => {
              const visits = jobs.filter((j: any) => j.scheduled_date === day);
              return (
                <button
                  onClick={() => {
                    setStart(day);
                    setMode("day");
                  }}
                >
                  <span>
                    {dayLabel(day, { weekday: "short", day: "numeric" })}
                  </span>
                  <strong>{visits.length}</strong>
                  <small>
                    {visits.filter((j: any) => j.status === "completed").length}{" "}
                    completed
                  </small>
                </button>
              );
            })}
          </div>
        ) : (
          <div class="planner-scroll">
            <div class="crew-planner" style={{ "--days": days.length }}>
              <div class="planner-corner">
                CREW / DAY<span>{jobs.length} visits in view</span>
              </div>
              {days.map((day) => (
                <div
                  class={`planner-day ${day === localDay() ? "current" : ""}`}
                >
                  <span>{dayLabel(day, { weekday: "short" })}</span>
                  <strong>{dayLabel(day, { day: "numeric" })}</strong>
                  <small>
                    {jobs.filter((j: any) => j.scheduled_date === day).length}{" "}
                    visits
                  </small>
                </div>
              ))}
              {[
                ...crews,
                { id: null, name: "Unassigned", color: "#B38E58" },
              ].map((c: any) => (
                <>
                  <div class="planner-crew">
                    <span class="crew-monogram" style={{ background: c.color }}>
                      {c.name.slice(0, 1)}
                    </span>
                    <strong>{c.name}</strong>
                    <small>
                      {jobs.filter((j: any) => j.technician_id === c.id).length}{" "}
                      visits
                    </small>
                  </div>
                  {days.map((day) => (
                    <div
                      class={`planner-cell ${day === localDay() ? "current" : ""}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const j = jobs.find(
                          (j: any) =>
                            j.id === e.dataTransfer?.getData("text/plain"),
                        );
                        if (j && !["completed", "cancelled"].includes(j.status))
                          setMove([
                            { ...j, scheduled_date: day, technician_id: c.id },
                          ]);
                      }}
                    >
                      {jobs
                        .filter(
                          (j: any) =>
                            j.scheduled_date === day &&
                            j.technician_id === c.id,
                        )
                        .map((j: any) => {
                          const conflict = jobs.some(
                            (k: any) =>
                              k.id !== j.id &&
                              c.id &&
                              k.technician_id === c.id &&
                              k.scheduled_date === day &&
                              !["completed", "cancelled"].includes(k.status) &&
                              !["completed", "cancelled"].includes(j.status) &&
                              toMinutes(k.scheduled_time) <
                                toMinutes(j.scheduled_time) + j.duration &&
                              toMinutes(k.scheduled_time) + k.duration >
                                toMinutes(j.scheduled_time),
                          );
                          return (
                            <article
                              class={`visit-slip ${j.status}`}
                              style={{ "--crew": c.color }}
                              draggable={
                                !["completed", "cancelled"].includes(j.status)
                              }
                              onDragStart={(e) =>
                                e.dataTransfer?.setData("text/plain", j.id)
                              }
                            >
                              <div>
                                <span>{j.scheduled_time}</span>
                                {j.is_recurring ? <RotateCw size={11} /> : null}
                              </div>
                              <button
                                class="slip-property"
                                onClick={() => open(j)}
                              >
                                {j.property_name}
                              </button>
                              <small>{j.suburb}</small>
                              <p>{j.service_type_name || "Garden care"}</p>
                              <footer>
                                <span>{j.duration} min</span>
                                <Badge status={j.status} />
                              </footer>
                              {conflict && (
                                <strong class="conflict-label">
                                  Crew overlap
                                </strong>
                              )}
                              {!["completed", "cancelled"].includes(
                                j.status,
                              ) && (
                                <button
                                  class="slip-edit"
                                  onClick={() => setMove([j])}
                                >
                                  Move / assign <ArrowUpRight size={11} />
                                </button>
                              )}
                            </article>
                          );
                        })}
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        )}
        <div class="planner-foot">
          <span>
            <span class="legend-dot" /> Scheduled{" "}
            <span class="legend-dot complete" /> Completed
          </span>
          <span>
            Move a visit by dragging, or use “Move / assign”. Times shown in
            SAST.
          </span>
        </div>
      </section>
      {create && <VisitForm data={d} onClose={() => setCreate(false)} />}
      {move && (
        <RescheduleForm
          jobs={move}
          data={d}
          onClose={() => {
            setMove(null);
            setSelected([]);
          }}
        />
      )}
    </div>
  );
}
function toMinutes(s: string) {
  return Number(s.slice(0, 2)) * 60 + Number(s.slice(3));
}
