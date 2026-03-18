import React from "react";
import { ModuleConfig, useAppState } from "@/lib/store";
import { WidgetWrapper } from "./GenericWidget";
import { Car, Wrench, CheckCircle2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "wouter";

export default function FleetWidget({ module }: { module: ModuleConfig }) {
  const { stats } = useAppState();
  const { data: vehicles } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: api.vehicles.list,
  });
  const fleet = stats?.fleet || {
    total: 0,
    available: 0,
    rented: 0,
    maintenance: 0,
  };

  const statItems = [
    {
      label: "Available",
      value: fleet.available,
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-400/10",
    },
    {
      label: "Rented",
      value: fleet.rented,
      icon: Car,
      color: "text-blue-400 bg-blue-400/10",
    },
    {
      label: "Service",
      value: fleet.maintenance,
      icon: Wrench,
      color: "text-amber-400 bg-amber-400/10",
    },
  ];

  return (
    <WidgetWrapper module={module}>
      <div className="flex flex-col h-full gap-3">
        <div className="grid grid-cols-3 gap-2">
          {statItems.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="bg-black/20 border border-white/[0.04] rounded-lg p-2.5 flex flex-col items-center text-center"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 ${s.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="text-lg font-heading font-bold">{s.value}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {fleet.total > 0 && (
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-muted-foreground">Utilization</span>
              <span className="text-primary font-semibold">
                {stats?.utilization || 0}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${stats?.utilization || 0}%` }}
              />
            </div>
          </div>
        )}

        {fleet.total === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground mb-2">
              No vehicles yet
            </p>
            <Link href="/fleet">
              <span className="text-xs text-primary hover:underline cursor-pointer">
                Add your first vehicle
              </span>
            </Link>
          </div>
        )}

        {vehicles && vehicles.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-1">
            {vehicles.slice(0, 4).map((v: any) => (
              <div
                key={v.id}
                className="flex items-center justify-between px-2 py-1.5 bg-black/10 rounded-lg text-xs"
              >
                <span className="font-medium truncate">
                  {v.make} {v.model}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${
                    v.status === "available"
                      ? "bg-emerald-400/10 text-emerald-400"
                      : v.status === "rented"
                        ? "bg-blue-400/10 text-blue-400"
                        : "bg-amber-400/10 text-amber-400"
                  }`}
                >
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}
