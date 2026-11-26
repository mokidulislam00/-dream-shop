import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export function Container({
  children,
  className,
  narrow = false,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        narrow ? "max-w-3xl" : "max-w-page",
        className
      )}
    >
      {children}
    </div>
  );
}
