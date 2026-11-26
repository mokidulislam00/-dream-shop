import type { ReactNode } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { Container } from "@/components/layout/Container";
import { siteConfig } from "@/constants/site";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface ContactItem {
  icon: typeof Phone;
  label: string;
  content: ReactNode;
}

export default function ContactPage() {
  useDocumentTitle("Contact");

  const { phone, email, address, hours } = siteConfig.contact;

  const items: ContactItem[] = [];

  if (phone) {
    items.push({
      icon: Phone,
      label: "Phone",
      content: (
        <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-accent">
          {phone}
        </a>
      ),
    });
  }

  if (email) {
    items.push({
      icon: Mail,
      label: "Email",
      content: (
        <a href={`mailto:${email}`} className="hover:text-accent">
          {email}
        </a>
      ),
    });
  }

  if (address) {
    items.push({
      icon: MapPin,
      label: "Address",
      content: <span className="whitespace-pre-line">{address}</span>,
    });
  }

  if (hours) {
    items.push({
      icon: Clock,
      label: "Opening hours",
      content: <span className="whitespace-pre-line">{hours}</span>,
    });
  }

  return (
    <Container narrow className="py-10 sm:py-14">
      <h1 className="text-3xl sm:text-4xl">Contact</h1>

      {items.length > 0 ? (
        <dl className="mt-8 divide-y divide-line border-y border-line">
          {items.map(({ icon: Icon, label, content }) => (
            <div key={label} className="flex gap-4 py-5">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-0.5 text-lg">{content}</dd>
              </div>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-5 max-w-xl text-muted">
          Contact details haven't been added yet. If you have placed an order,
          you can check its status any time in My orders.
        </p>
      )}
    </Container>
  );
}
