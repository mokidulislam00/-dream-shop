import { Link, NavLink, Outlet, ScrollRestoration } from "react-router-dom";
import {
  ClipboardList,
  ExternalLink,
  Layers,
  LayoutDashboard,
  Package,
  Users,
} from "lucide-react";

import { cn } from "@/utils/cn";

const ADMIN_LINKS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package, end: false },
  { to: "/admin/categories", label: "Categories", icon: Layers, end: false },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList, end: false },
  { to: "/admin/users", label: "Users", icon: Users, end: false },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-5">
          <Link to="/admin" className="font-display text-xl tracking-tight">
            Dream<span className="text-accent">Shop</span>
            <span className="ml-2 font-sans text-xs font-medium uppercase tracking-wider text-muted">
              Admin
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink lg:hidden"
          >
            Store <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <nav
          aria-label="Admin"
          className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-3 lg:pb-0"
        >
          {ADMIN_LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-11 shrink-0 items-center gap-2.5 rounded px-3 text-sm font-medium",
                  isActive
                    ? "bg-ink text-paper"
                    : "text-ink hover:bg-ink/5"
                )
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden px-5 py-5 lg:block">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
          >
            View store <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </aside>

      <main id="main" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  );
}
