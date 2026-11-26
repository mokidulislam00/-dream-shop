import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/utils/cn";

const buildPages = (page: number, total: number): Array<number | "gap"> => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, page - 1, page, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= total)
    .sort((a, b) => a - b);

  const result: Array<number | "gap"> = [];

  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];

    if (previous !== undefined && value - previous > 1) {
      result.push("gap");
    }

    result.push(value);
  });

  return result;
};

const itemStyle =
  "inline-flex h-10 min-w-10 items-center justify-center rounded px-2 text-sm font-medium";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button
        type="button"
        className={cn(itemStyle, "hover:bg-ink/5 disabled:opacity-40")}
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {buildPages(page, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              itemStyle,
              item === page ? "bg-ink text-paper" : "hover:bg-ink/5"
            )}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        className={cn(itemStyle, "hover:bg-ink/5 disabled:opacity-40")}
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
