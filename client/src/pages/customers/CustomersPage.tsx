import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Users, Trash2, MoreVertical, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function AddCustomerForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    idNumber: "",
    licenseNumber: "",
    address: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.customers.create(form);
    qc.invalidateQueries({ queryKey: ["/api/customers"] });
    qc.invalidateQueries({ queryKey: ["/api/stats"] });
    onClose();
  };

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-white/[0.06] rounded-xl p-5 mb-4">
      <h3 className="font-heading font-semibold text-sm mb-4">Add Customer</h3>
      <form onSubmit={submit} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <input
          placeholder="Full Name *"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="col-span-2 sm:col-span-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
          data-testid="input-customer-name"
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
          data-testid="input-customer-email"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
          data-testid="input-customer-phone"
        />
        <input
          placeholder="ID Number"
          value={form.idNumber}
          onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))}
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
        />
        <input
          placeholder="License Number"
          value={form.licenseNumber}
          onChange={(e) =>
            setForm((f) => ({ ...f, licenseNumber: e.target.value }))
          }
          className="bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
        />
        <input
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          className="col-span-2 sm:col-span-1 bg-black/20 border border-white/[0.06] rounded-lg px-3 py-2 text-xs"
        />
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
            data-testid="button-save-customer"
          >
            Add Customer
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: api.customers.list,
  });
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = (customers || []).filter((c: any) =>
    `${c.name} ${c.email} ${c.phone}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl font-heading font-bold">Customers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {customers?.length || 0} contacts
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          size="sm"
          className="text-xs gap-1.5"
          data-testid="button-add-customer"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Customer
        </Button>
      </div>

      {showAdd && <AddCustomerForm onClose={() => setShowAdd(false)} />}

      <div className="relative mb-4">
        <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full bg-card/40 border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No customers yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c: any) => (
            <div
              key={c.id}
              className="bg-card/40 border border-white/[0.04] rounded-xl p-4 flex items-center justify-between hover:border-white/[0.08] transition-colors group"
              data-testid={`customer-card-${c.id}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {[c.email, c.phone].filter(Boolean).join(" · ") ||
                      "No contact info"}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
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
                    onClick={async () => {
                      await api.customers.remove(c.id);
                      qc.invalidateQueries({ queryKey: ["/api/customers"] });
                    }}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
