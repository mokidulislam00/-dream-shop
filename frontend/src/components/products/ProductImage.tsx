import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/utils/cn";
import { optimizeImage } from "@/utils/image";

export function ProductImage({
  src,
  alt,
  width = 600,
  className,
  priority = false,
}: {
  src?: string;
  alt: string;
  width?: number;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-ink/5 text-muted",
          className
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={optimizeImage(src, width)}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
