import type { BuildConfig, UserProfile } from "@/app/lib/types";

export function emptyBuild(id = "current", name = "Meu PC"): BuildConfig {
  return { id, name, parts: {}, goal: "balanced", budget: 0, notes: "" };
}

export function makeDefaultProfile(displayName: string): UserProfile {
  return {
    displayName,
    location: "",
    currentBuild: emptyBuild(),
    draftBuild: emptyBuild("draft", "Meu próximo PC"),
    pricePreference: "cash",
    trustedOnly: true,
    customParts: [],
    offers: [],
  };
}

export function isBuildConfig(value: unknown): value is BuildConfig {
  if (!value || typeof value !== "object") return false;
  const build = value as Partial<BuildConfig>;
  return typeof build.id === "string" && typeof build.name === "string" && Boolean(build.parts) && typeof build.parts === "object" && !Array.isArray(build.parts) && Object.values(build.parts!).every(ids => Array.isArray(ids) && ids.every(id => typeof id === "string"));
}

export function normalizeProfile(value: unknown, displayName: string): UserProfile {
  const fallback = makeDefaultProfile(displayName);
  if (!value || typeof value !== "object") return fallback;
  const profile = value as Partial<UserProfile>;
  return {
    displayName: typeof profile.displayName === "string" && profile.displayName.trim() ? profile.displayName.slice(0, 100) : fallback.displayName,
    location: typeof profile.location === "string" ? profile.location.slice(0, 120) : fallback.location,
    currentBuild: isBuildConfig(profile.currentBuild) ? profile.currentBuild : fallback.currentBuild,
    draftBuild: isBuildConfig(profile.draftBuild) ? profile.draftBuild : fallback.draftBuild,
    pricePreference: profile.pricePreference === "installments" ? "installments" : "cash",
    trustedOnly: profile.trustedOnly !== false,
    customParts: Array.isArray(profile.customParts) ? profile.customParts.slice(0, 300) : [],
    offers: Array.isArray(profile.offers) ? profile.offers.slice(0, 500) : [],
  };
}
