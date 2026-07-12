import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Wrench, Plus, Search, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useVehicles } from "@/lib/fleet";
import {
  useMaintenance,
  useSaveMaintenance,
  useDeleteMaintenance,
  MAINTENANCE_TYPES,
  currency,
  type MaintenanceLog,
  type MaintenanceInsert,
} from "@/lib/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export const Route = createFileRoute("/_authenticated/maintenance")({
  component: MaintenancePage,
});

const today = () => new Date().toISOString().slice(0, 10);

const empty: MaintenanceInsert = {
  vehicle_id: "",
  service_type: "routine",
  description: "",
  cost: 0,
  odometer: null,
  service_date: today(),
  next_service_date: null,
};

function MaintenancePage() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["admin", "manager", "dispatcher"]);
  const { data: logs = [], isLoading } = useMaintenance();
  const { data: vehicles = [] } = useVehicles();
  const save = useSaveMaintenance();
  const del = useDeleteMaintenance();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MaintenanceLog | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MaintenanceInsert>(empty);
  const [toDelete, setToDelete] = useState<MaintenanceLog | null>(null);

  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.label ?? "—";
  const typeLabel = (t: string) => MAINTENANCE_TYPES.find((m) => m.value === t)?.label ?? t;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(
      (l) =>
        !q ||
        vehicleName(l.vehicle_id).toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, search, vehicles]);

  const dueSoon = (d: string | null) => {
    if (!d) return false;
    const diff = (new Date(d).getTime() - Date.now()) / 86400000;
    return diff <= 14;
  };

  function openNew() {
    setEditing(null);
    setForm({ ...empty, vehicle_id: vehicles[0]?.id ?? "" });
    setOpen(true);
  }

  function openEdit(l: MaintenanceLog) {
    setEditing(l);
    setForm({
      vehicle_id: l.vehicle_id,
      service_type: l.service_type,
      description: l.description ?? "",
      cost: l.cost,
      odometer: l.odometer,
      service_date: l.service_date,
      next_service_date: l.next_service_date,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicle_id) {
      toast.error("Select a vehicle");
      return;
    }
    try {
      await save.mutateAsync({ id: editing?.id, values: form });
      toast.success(editing ? "Record updated" : "Service record added");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save record");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Record removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete record");
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
            <Wrench className="h-5.5 w-5.5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">Maintenance</h1>
            <p className="truncate text-sm text-muted-foreground">
              {logs.length} service record{logs.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openNew} className="shrink-0" disabled={vehicles.length === 0}>
            <Plus className="h-4 w-4" /> Log service
          </Button>
        )}
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by vehicle or description…"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Wrench className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {logs.length === 0 ? "No service records yet." : "No records match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Next due</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    {canManage && <TableHead className="w-20" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{vehicleName(l.vehicle_id)}</TableCell>
                      <TableCell>
                        <div className="text-sm">{typeLabel(l.service_type)}</div>
                        <div className="text-xs text-muted-foreground">{l.description || "—"}</div>
                      </TableCell>
                      <TableCell className="text-sm">{l.service_date}</TableCell>
                      <TableCell className="text-sm">
                        {l.next_service_date ? (
                          <span className="inline-flex items-center gap-1.5">
                            {l.next_service_date}
                            {dueSoon(l.next_service_date) && (
                              <Badge variant="outline" className="border-warning/40 text-warning">
                                <AlertTriangle className="mr-1 h-3 w-3" /> Due
                              </Badge>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{currency(l.cost)}</TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(l)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setToDelete(l)}
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
            <DialogTitle>{editing ? "Edit service record" : "Log service"}</DialogTitle>
            <DialogDescription>Record maintenance performed on a vehicle.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vehicle *</Label>
                <Select
                  value={form.vehicle_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Service type</Label>
                <Select
                  value={form.service_type ?? "routine"}
                  onValueChange={(v) => setForm((f) => ({ ...f, service_type: v as MaintenanceInsert["service_type"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="service_date">Service date</Label>
                <Input
                  id="service_date"
                  type="date"
                  value={form.service_date ?? today()}
                  onChange={(e) => setForm((f) => ({ ...f, service_date: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="next_service_date">Next due</Label>
                <Input
                  id="next_service_date"
                  type="date"
                  value={form.next_service_date ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, next_service_date: e.target.value || null }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={form.cost ?? 0}
                  onChange={(e) => setForm((f) => ({ ...f, cost: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="odometer">Odometer (km)</Label>
                <Input
                  id="odometer"
                  type="number"
                  value={form.odometer ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, odometer: e.target.value ? Number(e.target.value) : null }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Add record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove service record?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the record. This action cannot be undone.
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
