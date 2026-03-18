import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  AppButton,
  AppInput,
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

export function FleetScreen({ navigation }: any) {
  const vehicles = useWorkspaceVehicles();
  const maintenance = useWorkspaceMaintenance();
  const setQuickCreateOpen = useAppStore((state) => state.setQuickCreateOpen);
  const updateVehicle = useAppStore((state) => state.updateVehicle);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "available" | "rented" | "maintenance"
  >("all");

  const filtered = useMemo(
    () =>
      vehicles.filter((vehicle) => {
        const matchesQuery = `${vehicle.name} ${vehicle.plate}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter =
          filter === "all" ? true : vehicle.status === filter;
        return matchesQuery && matchesFilter;
      }),
    [filter, query, vehicles],
  );

  return (
    <Screen>
      <SectionHeader
        title="Fleet"
        subtitle="Vehicle availability, service state, and quick adjustments."
        action={
          <AppButton
            label="Add vehicle"
            icon="add"
            variant="secondary"
            onPress={() => setQuickCreateOpen(true, "vehicle")}
          />
        }
      />
      <AppInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search plate or vehicle"
      />
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.sm,
          flexWrap: "wrap",
        }}
      >
        {(["all", "available", "rented", "maintenance"] as const).map(
          (option) => (
            <AppButton
              key={option}
              label={option}
              variant={filter === option ? "primary" : "secondary"}
              onPress={() => setFilter(option)}
            />
          ),
        )}
      </View>
      {filtered.map((vehicle) => {
        const vehicleMaintenance = maintenance.filter(
          (item) => item.vehicleId === vehicle.id && item.status !== "resolved",
        );
        return (
          <Pressable
            key={vehicle.id}
            onPress={() =>
              navigation.navigate("VehicleDetails", { vehicleId: vehicle.id })
            }
          >
            <Panel>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    {vehicle.name}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {vehicle.plate} · {vehicle.category}
                  </Text>
                </View>
                <StatusBadge
                  label={vehicle.status}
                  tone={
                    vehicle.status === "available"
                      ? "success"
                      : vehicle.status === "maintenance"
                        ? "danger"
                        : "warning"
                  }
                />
              </View>
              <Text style={{ color: theme.colors.text }}>
                Mileage {vehicle.mileage.toLocaleString()} km
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {vehicle.availabilityLabel}
              </Text>
              <Text style={{ color: theme.colors.textMuted }}>
                Service: {vehicle.serviceStatus}
              </Text>
              {vehicleMaintenance.length > 0 ? (
                <Text style={{ color: theme.colors.warning }}>
                  {vehicleMaintenance.length} maintenance item(s) still open.
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <AppButton
                  label="Set available"
                  variant="secondary"
                  onPress={() =>
                    updateVehicle(vehicle.id, {
                      status: "available",
                      availabilityLabel: "Ready now",
                    })
                  }
                  style={{ flex: 1 }}
                />
                <AppButton
                  label="Send to service"
                  variant="secondary"
                  onPress={() =>
                    updateVehicle(vehicle.id, {
                      status: "maintenance",
                      availabilityLabel: "In workshop",
                    })
                  }
                  style={{ flex: 1 }}
                />
              </View>
            </Panel>
          </Pressable>
        );
      })}
    </Screen>
  );
}

export function VehicleDetailsScreen({ route }: any) {
  const vehicleId = route.params?.vehicleId as string;
  const vehicles = useWorkspaceVehicles();
  const updateVehicle = useAppStore((state) => state.updateVehicle);
  const vehicle = vehicles.find((item) => item.id === vehicleId);

  if (!vehicle) return null;

  return (
    <Screen>
      <Panel>
        <Text
          style={{ color: theme.colors.text, fontSize: 24, fontWeight: "700" }}
        >
          {vehicle.name}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {vehicle.plate} · {vehicle.category}
        </Text>
        <StatusBadge
          label={vehicle.status}
          tone={
            vehicle.status === "available"
              ? "success"
              : vehicle.status === "maintenance"
                ? "danger"
                : "warning"
          }
        />
        <Text style={{ color: theme.colors.text }}>
          Mileage: {vehicle.mileage.toLocaleString()} km
        </Text>
        <Text style={{ color: theme.colors.text }}>
          Availability: {vehicle.availabilityLabel}
        </Text>
        <Text style={{ color: theme.colors.text }}>
          Service status: {vehicle.serviceStatus}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          Notes: {vehicle.notes || "No notes yet."}
        </Text>
      </Panel>
      <Panel>
        <SectionHeader
          title="Quick edit"
          subtitle="Fast operational updates without leaving the details page."
        />
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <AppButton
            label="+100 km"
            variant="secondary"
            onPress={() =>
              updateVehicle(vehicle.id, { mileage: vehicle.mileage + 100 })
            }
            style={{ flex: 1 }}
          />
          <AppButton
            label="-100 km"
            variant="secondary"
            onPress={() =>
              updateVehicle(vehicle.id, {
                mileage: Math.max(vehicle.mileage - 100, 0),
              })
            }
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <AppButton
            label="Available"
            variant="secondary"
            onPress={() => updateVehicle(vehicle.id, { status: "available" })}
            style={{ flex: 1 }}
          />
          <AppButton
            label="Reserved"
            variant="secondary"
            onPress={() => updateVehicle(vehicle.id, { status: "reserved" })}
            style={{ flex: 1 }}
          />
        </View>
      </Panel>
    </Screen>
  );
}
