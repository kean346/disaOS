export function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100);
}
export function quoteTotals(
  lines: { quantity: number; unit_price: number }[],
  discount: number,
  vat: number,
) {
  const gross = lines.reduce(
    (sum, l) => sum + Math.round(l.quantity * money(l.unit_price)),
    0,
  );
  const subtotal = Math.max(0, gross - money(discount));
  const tax = Math.round((subtotal * vat) / 100);
  return {
    subtotal_cents: subtotal,
    tax_cents: tax,
    total_cents: subtotal + tax,
  };
}
export function occurrences(start: string, frequency: string, count: number) {
  const anchor = new Date(start + "T12:00:00Z");
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(anchor);
    if (frequency === "monthly") {
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + i);
      d.setUTCDate(
        Math.min(
          anchor.getUTCDate(),
          new Date(
            Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
          ).getUTCDate(),
        ),
      );
    } else
      d.setUTCDate(
        d.getUTCDate() +
          i *
            (frequency === "fortnightly"
              ? 14
              : frequency === "weekly"
                ? 7
                : Number(frequency) || 7),
      );
    return d.toISOString().slice(0, 10);
  });
}
