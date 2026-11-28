import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, SearchX } from "lucide-react";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { AccountStatusBadge, Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageSpinner } from "@/components/ui/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryKeys } from "@/lib/queryKeys";
import { adminService } from "@/services/admin.service";
import type { AccountStatus } from "@/types/models";
import { getErrorMessage, isClientError } from "@/utils/errors";
import { formatDateTime } from "@/utils/format";

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<AccountStatus | null>(null);

  const { data: user, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.user(id ?? ""),
    queryFn: () => adminService.getUser(id as string),
    enabled: Boolean(id),
  });

  useDocumentTitle(user?.fullName ?? "User");

  const setStatus = useMutation({
    mutationFn: (next: AccountStatus) =>
      adminService.setUserStatus(id as string, next),
    onSuccess: async (_result, next) => {
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      setConfirming(null);
      toast.success(
        next === "blocked" ? "The account has been blocked" : "The account has been unblocked"
      );
    },
    onError: (mutationError) => {
      setConfirming(null);
      toast.error(getErrorMessage(mutationError));
    },
  });

  if (isPending) {
    return <PageSpinner label="Loading user" />;
  }

  if (isError) {
    return isClientError(error) ? (
      <EmptyState
        icon={SearchX}
        title="User not found"
        action={
          <Link to="/admin/users" className={buttonStyles("primary")}>
            Back to users
          </Link>
        }
      />
    ) : (
      <ErrorState error={error} onRetry={() => void refetch()} />
    );
  }

  const isCustomer = user.role === "customer";
  const isSelf = me?.id === user._id;
  const nextStatus: AccountStatus =
    user.accountStatus === "active" ? "blocked" : "active";

  return (
    <div className="max-w-2xl">
      <Link
        to="/admin/users"
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Users
      </Link>

      <AdminPageHeader
        title={user.fullName}
        actions={
          <div className="flex gap-2">
            <Badge tone={user.role === "admin" ? "accent" : "neutral"}>
              {user.role === "admin" ? "Admin" : "Customer"}
            </Badge>
            <AccountStatusBadge status={user.accountStatus} />
          </div>
        }
      />

      <section className="rounded border border-line bg-surface p-5">
        <dl className="divide-y divide-line text-sm">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-muted">Email</dt>
            <dd>
              <a href={`mailto:${user.email}`} className="text-accent hover:underline">
                {user.email}
              </a>
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-muted">Joined</dt>
            <dd>{formatDateTime(user.createdAt)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-muted">Last updated</dt>
            <dd>{formatDateTime(user.updatedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded border border-line bg-surface p-5">
        <h2 className="font-sans text-lg font-semibold tracking-normal">
          Account access
        </h2>

        {isCustomer && !isSelf ? (
          <>
            <p className="mt-2 text-sm text-muted">
              {user.accountStatus === "active"
                ? "Blocking stops this customer from signing in and using their account."
                : "This account is blocked. Unblocking lets the customer sign in again."}
            </p>
            <Button
              className="mt-4"
              variant={user.accountStatus === "active" ? "danger" : "primary"}
              onClick={() => setConfirming(nextStatus)}
            >
              {user.accountStatus === "active" ? "Block customer" : "Unblock customer"}
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            {isSelf
              ? "You can't change your own account."
              : "Only customer accounts can be blocked or unblocked."}
          </p>
        )}
      </section>

      <ConfirmDialog
        open={confirming !== null}
        title={confirming === "blocked" ? "Block this customer?" : "Unblock this customer?"}
        description={
          confirming === "blocked"
            ? `${user.fullName} will no longer be able to sign in.`
            : `${user.fullName} will be able to sign in again.`
        }
        confirmLabel={confirming === "blocked" ? "Block customer" : "Unblock customer"}
        variant={confirming === "blocked" ? "danger" : "primary"}
        loading={setStatus.isPending}
        onClose={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming) {
            setStatus.mutate(confirming);
          }
        }}
      />
    </div>
  );
}
