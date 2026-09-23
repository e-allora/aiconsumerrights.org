import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

// jsdom lacks these; react-dom/server needs them to render the root layout.
Object.assign(globalThis, { TextEncoder, TextDecoder });

// jsdom has no matchMedia; next-themes uses it to read the system theme.
// Report "no match" so tests run as a light-mode visitor.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// next/link prefetches with IntersectionObserver and updates state after the
// test ends. A plain anchor keeps href, aria and click behavior.
jest.mock("next/link", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  const Link = React.forwardRef(function Link(
    { href, prefetch: _prefetch, ...props }: { href: string; prefetch?: boolean },
    ref: unknown
  ) {
    return React.createElement("a", { href, ref, ...props });
  });
  return { __esModule: true, default: Link };
});
