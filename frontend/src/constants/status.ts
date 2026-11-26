import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
} from "@/types/models";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Mirrors the backend's allowedTransitions. Admins move an order one
// step forward at a time; cancellation is not an admin transition.
export const ORDER_NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

export const ORDER_TIMELINE: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  online: "Online payment",
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  out_of_stock: "Out of stock",
};

// Backend rule: only pending/confirmed, unpaid orders can be cancelled.
export const canCustomerCancel = (
  orderStatus: OrderStatus,
  paymentStatus: PaymentStatus
): boolean =>
  (orderStatus === "pending" || orderStatus === "confirmed") &&
  paymentStatus !== "paid";

export const PRODUCT_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
] as const;
