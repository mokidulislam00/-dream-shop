export const formatPrice = (value: number): string =>
  `৳${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const getEffectivePrice = (product: {
  price: number;
  discountPrice?: number | null;
}): number => product.discountPrice ?? product.price;

export const hasDiscount = (product: {
  price: number;
  discountPrice?: number | null;
}): boolean =>
  product.discountPrice !== undefined &&
  product.discountPrice !== null &&
  product.discountPrice < product.price;

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// The backend has no order number, so the last 8 characters of the
// order id are shown as a short reference.
export const orderCode = (id: string): string =>
  `#${id.slice(-8).toUpperCase()}`;

// Orders keep the customer as a populated object on the admin side
// (or null if the account was deleted).
export const getOrderCustomer = (order: {
  user: unknown;
}): { _id: string; fullName: string; email: string } | null =>
  typeof order.user === "object" && order.user !== null
    ? (order.user as { _id: string; fullName: string; email: string })
    : null;
