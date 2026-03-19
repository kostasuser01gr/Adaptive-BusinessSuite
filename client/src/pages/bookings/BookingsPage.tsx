import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, CheckCircle2 } from "lucide-react";

function NewBookingForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: vehicles } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: api.vehicles.list,
  });
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: api.customers.list,
  });
  const [form, setForm] = useState({
    vehicleId: "",
    customerId: "",
    startDate: "",
    endDate: "",
    dailyRate: "",
    deposit: "",
    notes: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.bookings.create({
      ...form,
      status: "active",
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      dailyRate: form.dailyRate || null,
      deposit: form.deposit || null,
    });
    qc.invalidateQueries({ queryKey: ["/api/bookings"] });
    qc.invalidateQueries({ queryKey: ["/api/vehicles"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
    onClose();
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 mb-4">
      <h3 className="font-heading font-semibold text-sm mb-4">New Booking</h3>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        <select
          value={form.vehicleId}
          onChange={(e) =>
            setForm((f) => ({ ...f, vehicleId: e.target.value }))
          }
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
          data-testid="select-booking-vehicle"
        >
          <option value="">Select Vehicle</option>
          {(vehicles || [])
            .filter((v: any) => v.status === "available")
            .map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.make} {v.model} ({v.plate})
              </option>
            ))}
        </select>
        <select
          value={form.customerId}
          onChange={(e) =>
            setForm((f) => ({ ...f, customerId: e.target.value }))
          }
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
          data-testid="select-booking-customer"
        >
          <option value="">Select Customer</option>
          {(customers || []).map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, startDate: e.target.value }))
          }
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
          data-testid="input-booking-start"
        />
        <input
          type="date"
          value={form.endDate}
          onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
          data-testid="input-booking-end"
        />
        <input
          type="number"
          placeholder="Daily Rate (€)"
          value={form.dailyRate}
          onChange={(e) =>
            setForm((f) => ({ ...f, dailyRate: e.target.value }))
          }
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
        />
        <input
          type="number"
          placeholder="Deposit (€)"
          value={form.deposit}
          onChange={(e) => setForm((f) => ({ ...f, deposit: e.target.value }))}
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
        />
        <div className="col-span-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            className="text-xs"
            data-testid="button-save-booking"
          >
            Create Booking
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function BookingsPage() {
  const qc = useQueryClient();
  const { data: bookings } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: api.bookings.list,
  });
  const { data: vehicles } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: api.vehicles.list,
  });
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: api.customers.list,
  });
  const [showAdd, setShowAdd] = useState(false);

  const getCustomerName = (id: string) =>
    customers?.find((c: any) => c.id === id)?.name || "Walk-in";
  const getVehicleName = (id: string) => {
    const v = vehicles?.find((v: any) => v.id === id);
    return v ? `${v.make} ${v.model}` : "-";
  };

  const statusColors: Record<string, string> = {
    active: "bg-emerald-400/10 text-emerald-400",
    pending: "bg-amber-400/10 text-amber-400",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-rose-400/10 text-rose-400",
  };

  const completeBooking = async (id: string) => {
    await api.bookings.update(id, { status: "completed" });
    qc.invalidateQueries({ queryKey: ["/api/bookings"] });
    qc.invalidateQueries({ queryKey: ["/api/vehicles"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1
            className="text-xl font-heading font-bold"
            data-testid="text-bookings-title"
          >
            Bookings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {bookings?.length || 0} total bookings
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          size="sm"
          className="text-xs gap-1.5"
          data-testid="button-add-booking"
        >
          <Plus className="h-3.5 w-3.5" />
          New Booking
        </Button>
      </div>

      {showAdd && <NewBookingForm onClose={() => setShowAdd(false)} />}

      {!bookings || bookings.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No bookings yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {bookings.map((b: any) => (
            <div
              key={b.id}
              className="bg-card/40 border border-white/[0.04] rounded-xl p-4 flex items-center justify-between hover:border-white/[0.08] transition-colors"
              data-testid={`booking-card-${b.id}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {b.customerId ? getCustomerName(b.customerId) : "Walk-in"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {b.vehicleId ? getVehicleName(b.vehicleId) : "No vehicle"}{" "}
                  {b.startDate
                    ? `· ${new Date(b.startDate).toLocaleDateString()}`
                    : ""}
                  {b.endDate
                    ? ` → ${new Date(b.endDate).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {b.dailyRate && (
                  <span className="text-xs text-muted-foreground">
                    €{b.dailyRate}/day
                  </span>
                )}
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-medium capitalize ${statusColors[b.status] || statusColors.pending}`}
                >
                  {b.status}
                </span>
                {b.status === "active" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-white/10 gap-1"
                    onClick={() => completeBooking(b.id)}
                    data-testid={`button-complete-${b.id}`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Return
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
