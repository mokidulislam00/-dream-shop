import { Link } from "react-router-dom";
import { Banknote, PackageCheck, Store, Truck } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { GadgetScene } from "@/components/common/GadgetScene";
import { SectionHeading } from "@/components/common/SectionHeading";
import { Container } from "@/components/layout/Container";
import { CategoryTile } from "@/components/products/CategoryTile";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "@/components/products/ProductGrid";
import { buttonStyles } from "@/components/ui/Button";
import { siteConfig } from "@/constants/site";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCategories, useProducts } from "@/hooks/useCatalog";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { groupCategories } from "@/utils/category";

const FEATURED_PARAMS = { featured: true, limit: 8 } as const;
const LATEST_PARAMS = { sort: "newest", limit: 8 } as const;

// These reflect how the backend actually works (COD only, no delivery
// charge, order tracking in the account).
const BENEFITS = [
  {
    icon: Banknote,
    title: "Cash on Delivery",
    text: "Pay when your order arrives.",
  },
  {
    icon: Truck,
    title: "No delivery charge",
    text: "Delivery is free on every order.",
  },
  {
    icon: PackageCheck,
    title: "Track your order",
    text: "Follow each status update in My orders.",
  },
] as const;

export default function HomePage() {
  useDocumentTitle(undefined);

  const featured = useProducts(FEATURED_PARAMS);
  const latest = useProducts(LATEST_PARAMS);
  const categories = useCategories();

  const featuredProducts = featured.data?.products ?? [];
  const latestProducts = latest.data?.products ?? [];
  const roots = categories.data
    ? groupCategories(categories.data.categories).roots.slice(0, 6)
    : [];

  const productsLoaded = !featured.isPending && !latest.isPending;
  const catalogEmpty =
    productsLoaded &&
    !featured.isError &&
    !latest.isError &&
    featuredProducts.length === 0 &&
    latestProducts.length === 0;

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-paper">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgb(var(--paper) / 0.09) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <Container className="relative grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:py-20">
          <div>
            <p className="rise text-sm font-medium uppercase tracking-[0.18em] text-accent">
              {siteConfig.tagline}
            </p>
            <h1 className="rise rise-2 mt-3 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              {siteConfig.name}
            </h1>
            <p className="rise rise-3 mt-5 max-w-md text-lg text-paper/75">
              Gadgets and accessories delivered to your door. Pay in cash when
              your order arrives.
            </p>
            <div className="rise rise-3 mt-8 flex flex-wrap gap-3">
              <Link to="/products" className={buttonStyles("accent", "lg")}>
                Shop all products
              </Link>
              <Link to="/categories" className={buttonStyles("light", "lg")}>
                Browse categories
              </Link>
            </div>
          </div>

          <GadgetScene className="mx-auto w-full max-w-md lg:max-w-none" />
        </Container>
      </section>

      <section aria-label="Shopping benefits" className="border-b border-line">
        <Container>
          <ul className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3 py-5 sm:px-6 sm:first:pl-0">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {catalogEmpty ? (
        <Container>
          <EmptyState
            icon={Store}
            title="Products are on their way"
            description="The catalogue is empty right now. Please check back soon."
          />
        </Container>
      ) : null}

      {categories.isPending || roots.length > 0 ? (
        <Container className="pt-14">
          <SectionHeading title="Shop by category" to="/categories" />
          {categories.isPending ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {roots.map((category) => (
                <CategoryTile key={category._id} category={category} />
              ))}
            </div>
          )}
        </Container>
      ) : null}

      {featured.isError && latest.isError ? (
        <Container>
          <ErrorState
            title="Products couldn't be loaded"
            error={featured.error}
            onRetry={() => {
              void featured.refetch();
              void latest.refetch();
            }}
          />
        </Container>
      ) : null}

      {featured.isPending || featuredProducts.length > 0 ? (
        <Container className="pt-14">
          <SectionHeading
            title="Featured products"
            to="/products?featured=true"
          />
          {featured.isPending ? (
            <ProductGridSkeleton count={4} className="lg:grid-cols-4" />
          ) : (
            <ProductGrid products={featuredProducts} className="lg:grid-cols-4" />
          )}
        </Container>
      ) : null}

      {latest.isPending || latestProducts.length > 0 ? (
        <Container className="pt-14">
          <SectionHeading title="New arrivals" to="/products?sort=newest" />
          {latest.isPending ? (
            <ProductGridSkeleton count={4} className="lg:grid-cols-4" />
          ) : (
            <ProductGrid products={latestProducts} className="lg:grid-cols-4" />
          )}
        </Container>
      ) : null}
    </>
  );
}
