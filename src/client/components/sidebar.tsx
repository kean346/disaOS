import { useEffect, useRef, useState } from "preact/hooks";
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
  ["dispatch", "/dispatch", "Crews", Users],
  ["properties", "/properties", "Properties", MapPin],
  ["quotes", "/quotes", "Enquiries & Quotes", FileText],
  ["services", "/services", "Services", Leaf],
  ["settings", "/settings", "Settings", Settings],
] as const;
export function Sidebar({ currentView }: { currentView: View }) {
  const { navigate } = useApp();
  const navRef=useRef<HTMLElement>(null);
  const [indicator,setIndicator]=useState({left:0,width:0});
  useEffect(()=>{const nav=navRef.current;if(!nav)return;const update=()=>{const active=nav.querySelector<HTMLElement>('[aria-current="page"]');if(active)setIndicator({left:active.offsetLeft,width:active.offsetWidth});else setIndicator({left:0,width:0});};update();const observer=new ResizeObserver(update);observer.observe(nav);document.fonts.ready.then(update);return()=>observer.disconnect();},[currentView]);
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
      <button class="nav-crew-shortcut" onClick={()=>navigate("/crew")}><Users size={15}/> Crew workspace <ArrowUpRight size={13}/></button>
      <div class="workspace-label">
        <span class="workspace-dot" /> Disa Tuine <small>PRETORIA</small>
      </div>
      <nav ref={navRef} aria-label="Main navigation"><span class="nav-active-indicator" aria-hidden="true" style={{left:indicator.left,width:indicator.width}}/>
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
