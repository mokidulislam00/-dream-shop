import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { buttonStyles } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";

interface LocationState {
  from?: string;
}

// Customer (and admin) pages that need a signed-in user.
export function RequireAuth() {
  const { status, retry } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <PageSpinner label="Checking your session" />;
  }

  if (status === "error") {
    return (
      <ErrorState
        title="We couldn't check your session"
        error={new Error("The server could not be reached.")}
        onRetry={retry}
      />
    );
  }

  if (status === "guest") {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to="/login" replace state={{ from } satisfies LocationState} />;
  }

  return <Outlet />;
}

// Admin pages. Must be nested inside <RequireAuth />.
export function RequireAdmin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Admin access required"
        description="Your account does not have permission to view this page."
        action={
          <Link to="/" className={buttonStyles("secondary")}>
            Back to the store
          </Link>
        }
      />
    );
  }

  return <Outlet />;
}

// Login and registration are not shown to signed-in users.
export function GuestOnly() {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <PageSpinner />;
  }

  if (status === "authenticated") {
    const from = (location.state as LocationState | null)?.from;
    return <Navigate to={from ?? (isAdmin ? "/admin" : "/account")} replace />;
  }

  return <Outlet />;
}
