import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Price, discountPercent } from "@/components/products/Price";
import { ProductImage } from "@/components/products/ProductImage";
import { WishlistButton } from "@/components/products/WishlistButton";
import type { Product } from "@/types/models";

export function ProductCard({ product }: { product: Product }) {
  const percent = discountPercent(product);
  const soldOut = product.stock === 0;

  return (
    <article className="group">
      <div className="relative">
        <Link
          to={`/products/${product._id}`}
          tabIndex={-1}
          aria-hidden="true"
          className="block aspect-[4/5] overflow-hidden rounded bg-ink/5"
        >
          <ProductImage
            src={product.images[0]}
            alt=""
            width={500}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {soldOut ? <Badge tone="danger">Out of stock</Badge> : null}
          {!soldOut && percent > 0 ? <Badge tone="accent">−{percent}%</Badge> : null}
        </div>

        <WishlistButton
          productId={product._id}
          productName={product.name}
          className="absolute right-2 top-2"
        />
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted">
          {product.category?.name}
        </p>
        <h3 className="line-clamp-2 font-sans text-base font-medium leading-snug tracking-normal">
          <Link to={`/products/${product._id}`} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <Price product={product} />
      </div>
    </article>
  );
}
