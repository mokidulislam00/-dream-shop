import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FilterTabs } from "@/components/admin/FilterTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { PAYMENT_METHOD_LABEL } from "@/constants/status";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryKeys } from "@/lib/queryKeys";
import { orderService } from "@/services/order.service";
import type { Order, OrderStatus } from "@/types/models";
import {
  formatDateTime,
  formatPrice,
  getOrderCustomer,
  orderCode,
} from "@/utils/format";

const PAGE_SIZE = 15;

// "Active" hides delivered and cancelled orders so the working list stays short.
const VIEWS = [
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
] as const;

type ViewKey = (typeof VIEWS)[number]["key"];

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
];

const statusesFor = (view: ViewKey): OrderStatus | OrderStatus[] | undefined => {
  if (view === "all") {
    return undefined;
  }

  if (view === "active") {
    return ACTIVE_STATUSES;
  }

  return view;
};

const itemCount = (order: Order): number =>
  order.items.reduce((sum, item) => sum + item.quantity, 0);

export default function AdminOrdersPage() {
  useDocumentTitle("Orders");

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: ViewKey = VIEWS.some((option) => option.key === viewParam)
    ? (viewParam as ViewKey)
    : "active";
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const params = { status: statusesFor(view), page, limit: PAGE_SIZE };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.orders(params),
    queryFn: () => orderService.adminList(params),
    placeholderData: keepPreviousData,
  });

  const setView = (next: ViewKey) => {
    setSearchParams(next === "active" ? {} : { view: next });
  };

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description="Customer orders, newest first."
      />

      <FilterTabs
        label="Order view"
        options={VIEWS}
        value={view}
        onChange={setView}
      />

      <div className="mt-6">
        {isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Orders couldn't be loaded"
            error={error}
            onRetry={() => void refetch()}
          />
        ) : data.orders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No orders here"
            description={
              view === "active"
                ? "There are no orders in progress right now."
                : "No orders match this view."
            }
          />
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded border border-line bg-surface md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Order</th>
                    <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                    <th scope="col" className="px-4 py-3 font-medium">Items</th>
                    <th scope="col" className="px-4 py-3 font-medium">Total</th>
                    <th scope="col" className="px-4 py-3 font-medium">Payment</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.orders.map((order) => {
                    const customer = getOrderCustomer(order);

                    return (
                      <tr key={order._id} className="hover:bg-ink/[0.02]">
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="font-medium text-accent hover:underline"
                          >
                            {orderCode(order._id)}
                          </Link>
                          <p className="text-xs text-muted">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {customer?.fullName ?? "Deleted customer"}
                          </p>
                          <p className="text-xs text-muted">{customer?.email}</p>
                        </td>
                        <td className="px-4 py-3">{itemCount(order)}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="px-4 py-3">
                          <p>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </td>
                        <td className="px-4 py-3">
                          <OrderStatusBadge status={order.orderStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-3 md:hidden">
              {data.orders.map((order) => {
                const customer = getOrderCustomer(order);

                return (
                  <li key={order._id}>
                    <Link
                      to={`/admin/orders/${order._id}`}
                      className="block rounded border border-line bg-surface p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{orderCode(order._id)}</p>
                          <p className="text-xs text-muted">
                            {formatDateTime(order.createdAt)}
                          </p>
                        </div>
                        <OrderStatusBadge status={order.orderStatus} />
                      </div>
                      <p className="mt-2 text-sm">
                        {customer?.fullName ?? "Deleted customer"}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <p className="font-semibold">
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6">
              <Pagination
                page={data.pagination.currentPage}
                totalPages={data.pagination.totalPages}
                onChange={(next) => {
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set("page", String(next));
                  setSearchParams(nextParams);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
