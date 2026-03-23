import { storage } from "../storage";
import { calculateYield } from "../services/yield";

export interface WorkspaceContext {
  vehicles: any[];
  customers: any[];
  bookings: any[];
  tasks: any[];
}

export async function getWorkspaceContext(
  userId: string,
  query: string,
): Promise<string> {
  const [vehicles, customers, bookings, tasks, maintenance] = await Promise.all([
    storage.getVehicles(userId),
    storage.getCustomers(userId),
    storage.getBookings(userId),
    storage.getTasks(userId),
    storage.getMaintenanceRecords(userId),
  ]);

  const q = query.toLowerCase();

  // Simple keyword filtering to keep context size manageable
  const relevantVehicles = vehicles.filter(
    (v) =>
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.plate?.toLowerCase().includes(q),
  );

  const relevantCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q),
  );

  let contextBlock = "### CURRENT WORKSPACE CONTEXT\n";

  // Fleet summary (always include for context)
  const available = vehicles.filter((v) => v.status === "available").length;
  const rented = vehicles.filter((v) => v.status === "rented").length;
  const inMaintenance = vehicles.filter((v) => v.status === "maintenance").length;
  contextBlock += `\n**Fleet Summary:** ${vehicles.length} total (${available} available, ${rented} rented, ${inMaintenance} in maintenance)\n`;

  if (relevantVehicles.length > 0) {
    contextBlock += "\n**Relevant Vehicles:**\n";
    relevantVehicles.forEach((v) => {
      contextBlock += `- ID: ${v.id}, ${v.make} ${v.model} (${v.plate}), Status: ${v.status}, Rate: ${v.dailyRate}\n`;
    });
  }

  if (relevantCustomers.length > 0) {
    contextBlock += "\n**Relevant Customers:**\n";
    relevantCustomers.forEach((c) => {
      contextBlock += `- ID: ${c.id}, Name: ${c.name}, Email: ${c.email || "N/A"}\n`;
    });
  }

  // Booking context
  if (q.includes("booking") || q.includes("rental") || q.includes("status") || q.includes("revenue")) {
    const activeBookings = bookings
      .filter((b) => b.status === "active")
      .slice(0, 5);
    if (activeBookings.length > 0) {
      contextBlock += "\n**Recent Active Bookings:**\n";
      activeBookings.forEach((b) => {
        contextBlock += `- ID: ${b.id}, Vehicle: ${b.vehicleId}, Customer: ${b.customerId}, Ends: ${b.endDate}\n`;
      });
    }

    // Booking conflict awareness
    const pendingBookings = bookings.filter((b) => b.status === "pending");
    if (pendingBookings.length > 0) {
      contextBlock += `\n**Pending Bookings:** ${pendingBookings.length} awaiting confirmation\n`;
    }
  }

  // Task context
  const todoTasks = tasks.filter((t) => t.status === "todo").slice(0, 5);
  if (
    todoTasks.length > 0 &&
    (q.includes("task") || q.includes("todo") || q.includes("do") || q.includes("pending"))
  ) {
    contextBlock += "\n**Priority Tasks:**\n";
    todoTasks.forEach((t) => {
      contextBlock += `- ID: ${t.id}, Title: ${t.title}, Priority: ${t.priority}\n`;
    });
  }

  // Maintenance awareness
  if (q.includes("maintenance") || q.includes("service") || q.includes("repair") || q.includes("schedule")) {
    const scheduled = maintenance.filter((m) => m.status === "scheduled").slice(0, 5);
    if (scheduled.length > 0) {
      contextBlock += "\n**Scheduled Maintenance:**\n";
      scheduled.forEach((m) => {
        contextBlock += `- ID: ${m.id}, Vehicle: ${m.vehicleId}, Type: ${m.type}, Scheduled: ${m.scheduledDate}\n`;
      });
    }
  }

  // Yield management context
  if (q.includes("price") || q.includes("yield") || q.includes("optim") || q.includes("revenue") || q.includes("rate")) {
    const yieldData = calculateYield(vehicles.length, rented);
    contextBlock += `\n**Yield Analytics:** Utilization: ${yieldData.utilization}%, Multiplier: ${yieldData.recommendedMultiplier}x, Demand Factor: ${yieldData.marketDemandFactor}, Uplift: ${yieldData.projectedRevenueUplift}\n`;
  }

  return contextBlock === "### CURRENT WORKSPACE CONTEXT\n" ? "" : contextBlock;
}
