import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/utils/errors";

const itemStyle =
  "flex h-11 w-full items-center gap-3 px-4 text-sm hover:bg-ink/5";

export function AccountMenu() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close when the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside click and on Escape (returning focus to the button).
  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await logout();
      toast.success("You have been signed out");
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, "We couldn't sign you out. Please try again."));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="inline-flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-ink/5"
      >
        <UserIcon className="h-5 w-5" />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded border border-line bg-surface shadow-pop"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate font-medium">{user.fullName}</p>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>

          <Link role="menuitem" to="/orders" className={itemStyle}>
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            My orders
          </Link>
          <Link role="menuitem" to="/account" className={itemStyle}>
            <Settings className="h-4 w-4" aria-hidden="true" />
            Account settings
          </Link>
          {isAdmin ? (
            <Link role="menuitem" to="/admin" className={itemStyle}>
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Admin dashboard
            </Link>
          ) : null}

          <button
            type="button"
            role="menuitem"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
            className={`${itemStyle} border-t border-line text-danger disabled:opacity-60`}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
