import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
  AppButton,
  AppInput,
  Chip,
  Panel,
  Screen,
  SectionHeader,
  StatusBadge,
} from "../components/ui";
import { theme } from "../app/theme";
import { useAppStore } from "../state/store";
import {
  useWorkspaceMaintenance,
  useWorkspaceVehicles,
} from "../state/selectors";

export function MaintenanceScreen() {
  const maintenanceItems = useWorkspaceMaintenance();
  const vehicles = useWorkspaceVehicles();
  const addMaintenanceItem = useAppStore((state) => state.addMaintenanceItem);
  const resolveMaintenanceItem = useAppStore(
    (state) => state.resolveMaintenanceItem,
  );
  const [title, setTitle] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("medium");
  const [vehicleId, setVehicleId] = useState<string | null>(
    vehicles[0]?.id || null,
  );

  return (
    <Screen>
      <SectionHeader
        title="Maintenance"
        subtitle="Issues, urgency, and service backlog by vehicle."
      />
      <Panel>
        <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
          Quick add issue
        </Text>
        <AppInput
          value={title}
          onChangeText={setTitle}
          placeholder="Issue title"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            {vehicles.map((vehicle) => (
              <Chip
                key={vehicle.id}
                label={vehicle.name}
                active={vehicleId === vehicle.id}
                onPress={() => setVehicleId(vehicle.id)}
              />
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          {(["low", "medium", "high"] as const).map((item) => (
            <Chip
              key={item}
              label={item}
              active={urgency === item}
              onPress={() => setUrgency(item)}
            />
          ))}
        </View>
        <AppButton
          label="Add issue"
          onPress={() => {
            if (!vehicleId) return;
            addMaintenanceItem({
              vehicleId,
              title: title || "New maintenance item",
              urgency,
              dueOn: new Date().toISOString(),
            });
            setTitle("");
          }}
        />
      </Panel>
      {maintenanceItems.map((item) => {
        const vehicle = vehicles.find(
          (vehicleEntry) => vehicleEntry.id === item.vehicleId,
        );
        return (
          <Panel key={item.id}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                  {item.title}
                </Text>
                <Text style={{ color: theme.colors.textMuted }}>
                  {vehicle?.name} · due{" "}
                  {new Date(item.dueOn).toLocaleDateString()}
                </Text>
              </View>
              <StatusBadge
                label={item.status}
                tone={
                  item.urgency === "high"
                    ? "danger"
                    : item.urgency === "medium"
                      ? "warning"
                      : "info"
                }
              />
            </View>
            <Text style={{ color: theme.colors.textMuted }}>
              {item.notes || "No extra notes."}
            </Text>
            {item.status !== "resolved" ? (
              <AppButton
                label="Mark resolved"
                variant="secondary"
                onPress={() => resolveMaintenanceItem(item.id)}
              />
            ) : null}
          </Panel>
        );
      })}
    </Screen>
  );
}
