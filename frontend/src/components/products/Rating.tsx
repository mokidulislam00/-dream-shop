import { Star } from "lucide-react";

import { cn } from "@/utils/cn";

export function Rating({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const rounded = Math.round(value);

  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-amber", className)}
      role="img"
      aria-label={`${value.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn("h-4 w-4", index < rounded ? "fill-current" : "text-line")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
