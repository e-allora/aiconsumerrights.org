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

// next-intl/server only runs in React Server Components. In tests, give the
// same functions a translator over the real message files.
jest.mock("next-intl/server", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createTranslator } = require("next-intl");
  const load = (locale: string) =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require(`./messages/${locale}.json`);
  const state = globalThis as unknown as { __requestLocale?: string };
  const localeOf = (opts?: { locale?: string }) => opts?.locale ?? state.__requestLocale ?? "en";
  return {
    // i18n.ts wraps its loader in this; tests call the loader directly.
    getRequestConfig: <T,>(fn: T) => fn,
    setRequestLocale: (locale: string) => {
      state.__requestLocale = locale;
    },
    getMessages: async (opts?: { locale?: string }) => load(localeOf(opts)),
    getTranslations: async (opts?: string | { locale?: string; namespace?: string }) => {
      const o = typeof opts === "string" ? { namespace: opts } : (opts ?? {});
      const locale = localeOf(o);
      return createTranslator({ locale, messages: load(locale), namespace: o.namespace });
    },
  };
});

// Locale-aware Link and router from lib/i18n/navigation, without Next's
// router. Tests set globalThis.__mockPathname and __mockRouter as needed.
jest.mock("@/lib/i18n/navigation", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useLocale } = require("next-intl");
  const state = globalThis as unknown as {
    __mockPathname?: string;
    __mockRouter?: { replace: jest.Mock; push: jest.Mock };
  };
  const Link = React.forwardRef(function Link(
    { href, locale, prefetch: _prefetch, ...props }: { href: string; locale?: string; prefetch?: boolean },
    ref: unknown
  ) {
    const active = useLocale();
    const path = href === "/" ? "" : href;
    return React.createElement("a", { href: `/${locale ?? active}${path}`, ref, ...props });
  });
  return {
    Link,
    usePathname: () => state.__mockPathname ?? "/",
    useRouter: () => state.__mockRouter ?? { replace: jest.fn(), push: jest.fn() },
    redirect: jest.fn(),
    getPathname: jest.fn(),
  };
});

// Radix menus measure elements and capture pointers; jsdom has neither.
if (typeof window !== "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.assign(window, { ResizeObserver: window.ResizeObserver ?? ResizeObserverStub });
  const proto = window.HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.releasePointerCapture ??= () => {};
  proto.scrollIntoView ??= () => {};
}
