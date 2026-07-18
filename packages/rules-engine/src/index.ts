import {
  getChecklistItem,
  type ChecklistItem,
  type RiskTier,
} from "@chw/content";

export type ChecklistAnswer = {
  itemKey: string;
  answer: boolean;
  /** Optional override when item metadata is already joined */
  riskIfTrue?: ChecklistItem["riskIfTrue"];
};

export type ScoreResult = {
  riskTier: RiskTier;
  triggeredItems: ChecklistItem[];
  primaryAction: string | null;
};

/**
 * Deterministic IMCI-style scoring: any single RED flag → RED;
 * else any YELLOW → YELLOW; else GREEN.
 */
export function scoreCase(responses: ChecklistAnswer[]): RiskTier {
  return scoreCaseDetailed(responses).riskTier;
}

export function scoreCaseDetailed(responses: ChecklistAnswer[]): ScoreResult {
  const triggeredItems: ChecklistItem[] = [];

  for (const response of responses) {
    if (!response.answer) continue;
    const item =
      response.riskIfTrue != null
        ? ({
            key: response.itemKey,
            riskIfTrue: response.riskIfTrue,
            action: "",
            question: "",
            category: "MATERNAL",
            source: "",
          } as ChecklistItem)
        : getChecklistItem(response.itemKey);

    if (!item) continue;
    const full = getChecklistItem(response.itemKey) ?? item;
    triggeredItems.push(full);
  }

  const hasRed = triggeredItems.some((i) => i.riskIfTrue === "RED");
  const hasYellow = triggeredItems.some((i) => i.riskIfTrue === "YELLOW");

  let riskTier: RiskTier = "GREEN";
  if (hasRed) riskTier = "RED";
  else if (hasYellow) riskTier = "YELLOW";

  const primary =
    triggeredItems.find((i) => i.riskIfTrue === riskTier) ??
    triggeredItems[0] ??
    null;

  return {
    riskTier,
    triggeredItems,
    primaryAction: primary?.action ?? null,
  };
}

export type ReferralStatus =
  | "REFERRED"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "RESOLVED";

export const REFERRAL_FLOW: ReferralStatus[] = [
  "REFERRED",
  "IN_TRANSIT",
  "ARRIVED",
  "RESOLVED",
];

export function nextReferralStatus(
  current: ReferralStatus
): ReferralStatus | null {
  const idx = REFERRAL_FLOW.indexOf(current);
  if (idx < 0 || idx >= REFERRAL_FLOW.length - 1) return null;
  return REFERRAL_FLOW[idx + 1]!;
}

export function referralStatusLabel(status: ReferralStatus): string {
  switch (status) {
    case "REFERRED":
      return "Referred";
    case "IN_TRANSIT":
      return "In Transit";
    case "ARRIVED":
      return "Arrived";
    case "RESOLVED":
      return "Resolved";
  }
}
