import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { AccountStatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { queryKeys } from "@/lib/queryKeys";
import { adminService } from "@/services/admin.service";
import type { AccountStatus, UserRole } from "@/types/models";
import { formatDate } from "@/utils/format";

const PAGE_SIZE = 15;

const isRole = (value: string | null): value is UserRole =>
  value === "customer" || value === "admin";

const isAccountStatus = (value: string | null): value is AccountStatus =>
  value === "active" || value === "blocked";

export default function AdminUsersPage() {
  useDocumentTitle("Users");

  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const statusParam = searchParams.get("status");
  const role = isRole(roleParam) ? roleParam : undefined;
  const accountStatus = isAccountStatus(statusParam) ? statusParam : undefined;
  const search = (searchParams.get("search") ?? "").slice(0, 100);
  const rawPage = Number(searchParams.get("page"));
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  const [searchDraft, setSearchDraft] = useState(search);

  const params = {
    search: search || undefined,
    role,
    accountStatus,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.users(params),
    queryFn: () => adminService.listUsers(params),
    placeholderData: keepPreviousData,
  });

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(patch)) {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    }

    if (!("page" in patch)) {
      next.delete("page");
    }

    setSearchParams(next);
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    update({ search: searchDraft.trim() || undefined });
  };

  return (
    <div>
      <AdminPageHeader title="Users" description="Customer and admin accounts." />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_10rem_10rem]">
        <form onSubmit={submitSearch} role="search" className="flex gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor="user-search" className="sr-only">
              Search users by name or email
            </label>
            <input
              id="user-search"
              type="search"
              value={searchDraft}
              maxLength={100}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search name or email"
              className="h-11 w-full rounded border border-line bg-surface px-3 hover:border-ink/40"
            />
          </div>
          <Button type="submit" variant="secondary" aria-label="Search">
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>

        <Select
          label="Role"
          hideLabel
          value={role ?? ""}
          onChange={(event) => update({ role: event.target.value })}
        >
          <option value="">All roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </Select>

        <Select
          label="Account status"
          hideLabel
          value={accountStatus ?? ""}
          onChange={(event) => update({ status: event.target.value })}
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </Select>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Users couldn't be loaded"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : data.users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try a different search or filter."
        />
      ) : (
        <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
          <div className="hidden overflow-x-auto rounded border border-line bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Name</th>
                  <th scope="col" className="px-4 py-3 font-medium">Email</th>
                  <th scope="col" className="px-4 py-3 font-medium">Role</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.users.map((user) => (
                  <tr key={user._id} className="hover:bg-ink/[0.02]">
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/users/${user._id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {user.fullName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={user.role === "admin" ? "accent" : "neutral"}>
                        {user.role === "admin" ? "Admin" : "Customer"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <AccountStatusBadge status={user.accountStatus} />
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {data.users.map((user) => (
              <li key={user._id}>
                <Link
                  to={`/admin/users/${user._id}`}
                  className="block rounded border border-line bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate font-medium">{user.fullName}</p>
                    <AccountStatusBadge status={user.accountStatus} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted">
                    <span>{user.role === "admin" ? "Admin" : "Customer"}</span>
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <Pagination
              page={data.pagination.currentPage}
              totalPages={data.pagination.totalPages}
              onChange={(next) => update({ page: String(next) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
