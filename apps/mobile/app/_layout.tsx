import "../global.css";
import { GuidanceProvider } from "@/lib/guidance-context";
import { CHW_THEME } from "@/lib/theme";
import { colors } from "@chw/ui";
import { ThemeProvider } from "expo-router/react-navigation";
import {
  IBMPlexMono_500Medium,
  useFonts as useMono,
} from "@expo-google-fonts/ibm-plex-mono";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_600SemiBold,
  IBMPlexSans_700Bold,
  useFonts as useSans,
} from "@expo-google-fonts/ibm-plex-sans";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { PortalHost } from "@rn-primitives/portal";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [sansLoaded] = useSans({
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexSans_700Bold,
  });
  const [monoLoaded] = useMono({ IBMPlexMono_500Medium });
  const ready = sansLoaded && monoLoaded;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.shea }}>
      <SafeAreaProvider>
        <ThemeProvider value={CHW_THEME}>
          <GuidanceProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.shea },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="case/new" />
              <Stack.Screen name="case/register" />
              <Stack.Screen name="case/[id]/checklist" />
              <Stack.Screen name="case/[id]/result" />
              <Stack.Screen name="case/[id]/referral" />
              <Stack.Screen name="case/[id]/guidance" />
              <Stack.Screen name="translate" />
            </Stack>
            <PortalHost />
          </GuidanceProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
