import { useState } from "react";

import { ProductImage } from "@/components/products/ProductImage";
import { cn } from "@/utils/cn";

export function ImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[Math.min(active, Math.max(images.length - 1, 0))];

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded bg-ink/5">
        <ProductImage src={current} alt={alt} width={1000} priority />
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-5 gap-2" aria-label="Product images">
          {images.map((image, index) => (
            <li key={`${image}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === active ? "true" : undefined}
                className={cn(
                  "block aspect-square w-full overflow-hidden rounded border-2 bg-ink/5",
                  index === active ? "border-ink" : "border-transparent hover:border-line"
                )}
              >
                <ProductImage src={image} alt="" width={160} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
