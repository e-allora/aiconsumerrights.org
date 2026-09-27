/** @jest-environment node */
import { neon } from "@neondatabase/serverless";

jest.mock("@neondatabase/serverless", () => ({ neon: jest.fn(() => "sql") }));

describe("getSql", () => {
  afterEach(() => {
    delete process.env.DATABASE_URL;
    jest.resetModules();
  });

  it("never lets Next.js cache database answers", () => {
    process.env.DATABASE_URL = "postgres://example";
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSql } = require("@/lib/forum/db");
    expect(getSql()).toBe("sql");
    expect(neon).toHaveBeenCalledWith("postgres://example", { fetchOptions: { cache: "no-store" } });
  });

  it("fails clearly when the database is not configured", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSql } = require("@/lib/forum/db");
    expect(() => getSql()).toThrow("DATABASE_URL is not set");
  });
});
