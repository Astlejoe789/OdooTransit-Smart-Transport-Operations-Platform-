import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Route as RouteIcon, Plus, Search, Pencil, Trash2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useVehicles, useDrivers } from "@/lib/fleet";
import {
  useTrips,
  useSaveTrip,
  useDeleteTrip,
  TRIP_STATUSES,
  statusMeta,
  type Trip,
  type TripInsert,
} from "@/lib/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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

export const Route = createFileRoute("/_authenticated/trips")({
  component: TripsPage,
});

const NONE = "__none__";

function makeRef() {
  return "TR-" + Math.floor(1000 + Math.random() * 9000);
}

const empty: TripInsert = {
  reference: "",
  origin: "",
  destination: "",
  status: "scheduled",
  vehicle_id: null,
  driver_id: null,
  scheduled_at: null,
  cargo: "",
  distance_km: null,
  checklist_passed: false,
  notes: "",
};

function TripsPage() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["admin", "manager", "dispatcher"]);
  const { data: trips = [], isLoading } = useTrips();
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const save = useSaveTrip();
  const del = useDeleteTrip();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<Trip | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TripInsert>(empty);
  const [toDelete, setToDelete] = useState<Trip | null>(null);

  const vehicleName = (id: string | null) => vehicles.find((v) => v.id === id)?.label ?? "—";
  const driverName = (id: string | null) => drivers.find((d) => d.id === id)?.full_name ?? "—";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trips.filter((t) => {
      const matchesSearch =
        !q || [t.reference, t.origin, t.destination, t.cargo].some((f) => f?.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [trips, search, statusFilter]);

  function openNew() {
    setEditing(null);
    setForm({ ...empty, reference: makeRef() });
    setOpen(true);
  }

  function openEdit(t: Trip) {
    setEditing(t);
    setForm({
      reference: t.reference,
      origin: t.origin,
      destination: t.destination,
      status: t.status,
      vehicle_id: t.vehicle_id,
      driver_id: t.driver_id,
      scheduled_at: t.scheduled_at,
      cargo: t.cargo ?? "",
      distance_km: t.distance_km,
      checklist_passed: t.checklist_passed,
      notes: t.notes ?? "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.origin?.trim() || !form.destination?.trim()) {
      toast.error("Origin and destination are required");
      return;
    }
    if ((form.status === "dispatched" || form.status === "in_progress") && !form.checklist_passed) {
      toast.error("Pre-trip checklist must pass before dispatch");
      return;
    }
    try {
      const values: TripInsert = {
        ...form,
        reference: form.reference?.trim() || makeRef(),
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        completed_at: form.status === "completed" ? new Date().toISOString() : null,
      };
      await save.mutateAsync({ id: editing?.id, values });
      toast.success(editing ? "Trip updated" : "Trip created");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save trip");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Trip removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete trip");
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <RouteIcon className="h-5.5 w-5.5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">Trips &amp; Dispatch</h1>
            <p className="truncate text-sm text-muted-foreground">
              {trips.length} trip{trips.length === 1 ? "" : "s"} on the board
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openNew} className="shrink-0">
            <Plus className="h-4 w-4" /> New trip
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, origin, destination or cargo…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TRIP_STATUSES.map((s) => (
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
              <RouteIcon className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {trips.length === 0 ? "No trips yet." : "No trips match your filters."}
              </p>
              {canManage && trips.length === 0 && (
                <Button variant="outline" size="sm" onClick={openNew} className="mt-1">
                  <Plus className="h-4 w-4" /> Create your first trip
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="w-20" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-mono text-sm font-medium">{t.reference}</div>
                        <div className="text-xs text-muted-foreground">{t.cargo || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{t.origin} → {t.destination}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{vehicleName(t.vehicle_id)}</TableCell>
                      <TableCell className="text-sm">{driverName(t.driver_id)}</TableCell>
                      <TableCell>
                        <StatusBadge {...statusMeta(TRIP_STATUSES, t.status)} />
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setToDelete(t)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit trip" : "New trip"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this trip's details." : "Create and dispatch a new trip."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={form.reference ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status ?? "scheduled"}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as TripInsert["status"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIP_STATUSES.map((s) => (
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
                <Label htmlFor="origin">Origin *</Label>
                <Input
                  id="origin"
                  value={form.origin}
                  onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  value={form.destination}
                  onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vehicle</Label>
                <Select
                  value={form.vehicle_id ?? NONE}
                  onValueChange={(v) => setForm((f) => ({ ...f, vehicle_id: v === NONE ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Unassigned</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Driver</Label>
                <Select
                  value={form.driver_id ?? NONE}
                  onValueChange={(v) => setForm((f) => ({ ...f, driver_id: v === NONE ? null : v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Unassigned</SelectItem>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="scheduled">Scheduled at</Label>
                <Input
                  id="scheduled"
                  type="datetime-local"
                  value={form.scheduled_at ? form.scheduled_at.slice(0, 16) : ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={form.distance_km ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, distance_km: e.target.value ? Number(e.target.value) : null }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cargo">Cargo</Label>
              <Input
                id="cargo"
                value={form.cargo ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2.5 rounded-lg border border-border p-3 text-sm">
              <Checkbox
                checked={!!form.checklist_passed}
                onCheckedChange={(c) => setForm((f) => ({ ...f, checklist_passed: !!c }))}
              />
              Pre-trip checklist passed (required to dispatch)
            </label>
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
                {editing ? "Save changes" : "Create trip"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toDelete?.reference}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the trip. This action cannot be undone.
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
