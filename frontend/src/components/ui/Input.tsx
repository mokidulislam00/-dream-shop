import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, endAdornment, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = `${inputId}-message`;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? messageId : undefined}
            className={cn(
              "h-11 w-full rounded border bg-surface px-3 text-base text-ink placeholder:text-muted/70",
              "transition-colors disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted",
              error ? "border-danger" : "border-line hover:border-ink/40",
              endAdornment ? "pr-11" : undefined,
              className
            )}
            {...rest}
          />
          {endAdornment ? (
            <div className="absolute inset-y-0 right-0 flex items-center">
              {endAdornment}
            </div>
          ) : null}
        </div>
        {error ? (
          <p id={messageId} role="alert" className="mt-1.5 text-sm text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={messageId} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
