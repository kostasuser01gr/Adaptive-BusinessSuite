import "react-native-gesture-handler";

import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AppNavigator, navigationTheme } from "./src/app/navigation";
import { GlobalOverlays } from "./src/components/overlays";
import OfflineBanner from "./src/components/OfflineBanner";
import { theme } from "./src/app/theme";
import { useAppStore } from "./src/state/store";

function AppRoot() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const initializeDemoData = useAppStore((state) => state.initializeDemoData);

  useEffect(() => {
    if (hasHydrated) {
      initializeDemoData();
    }
  }, [hasHydrated, initializeDemoData]);

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <OfflineBanner />
          <AppNavigator />
          <GlobalOverlays />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default AppRoot;
