import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  AppButton,
  Chip,
  HeroCard,
  Panel,
  Screen,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "../components/ui";
import { theme } from "../app/theme";
import { useAppStore } from "../state/store";
import {
  formatCurrency,
  formatDateLabel,
  useDashboardSnapshot,
  useWorkspaceNotifications,
} from "../state/selectors";

function DashboardQuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minWidth: 130,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 8,
      }}
    >
      <Ionicons name={icon} size={18} color={theme.colors.primary} />
      <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function DashboardScreen({ navigation }: any) {
  const snapshot = useDashboardSnapshot();
  const notifications = useWorkspaceNotifications();
  const setCommandBarOpen = useAppStore((state) => state.setCommandBarOpen);
  const setQuickCreateOpen = useAppStore((state) => state.setQuickCreateOpen);
  const applySuggestion = useAppStore((state) => state.applySuggestion);
  const dismissSuggestion = useAppStore((state) => state.dismissSuggestion);

  if (!snapshot) return null;

  const runQuickAction = (target: string) => {
    if (target === "NewBooking") setQuickCreateOpen(true, "booking");
    else if (target === "AddVehicle") setQuickCreateOpen(true, "vehicle");
    else if (target === "NewTask") setQuickCreateOpen(true, "task");
    else if (target === "NewNote") setQuickCreateOpen(true, "note");
    else if (target === "AddCustomer") setQuickCreateOpen(true, "customer");
    else if (target === "OpenCheckFlow") navigation.navigate("CheckFlow");
    else if (target === "OpenReturns") navigation.navigate("Bookings");
  };

  return (
    <Screen>
      <HeroCard
        title={snapshot.workspace.name}
        subtitle={`${formatDateLabel(new Date().toISOString())} · ${snapshot.workspace.mode} mode · ${snapshot.workspace.modules.length} active modules`}
        meta={
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <AppButton
              label="Command"
              icon="terminal"
              variant="secondary"
              onPress={() => setCommandBarOpen(true)}
            />
            <AppButton
              label="Assistant"
              icon="sparkles"
              onPress={() => navigation.navigate("Assistant")}
            />
          </View>
        }
      />

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        }}
      >
        <StatCard label="Bookings today" value={snapshot.stats.bookingsToday} />
        <StatCard
          label="Returns today"
          value={snapshot.stats.returnsToday}
          tone="warning"
        />
        <StatCard
          label="Available fleet"
          value={snapshot.stats.availableVehicles}
          tone="success"
        />
        <StatCard
          label="Maintenance due"
          value={snapshot.stats.maintenanceDue}
          tone="danger"
        />
      </View>

      <SectionHeader
        title="Quick actions"
        subtitle="One-thumb shortcuts for the busiest flows."
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {snapshot.workspace.quickActions.map((action) => (
            <DashboardQuickAction
              key={action.id}
              label={action.label}
              icon={action.icon as keyof typeof Ionicons.glyphMap}
              onPress={() => runQuickAction(action.target)}
            />
          ))}
        </View>
      </ScrollView>

      <SectionHeader
        title="Command center"
        subtitle="Pinned recommendations and the signals you need without digging."
        action={
          <Chip
            label="Workspace"
            onPress={() => navigation.navigate("Workspace")}
          />
        }
      />

      <View style={{ gap: theme.spacing.sm }}>
        {snapshot.workspace.dashboardWidgets.map((widget) => (
          <Panel key={widget.id}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {widget.title}
              </Text>
              <StatusBadge label={widget.type} tone="info" />
            </View>
            <Text style={{ color: theme.colors.textMuted }}>
              {widget.description}
            </Text>
            {widget.type === "today-summary" ? (
              <Text style={{ color: theme.colors.text }}>
                {snapshot.stats.bookingsToday} pickups,{" "}
                {snapshot.stats.returnsToday} returns,{" "}
                {snapshot.stats.overdueTasks} overdue tasks.
              </Text>
            ) : null}
            {widget.type === "bookings-today" ? (
              <Text style={{ color: theme.colors.text }}>
                {snapshot.stats.bookingsToday} bookings scheduled today.
              </Text>
            ) : null}
            {widget.type === "returns-today" ? (
              <Text style={{ color: theme.colors.text }}>
                {snapshot.stats.returnsToday} vehicle(s) due back today.
              </Text>
            ) : null}
            {widget.type === "available-vehicles" ? (
              <Text style={{ color: theme.colors.text }}>
                {snapshot.stats.availableVehicles} vehicle(s) ready now.
              </Text>
            ) : null}
            {widget.type === "maintenance-due" ? (
              <Text style={{ color: theme.colors.text }}>
                {snapshot.stats.maintenanceDue} maintenance item(s) need
                attention.
              </Text>
            ) : null}
            {widget.type === "notes-tasks" ? (
              <Text style={{ color: theme.colors.text }}>
                {snapshot.tasks.filter((task) => task.status !== "done").length}{" "}
                open task(s),{" "}
                {snapshot.notes.filter((note) => note.pinned).length} pinned
                note(s).
              </Text>
            ) : null}
            {widget.type === "revenue-snapshot" && snapshot.finance ? (
              <Text style={{ color: theme.colors.text }}>
                {formatCurrency(snapshot.finance.dailyRevenue)} today ·{" "}
                {formatCurrency(snapshot.finance.monthToDateRevenue)} MTD
              </Text>
            ) : null}
            {widget.type === "assistant-recommendations" ? (
              <Text style={{ color: theme.colors.text }}>
                {snapshot.pendingSuggestions.length > 0
                  ? `${snapshot.pendingSuggestions.length} pending suggestion(s) waiting for review.`
                  : "No pending changes. Ask the assistant for dashboard or workflow improvements."}
              </Text>
            ) : null}
            {widget.type === "custom-kpi" ? (
              <Text style={{ color: theme.colors.text }}>
                Fleet utilization placeholder:{" "}
                {
                  snapshot.bookings.filter(
                    (booking) => booking.status === "active",
                  ).length
                }
                /{snapshot.vehicles.length || 1}
              </Text>
            ) : null}
          </Panel>
        ))}
      </View>

      <SectionHeader
        title="Assistant proposals"
        subtitle="Preview changes before you apply them."
        action={
          <Chip
            label="Open assistant"
            onPress={() => navigation.navigate("Assistant")}
          />
        }
      />
      {snapshot.pendingSuggestions.length === 0 ? (
        <Panel>
          <Text style={{ color: theme.colors.textMuted }}>
            No pending proposals. Try "Suggest improvements for my dashboard"
            from the global command bar.
          </Text>
        </Panel>
      ) : (
        snapshot.pendingSuggestions.slice(0, 3).map((suggestion) => (
          <Panel key={suggestion.id}>
            <Text
              style={{
                color: theme.colors.text,
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              {suggestion.title}
            </Text>
            <Text style={{ color: theme.colors.textMuted }}>
              {suggestion.description}
            </Text>
            {suggestion.preview.map((line) => (
              <Text key={line} style={{ color: theme.colors.text }}>
                • {line}
              </Text>
            ))}
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              <AppButton
                label="Apply"
                onPress={() => applySuggestion(suggestion.id)}
                style={{ flex: 1 }}
              />
              <AppButton
                label="Dismiss"
                variant="secondary"
                onPress={() => dismissSuggestion(suggestion.id)}
                style={{ flex: 1 }}
              />
            </View>
          </Panel>
        ))
      )}

      <SectionHeader
        title="Alerts and reminders"
        subtitle="Notifications center in a quick scan."
        action={
          <Chip
            label="All alerts"
            onPress={() => navigation.navigate("Alerts")}
          />
        }
      />
      {notifications.slice(0, 3).map((notification) => (
        <Panel key={notification.id}>
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            {notification.title}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {notification.body}
          </Text>
        </Panel>
      ))}

      <SectionHeader
        title="Shortcuts"
        subtitle="The rest of the operating system."
      />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        }}
      >
        {[
          ["Customers", "Customers"],
          ["Maintenance", "Maintenance"],
          ["Notes", "Notes"],
          ["Calendar", "Calendar"],
          ["Finance", "Finance"],
          ["History", "History"],
          ["Settings", "Settings"],
        ].map(([label, target]) => (
          <Chip
            key={label}
            label={label}
            onPress={() => navigation.navigate(target)}
          />
        ))}
      </View>
    </Screen>
  );
}
