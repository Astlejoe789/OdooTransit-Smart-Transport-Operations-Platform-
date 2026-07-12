import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Plus, Search, Pencil, Trash2, Loader2, AlertTriangle, Link2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import {
  useDrivers,
  useSaveDriver,
  useDeleteDriver,
  useLinkDriver,
  useTeamProfiles,
  DRIVER_STATUSES,
  statusMeta,
  type Driver,
  type DriverInsert,
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

export const Route = createFileRoute("/_authenticated/drivers")({
  component: DriversPage,
});

const empty: DriverInsert = {
  full_name: "",
  email: "",
  phone: "",
  license_number: "",
  license_expiry: undefined,
  status: "active",
  notes: "",
};

function isExpiringSoon(date: string | null): boolean {
  if (!date) return false;
  const d = new Date(date).getTime();
  const in30 = Date.now() + 30 * 24 * 60 * 60 * 1000;
  return d < in30;
}

function DriversPage() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["admin", "manager", "dispatcher"]);
  const canLink = hasAnyRole(["admin", "manager"]);
  const { data: drivers = [], isLoading } = useDrivers();
  const save = useSaveDriver();
  const del = useDeleteDriver();
  const link = useLinkDriver();
  const { data: profiles = [] } = useTeamProfiles(canLink);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editing, setEditing] = useState<Driver | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DriverInsert>(empty);
  const [toDelete, setToDelete] = useState<Driver | null>(null);
  const [linking, setLinking] = useState<Driver | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter((d) => {
      const matchesSearch =
        !q ||
        [d.full_name, d.email, d.phone, d.license_number].some((f) => f?.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [drivers, search, statusFilter]);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  }

  function openEdit(d: Driver) {
    setEditing(d);
    setForm({
      full_name: d.full_name,
      email: d.email ?? "",
      phone: d.phone ?? "",
      license_number: d.license_number ?? "",
      license_expiry: d.license_expiry ?? undefined,
      status: d.status,
      notes: d.notes ?? "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name?.trim()) {
      toast.error("Driver name is required");
      return;
    }
    try {
      await save.mutateAsync({
        id: editing?.id,
        values: { ...form, full_name: form.full_name.trim(), license_expiry: form.license_expiry || null },
      });
      toast.success(editing ? "Driver updated" : "Driver added");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save driver");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Driver removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete driver");
    } finally {
      setToDelete(null);
    }
  }

  function openLink(d: Driver) {
    setLinking(d);
    setSelectedUser(d.user_id ?? "");
  }

  async function submitLink() {
    if (!linking) return;
    try {
      await link.mutateAsync({ id: linking.id, user_id: selectedUser || null });
      toast.success(selectedUser ? "Account linked" : "Account unlinked");
      setLinking(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update link");
    }
  }

  const profileLabel = (id: string | null) => {
    if (!id) return null;
    const p = profiles.find((x) => x.id === id);
    return p ? p.full_name || p.email || "Linked account" : "Linked account";
  };



  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
            <Users className="h-5.5 w-5.5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">Drivers</h1>
            <p className="truncate text-sm text-muted-foreground">
              {drivers.length} driver{drivers.length === 1 ? "" : "s"} on record
            </p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openNew} className="shrink-0">
            <Plus className="h-4 w-4" /> Add driver
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone or license…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {DRIVER_STATUSES.map((s) => (
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
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {drivers.length === 0 ? "No drivers yet." : "No drivers match your filters."}
              </p>
              {canManage && drivers.length === 0 && (
                <Button variant="outline" size="sm" onClick={openNew} className="mt-1">
                  <Plus className="h-4 w-4" /> Add your first driver
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                    {canManage && <TableHead className="w-28" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-medium">
                          {d.full_name}
                          {d.user_id && (
                            <span
                              title="Linked to a user account"
                              className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[0.6rem] font-medium text-success"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Portal
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{d.email || "—"}</div>
                      </TableCell>
                      <TableCell className="text-sm">{d.phone || "—"}</TableCell>
                      <TableCell className="text-sm">
                        <div className="font-mono">{d.license_number || "—"}</div>
                        {d.license_expiry && (
                          <div
                            className={
                              isExpiringSoon(d.license_expiry)
                                ? "flex items-center gap-1 text-xs text-warning"
                                : "text-xs text-muted-foreground"
                            }
                          >
                            {isExpiringSoon(d.license_expiry) && <AlertTriangle className="h-3 w-3" />}
                            exp {new Date(d.license_expiry).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge {...statusMeta(DRIVER_STATUSES, d.status)} />
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {canLink && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className={`h-8 w-8 ${d.user_id ? "text-success" : ""}`}
                                title={d.user_id ? "Manage linked account" : "Link user account"}
                                onClick={() => openLink(d)}
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(d)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setToDelete(d)}
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
            <DialogTitle>{editing ? "Edit driver" : "Add driver"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update this driver's details." : "Add a new driver to your roster."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name *</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="license_number">License #</Label>
                <Input
                  id="license_number"
                  value={form.license_number ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="license_expiry">License expiry</Label>
                <Input
                  id="license_expiry"
                  type="date"
                  value={form.license_expiry ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, license_expiry: e.target.value || undefined }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status ?? "active"}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as DriverInsert["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DRIVER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {editing ? "Save changes" : "Add driver"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {toDelete?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the driver from your roster. This action cannot be undone.
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

      <Dialog open={!!linking} onOpenChange={(o) => !o && setLinking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link {linking?.full_name} to an account</DialogTitle>
            <DialogDescription>
              Connect this driver to a user account so they can sign in and see their assigned trips
              in the Driver Portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>User account</Label>
              <Select
                value={selectedUser || "__none__"}
                onValueChange={(v) => setSelectedUser(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No account (unlink)</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || "Unnamed"} · {p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {profiles.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No user accounts found yet. People appear here after they sign up.
                </p>
              )}
            </div>
            {linking?.user_id && (
              <p className="text-xs text-muted-foreground">
                Currently linked to {profileLabel(linking.user_id)}.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setLinking(null)}>
              Cancel
            </Button>
            <Button onClick={submitLink} disabled={link.isPending}>
              {link.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
