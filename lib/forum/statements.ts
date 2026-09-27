// Seed statements for the forum. Each one is short, plain, and aimed at
// shared ground, not at any person, company, or group. Text lives in
// messages/*.json under Forum.statements.<id> and Forum.tracks.<id>.

export const TRACKS = ["transparency", "agency", "privacy", "shared"] as const;
export type TrackId = (typeof TRACKS)[number];

/**
 * A statement on the voting card. Seed statements get their text from
 * messages/*.json; an approved community suggestion carries its own text,
 * in the one language it was written in.
 */
export type Statement = { id: string; track: TrackId | "community"; text?: string };

export const STATEMENTS: Statement[] = [
  { id: "t1-disclose", track: "transparency" },
  { id: "t1-credentials", track: "transparency" },
  { id: "t2-reasons", track: "agency" },
  { id: "t2-person", track: "agency" },
  { id: "t3-optin", track: "privacy" },
  { id: "t3-clear", track: "privacy" },
  { id: "t4-together", track: "shared" },
  { id: "t4-accountable", track: "shared" },
];

export const MAX_STATEMENT_LENGTH = 140;
