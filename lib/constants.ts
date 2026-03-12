export const ALLOWED_EMAILS = [
  "daniel.daeschle@gmail.com",
  "jhnn.m@hotmail.de",
] as const;

export const USER_PROFILES: Record<
  string,
  { displayName: string; emoji: string }
> = {
  "daniel.daeschle@gmail.com": { displayName: "Daniel", emoji: "🤓" },
  "jhnn.m@hotmail.de": { displayName: "Johanna", emoji: "🌚" },
};
