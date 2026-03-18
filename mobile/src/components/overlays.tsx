import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../app/theme";
import { AppButton, AppInput, Chip, Panel } from "./ui";
import { useAppStore } from "../state/store";
import {
  useWorkspaceCustomers,
  useWorkspaceVehicles,
} from "../state/selectors";

function FloatingActions() {
  const commandBarOpen = useAppStore((state) => state.ui.commandBarOpen);
  const quickCreateOpen = useAppStore((state) => state.ui.quickCreateOpen);
  const setCommandBarOpen = useAppStore((state) => state.setCommandBarOpen);
  const setQuickCreateOpen = useAppStore((state) => state.setQuickCreateOpen);
  const activeUserId = useAppStore((state) => state.session.activeUserId);
  const activeWorkspaceId = useAppStore(
    (state) => state.session.activeWorkspaceId,
  );

  if (!activeUserId || !activeWorkspaceId) return null;

  return (
    <View pointerEvents="box-none" style={styles.floatingContainer}>
      <Pressable
        onPress={() => setCommandBarOpen(!commandBarOpen)}
        style={[
          styles.floatingButton,
          { backgroundColor: theme.colors.surfaceAlt },
        ]}
      >
        <Ionicons name="terminal" size={22} color={theme.colors.text} />
      </Pressable>
      <Pressable
        onPress={() => setQuickCreateOpen(!quickCreateOpen, "booking")}
        style={[
          styles.floatingButton,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <Ionicons name="add" size={24} color="#06111D" />
      </Pressable>
    </View>
  );
}

function CommandBarModal() {
  const open = useAppStore((state) => state.ui.commandBarOpen);
  const setCommandBarOpen = useAppStore((state) => state.setCommandBarOpen);
  const sendAssistantCommand = useAppStore(
    (state) => state.sendAssistantCommand,
  );
  const [command, setCommand] = useState("");

  const prompts = [
    "Add a Damage Reports module",
    "Add a Pickup Location field to Bookings",
    "Suggest improvements for my dashboard",
    "Create a workflow for late returns",
  ];

  return (
    <Modal
      transparent
      animationType="slide"
      visible={open}
      onRequestClose={() => setCommandBarOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <Panel
          style={{ marginTop: "auto", marginHorizontal: theme.spacing.md }}
        >
          <Text style={styles.modalTitle}>Global Command Bar</Text>
          <Text style={styles.modalBody}>
            Preview changes before apply. Commands still work in deterministic
            mode.
          </Text>
          <AppInput
            value={command}
            onChangeText={setCommand}
            placeholder="Type a command..."
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              {prompts.map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  onPress={() => setCommand(prompt)}
                />
              ))}
            </View>
          </ScrollView>
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <AppButton
              label="Close"
              variant="secondary"
              onPress={() => setCommandBarOpen(false)}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Run command"
              icon="sparkles"
              onPress={async () => {
                if (!command.trim()) return;
                await sendAssistantCommand(command.trim());
                setCommand("");
                setCommandBarOpen(false);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </Panel>
      </View>
    </Modal>
  );
}

function QuickCreateModal() {
  const open = useAppStore((state) => state.ui.quickCreateOpen);
  const target = useAppStore((state) => state.ui.quickCreateTarget);
  const setQuickCreateOpen = useAppStore((state) => state.setQuickCreateOpen);
  const addVehicle = useAppStore((state) => state.addVehicle);
  const addCustomer = useAppStore((state) => state.addCustomer);
  const addTask = useAppStore((state) => state.addTask);
  const addNote = useAppStore((state) => state.addNote);
  const addBooking = useAppStore((state) => state.addBooking);
  const vehicles = useWorkspaceVehicles();
  const customers = useWorkspaceCustomers();

  const [title, setTitle] = useState("");
  const [secondary, setSecondary] = useState("");
  const [tertiary, setTertiary] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );

  const options: Array<typeof target> = [
    "booking",
    "vehicle",
    "customer",
    "task",
    "note",
  ];
  const heading = useMemo(() => {
    if (target === "vehicle") return "Quick add vehicle";
    if (target === "customer") return "Quick add customer";
    if (target === "task") return "Quick add task";
    if (target === "note") return "Quick add note";
    return "Quick create booking";
  }, [target]);

  const reset = () => {
    setTitle("");
    setSecondary("");
    setTertiary("");
    setSelectedVehicleId(null);
    setSelectedCustomerId(null);
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={open}
      onRequestClose={() => setQuickCreateOpen(false)}
    >
      <View style={styles.modalBackdrop}>
        <Panel
          style={{ marginTop: "auto", marginHorizontal: theme.spacing.md }}
        >
          <Text style={styles.modalTitle}>{heading}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
              {options.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  active={target === option}
                  onPress={() => setQuickCreateOpen(true, option)}
                />
              ))}
            </View>
          </ScrollView>

          {target === "vehicle" ? (
            <>
              <AppInput
                value={title}
                onChangeText={setTitle}
                placeholder="Vehicle name"
              />
              <AppInput
                value={secondary}
                onChangeText={setSecondary}
                placeholder="Plate"
              />
              <AppInput
                value={tertiary}
                onChangeText={setTertiary}
                placeholder="Category"
              />
            </>
          ) : null}

          {target === "customer" ? (
            <>
              <AppInput
                value={title}
                onChangeText={setTitle}
                placeholder="Customer name"
              />
              <AppInput
                value={secondary}
                onChangeText={setSecondary}
                placeholder="Phone"
              />
              <AppInput
                value={tertiary}
                onChangeText={setTertiary}
                placeholder="Email"
              />
            </>
          ) : null}

          {target === "task" ? (
            <AppInput
              value={title}
              onChangeText={setTitle}
              placeholder="Task title"
            />
          ) : null}

          {target === "note" ? (
            <>
              <AppInput
                value={title}
                onChangeText={setTitle}
                placeholder="Note title"
              />
              <AppInput
                value={secondary}
                onChangeText={setSecondary}
                placeholder="Note content"
                multiline
              />
            </>
          ) : null}

          {target === "booking" ? (
            <>
              <AppInput
                value={title}
                onChangeText={setTitle}
                placeholder="Pickup location"
              />
              <AppInput
                value={secondary}
                onChangeText={setSecondary}
                placeholder="Dropoff location"
              />
              <Text style={styles.modalBody}>Vehicle</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                  {vehicles.map((vehicle) => (
                    <Chip
                      key={vehicle.id}
                      label={vehicle.name}
                      active={selectedVehicleId === vehicle.id}
                      onPress={() => setSelectedVehicleId(vehicle.id)}
                    />
                  ))}
                </View>
              </ScrollView>
              <Text style={styles.modalBody}>Customer</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                  {customers.map((customer) => (
                    <Chip
                      key={customer.id}
                      label={customer.name}
                      active={selectedCustomerId === customer.id}
                      onPress={() => setSelectedCustomerId(customer.id)}
                    />
                  ))}
                </View>
              </ScrollView>
            </>
          ) : null}

          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <AppButton
              label="Close"
              variant="secondary"
              onPress={() => {
                reset();
                setQuickCreateOpen(false);
              }}
              style={{ flex: 1 }}
            />
            <AppButton
              label="Create"
              onPress={() => {
                if (target === "vehicle") {
                  addVehicle({
                    name: title || "New vehicle",
                    plate: secondary || "TBD",
                    category: tertiary || "sedan",
                  });
                } else if (target === "customer") {
                  addCustomer({
                    name: title || "New customer",
                    phone: secondary || "-",
                    email: tertiary || "-",
                  });
                } else if (target === "task") {
                  addTask(title || "New task");
                } else if (target === "note") {
                  addNote(
                    title || "Quick note",
                    secondary || "Captured from global quick create.",
                  );
                } else {
                  const fallbackVehicle = selectedVehicleId || vehicles[0]?.id;
                  const fallbackCustomer =
                    selectedCustomerId || customers[0]?.id;
                  if (fallbackVehicle && fallbackCustomer) {
                    addBooking({
                      vehicleId: fallbackVehicle,
                      customerId: fallbackCustomer,
                      pickupAt: new Date().toISOString(),
                      dropoffAt: new Date(
                        Date.now() + 24 * 60 * 60 * 1000,
                      ).toISOString(),
                      amount: 120,
                      pickupLocation: title || "City office",
                      dropoffLocation: secondary || "City office",
                    });
                  }
                }

                reset();
                setQuickCreateOpen(false);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </Panel>
      </View>
    </Modal>
  );
}

export function GlobalOverlays() {
  return (
    <>
      <FloatingActions />
      <CommandBarModal />
      <QuickCreateModal />
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    right: theme.spacing.md,
    bottom: 34,
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: "flex-end",
    paddingBottom: theme.spacing.lg,
  },
  modalTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});
