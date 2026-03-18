import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Wrench, CheckCircle2 } from "lucide-react";

export default function MaintenancePage() {
  const qc = useQueryClient();
  const { data: records } = useQuery({
    queryKey: ["/api/maintenance"],
    queryFn: api.maintenance.list,
  });
  const { data: vehicles } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: api.vehicles.list,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "",
    type: "service",
    description: "",
    cost: "",
    scheduledDate: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.maintenance.create({
      ...form,
      status: "scheduled",
      cost: form.cost || null,
      scheduledDate: form.scheduledDate
        ? new Date(form.scheduledDate).toISOString()
        : null,
    });
    if (form.vehicleId)
      await api.vehicles.update(form.vehicleId, { status: "maintenance" });
    qc.invalidateQueries({ queryKey: ["/api/maintenance"] });
    qc.invalidateQueries({ queryKey: ["/api/vehicles"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
    setShowAdd(false);
    setForm({
      vehicleId: "",
      type: "service",
      description: "",
      cost: "",
      scheduledDate: "",
    });
  };

  const complete = async (id: string, vehicleId: string | null) => {
    await api.maintenance.update(id, {
      status: "completed",
      completedDate: new Date().toISOString(),
    });
    if (vehicleId)
      await api.vehicles.update(vehicleId, { status: "available" });
    qc.invalidateQueries({ queryKey: ["/api/maintenance"] });
    qc.invalidateQueries({ queryKey: ["/api/vehicles"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const getVehicleName = (id: string) => {
    const v = vehicles?.find((v: any) => v.id === id);
    return v ? `${v.make} ${v.model}` : "-";
  };
  const statusColors: Record<string, string> = {
    scheduled: "bg-amber-400/10 text-amber-400",
    "in-progress": "bg-blue-400/10 text-blue-400",
    completed: "bg-emerald-400/10 text-emerald-400",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-heading font-bold">Maintenance</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {records?.length || 0} records
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          size="sm"
          className="text-xs gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Log Service
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card/60 border border-white/[0.06] rounded-xl p-5 mb-4">
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <select
              value={form.vehicleId}
              onChange={(e) =>
                setForm((f) => ({ ...f, vehicleId: e.target.value }))
              }
              className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
            >
              <option value="">Select Vehicle</option>
              {(vehicles || []).map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model}
                </option>
              ))}
            </select>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
            >
              <option value="service">Service</option>
              <option value="repair">Repair</option>
              <option value="tire">Tire Change</option>
              <option value="inspection">Inspection</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="col-span-2 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
            />
            <input
              type="number"
              placeholder="Cost (€)"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
            />
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, scheduledDate: e.target.value }))
              }
              className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
            />
            <div className="col-span-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdd(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="text-xs">
                Log Service
              </Button>
            </div>
          </form>
        </div>
      )}

      {!records || records.length === 0 ? (
        <div className="text-center py-16">
          <Wrench className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No maintenance records
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {records.map((r: any) => (
            <div
              key={r.id}
              className="bg-card/40 border border-white/[0.04] rounded-xl p-4 flex items-center justify-between hover:border-white/[0.08] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                  <Wrench className="h-4 w-4 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium capitalize">
                    {r.type}
                    {r.vehicleId ? ` — ${getVehicleName(r.vehicleId)}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {r.description || "No details"}{" "}
                    {r.cost ? `· €${r.cost}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-medium capitalize ${statusColors[r.status] || ""}`}
                >
                  {r.status}
                </span>
                {r.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-white/10 gap-1"
                    onClick={() => complete(r.id, r.vehicleId)}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Done
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
