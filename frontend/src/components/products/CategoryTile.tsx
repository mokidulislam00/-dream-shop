import { Link } from "react-router-dom";

import { ProductImage } from "@/components/products/ProductImage";
import type { Category } from "@/types/models";
import { getCategoryIcon } from "@/utils/categoryIcon";

export function CategoryTile({ category }: { category: Category }) {
  const Icon = getCategoryIcon(category.name);

  return (
    <Link
      to={`/categories/${category._id}`}
      className="group block overflow-hidden rounded border border-line bg-surface hover:border-ink/40"
    >
      {category.image ? (
        <div className="aspect-[4/3] overflow-hidden bg-ink/5">
          <ProductImage
            src={category.image}
            alt=""
            width={500}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
        {category.image ? null : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-ink text-paper transition-colors group-hover:bg-accent">
            <Icon className="icon-wiggle h-5 w-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 break-words [overflow-wrap:anywhere]">
          <h3 className="font-sans text-base font-semibold tracking-normal group-hover:text-accent">
            {category.name}
          </h3>
          {category.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted">
              {category.description}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
