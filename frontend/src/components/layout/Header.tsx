import { useEffect, useState, type FormEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User as UserIcon,
  X,
} from "lucide-react";

import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/utils/cn";

const NAV_LINKS = [
  { to: "/products", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const iconLink =
  "inline-flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-ink/5";

export function Header() {
  const { user, status, isAdmin } = useAuth();
  const { data: cartData } = useCart();
  const cartCount = cartData?.summary?.totalItems ?? 0;
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim();

    if (term) {
      navigate(`/search?q=${encodeURIComponent(term)}`);
      setMenuOpen(false);
    }
  };

  const searchForm = (
    <form onSubmit={handleSearch} role="search" className="relative w-full">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        maxLength={100}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products"
        className="h-11 w-full rounded border border-line bg-surface pl-3 pr-11 text-base placeholder:text-muted/70 hover:border-ink/40"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-muted hover:text-ink"
      >
        <Search className="h-5 w-5" aria-hidden="true" />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <Container className="flex h-16 items-center gap-4 lg:gap-8">
        <button
          type="button"
          className={cn(iconLink, "-ml-2 lg:hidden")}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        <Link to="/" className="font-display text-2xl leading-none tracking-tight">
          Dream<span className="text-accent">Shop</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "text-sm font-medium hover:text-accent",
                  isActive ? "text-accent" : "text-ink"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden w-full max-w-xs lg:block">{searchForm}</div>

        <div className="ml-auto flex items-center lg:ml-0">
          <Link to="/wishlist" className={iconLink} aria-label="Wishlist">
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            to="/cart"
            className={cn(iconLink, "relative")}
            aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 ? (
              <span
                key={cartCount}
                aria-hidden="true"
                className="cart-bump absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white"
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>

          {status === "loading" ? (
            <span className="ml-1 h-9 w-20 animate-pulse rounded bg-ink/10" />
          ) : user ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="ml-1 hidden px-3 text-sm font-medium hover:text-accent sm:inline"
                >
                  Admin
                </Link>
              ) : null}
              <Link to="/account" className={iconLink} aria-label="My account">
                <UserIcon className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className={buttonStyles("primary", "sm", "ml-1")}
            >
              Sign in
            </Link>
          )}
        </div>
      </Container>

      {menuOpen ? (
        <div
          id="mobile-menu"
          className="border-t border-line bg-paper lg:hidden"
        >
          <Container className="space-y-4 py-4">
            {searchForm}
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex h-12 items-center border-b border-line text-base font-medium",
                      isActive ? "text-accent" : "text-ink"
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {isAdmin ? (
                <NavLink
                  to="/admin"
                  className="flex h-12 items-center text-base font-medium"
                >
                  Admin dashboard
                </NavLink>
              ) : null}
            </nav>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
