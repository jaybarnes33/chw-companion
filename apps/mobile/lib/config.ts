export const DEMO_CHW_ID =
  process.env.EXPO_PUBLIC_DEMO_CHW_ID ?? "chw-demo-kwesi";

export const DEMO_FACILITY = "Bolgatanga Central Hospital";
export const DEMO_FACILITY_PHONE =
  process.env.EXPO_PUBLIC_DEMO_FACILITY_PHONE ?? "+233201234567";

/** Hosted language-pack root (must contain manifest.json + model files). */
export const LANGUAGE_PACK_URL =
  process.env.EXPO_PUBLIC_LANGUAGE_PACK_URL ?? "";

export const LANGUAGE_PACK_VERSION =
  process.env.EXPO_PUBLIC_LANGUAGE_PACK_VERSION ?? "0.1.0";

/** Feature flag: show experimental Dagbani translator UI. */
export const DAGBANI_EXPERIMENTAL =
  (process.env.EXPO_PUBLIC_DAGBANI_EXPERIMENTAL ?? "true") === "true";

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.round((now - then) / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function patientTypeLabel(
  t: "MATERNAL" | "NEWBORN" | "UNDER5"
): string {
  switch (t) {
    case "MATERNAL":
      return "maternal";
    case "NEWBORN":
      return "newborn";
    case "UNDER5":
      return "under-5";
  }
}
