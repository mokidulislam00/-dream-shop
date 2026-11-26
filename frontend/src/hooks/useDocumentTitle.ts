import { useEffect } from "react";

export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} · Dream Shop` : "Dream Shop";
  }, [title]);
}
