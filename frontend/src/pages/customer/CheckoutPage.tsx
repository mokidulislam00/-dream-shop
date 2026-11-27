import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { FormAlert } from "@/components/forms/FormAlert";
import { Container } from "@/components/layout/Container";
import { OrderTotals } from "@/components/orders/OrderParts";
import { ProductImage } from "@/components/products/ProductImage";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryKeys } from "@/lib/queryKeys";
import { orderService } from "@/services/order.service";
import {
  checkoutSchema,
  type CheckoutFormValues,
} from "@/schemas/checkout";
import { ApiError, getErrorMessage } from "@/utils/errors";
import { formatPrice, getEffectivePrice } from "@/utils/format";
import { applyFieldErrors } from "@/utils/forms";

const FIELDS = [
  "fullName",
  "phone",
  "addressLine",
  "city",
  "district",
  "postalCode",
  "country",
] as const;

export default function CheckoutPage() {
  useDocumentTitle("Checkout");

  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isPending, isError, error, refetch } = useCart();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.fullName ?? "",
      phone: "",
      addressLine: "",
      city: "",
      district: "",
      postalCode: "",
      country: "Bangladesh",
    },
  });

  if (isPending) {
    return (
      <Container className="py-10">
        <Skeleton className="mb-8 h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </Container>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Your cart couldn't be loaded"
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  const items = data.cart.items;
  const available = items.flatMap((item) =>
    item.product ? [{ ...item, product: item.product }] : []
  );

  if (items.length === 0) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add a product before checking out."
          action={
            <Link to="/products" className={buttonStyles("primary")}>
              Browse products
            </Link>
          }
        />
      </Container>
    );
  }

  const hasProblem =
    available.length !== items.length ||
    available.some(
      (item) =>
        item.product.status !== "active" ||
        item.product.stock < item.quantity
    );

  if (hasProblem) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={ShoppingBag}
          title="Some items need attention"
          description="One or more items are unavailable or exceed the stock. Update your cart, then check out."
          action={
            <Link to="/cart" className={buttonStyles("primary")}>
              Back to cart
            </Link>
          }
        />
      </Container>
    );
  }

  const subtotal =
    data.summary?.subtotal ??
    available.reduce(
      (sum, item) => sum + getEffectivePrice(item.product) * item.quantity,
      0
    );

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const order = await orderService.place({
        shippingAddress: {
          ...values,
          postalCode: values.postalCode || undefined,
        },
        paymentMethod: "cod",
      });

      // Leave the page before the (now emptied) cart refreshes.
      navigate(`/order-confirmation/${order._id}`, { replace: true });
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    } catch (submitError) {
      if (applyFieldErrors(submitError, setError, FIELDS)) {
        return;
      }

      const message =
        submitError instanceof ApiError && submitError.fieldErrors.length > 0
          ? submitError.fieldErrors[0].message
          : getErrorMessage(submitError);
      setFormError(message);
      toast.error(message);
      // Stock or price may have changed; refresh the cart.
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    }
  });

  return (
    <Container className="py-10">
      <h1 className="mb-8 text-3xl sm:text-4xl">Checkout</h1>

      <form
        onSubmit={onSubmit}
        noValidate
        className="lg:grid lg:grid-cols-[1fr_24rem] lg:gap-12"
      >
        <div className="space-y-10">
          {formError ? <FormAlert>{formError}</FormAlert> : null}

          <section aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="text-xl">
              Delivery address
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  label="Full name"
                  autoComplete="name"
                  error={errors.fullName?.message}
                  {...register("fullName")}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Phone number"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Address"
                  autoComplete="street-address"
                  hint="House, road, area"
                  error={errors.addressLine?.message}
                  {...register("addressLine")}
                />
              </div>
              <Input
                label="City"
                autoComplete="address-level2"
                error={errors.city?.message}
                {...register("city")}
              />
              <Input
                label="District"
                autoComplete="address-level1"
                error={errors.district?.message}
                {...register("district")}
              />
              <Input
                label="Postal code (optional)"
                autoComplete="postal-code"
                error={errors.postalCode?.message}
                {...register("postalCode")}
              />
              <Input
                label="Country"
                autoComplete="country-name"
                error={errors.country?.message}
                {...register("country")}
              />
            </div>
          </section>

          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="text-xl">
              Payment
            </h2>
            <div className="mt-5 flex items-start gap-3 rounded border-2 border-ink bg-surface p-4">
              <Banknote className="mt-0.5 h-5 w-5 text-accent" aria-hidden="true" />
              <div>
                <p className="font-medium">Cash on Delivery</p>
                <p className="mt-0.5 text-sm text-muted">
                  Pay in cash when your order is delivered.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="mt-10 h-fit rounded border border-line bg-surface p-5 lg:sticky lg:top-24 lg:mt-0">
          <h2 className="font-sans text-lg font-semibold tracking-normal">
            Your order
          </h2>
          <ul className="mt-4 divide-y divide-line">
            {available.map((item) => (
              <li key={item.product._id} className="flex gap-3 py-3">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded bg-ink/5">
                  <ProductImage src={item.product.images[0]} alt="" width={120} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-muted">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-medium">
                  {formatPrice(
                    getEffectivePrice(item.product) * item.quantity
                  )}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-line pt-4">
            <OrderTotals subtotal={subtotal} shippingCost={0} total={subtotal} />
          </div>

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            loading={isSubmitting}
          >
            Place order
          </Button>
          <p className="mt-3 text-center text-sm text-muted">
            Prices are confirmed when the order is placed.
          </p>
        </aside>
      </form>
    </Container>
  );
}
