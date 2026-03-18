import React from "react";
import { useAppState } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Euro, TrendingUp, Car, Calendar } from "lucide-react";

export default function FinancialPage() {
  const { stats } = useAppState();
  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: api.bookings.list,
  });

  const completedBookings = (bookings || []).filter(
    (b: any) => b.status === "completed",
  );
  const totalRevenue = completedBookings.reduce(
    (sum: number, b: any) =>
      sum + parseFloat(b.totalAmount || b.dailyRate || "0"),
    0,
  );
  const avgBookingValue =
    completedBookings.length > 0
      ? Math.round(totalRevenue / completedBookings.length)
      : 0;

  const kpis = [
    {
      label: "Total Revenue",
      value: `€${totalRevenue.toLocaleString()}`,
      icon: Euro,
      color: "text-emerald-400 bg-emerald-400/10",
    },
    {
      label: "Completed Rentals",
      value: String(completedBookings.length),
      icon: CheckCircle,
      color: "text-blue-400 bg-blue-400/10",
    },
    {
      label: "Avg Booking Value",
      value: `€${avgBookingValue}`,
      icon: TrendingUp,
      color: "text-purple-400 bg-purple-400/10",
    },
    {
      label: "Fleet Size",
      value: String(stats?.fleet?.total || 0),
      icon: Car,
      color: "text-amber-400 bg-amber-400/10",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-xl font-heading font-bold mb-6">
        Financial Snapshot
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className="bg-card/40 border border-white/[0.04] rounded-xl p-4"
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

      {completedBookings.length > 0 ? (
        <div className="bg-card/40 border border-white/[0.04] rounded-xl p-5">
          <h2 className="text-sm font-heading font-semibold mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-2">
            {completedBookings.slice(0, 10).map((b: any) => (
              <div
                key={b.id}
                className="flex items-center justify-between px-3 py-2.5 bg-black/10 rounded-lg text-xs"
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
        </div>
      ) : (
        <div className="text-center py-16">
          <Euro className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Complete bookings to see financial data.
          </p>
        </div>
      )}
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
