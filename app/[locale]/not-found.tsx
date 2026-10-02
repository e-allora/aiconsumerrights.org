import { NotFoundContent } from "@/components/ui/NotFoundContent";

// Shown when a page inside a language calls notFound(). Addresses that match
// no page at all are sent to /[locale]/missing by proxy.ts, which serves the
// same content as ready-made HTML.
export default function LocaleNotFound() {
  return <NotFoundContent />;
}
