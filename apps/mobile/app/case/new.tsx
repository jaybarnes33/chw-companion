import { FuguDivider } from "@/components/Fugu";
import { TopAppBar } from "@/components/TopAppBar";
import { Text } from "@/components/ui/text";
import type { PatientType } from "@nyaaba/content";
import { colors } from "@nyaaba/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";

const CATEGORIES: {
  type: PatientType;
  label: string;
  detail: string;
}[] = [
  {
    type: "MATERNAL",
    label: "Maternal",
    detail: "Pregnant or postpartum woman",
  },
  {
    type: "NEWBORN",
    label: "Newborn",
    detail: "Baby under 1 month",
  },
  {
    type: "UNDER5",
    label: "Under-5",
    detail: "Child 1 month to 5 years",
  },
];

export default function NewCaseScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-shea">
      <TopAppBar title="New visit" onBack={() => router.back()} />
      <View className="p-mobile pt-section">
        <Text className="mb-2 font-display text-[32px] text-indigo-ink">
          Who are you seeing?
        </Text>
        <Text className="mb-4 font-body text-base leading-6 text-muted-foreground">
          Choose the visit type. Patient registration will open next.
        </Text>
        <FuguDivider />
        <View className="mt-section gap-3">
          {CATEGORIES.map((option) => (
            <Pressable
              key={option.type}
              className="min-h-touch flex-row items-center justify-between border-2 border-clay px-5 py-4 active:bg-clay/5"
              onPress={() =>
                router.push({
                  pathname: "/case/register",
                  params: { type: option.type },
                })
              }
            >
              <View className="flex-1 pr-3">
                <Text className="font-headline text-lg text-clay">
                  {option.label}
                </Text>
                <Text className="mt-1 font-body text-sm text-muted-foreground">
                  {option.detail}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={colors.clay}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
