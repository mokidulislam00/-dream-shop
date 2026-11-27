import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, SearchX } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Container } from "@/components/layout/Container";
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
import { Textarea } from "@/components/ui/Textarea";
import { PAYMENT_METHOD_LABEL, canCustomerCancel } from "@/constants/status";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useOrder } from "@/hooks/useOrders";
import { queryKeys } from "@/lib/queryKeys";
import { orderService } from "@/services/order.service";
import { getErrorMessage, isClientError } from "@/utils/errors";
import { formatDateTime, orderCode } from "@/utils/format";

const MAX_REASON = 500;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: order, isPending, isError, error, refetch } = useOrder(id);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  useDocumentTitle(order ? `Order ${orderCode(order._id)}` : "Order");

  const cancel = useMutation({
    mutationFn: () => orderService.cancel(id as string, reason.trim() || undefined),
    onSuccess: async () => {
      setCancelOpen(false);
      setReason("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success("Your order has been cancelled");
    },
    onError: (cancelError) => {
      toast.error(getErrorMessage(cancelError));
      // The status may have changed (for example, already confirmed and paid).
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  if (isPending) {
    return <PageSpinner label="Loading your order" />;
  }

  if (isError) {
    return isClientError(error) ? (
      <EmptyState
        icon={SearchX}
        title="Order not found"
        description="We couldn't find this order in your account."
        action={
          <Link to="/orders" className={buttonStyles("primary")}>
            My orders
          </Link>
        }
      />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  const cancellable = canCustomerCancel(order.orderStatus, order.paymentStatus);
  const reasonTooLong = reason.length > MAX_REASON;

  return (
    <Container narrow className="py-10">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        My orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Order {orderCode(order._id)}</h1>
          <p className="mt-1 text-sm text-muted">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.orderStatus} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
      </div>

      <section className="mt-8 rounded border border-line bg-surface p-5" aria-label="Order progress">
        <OrderStatusTimeline status={order.orderStatus} />
        {order.orderStatus === "cancelled" && order.cancellationReason ? (
          <p className="mt-3 text-sm text-muted">
            Reason: {order.cancellationReason}
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded border border-line bg-surface p-5">
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

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
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

      {cancellable ? (
        <div className="mt-8">
          <Button variant="secondary" onClick={() => setCancelOpen(true)}>
            Cancel order
          </Button>
        </div>
      ) : order.orderStatus !== "cancelled" && order.orderStatus !== "delivered" ? (
        <p className="mt-8 text-sm text-muted">
          Orders can only be cancelled while they are pending or confirmed and
          not yet paid.
        </p>
      ) : null}

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel this order?"
        description="The items will return to stock. This can't be undone."
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        loading={cancel.isPending}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          if (!reasonTooLong) {
            cancel.mutate();
          }
        }}
      >
        <Textarea
          label="Reason (optional)"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={reasonTooLong ? `Keep it under ${MAX_REASON} characters` : undefined}
          hint={`${reason.length}/${MAX_REASON}`}
        />
      </ConfirmDialog>
    </Container>
  );
}
