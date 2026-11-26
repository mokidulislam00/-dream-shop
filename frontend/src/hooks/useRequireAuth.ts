import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";

// Returns a guard: call it before an action that needs a signed-in user.
// Guests are sent to the login page and brought back afterwards.
export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (message = "Please sign in to continue"): boolean => {
      if (isAuthenticated) {
        return true;
      }

      toast.info(message);
      navigate("/login", {
        state: { from: `${location.pathname}${location.search}` },
      });
      return false;
    },
    [isAuthenticated, navigate, location.pathname, location.search]
  );
}
