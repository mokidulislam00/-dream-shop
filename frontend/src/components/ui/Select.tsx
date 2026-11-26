import { forwardRef, useId, type SelectHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hideLabel?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hideLabel = false, className, id, children, ...rest }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div>
        <label
          htmlFor={selectId}
          className={cn(
            "mb-1.5 block text-sm font-medium",
            hideLabel && "sr-only"
          )}
        >
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={cn(
            "h-11 w-full rounded border border-line bg-surface px-3 text-base hover:border-ink/40",
            className
          )}
          {...rest}
        >
          {children}
        </select>
      </div>
    );
  }
);

Select.displayName = "Select";
