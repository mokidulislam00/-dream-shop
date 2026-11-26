import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      {Icon ? (
        <Icon className="mb-4 h-10 w-10 text-muted" strokeWidth={1.5} />
      ) : null}
      <h2 className="text-xl">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
