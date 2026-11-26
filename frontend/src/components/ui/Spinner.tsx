import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("h-5 w-5 animate-spin text-muted", className)}
      aria-hidden="true"
    />
  );
}

export function PageSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3"
    >
      <Spinner className="h-7 w-7" />
      <span className="text-sm text-muted">{label}…</span>
    </div>
  );
}
