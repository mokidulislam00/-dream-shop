import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/lib/queryKeys";
import { AUTH_EXPIRED_EVENT, type AuthEndReason } from "@/services/api";
import {
  authService,
  type LoginInput,
  type RegisterInput,
} from "@/services/auth.service";
import type { User } from "@/types/models";
import { ApiError } from "@/utils/errors";

export type AuthStatus = "loading" | "authenticated" | "guest" | "error";

// A harmless boolean hint (never a token) used only to pick the right
// placeholder while the session check is still running.
const HINT_KEY = "dream-shop:signed-in";

const readHint = (): boolean => {
  try {
    return window.localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
};

const writeHint = (signedIn: boolean): void => {
  try {
    if (signedIn) {
      window.localStorage.setItem(HINT_KEY, "1");
    } else {
      window.localStorage.removeItem(HINT_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode); the hint is optional.
  }
};

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isAdmin: boolean;
  // While the session check runs: was the visitor signed in last time?
  likelySignedIn: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Cached data that belongs to a signed-in user.
const PRIVATE_QUERY_ROOTS = new Set(["cart", "wishlist", "orders", "admin"]);

// Ends the local session: marks the user as signed out and drops private
// cached data. The auth query itself is updated (not removed) so the
// components watching it re-render immediately.
const endSession = (client: QueryClient): void => {
  client.setQueryData(queryKeys.auth.me, null);
  client.removeQueries({
    predicate: (query) => PRIVATE_QUERY_ROOTS.has(String(query.queryKey[0])),
  });
};

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
  const [hint] = useState(readHint);

  let status: AuthStatus;

  if (query.isPending) {
    status = "loading";
  } else if (query.isError) {
    status = "error";
  } else {
    status = user ? "authenticated" : "guest";
  }

  useEffect(() => {
    if (status === "authenticated") {
      writeHint(true);
    } else if (status === "guest") {
      writeHint(false);
    }
  }, [status]);

  // A protected request showed the session ended (expired or blocked).
  useEffect(() => {
    const handleEnded = (event: Event) => {
      const reason = (event as CustomEvent<AuthEndReason>).detail;
      const hadUser = queryClient.getQueryData(queryKeys.auth.me) !== null;

      endSession(queryClient);

      if (hadUser) {
        toast.error(
          reason === "blocked"
            ? "Your account has been blocked. Please contact us if you think this is a mistake."
            : "Your session has expired. Please sign in again."
        );
      }
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleEnded);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleEnded);
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
    } catch (error) {
      // If the server could not be reached the cookie is still valid, so
      // stay signed in and let the caller report the failure.
      if (!(error instanceof ApiError && error.status === 401)) {
        throw error;
      }
    }

    endSession(queryClient);
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
      likelySignedIn: status === "loading" ? hint : user !== null,
      login,
      register,
      logout,
      setUser,
      retry,
    }),
    [user, status, hint, login, register, logout, setUser, retry]
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
