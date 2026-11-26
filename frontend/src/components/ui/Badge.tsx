import type { ReactNode } from "react";

import {
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PRODUCT_STATUS_LABEL,
} from "@/constants/status";
import type {
  AccountStatus,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
} from "@/types/models";
import { cn } from "@/utils/cn";

type Tone = "neutral" | "success" | "warning" | "danger" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-ink/5 text-ink",
  success: "bg-moss-soft text-moss",
  warning: "bg-amber-soft text-amber",
  danger: "bg-danger-soft text-danger",
  accent: "bg-accent-soft text-accent-deep",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const orderTone: Record<OrderStatus, Tone> = {
  pending: "warning",
  confirmed: "accent",
  processing: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "danger",
};

const paymentTone: Record<PaymentStatus, Tone> = {
  pending: "warning",
  paid: "success",
  failed: "danger",
  refunded: "neutral",
};

const productTone: Record<ProductStatus, Tone> = {
  active: "success",
  inactive: "neutral",
  out_of_stock: "danger",
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge tone={orderTone[status]}>{ORDER_STATUS_LABEL[status]}</Badge>
);

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => (
  <Badge tone={paymentTone[status]}>{PAYMENT_STATUS_LABEL[status]}</Badge>
);

export const ProductStatusBadge = ({ status }: { status: ProductStatus }) => (
  <Badge tone={productTone[status]}>{PRODUCT_STATUS_LABEL[status]}</Badge>
);

export const AccountStatusBadge = ({ status }: { status: AccountStatus }) => (
  <Badge tone={status === "active" ? "success" : "danger"}>
    {status === "active" ? "Active" : "Blocked"}
  </Badge>
);
