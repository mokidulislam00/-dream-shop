import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { Container } from "@/components/layout/Container";
import { ProductListing } from "@/components/products/ProductListing";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const term = (searchParams.get("q") ?? "").trim().slice(0, 100);

  useDocumentTitle(term ? `Search: ${term}` : "Search");

  if (!term) {
    return (
      <Container className="py-10">
        <EmptyState
          icon={Search}
          title="Search the catalogue"
          description="Type a product name, brand or keyword in the search box above."
        />
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <h1 className="mb-8 text-3xl sm:text-4xl">
        Results for “{term}”
      </h1>
      <ProductListing fixedSearch={term} />
    </Container>
  );
}
