import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { cn } from "@/utils/cn";

export function StatCard({
  label,
  value,
  note,
  to,
  highlight = false,
}: {
  label: string;
  value: ReactNode;
  note?: string;
  to?: string;
  highlight?: boolean;
}) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl tracking-tight">{value}</p>
      {note ? <p className="mt-1 text-sm text-muted">{note}</p> : null}
    </>
  );

  const classes = cn(
    "block rounded border bg-surface p-4",
    highlight ? "border-accent" : "border-line",
    to && "hover:border-ink/40"
  );

  return to ? (
    <Link to={to} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}
