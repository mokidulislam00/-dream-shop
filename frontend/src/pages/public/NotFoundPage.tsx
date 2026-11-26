import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { buttonStyles } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      description="The page you are looking for doesn't exist or has moved."
      action={
        <Link to="/" className={buttonStyles("primary")}>
          Go to the homepage
        </Link>
      }
    />
  );
}
