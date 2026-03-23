import { useAppState } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnimatedMount } from "@/components/animation/AnimatedMount";
import {
  Euro,
  TrendingUp,
  TrendingDown,
  Car,
  DollarSign,
  PiggyBank,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function FinancialPage() {
  const { stats } = useAppState();
  const { data: financial, isLoading } = useQuery({
    queryKey: ["/api/analytics/financial"],
    queryFn: api.analytics.financial,
  });
  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: api.bookings.list,
  });

  const completedBookings = (bookings || []).filter(
    (b: any) => b.status === "completed",
  );

  const kpis = [
    {
      label: "Total Revenue",
      value: `€${(financial?.totalRevenue || 0).toLocaleString()}`,
      icon: Euro,
      color: "text-emerald-400 bg-emerald-400/10",
    },
    {
      label: "Net Profit",
      value: `€${(financial?.netProfit || 0).toLocaleString()}`,
      icon: PiggyBank,
      color:
        (financial?.netProfit || 0) >= 0
          ? "text-blue-400 bg-blue-400/10"
          : "text-red-400 bg-red-400/10",
    },
    {
      label: "Total Expenses",
      value: `€${(financial?.totalExpenses || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-amber-400 bg-amber-400/10",
    },
    {
      label: "Growth",
      value: `${financial?.growth || 0}%`,
      icon: (financial?.growth || 0) >= 0 ? TrendingUp : TrendingDown,
      color: "text-purple-400 bg-purple-400/10",
    },
  ];

  return (
    <AnimatedMount className="max-w-6xl mx-auto">
      <h1 className="text-xl font-heading font-bold mb-6">
        Financial Dashboard
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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
              <p className="text-lg font-heading font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {kpi.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue Trend */}
        <div className="bg-card/40 border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-heading font-semibold mb-4">
            Monthly Revenue
          </h3>
          {financial?.monthlyRevenue?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={financial.monthlyRevenue}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/30"
                />
                <XAxis
                  dataKey="month"
                  className="text-[10px]"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-[10px]"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--chart-1))"
                  name="Revenue"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke="hsl(var(--chart-2))"
                  name="Trend"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">
              No revenue data available yet
            </div>
          )}
        </div>

        {/* Profit Margin */}
        <div className="bg-card/40 border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-heading font-semibold mb-4">
            Profit Margin %
          </h3>
          {financial?.profitMargins?.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={financial.profitMargins}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/30"
                />
                <XAxis
                  dataKey="month"
                  className="text-[10px]"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-[10px]"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="margin"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-3))", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">
              No margin data available yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost Breakdown */}
        <div className="bg-card/40 border border-border/50 rounded-xl p-5">
          <h3 className="text-sm font-heading font-semibold mb-4">
            Cost Breakdown
          </h3>
          {financial?.costs?.length &&
          financial.costs.some((c: any) => c.value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={financial.costs}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }: any) => `${name}: €${value}`}
                >
                  {(financial.costs as any[]).map((_: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">
              No expense data available yet
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-card/40 border border-border/50 rounded-xl p-5">
          <h2 className="text-sm font-heading font-semibold mb-4">
            Recent Transactions
          </h2>
          {completedBookings.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {completedBookings.slice(0, 10).map((b: any) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between px-3 py-2.5 bg-muted/30 rounded-lg text-xs"
                >
                  <div>
                    <span className="font-medium">
                      Booking #{b.id.slice(0, 8)}
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-400">
                    +€{b.totalAmount || b.dailyRate || "0"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 text-sm text-muted-foreground">
              <div className="text-center">
                <Euro className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Complete bookings to see transactions</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedMount>
  );
}
