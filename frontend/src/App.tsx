import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { PageSpinner } from "@/components/ui/Spinner";
import { AuthProvider } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { router } from "@/routes";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} fallbackElement={<PageSpinner label="Loading" />} />
        <Toaster position="bottom-right" closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
