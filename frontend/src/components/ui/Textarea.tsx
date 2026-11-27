import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { cn } from "@/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...rest }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const messageId = `${textareaId}-message`;

    return (
      <div className="w-full">
        <label
          htmlFor={textareaId}
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? messageId : undefined}
          className={cn(
            "min-h-[96px] w-full rounded border bg-surface px-3 py-2 text-base text-ink placeholder:text-muted/70",
            error ? "border-danger" : "border-line hover:border-ink/40",
            className
          )}
          {...rest}
        />
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

Textarea.displayName = "Textarea";
