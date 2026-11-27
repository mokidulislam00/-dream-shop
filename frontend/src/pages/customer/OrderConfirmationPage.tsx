import { Link, useParams } from "react-router-dom";
import { CheckCircle2, SearchX } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Container } from "@/components/layout/Container";
import {
  AddressBlock,
  OrderItemsList,
  OrderTotals,
} from "@/components/orders/OrderParts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { PAYMENT_METHOD_LABEL } from "@/constants/status";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useOrder } from "@/hooks/useOrders";
import { isClientError } from "@/utils/errors";
import { formatDateTime, orderCode } from "@/utils/format";

export default function OrderConfirmationPage() {
  useDocumentTitle("Order placed");

  const { id } = useParams<{ id: string }>();
  const { data: order, isPending, isError, error, refetch } = useOrder(id);

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

  return (
    <Container narrow className="py-10 sm:py-14">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="h-14 w-14 text-moss" strokeWidth={1.5} aria-hidden="true" />
        <h1 className="mt-4 text-3xl sm:text-4xl">Your order has been placed</h1>
        <p className="mt-2 text-muted">
          Order {orderCode(order._id)} · {formatDateTime(order.createdAt)}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <OrderStatusBadge status={order.orderStatus} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <p className="mt-4 max-w-md text-muted">
          You'll pay in cash when it is delivered. Follow its progress any time
          in My orders.
        </p>
      </div>

      <section className="mt-10 rounded border border-line bg-surface p-5">
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
        </section>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to={`/orders/${order._id}`} className={buttonStyles("primary", "lg")}>
          View order details
        </Link>
        <Link to="/products" className={buttonStyles("secondary", "lg")}>
          Continue shopping
        </Link>
      </div>
    </Container>
  );
}
