import { useState } from "preact/hooks";
import { useApp } from "../context";
import {
  Leaf,
  PanelLeft,
  LayoutDashboard,
  CalendarDays,
  Users,
  Sprout,
  MapPin,
  FileText,
  Receipt,
  ChartNoAxesCombined,
  Settings,
  ArrowUpRight,
  Package,
} from "lucide-preact";
import type { View } from "../types";
const items = [
  ["dashboard", "/", "Overview", LayoutDashboard],
  ["schedule", "/schedule", "Weekly Schedule", CalendarDays],
  ["dispatch", "/dispatch", "Crew Dispatch", Users],
  ["jobs", "/jobs", "Garden Visits", Sprout],
  ["properties", "/properties", "Properties & Clients", MapPin],
  ["quotes", "/quotes", "Quotations", FileText],
  ["invoices", "/invoices", "Invoices", Receipt],
  ["reports", "/reports", "Reports", ChartNoAxesCombined],
  ["services", "/services", "Services", Leaf],
  ["settings", "/settings", "Settings", Settings],
] as const;
export function Sidebar({ currentView }: { currentView: View }) {
  const { navigate } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside class={`garden-sidebar ${collapsed ? "compact" : ""}`}>
      <div class="garden-brand">
        <div class="brand-mark">
          <Leaf size={25} />
        </div>
        <div>
          <strong>
            Disa<span>GardenOS</span>
          </strong>
          <small>GARDEN OPERATIONS</small>
        </div>
        <button
          class="btn-icon collapse-nav"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          onClick={() => setCollapsed(!collapsed)}
        >
          <PanelLeft size={16} />
        </button>
      </div>
      <div class="workspace-label">
        <span class="workspace-dot" /> Disa Tuine <small>PRETORIA</small>
      </div>
      <nav aria-label="Main navigation">
        <div class="nav-caption">WORKSPACE</div>
        {items.map(([view, path, label, Icon]) => (
          <a
            key={view}
            href={path}
            title={label}
            class={`garden-nav-item ${currentView === view ? "active" : ""}`}
            aria-current={currentView === view ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              navigate(path);
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
            {view === "schedule" && <small>WEEK</small>}
          </a>
        ))}
      </nav>
      <div class="garden-sidebar-bottom">
        <button class="crew-view-link" onClick={() => navigate("/crew")}>
          <span class="crew-icon">
            <Users size={19} />
          </span>
          <span>
            <strong>Open Crew View</strong>
            <small>Made for the field</small>
          </span>
          <ArrowUpRight size={17} />
        </button>
        <a
          class="garden-nav-item"
          href="/materials"
          onClick={(e) => {
            e.preventDefault();
            navigate("/materials");
          }}
        >
          <Package size={17} />
          <span>Equipment & inventory</span>
        </a>
        <div class="sidebar-person">
          <span class="avatar">DT</span>
          <span>
            <strong>Demo workspace</strong>
            <small>Independent concept by paceIT</small>
          </span>
        </div>
      </div>
    </aside>
  );
}
