import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  title,
  to,
  linkLabel = "View all",
}: {
  title: string;
  to?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      {to ? (
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
