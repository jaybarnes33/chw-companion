import { cn } from "@/lib/utils";
import { colors } from "@nyaaba/ui";
import { View } from "react-native";

export function FuguDivider() {
  return <View className="h-0.5 border border-dashed border-indigo-ink/20" />;
}

export function StripMeter({
  total,
  filled,
  filledColor = colors.savanna,
  dangerAt,
}: {
  total: number;
  filled: number;
  filledColor?: string;
  dangerAt?: number[];
}) {
  return (
    <View className="h-6 flex-row gap-0.5">
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled;
        const isDanger = dangerAt?.includes(i);
        return (
          <View
            key={i}
            className={cn("flex-1 border")}
            style={{
              backgroundColor: isFilled
                ? isDanger
                  ? colors.ember
                  : filledColor
                : "transparent",
              borderColor: isFilled
                ? isDanger
                  ? colors.ember
                  : filledColor
                : `${colors.indigoInk}33`,
            }}
          />
        );
      })}
    </View>
  );
}
