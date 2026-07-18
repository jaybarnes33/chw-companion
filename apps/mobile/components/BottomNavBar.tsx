import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { colors } from "@chw/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabs = [
  { href: "/", label: "Cases", icon: "folder-shared" as const },
  { href: "/sync", label: "Sync", icon: "cloud-sync" as const },
  { href: "/profile", label: "Profile", icon: "person" as const },
] as const;

export function BottomNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-indigo-ink/15 bg-background"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <View className="h-16 flex-row">
        {tabs.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/" || pathname.startsWith("/case")
              : pathname.startsWith(tab.href);
          return (
            <Pressable
              key={tab.href}
              onPress={() => router.push(tab.href as never)}
              className="flex-1 items-center justify-center gap-1"
              android_ripple={{ color: colors.tertiaryFixed }}
            >
              <View
                className={cn(
                  "h-8 w-16 items-center justify-center rounded-full",
                  active && "bg-accent/25"
                )}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={22}
                  color={active ? colors.clay : colors.onSurfaceVariant}
                />
              </View>
              <Text
                className={cn(
                  "font-body-bold text-[11px]",
                  active ? "text-clay" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
