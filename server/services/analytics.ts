import { db } from "../db";
import { storage } from "../storage";
import { bookings, vehicles, customers } from "@shared/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface FleetUtilizationEntry {
  vehicleId: string;
  make: string;
  model: string;
  utilization: number;
}

interface ForecastPoint {
  date: string;
  actual?: number;
  forecast: number;
}

interface CustomerLTV {
  customerId: string;
  name: string;
  totalSpent: number;
  bookingCount: number;
  avgPerBooking: number;
}

interface TopMetrics {
  totalRevenue: number;
  avgBookingValue: number;
  fleetUtilization: number;
  activeBookings: number;
  totalCustomers: number;
  revenueGrowth: number;
}

export class AnalyticsEngine {
  async getRevenueTimeSeries(
    userId: string,
    dateRange: { start: Date; end: Date },
    granularity: "day" | "week" | "month" = "day",
  ): Promise<RevenuePoint[]> {
    const allBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          gte(bookings.createdAt, dateRange.start),
          lte(bookings.createdAt, dateRange.end),
        ),
      );

    // Build a date map for aggregation
    const map = new Map<string, number>();
    const msPerDay = 24 * 60 * 60 * 1000;

    // Pre-fill all dates in range
    for (
      let d = new Date(dateRange.start);
      d <= dateRange.end;
      d = new Date(d.getTime() + msPerDay)
    ) {
      const key = this.dateKey(d, granularity);
      if (!map.has(key)) map.set(key, 0);
    }

    for (const b of allBookings) {
      const d = b.createdAt ? new Date(b.createdAt) : null;
      if (!d) continue;
      const key = this.dateKey(d, granularity);
      const current = map.get(key) || 0;
      map.set(key, current + parseFloat(b.totalAmount || "0"));
    }

    const result: RevenuePoint[] = [];
    for (const [date, revenue] of Array.from(map.entries())) {
      result.push({ date, revenue: Math.round(revenue * 100) / 100 });
    }

    result.sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }

  async getFleetUtilization(
    userId: string,
    dateRange: { start: Date; end: Date },
  ): Promise<FleetUtilizationEntry[]> {
    const allVehicles = await storage.getVehicles(userId);
    const allBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          gte(bookings.startDate, dateRange.start),
          lte(bookings.startDate, dateRange.end),
        ),
      );

    const totalDays = Math.max(
      1,
      Math.ceil(
        (dateRange.end.getTime() - dateRange.start.getTime()) /
          (24 * 60 * 60 * 1000),
      ),
    );

    return allVehicles.map((v) => {
      const vehicleBookings = allBookings.filter(
        (b) => b.vehicleId === v.id,
      );
      let rentedDays = 0;
      for (const b of vehicleBookings) {
        const start = b.startDate ? new Date(b.startDate) : null;
        const end = b.endDate ? new Date(b.endDate) : null;
        if (start && end) {
          rentedDays += Math.ceil(
            (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
          );
        } else {
          rentedDays += 1; // default 1 day if no range
        }
      }

      return {
        vehicleId: v.id,
        make: v.make,
        model: v.model,
        utilization:
          Math.round((Math.min(rentedDays, totalDays) / totalDays) * 10000) /
          100,
      };
    });
  }

  async getBookingDemandForecast(userId: string): Promise<ForecastPoint[]> {
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const recentBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, userId),
          gte(bookings.createdAt, ninetyDaysAgo),
        ),
      );

    // Build daily counts for last 90 days
    const dailyCounts = new Map<string, number>();
    const msPerDay = 24 * 60 * 60 * 1000;

    for (let i = 0; i < 90; i++) {
      const d = new Date(ninetyDaysAgo.getTime() + i * msPerDay);
      dailyCounts.set(d.toISOString().slice(0, 10), 0);
    }

    for (const b of recentBookings) {
      const d = b.createdAt
        ? new Date(b.createdAt).toISOString().slice(0, 10)
        : null;
      if (d && dailyCounts.has(d)) {
        dailyCounts.set(d, (dailyCounts.get(d) || 0) + 1);
      }
    }

    // Simple linear regression: y = mx + b
    const entries = Array.from(dailyCounts.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    const n = entries.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    for (let i = 0; i < n; i++) {
      const y = entries[i][1];
      sumX += i;
      sumY += y;
      sumXY += i * y;
      sumX2 += i * i;
    }

    const denom = n * sumX2 - sumX * sumX;
    const m = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
    const b = (sumY - m * sumX) / n;

    const result: ForecastPoint[] = [];

    // Past 90 days with actual values
    for (let i = 0; i < n; i++) {
      const [date, count] = entries[i];
      result.push({
        date,
        actual: count,
        forecast: Math.max(0, Math.round((m * i + b) * 100) / 100),
      });
    }

    // Forecast next 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() + (i + 1) * msPerDay);
      const x = n + i;
      result.push({
        date: d.toISOString().slice(0, 10),
        forecast: Math.max(0, Math.round((m * x + b) * 100) / 100),
      });
    }

    return result;
  }

  async getCustomerLifetimeValue(userId: string): Promise<CustomerLTV[]> {
    const allCustomers = await storage.getCustomers(userId);
    const allBookings = await storage.getBookings(userId);

    return allCustomers
      .map((c) => {
        const customerBookings = allBookings.filter(
          (b) => b.customerId === c.id,
        );
        const totalSpent = customerBookings.reduce(
          (sum, b) => sum + parseFloat(b.totalAmount || "0"),
          0,
        );
        const bookingCount = customerBookings.length;

        return {
          customerId: c.id,
          name: c.name,
          totalSpent: Math.round(totalSpent * 100) / 100,
          bookingCount,
          avgPerBooking:
            bookingCount > 0
              ? Math.round((totalSpent / bookingCount) * 100) / 100
              : 0,
        };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }

  async getTopMetrics(userId: string): Promise<TopMetrics> {
    const [allBookings, allVehicles, allCustomers] = await Promise.all([
      storage.getBookings(userId),
      storage.getVehicles(userId),
      storage.getCustomers(userId),
    ]);

    const completedBookings = allBookings.filter(
      (b) => b.status === "completed",
    );
    const activeBookings = allBookings.filter(
      (b) => b.status === "active",
    ).length;

    const totalRevenue = completedBookings.reduce(
      (sum, b) => sum + parseFloat(b.totalAmount || "0"),
      0,
    );
    const avgBookingValue =
      completedBookings.length > 0
        ? totalRevenue / completedBookings.length
        : 0;

    // Fleet utilization: rented vehicles / total vehicles
    const rentedCount = allVehicles.filter(
      (v) => v.status === "rented",
    ).length;
    const fleetUtilization =
      allVehicles.length > 0
        ? Math.round((rentedCount / allVehicles.length) * 10000) / 100
        : 0;

    // Revenue growth: compare last 30 days vs prior 30 days
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const currentPeriod = completedBookings.filter((b) => {
      const d = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return d >= now - thirtyDays;
    });
    const priorPeriod = completedBookings.filter((b) => {
      const d = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return d >= now - 2 * thirtyDays && d < now - thirtyDays;
    });

    const currentRev = currentPeriod.reduce(
      (s, b) => s + parseFloat(b.totalAmount || "0"),
      0,
    );
    const priorRev = priorPeriod.reduce(
      (s, b) => s + parseFloat(b.totalAmount || "0"),
      0,
    );

    const revenueGrowth =
      priorRev > 0
        ? Math.round(((currentRev - priorRev) / priorRev) * 10000) / 100
        : currentRev > 0
          ? 100
          : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgBookingValue: Math.round(avgBookingValue * 100) / 100,
      fleetUtilization,
      activeBookings,
      totalCustomers: allCustomers.length,
      revenueGrowth,
    };
  }

  private dateKey(
    d: Date,
    granularity: "day" | "week" | "month",
  ): string {
    switch (granularity) {
      case "day":
        return d.toISOString().slice(0, 10);
      case "week": {
        // ISO week start (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d);
        monday.setDate(diff);
        return monday.toISOString().slice(0, 10);
      }
      case "month":
        return d.toISOString().slice(0, 7);
    }
  }
}

export const analyticsEngine = new AnalyticsEngine();
