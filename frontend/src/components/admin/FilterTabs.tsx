import { cn } from "@/utils/cn";

// Scrollable pill filter (used for order views).
export function FilterTabs<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ key: T; label: string }>;
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1">
      <ul className="flex gap-2 pb-1">
        {options.map((option) => (
          <li key={option.key}>
            <button
              type="button"
              onClick={() => onChange(option.key)}
              aria-current={option.key === value ? "true" : undefined}
              className={cn(
                "h-10 whitespace-nowrap rounded-full border px-4 text-sm font-medium",
                option.key === value
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-surface hover:border-ink/40"
              )}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
