import { GardenDialog } from "../garden-ui";
import { useState } from "preact/hooks";
import { useApp } from "../context";
import { X } from "lucide-preact";

export function CreateCustomer({ onClose }: { onClose: () => void }) {
  const { addCustomer, setError } = useApp();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSubmitting(true);
    try {
      await addCustomer({
        name: name.trim(),
        email,
        phone,
        address,
        city,
        state,
        zip,
        notes,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GardenDialog title="Add client" onClose={onClose}>
      <form noValidate onSubmit={handleSubmit}>
        <div class="form-grid">
          <div class="form-group full-width">
            <label htmlFor="create-customer-field-1">Name *</label>
            <input
              id="create-customer-field-1"
              type="text"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              required
              placeholder="John Smith"
            />
          </div>
          <div class="form-group">
            <label htmlFor="create-customer-field-2">Email</label>
            <input
              id="create-customer-field-2"
              type="email"
              value={email}
              onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
              placeholder="john@example.com"
            />
          </div>
          <div class="form-group">
            <label htmlFor="create-customer-field-3">Phone</label>
            <input
              id="create-customer-field-3"
              type="tel"
              value={phone}
              onInput={(e) => setPhone((e.target as HTMLInputElement).value)}
              placeholder="012 555 0100"
            />
          </div>
          <div class="form-group full-width">
            <label htmlFor="create-customer-field-4">Address</label>
            <input
              id="create-customer-field-4"
              type="text"
              value={address}
              onInput={(e) => setAddress((e.target as HTMLInputElement).value)}
              placeholder="10 Example Lane, Wonderboom"
            />
          </div>
          <div class="form-group">
            <label htmlFor="create-customer-field-5">City</label>
            <input
              id="create-customer-field-5"
              type="text"
              value={city}
              onInput={(e) => setCity((e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="form-group">
            <label htmlFor="create-customer-field-6">State</label>
            <input
              id="create-customer-field-6"
              type="text"
              value={state}
              onInput={(e) => setState((e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="form-group">
            <label htmlFor="create-customer-field-7">ZIP</label>
            <input
              id="create-customer-field-7"
              type="text"
              value={zip}
              onInput={(e) => setZip((e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="form-group full-width">
            <label htmlFor="create-customer-field-8">Notes</label>
            <textarea
              id="create-customer-field-8"
              class="resize-none"
              rows={3}
              value={notes}
              onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)}
            />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </form>
    </GardenDialog>
  );
}
