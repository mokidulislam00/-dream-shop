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
