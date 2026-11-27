import type { ReactNode } from "react";

import { GadgetScene } from "@/components/common/GadgetScene";

// Two-column layout for sign in / register: brand panel + form.
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-[70vh] lg:grid-cols-2">
      <aside
        aria-hidden="true"
        className="relative hidden items-center justify-center overflow-hidden bg-ink lg:flex"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgb(var(--paper) / 0.09) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <GadgetScene className="relative w-full max-w-md px-6" />
      </aside>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl sm:text-4xl">{title}</h1>
          {subtitle ? <p className="mt-2 text-muted">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-sm text-muted">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
