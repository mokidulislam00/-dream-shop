import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors " +
  "disabled:cursor-not-allowed disabled:opacity-50 select-none whitespace-nowrap";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-accent-deep",
  secondary:
    "border border-ink/25 bg-surface text-ink hover:border-ink hover:bg-paper",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

// Shared with <Link> elements that should look like buttons.
export const buttonStyles = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string
): string => cn(base, variants[variant], sizes[size], className);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      className,
      disabled,
      children,
      type = "button",
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles(variant, size, className)}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
    </button>
  )
);

Button.displayName = "Button";
