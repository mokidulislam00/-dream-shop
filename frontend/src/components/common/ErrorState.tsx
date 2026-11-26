import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/utils/errors";

export function ErrorState({
  error,
  onRetry,
  title = "We couldn't load this",
}: {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center px-4 py-16 text-center"
    >
      <AlertCircle className="mb-4 h-10 w-10 text-danger" strokeWidth={1.5} />
      <h2 className="text-xl">{title}</h2>
      <p className="mt-2 max-w-md text-muted">{getErrorMessage(error)}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
