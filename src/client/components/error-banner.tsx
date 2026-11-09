import { useApp } from "../context";
import { X } from "lucide-preact";

export function ErrorBanner() {
  const { error, setError } = useApp();
  if (!error) return null;

  return (
    <div class="error-banner" role="alert">
      <span id="global-form-error">{error}</span>
      <button
        class="error-close"
        aria-label="Dismiss error"
        onClick={() => setError(null)}
      >
        <X size={14} />
      </button>
    </div>
  );
}
