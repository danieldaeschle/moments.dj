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

export const TRIGGER_LABELS = {
  manual: "Manuell öffnen",
  date: "An einem Datum",
  bad_day: "Schlechter Tag",
} as const;

export function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? null;
}

export function getUserProfile(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const profile = USER_PROFILES[normalizedEmail];
  if (!profile) {
    return null;
  }

  return {
    email: normalizedEmail,
    displayName: profile.displayName,
    emoji: profile.emoji,
  };
}

export function getPartnerProfile(email: string | null | undefined) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const partnerEmail = ALLOWED_EMAILS.find(
    (allowedEmail) => allowedEmail !== normalizedEmail,
  );
  if (!partnerEmail) {
    return null;
  }

  return getUserProfile(partnerEmail);
}
