import { useEffect, useState } from "preact/hooks";
import { App } from "./app";

/** Runs once per page load; navigation and ordinary data refreshes never restart it. */
export function Startup() {
  const [opening, setOpening] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (!opening) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => setOpening(false);
    const change = () => { if (preference.matches) finish(); };
    const timeout = window.setTimeout(finish, 950);
    preference.addEventListener('change', change);
    return () => { window.clearTimeout(timeout); preference.removeEventListener('change', change); };
  }, [opening]);
  return <div class={`startup-root ${opening ? 'is-opening' : 'is-ready'}`}>
    <App />
    {opening && <div class="startup-veil" aria-hidden="true" onAnimationEnd={event => { if (event.target === event.currentTarget) setOpening(false); }}>
      <div class="startup-wordmark"><span class="startup-symbol">D</span><span>Disa <b>GardenOS</b></span></div>
      <span class="startup-line" />
    </div>}
  </div>;
}
