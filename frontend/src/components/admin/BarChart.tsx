import { formatPrice } from "@/utils/format";

export interface BarPoint {
  label: string;
  value: number;
  orders: number;
}

// Lightweight bar chart built from plain elements (no chart library).
export function BarChart({
  points,
  caption,
}: {
  points: BarPoint[];
  caption: string;
}) {
  const max = Math.max(...points.map((point) => point.value), 0);
  const total = points.reduce((sum, point) => sum + point.value, 0);

  if (points.length === 0 || max === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted">
        No paid sales in this period yet.
      </p>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <figure>
      <div
        className="flex h-44 items-end gap-1"
        role="img"
        aria-label={`${caption}. Total ${formatPrice(total)}.`}
      >
        {points.map((point) => (
          <div
            key={point.label}
            title={`${point.label}: ${formatPrice(point.value)} (${point.orders} ${
              point.orders === 1 ? "order" : "orders"
            })`}
            className="min-w-0 flex-1 rounded-t bg-accent/75 hover:bg-accent"
            style={{
              height: `${(point.value / max) * 100}%`,
              minHeight: point.value > 0 ? 3 : 0,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted">
        <span>{first.label}</span>
        <span>{last.label}</span>
      </div>
      <figcaption className="mt-2 text-sm text-muted">
        {caption}. Total {formatPrice(total)}.
      </figcaption>
    </figure>
  );
}
