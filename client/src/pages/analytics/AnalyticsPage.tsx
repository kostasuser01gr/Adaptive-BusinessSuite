import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnimatedMount } from "@/components/animation/AnimatedMount";
import { AnimatedCounter } from "@/components/animation/AnimatedCounter";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Car,
  Users,
  CalendarCheck,
  AlertTriangle,
} from "lucide-react";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/analytics/metrics"],
    queryFn: api.analytics.metrics,
  });

  const { data: revenue } = useQuery({
    queryKey: ["/api/analytics/revenue", dateRange.start, dateRange.end],
    queryFn: () => api.analytics.revenue(dateRange.start, dateRange.end, "day"),
  });

  const { data: fleetUtil } = useQuery({
    queryKey: [
      "/api/analytics/fleet-utilization",
      dateRange.start,
      dateRange.end,
    ],
    queryFn: () =>
      api.analytics.fleetUtilization(dateRange.start, dateRange.end),
  });

  const { data: customerLtv } = useQuery({
    queryKey: ["/api/analytics/customer-ltv"],
    queryFn: api.analytics.customerLtv,
  });

  const { data: anomalies } = useQuery({
    queryKey: ["/api/analytics/anomalies"],
    queryFn: api.analytics.anomalies,
  });

  const kpis = useMemo(
    () => [
      {
        label: "Total Revenue",
        value: metrics?.totalRevenue || 0,
        prefix: "\u20AC",
        decimals: 2,
        icon: DollarSign,
        color: "text-emerald-400 bg-emerald-400/10",
      },
      {
        label: "Avg Booking Value",
        value: metrics?.avgBookingValue || 0,
        prefix: "\u20AC",
        decimals: 2,
        icon: TrendingUp,
        color: "text-blue-400 bg-blue-400/10",
      },
      {
        label: "Fleet Utilization",
        value: metrics?.fleetUtilization || 0,
        suffix: "%",
        decimals: 1,
        icon: Car,
        color: "text-amber-400 bg-amber-400/10",
      },
      {
        label: "Active Bookings",
        value: metrics?.activeBookings || 0,
        decimals: 0,
        icon: CalendarCheck,
        color: "text-purple-400 bg-purple-400/10",
      },
      {
        label: "Revenue Growth",
        value: metrics?.revenueGrowth || 0,
        suffix: "%",
        decimals: 1,
        icon: TrendingUp,
        color:
          (metrics?.revenueGrowth || 0) >= 0
            ? "text-green-400 bg-green-400/10"
            : "text-red-400 bg-red-400/10",
      },
    ],
    [metrics],
  );

  return (
    <AnimatedMount className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-xl font-heading font-bold">
          Analytics & Intelligence
        </h1>
        <div className="flex items-center gap-2 text-xs">
          <label className="text-muted-foreground">From</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="bg-card/60 border border-border/50 rounded-lg px-2 py-1 text-xs text-foreground"
          />
          <label className="text-muted-foreground">To</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="bg-card/60 border border-border/50 rounded-lg px-2 py-1 text-xs text-foreground"
          />
        </div>
      </div>

      {/* Anomaly Alerts */}
      {anomalies && anomalies.length > 0 && (
        <div className="mb-4 space-y-2">
          {anomalies.map((a: any, i: number) => (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border p-3 text-xs ${
                a.severity === "critical"
                  ? "border-red-500/30 bg-red-500/5 text-red-300"
                  : "border-amber-500/30 bg-amber-500/5 text-amber-300"
              }`}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="bg-card/40 border border-border/50 rounded-xl p-4"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${kpi.color}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-lg font-heading font-bold">
                <AnimatedCounter
                  value={kpi.value}
                  decimals={kpi.decimals}
                  prefix={kpi.prefix || ""}
                  suffix={kpi.suffix || ""}
                />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {kpi.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue Area Chart */}
        <div className="bg-card/40 border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-heading font-semibold mb-4">
            Revenue Over Time
          </h3>
          {revenue && revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="hsl(var(--chart-1))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/30"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-xs">
              No revenue data for selected period
            </div>
          )}
        </div>

        {/* Fleet Utilization Bar Chart */}
        <div className="bg-card/40 border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-heading font-semibold mb-4">
            Fleet Utilization
          </h3>
          {fleetUtil && fleetUtil.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={fleetUtil}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/30"
                />
                <XAxis
                  dataKey="make"
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  tickFormatter={(v, i) => {
                    const item = fleetUtil[i];
                    return item ? `${v} ${item.model}` : v;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [`${value}%`, "Utilization"]}
                />
                <Bar
                  dataKey="utilization"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-xs">
              No fleet data available
            </div>
          )}
        </div>
      </div>

      {/* Customer LTV Table */}
      <div className="bg-card/40 border border-border/50 rounded-xl p-5">
        <h3 className="text-sm font-heading font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Customer Lifetime Value
        </h3>
        {customerLtv && customerLtv.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30 text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-semibold uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-right py-2 px-4 font-semibold uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="text-right py-2 px-4 font-semibold uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="text-right py-2 pl-4 font-semibold uppercase tracking-wider">
                    Avg / Booking
                  </th>
                </tr>
              </thead>
              <tbody>
                {customerLtv.slice(0, 15).map((c: any) => (
                  <tr
                    key={c.customerId}
                    className="border-b border-border/10 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400 font-mono">
                      {"\u20AC"}
                      {c.totalSpent.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">
                      {c.bookingCount}
                    </td>
                    <td className="py-2.5 pl-4 text-right font-mono">
                      {"\u20AC"}
                      {c.avgPerBooking.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-xs">
            No customer data available
          </div>
        )}
      </div>
    </AnimatedMount>
  );
}
