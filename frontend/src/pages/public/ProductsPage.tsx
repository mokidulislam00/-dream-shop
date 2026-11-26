import { Container } from "@/components/layout/Container";
import { ProductListing } from "@/components/products/ProductListing";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function ProductsPage() {
  useDocumentTitle("All products");

  return (
    <Container className="py-10">
      <h1 className="mb-8 text-3xl sm:text-4xl">All products</h1>
      <ProductListing />
    </Container>
  );
}
