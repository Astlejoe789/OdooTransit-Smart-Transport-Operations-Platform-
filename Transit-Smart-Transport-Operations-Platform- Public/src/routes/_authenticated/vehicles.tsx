import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Truck, Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import {
  useVehicles,
  useSaveVehicle,
  useDeleteVehicle,
  VEHICLE_STATUSES,
  VEHICLE_TYPES,
  statusMeta,
  type Vehicle,
  type VehicleInsert,
} from "@/lib/fleet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/fleet/StatusBadge";

export const Route = createFileRoute("/_authenticated/vehicles")({
  component: VehiclesPage,
});

const empty: VehicleInsert = {
  label: "",
  plate: "",
  make: "",
  model: "",
  year: undefined,
  type: "van",
  status: "available",
  odometer: 0,
  capacity: undefined,
  notes: "",
};

function VehiclesPage() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["admin", "manager", "dispatcher"]);
  const { data: vehicles = [], isLoading } = useVehicles();
  const save = useSaveVehicle();
  const del = useDeleteVehicle();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<VehicleInsert>(empty);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      const matchesSearch =
        !q ||
        [v.label, v.plate, v.make, v.model].some((f) => f?.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      label: v.label,
      plate: v.plate ?? "",
      make: v.make ?? "",
      model: v.model ?? "",
      year: v.year ?? undefined,
      type: v.type,
      status: v.status,
      odometer: v.odometer,
      capacity: v.capacity ?? undefined,
      notes: v.notes ?? "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label?.trim()) {
      toast.error("Vehicle name is required");
      return;
    }
    try {
      await save.mutateAsync({ id: editing?.id, values: { ...form, label: form.label.trim() } });
      toast.success(editing ? "Vehicle updated" : "Vehicle added");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save vehicle");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Vehicle removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete vehicle");
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <Truck className="h-5.5 w-5.5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">Vehicles</h1>
            <p className="truncate text-sm text-muted-foreground">
              {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} in your fleet registry
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openNew} className="shrink-0">
            <Plus className="h-4 w-4" /> Add vehicle
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, plate, make or model…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {VEHICLE_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Truck className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {vehicles.length === 0 ? "No vehicles yet." : "No vehicles match your filters."}
              </p>
              {canManage && vehicles.length === 0 && (
                <Button variant="outline" size="sm" onClick={openNew} className="mt-1">
                  <Plus className="h-4 w-4" /> Add your first vehicle
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Odometer</TableHead>
                    {canManage && <TableHead className="w-20" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => {
                    const type = VEHICLE_TYPES.find((t) => t.value === v.type)?.label ?? v.type;
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="font-medium">{v.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {[v.year, v.make, v.model].filter(Boolean).join(" ") || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{v.plate || "—"}</TableCell>
                        <TableCell className="text-sm">{type}</TableCell>
                        <TableCell>
                          <StatusBadge {...statusMeta(VEHICLE_STATUSES, v.status)} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {v.odometer.toLocaleString()} km
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(v)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setToDelete(v)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this vehicle's details." : "Register a new vehicle in your fleet."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="label">Name / label *</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="VH-101"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="plate">Plate</Label>
                <Input
                  id="plate"
                  value={form.plate ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, plate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={form.year ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  value={form.make ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={form.model ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type ?? "van"}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as VehicleInsert["type"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status ?? "available"}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as VehicleInsert["status"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="odometer">Odometer (km)</Label>
                <Input
                  id="odometer"
                  type="number"
                  value={form.odometer ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, odometer: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={form.capacity ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: e.target.value ? Number(e.target.value) : undefined }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Add vehicle"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toDelete?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the vehicle from your registry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
