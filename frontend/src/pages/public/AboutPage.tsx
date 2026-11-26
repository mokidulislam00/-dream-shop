import { Link } from "react-router-dom";

import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/Button";
import { siteConfig } from "@/constants/site";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// The steps describe how the store actually works today.
const STEPS = [
  {
    title: "Browse and choose",
    text: "Search the catalogue or filter by category, brand and price.",
  },
  {
    title: "Add to your cart",
    text: "Create an account or sign in to keep a cart and a wishlist.",
  },
  {
    title: "Enter your delivery address",
    text: "Checkout asks for your name, phone number and address.",
  },
  {
    title: "Pay on delivery",
    text: "Payment is by cash when your order arrives. There is no delivery charge.",
  },
  {
    title: "Follow your order",
    text: "Each status change appears in My orders. Orders can be cancelled while they are pending or confirmed and not yet paid.",
  },
];

export default function AboutPage() {
  useDocumentTitle("About");

  return (
    <Container narrow className="py-10 sm:py-14">
      <h1 className="text-3xl sm:text-4xl">About {siteConfig.name}</h1>

      <p className="mt-5 text-lg text-ink/90">
        {siteConfig.about ||
          `${siteConfig.name} is an online store for ${siteConfig.tagline.toLowerCase()}. Browse the catalogue, order what you need and pay when it is delivered.`}
      </p>

      <h2 className="mt-12 text-2xl">How ordering works</h2>
      <ol className="mt-6 space-y-6">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-medium text-paper"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div>
              <h3 className="font-sans text-base font-semibold tracking-normal">
                {step.title}
              </h3>
              <p className="mt-1 text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12">
        <Link to="/products" className={buttonStyles("primary", "lg")}>
          Start shopping
        </Link>
      </div>
    </Container>
  );
}
