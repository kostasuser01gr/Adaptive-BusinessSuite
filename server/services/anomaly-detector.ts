import { storage } from "../storage";

interface Anomaly {
  metric: string;
  value: number;
  expected: number;
  zScore: number;
  severity: "warning" | "critical";
  message: string;
}

export class AnomalyDetector {
  async detectAnomalies(userId: string): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const msPerDay = 24 * 60 * 60 * 1000;

    const allBookings = await storage.getBookings(userId);

    // Filter to last 30 days
    const recentBookings = allBookings.filter((b) => {
      const d = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return d >= thirtyDaysAgo.getTime();
    });

    // Build daily booking counts
    const dailyCounts: number[] = [];
    const dailyRevenue: number[] = [];

    for (let i = 0; i < 30; i++) {
      const dayStart = new Date(thirtyDaysAgo.getTime() + i * msPerDay);
      const dayEnd = new Date(dayStart.getTime() + msPerDay);
      const dayStr = dayStart.toISOString().slice(0, 10);

      const dayBookings = recentBookings.filter((b) => {
        const d = b.createdAt
          ? new Date(b.createdAt).toISOString().slice(0, 10)
          : "";
        return d === dayStr;
      });

      dailyCounts.push(dayBookings.length);
      dailyRevenue.push(
        dayBookings.reduce(
          (sum, b) => sum + parseFloat(b.totalAmount || "0"),
          0,
        ),
      );
    }

    // Check booking count anomalies
    const countAnomaly = this.checkZScore(
      dailyCounts,
      "daily_booking_count",
      "Daily booking count",
    );
    if (countAnomaly) anomalies.push(countAnomaly);

    // Check revenue anomalies
    const revenueAnomaly = this.checkZScore(
      dailyRevenue,
      "daily_revenue",
      "Daily revenue",
    );
    if (revenueAnomaly) anomalies.push(revenueAnomaly);

    return anomalies;
  }

  private checkZScore(
    values: number[],
    metric: string,
    label: string,
  ): Anomaly | null {
    if (values.length < 3) return null;

    const todayValue = values[values.length - 1];
    // Use all but today for baseline
    const baseline = values.slice(0, -1);

    const mean = baseline.reduce((s, v) => s + v, 0) / baseline.length;
    const variance =
      baseline.reduce((s, v) => s + (v - mean) ** 2, 0) / baseline.length;
    const stddev = Math.sqrt(variance);

    if (stddev === 0) return null;

    const zScore = (todayValue - mean) / stddev;
    const absZ = Math.abs(zScore);

    if (absZ < 2) return null;

    const severity: "warning" | "critical" = absZ >= 3 ? "critical" : "warning";
    const direction = zScore > 0 ? "above" : "below";

    return {
      metric,
      value: Math.round(todayValue * 100) / 100,
      expected: Math.round(mean * 100) / 100,
      zScore: Math.round(zScore * 100) / 100,
      severity,
      message: `${label} is ${Math.round(absZ * 10) / 10} standard deviations ${direction} the 30-day average (${Math.round(todayValue * 100) / 100} vs expected ${Math.round(mean * 100) / 100})`,
    };
  }
}

export const anomalyDetector = new AnomalyDetector();
