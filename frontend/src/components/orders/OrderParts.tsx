import { Link } from "react-router-dom";
import { Check, X } from "lucide-react";

import { ProductImage } from "@/components/products/ProductImage";
import { ORDER_STATUS_LABEL, ORDER_TIMELINE } from "@/constants/status";
import type { Order, OrderItem, OrderStatus, ShippingAddress } from "@/types/models";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";

export function OrderItemsList({ items }: { items: OrderItem[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((item, index) => (
        <li key={`${item.product}-${index}`} className="flex gap-4 py-4">
          <Link
            to={`/products/${item.product}`}
            className="h-20 w-16 shrink-0 overflow-hidden rounded bg-ink/5"
            tabIndex={-1}
            aria-hidden="true"
          >
            <ProductImage src={item.image} alt="" width={160} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/products/${item.product}`}
              className="line-clamp-2 font-medium hover:text-accent"
            >
              {item.name}
            </Link>
            <p className="mt-0.5 text-sm text-muted">SKU {item.sku}</p>
            <p className="mt-1 text-sm text-muted">
              {item.quantity} × {formatPrice(item.price)}
            </p>
          </div>
          <p className="shrink-0 font-medium">{formatPrice(item.subtotal)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({
  subtotal,
  shippingCost,
  total,
}: {
  subtotal: number;
  shippingCost: number;
  total: number;
}) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd>{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-muted">Delivery</dt>
        <dd>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd>{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}

export function AddressBlock({ address }: { address: ShippingAddress }) {
  return (
    <address className="space-y-0.5 not-italic">
      <p className="font-medium">{address.fullName}</p>
      <p>{address.addressLine}</p>
      <p>
        {address.city}, {address.district}
        {address.postalCode ? ` ${address.postalCode}` : ""}
      </p>
      <p>{address.country}</p>
      <p className="pt-1 text-muted">{address.phone}</p>
    </address>
  );
}

// Progress through the order stages. The backend keeps no per-status
// timestamps, so none are shown.
export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded border border-danger/30 bg-danger-soft p-4 text-danger">
        <X className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="font-medium">This order was cancelled</p>
      </div>
    );
  }

  const currentIndex = ORDER_TIMELINE.indexOf(status);

  return (
    <ol className="flex flex-col gap-4 md:flex-row md:gap-0" aria-label="Order progress">
      {ORDER_TIMELINE.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;

        return (
          <li
            key={step}
            aria-current={current ? "step" : undefined}
            className="flex items-center gap-3 md:flex-1 md:flex-col md:gap-2 md:text-center"
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium",
                done && "border-moss bg-moss text-white",
                current && "border-accent bg-accent text-white",
                !done && !current && "border-line text-muted"
              )}
            >
              {done ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
            </span>
            <span
              className={cn(
                "text-sm",
                current ? "font-semibold text-ink" : "text-muted"
              )}
            >
              {ORDER_STATUS_LABEL[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export const orderItemCount = (order: Order): number =>
  order.items.reduce((sum, item) => sum + item.quantity, 0);
