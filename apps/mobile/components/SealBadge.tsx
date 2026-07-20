import { cn } from "@/lib/utils";
import { riskColor } from "@nyaaba/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { View } from "react-native";
import type { RiskTier } from "@nyaaba/content";

const icons: Record<RiskTier, keyof typeof MaterialIcons.glyphMap> = {
  RED: "warning",
  YELLOW: "child-care",
  GREEN: "check-circle",
};

export function SealBadge({
  tier,
  size = 48,
}: {
  tier: RiskTier;
  size?: number;
}) {
  const color = riskColor(tier);
  return (
    <View
      className={cn(
        "items-center justify-center rounded-full border-2",
        tier === "RED" && "border-ember bg-ember/5",
        tier === "YELLOW" && "border-millet bg-millet/5",
        tier === "GREEN" && "border-savanna bg-savanna/5"
      )}
      style={{ width: size, height: size }}
    >
      <MaterialIcons name={icons[tier]} size={size * 0.45} color={color} />
    </View>
  );
}
