import { QueryClient } from "@tanstack/react-query";

import { isClientError } from "@/utils/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      // Never retry 4xx responses; retry transient failures once.
      retry: (failureCount, error) =>
        !isClientError(error) && failureCount < 1,
    },
    mutations: {
      retry: false,
    },
  },
});
