import React from "react";
import { Text, View } from "react-native";
import {
  AppButton,
  Panel,
  Screen,
  SectionHeader,
  StatCard,
} from "../components/ui";
import { theme } from "../app/theme";
import { useAppStore } from "../state/store";
import {
  formatCurrency,
  useWorkspaceBookings,
  useWorkspaceFinance,
  useWorkspaceMaintenance,
  useWorkspaceNotifications,
  useWorkspaceTasks,
} from "../state/selectors";

export function CalendarScreen() {
  const bookings = useWorkspaceBookings();
  const tasks = useWorkspaceTasks();
  const maintenanceItems = useWorkspaceMaintenance();

  const agenda = [
    ...bookings.map((booking) => ({
      id: booking.id,
      title: `Booking ${booking.status}`,
      date: booking.pickupAt,
    })),
    ...tasks.map((task) => ({
      id: task.id,
      title: `Task: ${task.title}`,
      date: task.dueOn,
    })),
    ...maintenanceItems.map((item) => ({
      id: item.id,
      title: `Maintenance: ${item.title}`,
      date: item.dueOn,
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Screen>
      <SectionHeader
        title="Calendar"
        subtitle="Daily and weekly agenda across bookings, tasks, and reminders."
      />
      {agenda.map((entry) => (
        <Panel key={entry.id}>
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            {entry.title}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {new Date(entry.date).toLocaleString()}
          </Text>
        </Panel>
      ))}
    </Screen>
  );
}

export function FinanceScreen() {
  const finance = useWorkspaceFinance();

  if (!finance) return null;

  return (
    <Screen>
      <SectionHeader
        title="Finance snapshot"
        subtitle="Visually useful, lightweight money visibility for the MVP."
      />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
        }}
      >
        <StatCard label="Today" value={formatCurrency(finance.dailyRevenue)} />
        <StatCard
          label="Month to date"
          value={formatCurrency(finance.monthToDateRevenue)}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(finance.outstandingPayments)}
          tone="warning"
        />
        <StatCard
          label="Estimated cost"
          value={formatCurrency(finance.estimatedCosts)}
          tone="danger"
        />
      </View>
      <Panel>
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          Non-accounting MVP
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          This screen is intentionally focused on visibility and operator
          awareness. A full accounting backend can plug in later through the
          sync abstraction.
        </Text>
      </Panel>
    </Screen>
  );
}

export function AlertsScreen() {
  const notifications = useWorkspaceNotifications();
  const markNotificationRead = useAppStore(
    (state) => state.markNotificationRead,
  );

  return (
    <Screen>
      <SectionHeader
        title="Alerts center"
        subtitle="Notifications, reminders, and assistant nudges."
      />
      {notifications.map((notification) => (
        <Panel key={notification.id}>
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            {notification.title}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {notification.body}
          </Text>
          {!notification.read ? (
            <AppButton
              label="Mark read"
              variant="secondary"
              onPress={() => markNotificationRead(notification.id)}
            />
          ) : null}
        </Panel>
      ))}
    </Screen>
  );
}
