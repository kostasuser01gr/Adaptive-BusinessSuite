import { storage } from "../storage";

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
  const [vehicles, customers, bookings, tasks] = await Promise.all([
    storage.getVehicles(userId),
    storage.getCustomers(userId),
    storage.getBookings(userId),
    storage.getTasks(userId),
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

  // Summarize context into a text block for the LLM
  let contextBlock = "### CURRENT WORKSPACE CONTEXT\n";

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

  // Add summary of recent activity if relevant
  if (q.includes("booking") || q.includes("rental") || q.includes("status")) {
    const activeBookings = bookings
      .filter((b) => b.status === "active")
      .slice(0, 5);
    if (activeBookings.length > 0) {
      contextBlock += "\n**Recent Active Bookings:**\n";
      activeBookings.forEach((b) => {
        contextBlock += `- ID: ${b.id}, Vehicle: ${b.vehicleId}, Customer: ${b.customerId}, Ends: ${b.endDate}\n`;
      });
    }
  }

  const todoTasks = tasks.filter((t) => t.status === "todo").slice(0, 5);
  if (
    todoTasks.length > 0 &&
    (q.includes("task") || q.includes("todo") || q.includes("do"))
  ) {
    contextBlock += "\n**Priority Tasks:**\n";
    todoTasks.forEach((t) => {
      contextBlock += `- ID: ${t.id}, Title: ${t.title}, Priority: ${t.priority}\n`;
    });
  }

  return contextBlock === "### CURRENT WORKSPACE CONTEXT\n" ? "" : contextBlock;
}
