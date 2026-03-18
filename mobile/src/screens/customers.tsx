import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
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
  useWorkspaceBookings,
  useWorkspaceCustomers,
} from "../state/selectors";

export function CustomersScreen({ navigation }: any) {
  const customers = useWorkspaceCustomers();
  const setQuickCreateOpen = useAppStore((state) => state.setQuickCreateOpen);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "vip" | "risk" | "standard">(
    "all",
  );

  const filtered = useMemo(
    () =>
      customers.filter((customer) => {
        const matchesQuery =
          `${customer.name} ${customer.email} ${customer.phone}`
            .toLowerCase()
            .includes(query.toLowerCase());
        const matchesFilter = filter === "all" ? true : customer.tag === filter;
        return matchesQuery && matchesFilter;
      }),
    [customers, filter, query],
  );

  return (
    <Screen>
      <SectionHeader
        title="Customers"
        subtitle="Profiles, notes, and booking context."
        action={
          <AppButton
            label="Add customer"
            icon="person-add"
            variant="secondary"
            onPress={() => setQuickCreateOpen(true, "customer")}
          />
        }
      />
      <AppInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search customer"
      />
      <View
        style={{
          flexDirection: "row",
          gap: theme.spacing.sm,
          flexWrap: "wrap",
        }}
      >
        {(["all", "vip", "risk", "standard"] as const).map((option) => (
          <Chip
            key={option}
            label={option}
            active={filter === option}
            onPress={() => setFilter(option)}
          />
        ))}
      </View>
      {filtered.map((customer) => (
        <Pressable
          key={customer.id}
          onPress={() =>
            navigation.navigate("CustomerDetails", { customerId: customer.id })
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
              <View>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontWeight: "700",
                    fontSize: 16,
                  }}
                >
                  {customer.name}
                </Text>
                <Text style={{ color: theme.colors.textMuted }}>
                  {customer.phone}
                </Text>
              </View>
              <StatusBadge
                label={customer.tag}
                tone={
                  customer.tag === "vip"
                    ? "success"
                    : customer.tag === "risk"
                      ? "danger"
                      : "info"
                }
              />
            </View>
            <Text style={{ color: theme.colors.text }}>{customer.email}</Text>
            <Text style={{ color: theme.colors.textMuted }}>
              {customer.notes || "No notes yet."}
            </Text>
          </Panel>
        </Pressable>
      ))}
    </Screen>
  );
}

export function CustomerDetailsScreen({ route }: any) {
  const customerId = route.params?.customerId as string;
  const customers = useWorkspaceCustomers();
  const bookings = useWorkspaceBookings();
  const updateCustomer = useAppStore((state) => state.updateCustomer);
  const customer = customers.find((item) => item.id === customerId);

  if (!customer) return null;

  const linkedBookings = bookings.filter(
    (booking) => booking.customerId === customer.id,
  );

  return (
    <Screen>
      <Panel>
        <Text
          style={{ color: theme.colors.text, fontSize: 24, fontWeight: "700" }}
        >
          {customer.name}
        </Text>
        <Text style={{ color: theme.colors.text }}>{customer.phone}</Text>
        <Text style={{ color: theme.colors.text }}>{customer.email}</Text>
        <StatusBadge
          label={customer.tag}
          tone={
            customer.tag === "vip"
              ? "success"
              : customer.tag === "risk"
                ? "danger"
                : "info"
          }
        />
        <Text style={{ color: theme.colors.textMuted }}>
          {customer.notes || "No notes saved."}
        </Text>
      </Panel>
      <Panel>
        <SectionHeader
          title="Profile tag"
          subtitle="Simple local risk/VIP handling."
        />
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <AppButton
            label="VIP"
            variant="secondary"
            onPress={() => updateCustomer(customer.id, { tag: "vip" })}
            style={{ flex: 1 }}
          />
          <AppButton
            label="Risk"
            variant="secondary"
            onPress={() => updateCustomer(customer.id, { tag: "risk" })}
            style={{ flex: 1 }}
          />
          <AppButton
            label="Standard"
            variant="secondary"
            onPress={() => updateCustomer(customer.id, { tag: "standard" })}
            style={{ flex: 1 }}
          />
        </View>
      </Panel>
      <Panel>
        <SectionHeader
          title="Linked bookings"
          subtitle="Recent bookings for this customer."
        />
        {linkedBookings.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>
            No linked bookings yet.
          </Text>
        ) : (
          linkedBookings.map((booking) => (
            <Text key={booking.id} style={{ color: theme.colors.text }}>
              {booking.status} ·{" "}
              {new Date(booking.pickupAt).toLocaleDateString()}
            </Text>
          ))
        )}
      </Panel>
    </Screen>
  );
}
