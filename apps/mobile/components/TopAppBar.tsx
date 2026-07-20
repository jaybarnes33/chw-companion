import { Text } from "@/components/ui/text";
import { colors } from "@nyaaba/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  title: string;
  onBack?: () => void;
  onSync?: () => void;
  syncBadge?: number;
  right?: React.ReactNode;
  backgroundColor?: string;
  borderColor?: string;
  titleColor?: string;
};

export function TopAppBar({
  title,
  onBack,
  onSync,
  syncBadge = 0,
  right,
  backgroundColor = colors.indigoInk,
  borderColor = colors.indigoInk,
  titleColor = colors.white,
}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="z-50 border-b-2"
      style={{ paddingTop: insets.top, backgroundColor, borderBottomColor: borderColor }}
    >
      <View className="h-touch flex-row items-center justify-between px-mobile">
        <View className="flex-1 flex-row items-center gap-3">
          {onBack ? (
            <Pressable
              className="size-10 items-center justify-center"
              onPress={onBack}
              hitSlop={12}
            >
              <MaterialIcons name="arrow-back" size={24} color={titleColor} />
            </Pressable>
          ) : (
            <MaterialIcons name="menu" size={24} color={titleColor} />
          )}
          <Text
            className="shrink font-headline text-xl"
            style={{ color: titleColor }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {right ??
          (onSync ? (
            <Pressable
              className="size-10 items-center justify-center"
              onPress={onSync}
            >
              <MaterialIcons name="sync" size={22} color={titleColor} />
              {syncBadge > 0 ? (
                <View className="absolute right-0 top-0 h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-indigo-ink bg-clay">
                  <Text className="font-body-bold text-[10px] text-white">
                    {syncBadge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          ) : (
            <View className="w-10" />
          ))}
      </View>
    </View>
  );
}
