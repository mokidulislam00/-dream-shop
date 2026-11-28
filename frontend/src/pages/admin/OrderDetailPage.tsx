import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, SearchX } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import {
  AddressBlock,
  OrderItemsList,
  OrderStatusTimeline,
  OrderTotals,
} from "@/components/orders/OrderParts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageSpinner } from "@/components/ui/Spinner";
import {
  ORDER_NEXT_STATUS,
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
} from "@/constants/status";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryKeys } from "@/lib/queryKeys";
import { orderService } from "@/services/order.service";
import type { OrderStatus } from "@/types/models";
import { getErrorMessage, isClientError } from "@/utils/errors";
import { formatDateTime, getOrderCustomer, orderCode } from "@/utils/format";

const ADVANCE_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Confirm order",
  processing: "Start processing",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
};

type PendingAction = "advance" | "cod" | null;

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<PendingAction>(null);

  const { data: order, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.order(id ?? ""),
    queryFn: () => orderService.adminGetById(id as string),
    enabled: Boolean(id),
  });

  useDocumentTitle(order ? `Order ${orderCode(order._id)}` : "Order");

  const refreshAdminData = () =>
    queryClient.invalidateQueries({ queryKey: ["admin"] });

  const advance = useMutation({
    mutationFn: (next: OrderStatus) =>
      orderService.adminUpdateStatus(id as string, next),
    onSuccess: async (updated) => {
      await refreshAdminData();
      setAction(null);
      toast.success(`Order marked as ${ORDER_STATUS_LABEL[updated.orderStatus]}`);
    },
    onError: (mutationError) => {
      setAction(null);
      toast.error(getErrorMessage(mutationError));
      void refreshAdminData();
    },
  });

  const confirmCod = useMutation({
    mutationFn: () => orderService.adminConfirmCodPayment(id as string),
    onSuccess: async () => {
      await refreshAdminData();
      setAction(null);
      toast.success("Cash payment confirmed");
    },
    onError: (mutationError) => {
      setAction(null);
      toast.error(getErrorMessage(mutationError));
      void refreshAdminData();
    },
  });

  if (isPending) {
    return <PageSpinner label="Loading order" />;
  }

  if (isError) {
    return isClientError(error) ? (
      <EmptyState
        icon={SearchX}
        title="Order not found"
        action={
          <Link to="/admin/orders" className={buttonStyles("primary")}>
            Back to orders
          </Link>
        }
      />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  const customer = getOrderCustomer(order);
  const next = ORDER_NEXT_STATUS[order.orderStatus];
  const canConfirmCod =
    order.paymentMethod === "cod" &&
    order.orderStatus === "delivered" &&
    order.paymentStatus === "pending";

  return (
    <div className="max-w-4xl">
      <Link
        to="/admin/orders"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Orders
      </Link>

      <AdminPageHeader
        title={`Order ${orderCode(order._id)}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <div className="flex gap-2">
            <OrderStatusBadge status={order.orderStatus} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        }
      />

      <section
        aria-label="Order actions"
        className="rounded border border-line bg-surface p-5"
      >
        <OrderStatusTimeline status={order.orderStatus} />

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {next ? (
            <Button onClick={() => setAction("advance")}>
              {ADVANCE_LABEL[next] ?? `Mark as ${ORDER_STATUS_LABEL[next]}`}
            </Button>
          ) : null}

          {canConfirmCod ? (
            <Button variant="secondary" onClick={() => setAction("cod")}>
              Confirm cash received
            </Button>
          ) : null}

          {!next && !canConfirmCod ? (
            <p className="text-sm text-muted">
              {order.orderStatus === "cancelled"
                ? order.cancellationReason
                  ? `Cancelled by the customer. Reason: ${order.cancellationReason}`
                  : "This order was cancelled."
                : "This order is complete."}
            </p>
          ) : (
            <p className="text-sm text-muted">
              Customers can cancel their own order while it is pending or
              confirmed and unpaid.
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded border border-line bg-surface p-5">
          <h2 className="font-sans text-lg font-semibold tracking-normal">Items</h2>
          <OrderItemsList items={order.items} />
          <div className="mt-2 border-t border-line pt-4">
            <OrderTotals
              subtotal={order.subtotal}
              shippingCost={order.shippingCost}
              total={order.totalAmount}
            />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded border border-line bg-surface p-5">
            <h2 className="mb-3 font-sans text-lg font-semibold tracking-normal">
              Customer
            </h2>
            {customer ? (
              <>
                <p className="font-medium">{customer.fullName}</p>
                <a
                  href={`mailto:${customer.email}`}
                  className="text-sm text-accent hover:underline"
                >
                  {customer.email}
                </a>
                <p className="mt-2">
                  <Link
                    to={`/admin/users/${customer._id}`}
                    className="text-sm text-muted hover:text-ink"
                  >
                    View account
                  </Link>
                </p>
              </>
            ) : (
              <p className="text-muted">This account no longer exists.</p>
            )}
          </section>

          <section className="rounded border border-line bg-surface p-5">
            <h2 className="mb-3 font-sans text-lg font-semibold tracking-normal">
              Delivery address
            </h2>
            <AddressBlock address={order.shippingAddress} />
          </section>

          <section className="rounded border border-line bg-surface p-5">
            <h2 className="mb-3 font-sans text-lg font-semibold tracking-normal">
              Payment
            </h2>
            <p>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
            <div className="mt-2">
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            {order.transactionId ? (
              <p className="mt-3 text-sm text-muted">
                Transaction {order.transactionId}
              </p>
            ) : null}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={action === "advance" && next !== null}
        title={next ? ADVANCE_LABEL[next] ?? "Update status" : "Update status"}
        description={
          next
            ? `The order will move to "${ORDER_STATUS_LABEL[next]}". Status changes go forward only and can't be undone.`
            : undefined
        }
        confirmLabel="Yes, continue"
        variant="primary"
        loading={advance.isPending}
        onClose={() => setAction(null)}
        onConfirm={() => {
          if (next) {
            advance.mutate(next);
          }
        }}
      />

      <ConfirmDialog
        open={action === "cod"}
        title="Confirm cash received?"
        description="Mark this order as paid. Do this only after you have collected the cash."
        confirmLabel="Yes, mark as paid"
        variant="primary"
        loading={confirmCod.isPending}
        onClose={() => setAction(null)}
        onConfirm={() => confirmCod.mutate()}
      />
    </div>
  );
}
