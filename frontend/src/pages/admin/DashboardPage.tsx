import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BarChart, type BarPoint } from "@/components/admin/BarChart";
import { StatCard } from "@/components/admin/StatCard";
import { ErrorState } from "@/components/common/ErrorState";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ORDER_STATUS_LABEL } from "@/constants/status";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryKeys } from "@/lib/queryKeys";
import { adminService } from "@/services/admin.service";
import type { DashboardOrderPreview, OrderStatus } from "@/types/models";
import { cn } from "@/utils/cn";
import { formatDate, formatPrice, orderCode } from "@/utils/format";

type Period = "daily" | "weekly" | "monthly";

const PERIODS: Array<{ key: Period; label: string }> = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function OrderRow({ order }: { order: DashboardOrderPreview }) {
  return (
    <li>
      <Link
        to={`/admin/orders/${order._id}`}
        className="flex items-center justify-between gap-3 py-3 hover:text-accent"
      >
        <div className="min-w-0">
          <p className="font-medium">
            {orderCode(order._id)}
            {order.orderStatus ? (
              <span className="ml-2 align-middle">
                <OrderStatusBadge status={order.orderStatus} />
              </span>
            ) : null}
          </p>
          <p className="truncate text-sm text-muted">
            {order.user?.fullName ?? "Deleted customer"} ·{" "}
            {formatDate(order.createdAt)}
          </p>
        </div>
        <p className="shrink-0 font-medium">{formatPrice(order.totalAmount)}</p>
      </Link>
    </li>
  );
}

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded border border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-sans text-base font-semibold tracking-normal">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  useDocumentTitle("Dashboard");

  const [period, setPeriod] = useState<Period>("daily");
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: () => adminService.dashboard(),
    staleTime: 30_000,
  });

  if (isPending) {
    return (
      <div>
        <AdminPageHeader title="Dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="The dashboard couldn't be loaded"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const { dashboard, admin } = data;
  const { users, products, orders, revenue, inventory, sales } = dashboard;

  const points: BarPoint[] =
    period === "daily"
      ? sales.daily.map((item) => ({
          label: item.date,
          value: item.totalRevenue,
          orders: item.totalOrders,
        }))
      : period === "weekly"
        ? sales.weekly.map((item) => ({
            label: item.week,
            value: item.totalRevenue,
            orders: item.totalOrders,
          }))
        : sales.monthly.map((item) => ({
            label: item.month,
            value: item.totalRevenue,
            orders: item.totalOrders,
          }));

  const maxStatus = Math.max(
    ...STATUS_ORDER.map((status) => orders[status]),
    1
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description={`Signed in as ${admin.fullName}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPrice(revenue.total)}
          note={`${revenue.paidOrders} paid ${
            revenue.paidOrders === 1 ? "order" : "orders"
          }`}
        />
        <StatCard
          label="Average order value"
          value={formatPrice(revenue.averageOrderValue)}
        />
        <StatCard
          label="Orders waiting"
          value={orders.pending}
          note="Pending confirmation"
          to="/admin/orders?view=pending"
          highlight={orders.pending > 0}
        />
        <StatCard
          label="All orders"
          value={orders.total}
          note={`${orders.delivered} delivered · ${orders.cancelled} cancelled`}
          to="/admin/orders?view=all"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Products"
          value={products.total}
          note={`${products.active} active · ${products.inactive} inactive · ${products.outOfStock} out of stock`}
          to="/admin/products"
        />
        <StatCard
          label="Customers"
          value={users.customers}
          note={`${users.active} active accounts · ${users.blocked} blocked`}
          to="/admin/users"
        />
        <StatCard
          label="Units in stock"
          value={inventory.totalStockUnits.toLocaleString("en-US")}
          note={`${inventory.lowStockCount} low on stock (${inventory.lowStockThreshold} or fewer)`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel
          title="Paid sales"
          action={
            <div role="group" aria-label="Sales period" className="flex gap-1">
              {PERIODS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPeriod(item.key)}
                  aria-pressed={period === item.key}
                  className={cn(
                    "h-8 rounded px-3 text-sm",
                    period === item.key
                      ? "bg-ink text-paper"
                      : "text-muted hover:bg-ink/5"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          }
        >
          <BarChart points={points} caption={sales.periods[period]} />
          <p className="mt-3 text-xs text-muted">{sales.revenueBasis}</p>
        </Panel>

        <Panel title="Orders by status">
          <ul className="space-y-3">
            {STATUS_ORDER.map((status) => (
              <li key={status}>
                <Link
                  to={`/admin/orders?view=${status}`}
                  className="block hover:text-accent"
                >
                  <div className="flex justify-between text-sm">
                    <span>{ORDER_STATUS_LABEL[status]}</span>
                    <span className="font-medium">{orders[status]}</span>
                  </div>
                  <div className="mt-1 h-2 rounded bg-ink/5">
                    <div
                      className="h-2 rounded bg-accent/70"
                      style={{ width: `${(orders[status] / maxStatus) * 100}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Needs your attention"
          action={
            <Link
              to="/admin/orders?view=pending"
              className="text-sm text-accent hover:underline"
            >
              View pending
            </Link>
          }
        >
          {dashboard.pendingOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No orders are waiting for confirmation.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {dashboard.pendingOrders.map((order) => (
                <OrderRow key={order._id} order={order} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent orders">
          {dashboard.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {dashboard.recentOrders.map((order) => (
                <OrderRow key={order._id} order={order} />
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Low stock">
          {inventory.lowStockProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No products are running low.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {inventory.lowStockProducts.map((product) => (
                <li key={product._id}>
                  <Link
                    to={`/admin/products/${product._id}/edit`}
                    className="flex items-center justify-between gap-3 py-3 hover:text-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{product.name}</p>
                      <p className="text-sm text-muted">SKU {product.sku}</p>
                    </div>
                    <p
                      className={cn(
                        "shrink-0 text-sm font-medium",
                        product.stock === 0 ? "text-danger" : "text-amber"
                      )}
                    >
                      {product.stock} left
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Best sellers">
          {dashboard.bestSellingProducts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Sales will show up here once orders are placed.
            </p>
          ) : (
            <ol className="divide-y divide-line">
              {dashboard.bestSellingProducts.map((product, index) => (
                <li
                  key={product.productId}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-5 text-sm text-muted">{index + 1}</span>
                    <p className="truncate font-medium">{product.productName}</p>
                  </div>
                  <p className="shrink-0 text-sm text-muted">
                    {product.totalSold} sold · {formatPrice(product.totalRevenue)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
    </div>
  );
}
