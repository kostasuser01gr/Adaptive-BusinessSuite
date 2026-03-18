import React from "react";
import { Text } from "react-native";
import { DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "./theme";
import { useAppStore } from "../state/store";
import {
  SplashGateScreen,
  LoginScreen,
  SignUpScreen,
  OnboardingScreen,
} from "../screens/auth";
import { DashboardScreen } from "../screens/dashboard";
import { FleetScreen, VehicleDetailsScreen } from "../screens/fleet";
import {
  BookingsScreen,
  BookingDetailsScreen,
  CheckFlowScreen,
} from "../screens/bookings";
import { CustomersScreen, CustomerDetailsScreen } from "../screens/customers";
import { MaintenanceScreen } from "../screens/maintenance";
import { TasksScreen, NotesScreen } from "../screens/tasksNotes";
import {
  CalendarScreen,
  FinanceScreen,
  AlertsScreen,
} from "../screens/calendarFinance";
import { AssistantScreen } from "../screens/assistant";
import {
  WorkspaceScreen,
  SettingsScreen,
  HistoryScreen,
} from "../screens/workspace";

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 78,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", paddingBottom: 8 },
        tabBarIcon: ({ color, size }) => {
          const nameMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            Dashboard: "grid",
            Fleet: "car-sport",
            Bookings: "calendar",
            Tasks: "checkbox",
            Assistant: "sparkles",
          };
          return (
            <Ionicons name={nameMap[route.name]} size={size} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Fleet" component={FleetScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
    </Tab.Navigator>
  );
}

export const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    border: theme.colors.border,
    primary: theme.colors.primary,
    text: theme.colors.text,
  },
};

export function AppNavigator() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const activeUserId = useAppStore((state) => state.session.activeUserId);
  const activeWorkspaceId = useAppStore(
    (state) => state.session.activeWorkspaceId,
  );
  const users = useAppStore((state) => state.users);
  const workspaces = useAppStore((state) => state.workspaces);

  const activeUser = users.find((user) => user.id === activeUserId) || null;
  const needsOnboarding = activeUser && !activeUser.onboardingComplete;
  const hasWorkspace = !!workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

  if (!hasHydrated) {
    return <SplashGateScreen />;
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      {!activeUser ? (
        <>
          <RootStack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <RootStack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ title: "Create account" }}
          />
        </>
      ) : needsOnboarding ? (
        <RootStack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <RootStack.Screen
            name="Home"
            component={AppTabs}
            options={{
              headerShown: false,
            }}
          />
          <RootStack.Screen name="Customers" component={CustomersScreen} />
          <RootStack.Screen name="Maintenance" component={MaintenanceScreen} />
          <RootStack.Screen name="Notes" component={NotesScreen} />
          <RootStack.Screen name="Calendar" component={CalendarScreen} />
          <RootStack.Screen name="Finance" component={FinanceScreen} />
          <RootStack.Screen name="Workspace" component={WorkspaceScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
          <RootStack.Screen name="History" component={HistoryScreen} />
          <RootStack.Screen name="Alerts" component={AlertsScreen} />
          <RootStack.Screen
            name="CheckFlow"
            component={CheckFlowScreen}
            options={{ title: "Quick Check-In / Out" }}
          />
          <RootStack.Screen
            name="VehicleDetails"
            component={VehicleDetailsScreen}
            options={{ title: "Vehicle details" }}
          />
          <RootStack.Screen
            name="CustomerDetails"
            component={CustomerDetailsScreen}
            options={{ title: "Customer details" }}
          />
          <RootStack.Screen
            name="BookingDetails"
            component={BookingDetailsScreen}
            options={{ title: "Booking details" }}
          />
          {!hasWorkspace ? (
            <RootStack.Screen
              name="WorkspaceBootstrap"
              component={WorkspaceScreen}
              options={{
                presentation: "modal",
                title: "Choose a workspace",
                headerRight: () => (
                  <Text style={{ color: theme.colors.primary }}>Setup</Text>
                ),
              }}
            />
          ) : null}
        </>
      )}
    </RootStack.Navigator>
  );
}
