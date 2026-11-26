import { createBrowserRouter, type RouteObject } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout";
import PublicLayout from "@/layouts/PublicLayout";
import ComingSoon from "@/pages/ComingSoon";
import NotFoundPage from "@/pages/public/NotFoundPage";
import { GuestOnly, RequireAdmin, RequireAuth } from "./guards";

const stub = (title: string, phase: number): RouteObject["element"] => (
  <ComingSoon title={title} phase={phase} />
);

const publicRoutes: RouteObject[] = [
  { index: true, element: stub("Home", 3) },
  { path: "products", element: stub("All products", 3) },
  { path: "products/:id", element: stub("Product details", 3) },
  { path: "categories", element: stub("Categories", 3) },
  { path: "categories/:id", element: stub("Category products", 3) },
  { path: "search", element: stub("Search results", 3) },
  { path: "about", element: stub("About", 3) },
  { path: "contact", element: stub("Contact", 3) },
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
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  adminRoutes,
]);
