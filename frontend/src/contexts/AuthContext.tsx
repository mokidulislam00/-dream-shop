import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/lib/queryKeys";
import { AUTH_EXPIRED_EVENT } from "@/services/api";
import {
  authService,
  type LoginInput,
  type RegisterInput,
} from "@/services/auth.service";
import type { User } from "@/types/models";
import { ApiError } from "@/utils/errors";

export type AuthStatus = "loading" | "authenticated" | "guest" | "error";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Session restoration. The JWT is in an HTTP-only cookie, so the only
  // way to know if we are signed in is to ask the backend.
  const query = useQuery<User | null>({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        return await authService.me();
      } catch (error) {
        // 401 = signed out, 403 = blocked account. Both mean "guest" here.
        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          return null;
        }

        throw error;
      }
    },
    staleTime: 5 * 60_000,
  });

  const user = query.data ?? null;

  let status: AuthStatus;

  if (query.isPending) {
    status = "loading";
  } else if (query.isError) {
    status = "error";
  } else {
    status = user ? "authenticated" : "guest";
  }

  // A protected request returned 401: the session expired.
  useEffect(() => {
    const handleExpired = () => {
      const hadUser = queryClient.getQueryData(queryKeys.auth.me) !== null;

      queryClient.clear();
      queryClient.setQueryData(queryKeys.auth.me, null);

      if (hadUser) {
        toast.error("Your session has expired. Please sign in again.");
      }
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, [queryClient]);

  const setUser = useCallback(
    (next: User) => {
      queryClient.setQueryData(queryKeys.auth.me, next);
    },
    [queryClient]
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const loggedIn = await authService.login(input);
      queryClient.setQueryData(queryKeys.auth.me, loggedIn);
      return loggedIn;
    },
    [queryClient]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      // The backend signs the new customer in immediately.
      const created = await authService.register(input);
      queryClient.setQueryData(queryKeys.auth.me, created);
      return created;
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Drop every cached private resource (cart, orders, admin data).
      queryClient.clear();
      queryClient.setQueryData(queryKeys.auth.me, null);
    }
  }, [queryClient]);

  const retry = useCallback(() => {
    void query.refetch();
  }, [query]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated",
      isAdmin: user?.role === "admin",
      login,
      register,
      logout,
      setUser,
      retry,
    }),
    [user, status, login, register, logout, setUser, retry]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
