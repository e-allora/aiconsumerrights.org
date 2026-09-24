import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

// next-intl and its dependencies ship as ES modules only, so Jest must
// transform them instead of skipping node_modules entirely.
const ESM_PACKAGES = ["next-intl", "use-intl", "intl-messageformat", "@formatjs", "icu-minify", "@schummar"];

const base = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
});

export default async function config() {
  const resolved = await base();
  resolved.transformIgnorePatterns = [
    `/node_modules/(?!(${ESM_PACKAGES.join("|")})/)`,
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return resolved;
}
