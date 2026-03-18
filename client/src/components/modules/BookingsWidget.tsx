import React from "react";
import { ModuleConfig, useAppState } from "@/lib/store";
import { WidgetWrapper } from "./GenericWidget";
import { Calendar, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "wouter";

export default function BookingsWidget({ module }: { module: ModuleConfig }) {
  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: api.bookings.list,
  });
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: api.customers.list,
  });
  const { data: vehicles } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: api.vehicles.list,
  });

  const getCustomerName = (id: string) =>
    customers?.find((c: any) => c.id === id)?.name || "Unknown";
  const getVehicleName = (id: string) => {
    const v = vehicles?.find((v: any) => v.id === id);
    return v ? `${v.make} ${v.model}` : "Unknown";
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-400/10 text-emerald-400",
    pending: "bg-amber-400/10 text-amber-400",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-rose-400/10 text-rose-400",
  };

  if (!bookings || bookings.length === 0) {
    return (
      <WidgetWrapper module={module}>
        <div className="h-full flex flex-col items-center justify-center text-center">
          <Calendar className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground mb-2">No bookings yet</p>
          <Link href="/bookings">
            <span className="text-xs text-primary hover:underline cursor-pointer">
              Create a booking
            </span>
          </Link>
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper module={module} noPadding>
      <div className="space-y-1 overflow-y-auto">
        {bookings.slice(0, 6).map((b: any) => (
          <div
            key={b.id}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] last:border-0"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">
                {b.customerId ? getCustomerName(b.customerId) : "Walk-in"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {b.vehicleId ? getVehicleName(b.vehicleId) : "No vehicle"}
              </p>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize shrink-0 ${statusColors[b.status] || statusColors.pending}`}
            >
              {b.status}
            </span>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
