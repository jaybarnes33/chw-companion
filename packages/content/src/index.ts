export type PatientType = "MATERNAL" | "NEWBORN" | "UNDER5";
export type RiskTier = "RED" | "YELLOW" | "GREEN";

export type ChecklistItem = {
  key: string;
  category: PatientType;
  question: string;
  riskIfTrue: Exclude<RiskTier, "GREEN">;
  action: string;
  source: string;
};

export type NutritionTip = {
  key: string;
  appliesTo: PatientType;
  text: string;
  source: string;
};

export type NorthernGhanaPlace = {
  name: string;
  district: string;
  region: "Northern" | "North East" | "Savannah" | "Upper East" | "Upper West";
};

import checklistJson from "../checklist.json";
import nutritionJson from "../nutrition.json";
import placesJson from "../northern-ghana-places.json";

const checklistData = checklistJson as {
  version: string;
  disclaimer: string;
  items: ChecklistItem[];
};

const nutritionData = nutritionJson as {
  version: string;
  disclaimer: string;
  tips: NutritionTip[];
};

const placesData = placesJson as {
  version: string;
  source: string;
  coverage: string[];
  places: NorthernGhanaPlace[];
};

export const checklistDisclaimer = checklistData.disclaimer;
export const nutritionDisclaimer = nutritionData.disclaimer;
export const checklistVersion = checklistData.version;
export const nutritionVersion = nutritionData.version;

export const checklistItems = checklistData.items;
export const nutritionTips = nutritionData.tips;
export const northernGhanaPlaces = placesData.places;
export const northernGhanaPlacesVersion = placesData.version;

export function getChecklistByCategory(category: PatientType): ChecklistItem[] {
  return checklistItems.filter((item) => item.category === category);
}

export function getChecklistItem(key: string): ChecklistItem | undefined {
  return checklistItems.find((item) => item.key === key);
}

export function getNutritionTips(patientType: PatientType): NutritionTip[] {
  return nutritionTips.filter((tip) => tip.appliesTo === patientType);
}

export function getPrimaryNutritionTip(
  patientType: PatientType
): NutritionTip | undefined {
  return getNutritionTips(patientType)[0];
}

function normalizePlaceQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/,/g, " ")
    .replace(/\s+/g, " ");
}

/** Ranked autocomplete for Northern Ghana towns and villages. */
export function searchNorthernGhanaPlaces(
  query: string,
  limit = 8
): NorthernGhanaPlace[] {
  const q = normalizePlaceQuery(query);
  if (q.length < 1) return [];

  const scored: Array<{ place: NorthernGhanaPlace; score: number }> = [];
  for (const place of northernGhanaPlaces) {
    const name = place.name.toLowerCase();
    const district = place.district.toLowerCase();
    const region = place.region.toLowerCase();
    const label = normalizePlaceQuery(formatNorthernGhanaPlace(place));
    const haystack = `${name} ${district} ${region}`;

    let score = -1;
    if (label === q || name === q) score = 100;
    else if (name.startsWith(q)) score = 80;
    else if (name.includes(q)) score = 60;
    else if (district.startsWith(q)) score = 40;
    else if (haystack.includes(q) || label.includes(q)) score = 20;

    if (score >= 0) scored.push({ place, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.place.name.localeCompare(b.place.name);
  });

  return scored.slice(0, limit).map((entry) => entry.place);
}

export function formatNorthernGhanaPlace(place: NorthernGhanaPlace): string {
  return `${place.name}, ${place.district}`;
}
