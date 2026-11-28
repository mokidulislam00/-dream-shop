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
      { path: "login", lazy: lazyPage(() => import("@/pages/auth/LoginPage")) },
      {
        path: "register",
        lazy: lazyPage(() => import("@/pages/auth/RegisterPage")),
      },
    ],
  },
];

const customerRoutes: RouteObject[] = [
  {
    element: <RequireAuth />,
    children: [
      { path: "cart", lazy: lazyPage(() => import("@/pages/customer/CartPage")) },
      {
        path: "wishlist",
        lazy: lazyPage(() => import("@/pages/customer/WishlistPage")),
      },
      {
        path: "checkout",
        lazy: lazyPage(() => import("@/pages/customer/CheckoutPage")),
      },
      {
        path: "order-confirmation/:id",
        lazy: lazyPage(() => import("@/pages/customer/OrderConfirmationPage")),
      },
      { path: "orders", lazy: lazyPage(() => import("@/pages/customer/OrdersPage")) },
      {
        path: "orders/:id",
        lazy: lazyPage(() => import("@/pages/customer/OrderDetailPage")),
      },
      {
        path: "account",
        lazy: lazyPage(() => import("@/pages/customer/AccountPage")),
      },
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
            {
              index: true,
              lazy: lazyPage(() => import("@/pages/admin/DashboardPage")),
            },
            { path: "products", element: stub("Products", 6) },
            { path: "products/new", element: stub("New product", 6) },
            { path: "products/:id/edit", element: stub("Edit product", 6) },
            { path: "categories", element: stub("Categories", 6) },
            {
              path: "orders",
              lazy: lazyPage(() => import("@/pages/admin/OrdersPage")),
            },
            {
              path: "orders/:id",
              lazy: lazyPage(() => import("@/pages/admin/OrderDetailPage")),
            },
            {
              path: "users",
              lazy: lazyPage(() => import("@/pages/admin/UsersPage")),
            },
            {
              path: "users/:id",
              lazy: lazyPage(() => import("@/pages/admin/UserDetailPage")),
            },
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
