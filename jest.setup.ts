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
