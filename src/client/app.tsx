import { OperationsOverview, GardenPlanner } from "./garden-operations";
import { Properties, Quotations, CrewVisit } from "./garden-records";
import { GardenInvoices, Reports, GardenSettings } from "./garden-finance";
import { Notice, localDay, SearchBox, RemovalConfirmation } from "./garden-ui";
import { Leaf, Bell, ChevronDown } from "lucide-preact";
import { reportLocation } from "@clawnify/app/client";
import { useEffect, useMemo, useState } from "preact/hooks";
import { AppContext } from "./context";
import { useAppState } from "./hooks/use-app";
import { useRouter } from "./hooks/use-router";
import { Sidebar } from "./components/sidebar";
import { JobList } from "./components/job-list";
import { JobDetail } from "./components/job-detail";
import { CustomerList } from "./components/customer-list";
import { CustomerDetail } from "./components/customer-detail";
import { TechnicianList } from "./components/technician-list";
import { ServiceTypeList } from "./components/service-type-list";
import { MaterialList } from "./components/material-list";
import { AssetDetail } from "./components/asset-detail";
import { ErrorBanner } from "./components/error-banner";
import { OfflineBanner } from "./components/offline-banner";

export function App() {
  const isAgent = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("agent") || params.get("mode") === "agent";
  }, []);

  useEffect(() => {
    if (isAgent) {
      document.documentElement.setAttribute("data-agent", "");
    }
  }, [isAgent]);

  const { view, id, navigate } = useRouter();
  const appState = useAppState(isAgent, navigate);
  const [globalSearch, setGlobalSearch] = useState("");
  useEffect(() => {
    document.title = `${view === "dashboard" ? "Operations Overview" : view.charAt(0).toUpperCase() + view.slice(1)} · Disa GardenOS`;
  }, [view, id]);
  const [detailError, setDetailError] = useState<string | null>(null);
  useEffect(() => {
    reportLocation(window.location.pathname + window.location.search);
  }, [view, id]);

  // Load detail when URL has an ID
  useEffect(() => {
    setDetailError(null);
    if (view === "jobs" && id) {
      appState
        .selectJob(id)
        .catch((err) => setDetailError((err as Error).message));
    } else if (view === "customers" && id) {
      appState
        .selectCustomer(id)
        .catch((err) => setDetailError((err as Error).message));
    } else if (view === "invoices" && id) {
      appState
        .selectInvoice(id)
        .catch((err) => setDetailError((err as Error).message));
    }
  }, [view, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderMain = () => {
    if (view === "assets" && id) return <AssetDetail key={id} id={id} />;
    if (view === "jobs" && id) {
      if (appState.selectedJob?.id === id) return <JobDetail />;
      return (
        <div class="page">
          <div class="empty-state" role={detailError ? "alert" : "status"}>
            <h2>{detailError ? "Job unavailable" : "Loading job…"}</h2>
            {detailError && <p>{detailError}</p>}
            {detailError && (
              <button class="btn" onClick={() => navigate("/schedule")}>
                Back to schedule
              </button>
            )}
          </div>
        </div>
      );
    }
    if (view === "customers" && id) {
      if (appState.selectedCustomer?.id === id) return <CustomerDetail />;
      return (
        <div class="garden-empty" role={detailError ? "alert" : "status"}>
          <h2>{detailError ? "Client unavailable" : "Loading client…"}</h2>
          <p>{detailError}</p>
          <button class="btn" onClick={() => navigate("/customers")}>
            Back to clients
          </button>
        </div>
      );
    }
    if (view === "invoices") return <GardenInvoices id={id} />;
    if (view === "crew" && id) return <CrewVisit id={id} />;
    switch (view) {
      case "notfound":
        return (
          <div class="garden-empty">
            <h1>Page not found</h1>
            <p>This address does not match a GardenOS page.</p>
            <button class="btn btn-primary" onClick={() => navigate("/")}>
              Back to Overview
            </button>
          </div>
        );
      case "schedule":
        return <GardenPlanner />;
      case "dispatch":
        return <GardenPlanner dispatch />;
      case "crew":
        return <GardenPlanner crewView />;
      case "properties":
        return <Properties id={id} />;
      case "quotes":
        return <Quotations />;
      case "reports":
        return <Reports />;
      case "settings":
        return <GardenSettings />;
      case "jobs":
        return <JobList />;
      case "customers":
        return <CustomerList />;
      case "technicians":
        return <TechnicianList />;
      case "services":
        return <ServiceTypeList />;
      case "materials":
        return <MaterialList />;
      default:
        return <OperationsOverview />;
    }
  };

  return (
    <AppContext.Provider value={appState}>
      <div class="layout">
        <Sidebar currentView={view} />
        <main
          class="main-content"
          onSubmitCapture={(e) => {
            const form = e.target as HTMLFormElement;
            if (form.closest(".garden-dialog")) return;
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
              invalid.setAttribute("aria-invalid", "true");
              invalid.setAttribute("aria-describedby", "global-form-error");
              invalid.focus();
              appState.setError(invalid.validationMessage);
            } else {
              for (const el of Array.from(form.elements))
                if (el instanceof HTMLElement)
                  el.removeAttribute("aria-invalid");
            }
          }}
        >
          <header class="garden-topbar">
            <div class="topbar-location">
              <Leaf size={16} />
              <span>Workspace</span>
              <span>/</span>
              <strong>
                {view === "dashboard"
                  ? "Overview"
                  : view.charAt(0).toUpperCase() + view.slice(1)}
              </strong>
            </div>
            <form
              noValidate
              class="topbar-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(
                  "/properties?search=" + encodeURIComponent(globalSearch),
                );
              }}
            >
              <SearchBox
                value={globalSearch}
                onChange={setGlobalSearch}
                placeholder="Search properties…"
              />
            </form>
            <span class="demo-mode">
              <span /> DEMO MODE
            </span>
            <span class="topbar-date">
              {new Intl.DateTimeFormat("en-ZA", {
                timeZone: "Africa/Johannesburg",
                weekday: "short",
                day: "numeric",
                month: "short",
              }).format(new Date())}
            </span>
            <button
              class="profile-menu"
              title="Workspace settings"
              aria-label="Open workspace settings"
              onClick={() => navigate("/settings")}
            >
              <span class="avatar">DT</span>
              <ChevronDown size={13} />
            </button>
          </header>
          <div class="demo-disclosure">
            Independent paceIT concept for Disa Tuine · Fictional demo records
            and pricing · Garden Operations. Simplified.
          </div>
          <OfflineBanner />
          {appState.loading ? (
            <div class="loading-text">Loading...</div>
          ) : (
            <div key={view + String(id)}>{renderMain()}</div>
          )}
        </main>
      </div>
      <Notice />
      <RemovalConfirmation />
      <ErrorBanner />
    </AppContext.Provider>
  );
}
