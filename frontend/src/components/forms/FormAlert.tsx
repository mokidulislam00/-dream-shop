import type { ReactNode } from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";

export function FormAlert({
  children,
  variant = "error",
}: {
  children: ReactNode;
  variant?: "error" | "blocked";
}) {
  const Icon = variant === "blocked" ? ShieldAlert : AlertCircle;

  return (
    <div
      role="alert"
      className="flex gap-3 rounded border border-danger/30 bg-danger-soft p-3 text-sm text-danger"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
