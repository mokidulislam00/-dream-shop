import { Link } from "react-router-dom";

import { Container } from "@/components/layout/Container";
import { useAuth } from "@/contexts/AuthContext";

export function Footer() {
  const { isAuthenticated } = useAuth();

  const links = [
    { to: "/products", label: "Shop" },
    { to: "/categories", label: "Categories" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
    isAuthenticated
      ? { to: "/orders", label: "My orders" }
      : { to: "/login", label: "Sign in" },
  ];

  return (
    <footer className="mt-20 border-t border-line">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl tracking-tight">
            Dream<span className="text-accent">Shop</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            © {new Date().getFullYear()} Dream Shop
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-muted hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
