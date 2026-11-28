// Central query keys so cache invalidation stays consistent.
export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  products: {
    all: ["products"] as const,
    list: (params: object) => ["products", "list", params] as const,
    detail: (id: string) => ["products", "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: (params: object) => ["categories", "list", params] as const,
    detail: (id: string) => ["categories", "detail", id] as const,
  },
  cart: ["cart"] as const,
  wishlist: ["wishlist"] as const,
  orders: {
    all: ["orders"] as const,
    mine: (params: object) => ["orders", "mine", params] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  reviews: {
    product: (productId: string) => ["reviews", productId] as const,
    forProduct: (productId: string, params: object) =>
      ["reviews", productId, params] as const,
  },
  admin: {
    dashboard: ["admin", "dashboard"] as const,
    products: (params: object) => ["admin", "products", params] as const,
    product: (id: string) => ["admin", "product", id] as const,
    categories: (params: object) => ["admin", "categories", params] as const,
    category: (id: string) => ["admin", "category", id] as const,
    orders: (params: object) => ["admin", "orders", params] as const,
    users: (params: object) => ["admin", "users", params] as const,
    user: (id: string) => ["admin", "user", id] as const,
  },
};
