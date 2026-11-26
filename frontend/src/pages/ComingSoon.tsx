import { Container } from "@/components/layout/Container";

// Temporary route target. Each page is replaced by its real implementation
// in the phase noted on the route.
export default function ComingSoon({
  title,
  phase,
}: {
  title: string;
  phase: number;
}) {
  return (
    <Container className="py-16">
      <p className="text-sm font-medium uppercase tracking-wider text-accent">
        Phase {phase}
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-xl text-muted">
        This page is wired into the router and will be built in Phase {phase}.
      </p>
    </Container>
  );
}
