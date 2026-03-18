import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { addDays, format } from "date-fns";
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
  formatCurrency,
  useWorkspaceBookings,
  useWorkspaceCustomers,
  useWorkspaceVehicles,
} from "../state/selectors";

export function BookingsScreen({ navigation }: any) {
  const bookings = useWorkspaceBookings();
  const vehicles = useWorkspaceVehicles();
  const customers = useWorkspaceCustomers();
  const setQuickCreateOpen = useAppStore((state) => state.setQuickCreateOpen);
  const extendBooking = useAppStore((state) => state.extendBooking);
  const markBookingReturned = useAppStore((state) => state.markBookingReturned);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "confirmed" | "late" | "returned"
  >("all");

  const filtered = useMemo(
    () =>
      bookings.filter((booking) => {
        const vehicle =
          vehicles.find((item) => item.id === booking.vehicleId)?.name || "";
        const customer =
          customers.find((item) => item.id === booking.customerId)?.name || "";
        const matchesQuery = `${vehicle} ${customer}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter =
          filter === "all" ? true : booking.status === filter;
        return matchesQuery && matchesFilter;
      }),
    [bookings, customers, filter, query, vehicles],
  );

  return (
    <Screen>
      <SectionHeader
        title="Bookings"
        subtitle="Pickups, returns, extensions, and conflict-aware drafts."
        action={
          <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
            <AppButton
              label="Check flow"
              variant="secondary"
              onPress={() => navigation.navigate("CheckFlow")}
            />
            <AppButton
              label="New booking"
              icon="add"
              variant="secondary"
              onPress={() => setQuickCreateOpen(true, "booking")}
            />
          </View>
        }
      />
      <AppInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by vehicle or customer"
      />
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.sm,
          flexWrap: "wrap",
        }}
      >
        {(["all", "active", "confirmed", "late", "returned"] as const).map(
          (option) => (
            <Chip
              key={option}
              label={option}
              active={filter === option}
              onPress={() => setFilter(option)}
            />
          ),
        )}
      </View>
      {filtered.map((booking) => {
        const vehicle = vehicles.find((item) => item.id === booking.vehicleId);
        const customer = customers.find(
          (item) => item.id === booking.customerId,
        );
        return (
          <Pressable
            key={booking.id}
            onPress={() =>
              navigation.navigate("BookingDetails", { bookingId: booking.id })
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
                  <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
                    {customer?.name || "Customer"}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted }}>
                    {vehicle?.name || "Vehicle"} ·{" "}
                    {format(new Date(booking.pickupAt), "EEE d MMM HH:mm")}
                  </Text>
                </View>
                <StatusBadge
                  label={booking.status}
                  tone={
                    booking.status === "late"
                      ? "danger"
                      : booking.status === "returned"
                        ? "success"
                        : "warning"
                  }
                />
              </View>
              <Text style={{ color: theme.colors.text }}>
                Pickup: {booking.pickupLocation}
              </Text>
              <Text style={{ color: theme.colors.text }}>
                Dropoff: {booking.dropoffLocation}
              </Text>
              <Text style={{ color: theme.colors.text }}>
                {formatCurrency(booking.amount)}
              </Text>
              {booking.notes ? (
                <Text style={{ color: theme.colors.warning }}>
                  {booking.notes}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
                <AppButton
                  label="Extend 1 day"
                  variant="secondary"
                  onPress={() => extendBooking(booking.id, 1)}
                  style={{ flex: 1 }}
                />
                <AppButton
                  label="Returned"
                  variant="secondary"
                  onPress={() => markBookingReturned(booking.id)}
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

export function BookingDetailsScreen({ route }: any) {
  const bookingId = route.params?.bookingId as string;
  const bookings = useWorkspaceBookings();
  const vehicles = useWorkspaceVehicles();
  const customers = useWorkspaceCustomers();
  const extendBooking = useAppStore((state) => state.extendBooking);
  const markBookingReturned = useAppStore((state) => state.markBookingReturned);
  const booking = bookings.find((item) => item.id === bookingId);

  if (!booking) return null;

  const vehicle = vehicles.find((item) => item.id === booking.vehicleId);
  const customer = customers.find((item) => item.id === booking.customerId);

  return (
    <Screen>
      <Panel>
        <Text
          style={{ color: theme.colors.text, fontSize: 22, fontWeight: "700" }}
        >
          {customer?.name}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>{vehicle?.name}</Text>
        <StatusBadge
          label={booking.status}
          tone={booking.status === "late" ? "danger" : "warning"}
        />
        <Text style={{ color: theme.colors.text }}>
          Pickup: {booking.pickupLocation}
        </Text>
        <Text style={{ color: theme.colors.text }}>
          Dropoff: {booking.dropoffLocation}
        </Text>
        <Text style={{ color: theme.colors.text }}>
          Dates: {format(new Date(booking.pickupAt), "EEE d MMM HH:mm")} to{" "}
          {format(new Date(booking.dropoffAt), "EEE d MMM HH:mm")}
        </Text>
        <Text style={{ color: theme.colors.text }}>
          Value: {formatCurrency(booking.amount)}
        </Text>
        <Text style={{ color: theme.colors.textMuted }}>
          {booking.notes || "No notes attached."}
        </Text>
      </Panel>
      <Panel>
        <SectionHeader title="Actions" subtitle="Common rental adjustments." />
        <AppButton
          label="Extend by 1 day"
          onPress={() => extendBooking(booking.id, 1)}
        />
        <AppButton
          label="Mark returned"
          variant="secondary"
          onPress={() => markBookingReturned(booking.id)}
        />
      </Panel>
    </Screen>
  );
}

export function CheckFlowScreen() {
  const vehicles = useWorkspaceVehicles();
  const customers = useWorkspaceCustomers();
  const addBooking = useAppStore((state) => state.addBooking);
  const [step, setStep] = useState(0);
  const [vehicleId, setVehicleId] = useState<string | null>(
    vehicles[0]?.id || null,
  );
  const [customerId, setCustomerId] = useState<string | null>(
    customers[0]?.id || null,
  );
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState({
    fuel: true,
    photos: false,
    contract: true,
  });

  const steps = ["Select vehicle", "Select customer", "Checklist", "Complete"];

  return (
    <Screen>
      <SectionHeader
        title="Quick Check-In / Out"
        subtitle="One-hand flow for vehicle handoffs."
      />
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.sm,
          flexWrap: "wrap",
        }}
      >
        {steps.map((label, index) => (
          <Chip
            key={label}
            label={`${index + 1}. ${label}`}
            active={index === step}
            onPress={() => setStep(index)}
          />
        ))}
      </View>
      {step === 0 ? (
        <Panel>
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            Choose vehicle
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            {vehicles.map((vehicle) => (
              <Chip
                key={vehicle.id}
                label={`${vehicle.name} · ${vehicle.status}`}
                active={vehicleId === vehicle.id}
                onPress={() => setVehicleId(vehicle.id)}
              />
            ))}
          </View>
        </Panel>
      ) : null}
      {step === 1 ? (
        <Panel>
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            Choose customer
          </Text>
          <View style={{ gap: theme.spacing.sm }}>
            {customers.map((customer) => (
              <Chip
                key={customer.id}
                label={`${customer.name} · ${customer.tag}`}
                active={customerId === customer.id}
                onPress={() => setCustomerId(customer.id)}
              />
            ))}
          </View>
        </Panel>
      ) : null}
      {step === 2 ? (
        <Panel>
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            Checklist and notes
          </Text>
          {Object.entries(checklist).map(([key, value]) => (
            <Chip
              key={key}
              label={`${value ? "Done" : "Pending"} · ${key}`}
              active={value}
              onPress={() =>
                setChecklist((current) => ({
                  ...current,
                  [key]: !current[key as keyof typeof current],
                }))
              }
            />
          ))}
          <AppInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Condition summary or handoff note"
            multiline
          />
        </Panel>
      ) : null}
      {step === 3 ? (
        <Panel>
          <Text style={{ color: theme.colors.text, fontWeight: "700" }}>
            Ready to complete
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            This Expo Go flow creates a local booking placeholder and stores the
            checkflow context in notes.
          </Text>
          <AppButton
            label="Complete handoff"
            onPress={() => {
              if (!vehicleId || !customerId) return;
              addBooking({
                vehicleId,
                customerId,
                pickupAt: new Date().toISOString(),
                dropoffAt: addDays(new Date(), 1).toISOString(),
                amount: 140,
                pickupLocation: "Quick handoff",
                dropoffLocation: "Quick return",
              });
            }}
          />
        </Panel>
      ) : null}
      <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
        <AppButton
          label="Back"
          variant="secondary"
          onPress={() => setStep((current) => Math.max(current - 1, 0))}
          style={{ flex: 1 }}
        />
        <AppButton
          label="Next"
          onPress={() => setStep((current) => Math.min(current + 1, 3))}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
  );
}
