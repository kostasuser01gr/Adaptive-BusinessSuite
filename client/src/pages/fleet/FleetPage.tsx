import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AnimatedMount } from "@/components/animation/AnimatedMount";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Car, MoreVertical, Trash2, LayoutGrid, Table2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnDef } from "@tanstack/react-table";

type ViewMode = "cards" | "table";

function AddVehicleForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    plate: "",
    color: "",
    category: "sedan",
    dailyRate: "",
    status: "available",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.vehicles.create({ ...form, dailyRate: form.dailyRate || null });
    qc.invalidateQueries({ queryKey: ["/api/vehicles"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
    onClose();
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 mb-4">
      <h3 className="font-heading font-semibold text-sm mb-4">Add Vehicle</h3>
      <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <input
          placeholder="Make *"
          required
          value={form.make}
          onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
          className="col-span-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
          data-testid="input-vehicle-make"
        />
        <input
          placeholder="Model *"
          required
          value={form.model}
          onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
          className="col-span-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
          data-testid="input-vehicle-model"
        />
        <input
          placeholder="Plate"
          value={form.plate}
          onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
          className="col-span-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
          data-testid="input-vehicle-plate"
        />
        <input
          placeholder="Color"
          value={form.color}
          onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
          className="col-span-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <input
          placeholder="Daily Rate (€)"
          type="number"
          value={form.dailyRate}
          onChange={(e) =>
            setForm((f) => ({ ...f, dailyRate: e.target.value }))
          }
          className="col-span-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
          data-testid="input-vehicle-rate"
        />
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="col-span-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs focus:outline-none"
        >
          <option value="sedan">Sedan</option>
          <option value="suv">SUV</option>
          <option value="van">Van</option>
          <option value="compact">Compact</option>
          <option value="luxury">Luxury</option>
        </select>
        <div className="col-span-2 sm:col-span-3 flex justify-end gap-2">
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
            data-testid="button-save-vehicle"
          >
            Add Vehicle
          </Button>
        </div>
      </form>
    </div>
  );
}

const statusColors: Record<string, string> = {
  available: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
  rented: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  maintenance: "bg-amber-400/10 text-amber-400 border-amber-400/20",
};

export default function FleetPage() {
  const qc = useQueryClient();
  const { data: vehicles } = useQuery({
    queryKey: ["/api/vehicles"],
    queryFn: api.vehicles.list,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState<ViewMode>("cards");

  const deleteVehicle = async (id: string) => {
    await api.vehicles.remove(id);
    qc.invalidateQueries({ queryKey: ["/api/vehicles"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const toggleStatus = async (id: string, current: string) => {
    const next =
      current === "available"
        ? "rented"
        : current === "rented"
          ? "maintenance"
          : "available";
    await api.vehicles.update(id, { status: next });
    qc.invalidateQueries({ queryKey: ["/api/vehicles"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
  };

  const columns = useMemo<ColumnDef<any, any>[]>(
    () => [
      {
        accessorKey: "make",
        header: "Make",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.make}</span>
        ),
      },
      {
        accessorKey: "model",
        header: "Model",
      },
      {
        accessorKey: "plate",
        header: "Plate",
        cell: ({ row }) => row.original.plate || "—",
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="capitalize">{row.original.category || "sedan"}</span>
        ),
      },
      {
        accessorKey: "dailyRate",
        header: "Rate",
        cell: ({ row }) =>
          row.original.dailyRate ? `€${row.original.dailyRate}/day` : "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStatus(row.original.id, row.original.status);
            }}
            className={`px-2 py-1 rounded-md text-[10px] font-medium capitalize border cursor-pointer ${statusColors[row.original.status] || statusColors.available}`}
          >
            {row.original.status}
          </button>
        ),
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        size: 50,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`Vehicle actions for ${row.original.make} ${row.original.model}`}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-popover border-white/10"
            >
              <DropdownMenuItem
                className="text-destructive text-xs cursor-pointer"
                onClick={() => deleteVehicle(row.original.id)}
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  return (
    <AnimatedMount className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1
            className="text-xl font-heading font-bold"
            data-testid="text-fleet-title"
          >
            Fleet Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {vehicles?.length || 0} vehicles in your fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-white/[0.06] bg-card/40 p-0.5">
            <button
              onClick={() => setView("cards")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                view === "cards"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Card view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
            <button
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                view === "table"
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label="Table view"
            >
              <Table2 className="h-3.5 w-3.5" />
              Table
            </button>
          </div>
          <Button
            onClick={() => setShowAdd(true)}
            size="sm"
            className="text-xs gap-1.5"
            data-testid="button-add-vehicle"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {showAdd && <AddVehicleForm onClose={() => setShowAdd(false)} />}

      {view === "table" ? (
        <DataTable
          columns={columns}
          data={vehicles || []}
          searchPlaceholder="Search vehicles..."
          enableRowSelection
        />
      ) : (
        <>
          {(!vehicles || vehicles.length === 0) ? (
            <div className="text-center py-16">
              <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                No vehicles found
              </p>
              <p className="text-xs text-muted-foreground">
                Add your first vehicle to get started.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {(vehicles || []).map((v: any) => (
                <div
                  key={v.id}
                  className="bg-card/40 border border-white/[0.04] rounded-xl p-4 flex items-center justify-between hover:border-white/[0.08] transition-colors group"
                  data-testid={`vehicle-card-${v.id}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center shrink-0">
                      <Car className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {v.make} {v.model} {v.year ? `(${v.year})` : ""}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {v.plate || "No plate"} · {v.category || "sedan"}{" "}
                        {v.dailyRate ? `· €${v.dailyRate}/day` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleStatus(v.id, v.status)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium capitalize border cursor-pointer ${statusColors[v.status] || statusColors.available}`}
                      data-testid={`vehicle-status-${v.id}`}
                    >
                      {v.status}
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          aria-label={`Vehicle actions for ${v.make} ${v.model}`}
                          data-testid={`button-vehicle-menu-${v.id}`}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-popover border-white/10"
                      >
                        <DropdownMenuItem
                          className="text-destructive text-xs cursor-pointer"
                          onClick={() => deleteVehicle(v.id)}
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AnimatedMount>
  );
}
