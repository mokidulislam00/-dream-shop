import { Star } from "lucide-react";

import { cn } from "@/utils/cn";

// Accessible star picker built from native radio inputs, so arrow keys
// and screen readers work without extra code.
export function StarRatingInput({
  value,
  onChange,
  error,
  name = "rating",
}: {
  value: number | undefined;
  onChange: (value: number) => void;
  error?: string;
  name?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Your rating</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = value !== undefined && star <= value;

          return (
            <label
              key={star}
              className="cursor-pointer rounded p-1 focus-within:outline focus-within:outline-2 focus-within:outline-accent"
            >
              <input
                type="radio"
                name={name}
                value={star}
                checked={value === star}
                onChange={() => onChange(star)}
                className="sr-only"
              />
              <Star
                aria-hidden="true"
                className={cn(
                  "h-8 w-8 transition-colors",
                  filled ? "fill-amber text-amber" : "text-line hover:text-amber"
                )}
              />
              <span className="sr-only">
                {star} {star === 1 ? "star" : "stars"}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
