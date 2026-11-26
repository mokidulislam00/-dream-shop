import type { ComponentType } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import PublicLayout from "@/layouts/PublicLayout";
import ComingSoon from "@/pages/ComingSoon";
import { GuestOnly, RequireAdmin, RequireAuth } from "./guards";

// Route-level code splitting: a page's code loads when first visited.
const lazyPage =
  (loader: () => Promise<{ default: ComponentType }>) => async () => ({
    Component: (await loader()).default,
  });

// Temporary route target for pages built in later phases.
const stub = (title: string, phase: number): RouteObject["element"] => (
  <ComingSoon title={title} phase={phase} />
);

const publicRoutes: RouteObject[] = [
  { index: true, lazy: lazyPage(() => import("@/pages/public/HomePage")) },
  { path: "products", lazy: lazyPage(() => import("@/pages/public/ProductsPage")) },
  {
    path: "products/:id",
    lazy: lazyPage(() => import("@/pages/public/ProductDetailPage")),
  },
  {
    path: "categories",
    lazy: lazyPage(() => import("@/pages/public/CategoriesPage")),
  },
  {
    path: "categories/:id",
    lazy: lazyPage(() => import("@/pages/public/CategoryPage")),
  },
  { path: "search", lazy: lazyPage(() => import("@/pages/public/SearchPage")) },
  { path: "about", lazy: lazyPage(() => import("@/pages/public/AboutPage")) },
  { path: "contact", lazy: lazyPage(() => import("@/pages/public/ContactPage")) },
];

const guestRoutes: RouteObject[] = [
  {
    element: <GuestOnly />,
    children: [
      { path: "login", element: stub("Sign in", 4) },
      { path: "register", element: stub("Create account", 4) },
    ],
  },
];

const customerRoutes: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [
      { path: "cart", element: stub("Cart", 5) },
      { path: "wishlist", element: stub("Wishlist", 5) },
      { path: "checkout", element: stub("Checkout", 5) },
      { path: "order-confirmation/:id", element: stub("Order confirmed", 5) },
      { path: "orders", element: stub("My orders", 5) },
      { path: "orders/:id", element: stub("Order details", 5) },
      { path: "account", element: stub("Account settings", 5) },
    ],
  },
];

const adminRoutes: RouteObject = {
  path: "admin",
  element: <RequireAuth />,
  children: [
    {
      element: <RequireAdmin />,
      children: [
        {
          element: <AdminLayout />,
          children: [
            { index: true, element: stub("Dashboard", 6) },
            { path: "products", element: stub("Products", 6) },
            { path: "products/new", element: stub("New product", 6) },
            { path: "products/:id/edit", element: stub("Edit product", 6) },
            { path: "categories", element: stub("Categories", 6) },
            { path: "orders", element: stub("Orders", 6) },
            { path: "users", element: stub("Users", 6) },
            { path: "users/:id", element: stub("User details", 6) },
          ],
        },
      ],
    },
  ],
};

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
      children: [
      ...publicRoutes,
      ...guestRoutes,
      ...customerRoutes,
      {
        path: "*",
        lazy: lazyPage(() => import("@/pages/public/NotFoundPage")),
      },
    ],
  },
  adminRoutes,
]);
