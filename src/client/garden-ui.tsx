import { createPortal } from "preact/compat";
import { cloneElement, isValidElement, type ComponentChildren } from "preact";
import { useEffect, useRef, useState, useId } from "preact/hooks";
import { X, Search } from "lucide-preact";
import { api } from "./api";
export const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(n || 0);
export const localDay = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(
    new Date(),
  );
export const dayLabel = (
  s: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" },
) =>
  new Intl.DateTimeFormat("en-ZA", {
    ...opts,
    timeZone: "Africa/Johannesburg",
  }).format(new Date(s + "T12:00:00Z"));
export const addDays = (s: string, n: number) => {
  const d = new Date(s + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const monday = (s = localDay()) =>
  addDays(s, -(new Date(s + "T12:00:00Z").getUTCDay() + 6) % 7);
export function notify(message: string) {
  window.dispatchEvent(new CustomEvent("garden:notice", { detail: message }));
}
export function changed() {
  window.dispatchEvent(new Event("garden:changed"));
}
export function Notice() {
  const [msg, set] = useState("");
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const fn = (e: Event) => {
      set((e as CustomEvent).detail);
      clearTimeout(timer);
      timer = setTimeout(() => set(""), 5000);
    };
    window.addEventListener("garden:notice", fn);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("garden:notice", fn);
    };
  }, []);
  return (
    <div class={`garden-toast ${msg ? "shown" : ""}`} role="status">
      {msg}
    </div>
  );
}
export function GardenDialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ComponentChildren;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [validationError, setValidationError] = useState("");
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.showModal();
    return () => {
      document.body.style.overflow = overflow;
      ref.current?.close();
      previous?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      class="garden-dialog"
      onSubmitCapture={(e) => {
        const form = e.target as HTMLFormElement;
        if (form.hasAttribute("data-garden-form")) return;
        const invalid = Array.from(form.elements).find((el) =>
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement
            ? !(el as HTMLInputElement).validity.valid
            : false,
        ) as HTMLInputElement | undefined;
        if (invalid) {
          e.preventDefault();
          e.stopPropagation();
          setValidationError(invalid.validationMessage);
          invalid.setAttribute("aria-invalid", "true");
          invalid.setAttribute("aria-describedby", "dialog-field-error");
          invalid.focus();
        } else {
          setValidationError("");
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={title}
    >
      <header>
        <h2>{title}</h2>
        <button
          type="button"
          class="btn-icon"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </header>
      {validationError && (
        <p class="dialog-validation-error" id="dialog-field-error" role="alert">
          {validationError}
        </p>
      )}
      {children}
    </dialog>,
    document.body,
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ComponentChildren;
}) {
  const generatedId = useId();
  const id = generatedId;
  return (
    <div class="garden-field">
      <label htmlFor={id}>{label}</label>
      {isValidElement(children) ? cloneElement(children, { id }) : children}
    </div>
  );
}
export function GardenForm({
  children,
  onSave,
  label = "Save changes",
  onCancel,
}: {
  children: ComponentChildren;
  onSave: (data: FormData) => Promise<void>;
  label?: string;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      noValidate
      data-garden-form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        const form = e.currentTarget;
        const invalid = Array.from(form.elements).find((el) =>
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement
            ? !(el as HTMLInputElement).validity.valid
            : false,
        ) as HTMLInputElement | undefined;
        if (invalid) {
          setError(invalid.validationMessage);
          invalid.setAttribute("aria-invalid", "true");
          invalid.setAttribute("aria-describedby", "garden-form-error");
          invalid.focus();
          return;
        }
        setBusy(true);
        setError("");
        try {
          await onSave(new FormData(form));
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div class="garden-form-body">
        {children}
        <div id="garden-form-error" class="form-error" role="alert">
          {error}
        </div>
      </div>
      <footer>
        <button type="button" class="btn" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <button class="btn btn-primary" disabled={busy} aria-busy={busy}>
          {busy ? "Saving…" : label}
        </button>
      </footer>
    </form>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "Search records…",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div class="garden-search">
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        type="search"
        value={value}
        onInput={(e) => {
          if (!(e as InputEvent).isComposing) onChange(e.currentTarget.value);
        }}
        onCompositionEnd={(e) => onChange(e.currentTarget.value)}
      />
      {value && (
        <button
          type="button"
          class="btn-icon"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
export function Empty({
  title = "No records yet",
  text = "Create a record to get started.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div class="garden-empty">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
export function PageHeading({
  eyebrow = "YOUR GARDEN OPERATIONS",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ComponentChildren;
}) {
  return (
    <header class="garden-page-heading">
      <div>
        <div class="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div class="heading-actions">{children}</div>
    </header>
  );
}
export function useGarden(
  start = monday(),
  end = addDays(start, 6),
  page = 1,
  search = "",
) {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const fn = () => setRevision((n) => n + 1);
    window.addEventListener("garden:changed", fn);
    return () => window.removeEventListener("garden:changed", fn);
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = setTimeout(
      () =>
        api(
          "GET",
          `/api/garden/overview?${new URLSearchParams({ start, end, page: String(page), search })}`,
        )
          .then((d) => {
            if (active) {
              setData(d);
              setError("");
            }
          })
          .catch((e) => {
            if (active) setError(e.message);
          })
          .finally(() => {
            if (active) setLoading(false);
          }),
      search ? 300 : 0,
    );
    return () => {
      clearTimeout(timer);
      active = false;
    };
  }, [start, end, page, search, revision]);
  return { data, error, loading, retry: () => setRevision((n) => n + 1) };
}
export function LoadState({
  error,
  retry,
}: {
  error?: string;
  retry?: () => void;
}) {
  return (
    <div class="garden-empty" role={error ? "alert" : "status"}>
      <h3>
        {error ? "Unable to load garden data" : "Preparing your workspace…"}
      </h3>
      <p>{error || "Loading visits, crews and property records."}</p>
      {error && (
        <button class="btn" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Pager({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div class="garden-pager">
      <span>
        {total
          ? `${(page - 1) * 50 + 1}–${Math.min(page * 50, total)} of ${total}`
          : "0 records"}
      </span>
      <button
        class="btn"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>
      <button
        class="btn"
        disabled={page * 50 >= total}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
export function Badge({ status }: { status: string }) {
  return (
    <span class={`garden-badge ${status}`}>{status.replaceAll("_", " ")}</span>
  );
}
export function CrewLabel({ name, color }: { name?: string; color?: string }) {
  return (
    <span class="garden-crew-label">
      <span style={{ background: color || "#9AAF98" }} />
      {name || "Unassigned"}
    </span>
  );
}
let confirmationHandler: ((message: string) => Promise<boolean>) | undefined;
export function confirmRemoval(message: string) {
  return confirmationHandler
    ? confirmationHandler(message)
    : Promise.resolve(false);
}
export function RemovalConfirmation() {
  const [pending, setPending] = useState<{
    message: string;
    resolve: (yes: boolean) => void;
  } | null>(null);
  useEffect(() => {
    confirmationHandler = (message) =>
      new Promise((resolve) => setPending({ message, resolve }));
    return () => {
      confirmationHandler = undefined;
    };
  }, []);
  if (!pending) return null;
  const close = (yes = false) => {
    pending.resolve(yes);
    setPending(null);
  };
  return (
    <GardenDialog title="Delete this record?" onClose={() => close()}>
      <GardenForm
        label="Delete record"
        onCancel={() => close()}
        onSave={async () => close(true)}
      >
        <p>{pending.message}</p>
        <p class="field-help">
          This cannot be undone. Cancel to keep the record.
        </p>
      </GardenForm>
    </GardenDialog>
  );
}
export function PropertyPicker() {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [data, setData] = useState<any>({ properties: [], total: 0 }),
    [selected, setSelected] = useState<any>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let current = true;
    setLoading(true);
    const timer = setTimeout(
      () => {
        api<any>(
          "GET",
          "/api/garden/property-options?" +
            new URLSearchParams({ search, page: String(page) }),
        )
          .then((d) => {
            if (current) {
              setData(d);
              setError("");
            }
          })
          .catch((e) => {
            if (current) setError(e.message);
          })
          .finally(() => {
            if (current) setLoading(false);
          });
      },
      search ? 300 : 0,
    );
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [search, page]);
  return (
    <div class="property-picker">
      <SearchBox
        value={search}
        onChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        placeholder="Find a property…"
      />
      <Field label="Property">
        <select
          name="property_id"
          required
          value={selected?.id || ""}
          onChange={(e) =>
            setSelected(
              data.properties.find(
                (p: any) => p.id === e.currentTarget.value,
              ) || null,
            )
          }
        >
          <option value="">Choose property</option>
          {selected &&
            !data.properties.some((p: any) => p.id === selected.id) && (
              <option value={selected.id}>
                {selected.name} · {selected.suburb}
              </option>
            )}
          {data.properties.map((p: any) => (
            <option value={p.id}>
              {p.name} · {p.suburb}
            </option>
          ))}
        </select>
      </Field>
      <div class="picker-pagination">
        <span role="status">
          {loading
            ? "Finding properties…"
            : `${data.total} matching properties`}
        </span>
        <button
          type="button"
          class="btn"
          disabled={page === 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          class="btn"
          disabled={page * 50 >= data.total || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
      {error && (
        <p class="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
