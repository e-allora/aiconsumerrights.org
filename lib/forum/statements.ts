// Seed statements for the forum. Each one is short, plain, and aimed at
// shared ground, not at any person, company, or group.

export type Track = { id: string; name: string; focus: string };

export const TRACKS: Track[] = [
  { id: "transparency", name: "Transparency", focus: "Knowing when AI is involved" },
  { id: "agency", name: "Human agency", focus: "Reasons and a path to a person" },
  { id: "privacy", name: "Privacy", focus: "Control over your data" },
  { id: "shared", name: "Shared responsibility", focus: "Working on this together" },
];

export type Statement = { id: string; track: Track["id"]; text: string };

export const STATEMENTS: Statement[] = [
  { id: "t1-disclose", track: "transparency", text: "Automated assistants should say they are AI at the start of a conversation." },
  { id: "t1-credentials", track: "transparency", text: "Photos, audio, and video made with AI should carry a label that shows how they were made." },
  { id: "t2-reasons", track: "agency", text: "When software helps make a decision about you, you should get the top reasons in plain language." },
  { id: "t2-person", track: "agency", text: "Every automated decision that affects you should come with a clear way to reach a person." },
  { id: "t3-optin", track: "privacy", text: "Using your conversations to train AI should stay off unless you choose to turn it on." },
  { id: "t3-clear", track: "privacy", text: "You should be able to clear your chat history with one tap." },
  { id: "t4-together", track: "shared", text: "People, educators, regulators, and companies should shape AI rules together." },
  { id: "t4-accountable", track: "shared", text: "Organizations should take responsibility for what their AI tools tell customers." },
];

export const trackOf = (s: Statement): Track => TRACKS.find((t) => t.id === s.track)!;

export const MAX_STATEMENT_LENGTH = 140;
