import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl">Something went wrong</h1>
        <p className="mt-3 max-w-md text-muted">
          An unexpected error occurred. Reloading the page usually fixes it.
        </p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    );
  }
}
