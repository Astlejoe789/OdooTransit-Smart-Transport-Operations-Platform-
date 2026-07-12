import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Fuel, Plus, Search, Pencil, Trash2, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { useVehicles } from "@/lib/fleet";
import {
  useFuel,
  useSaveFuel,
  useDeleteFuel,
  useExpenses,
  useSaveExpense,
  useDeleteExpense,
  EXPENSE_CATEGORIES,
  currency,
  type FuelLog,
  type FuelInsert,
  type Expense,
  type ExpenseInsert,
} from "@/lib/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/_authenticated/fuel")({
  component: FuelExpensePage,
});

const NONE = "__none__";
const today = () => new Date().toISOString().slice(0, 10);

function FuelExpensePage() {
  const { hasAnyRole } = useAuth();
  const canManage = hasAnyRole(["admin", "manager", "dispatcher"]);

  return (
    <div className="space-y-6">
      <header className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent">
          <Fuel className="h-5.5 w-5.5" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold">Fuel &amp; Expenses</h1>
          <p className="truncate text-sm text-muted-foreground">Track fuel fill-ups and operating costs</p>
        </div>
      </header>

      <Tabs defaultValue="fuel">
        <TabsList>
          <TabsTrigger value="fuel">Fuel logs</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="fuel" className="mt-4">
          <FuelTab canManage={canManage} />
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <ExpenseTab canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const emptyFuel: FuelInsert = {
  vehicle_id: "",
  liters: 0,
  cost: 0,
  odometer: null,
  station: "",
  filled_at: today(),
};

function FuelTab({ canManage }: { canManage: boolean }) {
  const { data: logs = [], isLoading } = useFuel();
  const { data: vehicles = [] } = useVehicles();
  const save = useSaveFuel();
  const del = useDeleteFuel();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FuelLog | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FuelInsert>(emptyFuel);
  const [toDelete, setToDelete] = useState<FuelLog | null>(null);

  const vehicleName = (id: string) => vehicles.find((v) => v.id === id)?.label ?? "—";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(
      (l) => !q || vehicleName(l.vehicle_id).toLowerCase().includes(q) || l.station?.toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, search, vehicles]);

  const totalCost = logs.reduce((s, l) => s + Number(l.cost), 0);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyFuel, vehicle_id: vehicles[0]?.id ?? "" });
    setOpen(true);
  }
  function openEdit(l: FuelLog) {
    setEditing(l);
    setForm({
      vehicle_id: l.vehicle_id,
      liters: l.liters,
      cost: l.cost,
      odometer: l.odometer,
      station: l.station ?? "",
      filled_at: l.filled_at,
    });
    setOpen(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vehicle_id) return toast.error("Select a vehicle");
    try {
      await save.mutateAsync({ id: editing?.id, values: form });
      toast.success(editing ? "Fuel log updated" : "Fuel log added");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save fuel log");
    }
  }
  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Fuel log removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vehicle or station…" className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{currency(totalCost)}</span>
        </p>
        {canManage && (
          <Button onClick={openNew} disabled={vehicles.length === 0}>
            <Plus className="h-4 w-4" /> Add fuel log
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Fuel className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No fuel logs yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead className="text-right">Liters</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    {canManage && <TableHead className="w-20" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{vehicleName(l.vehicle_id)}</TableCell>
                      <TableCell className="text-sm">{l.filled_at}</TableCell>
                      <TableCell className="text-sm">{l.station || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{Number(l.liters).toLocaleString()} L</TableCell>
                      <TableCell className="text-right tabular-nums">{currency(l.cost)}</TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setToDelete(l)}><Trash2 className="h-4 w-4" /></Button>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit fuel log" : "Add fuel log"}</DialogTitle>
            <DialogDescription>Record a fuel fill-up.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Vehicle *</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="filled_at">Date</Label>
                <Input id="filled_at" type="date" value={form.filled_at ?? today()} onChange={(e) => setForm((f) => ({ ...f, filled_at: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="liters">Liters</Label>
                <Input id="liters" type="number" step="0.01" value={form.liters ?? 0} onChange={(e) => setForm((f) => ({ ...f, liters: Number(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fcost">Cost</Label>
                <Input id="fcost" type="number" step="0.01" value={form.cost ?? 0} onChange={(e) => setForm((f) => ({ ...f, cost: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fodo">Odometer (km)</Label>
                <Input id="fodo" type="number" value={form.odometer ?? ""} onChange={(e) => setForm((f) => ({ ...f, odometer: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="station">Station</Label>
                <Input id="station" value={form.station ?? ""} onChange={(e) => setForm((f) => ({ ...f, station: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Save changes" : "Add log"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove fuel log?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const emptyExpense: ExpenseInsert = {
  category: "other",
  amount: 0,
  description: "",
  spent_at: today(),
  vehicle_id: null,
};

function ExpenseTab({ canManage }: { canManage: boolean }) {
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: vehicles = [] } = useVehicles();
  const save = useSaveExpense();
  const del = useDeleteExpense();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ExpenseInsert>(emptyExpense);
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const vehicleName = (id: string | null) => vehicles.find((v) => v.id === id)?.label ?? "—";
  const catLabel = (c: string) => EXPENSE_CATEGORIES.find((x) => x.value === c)?.label ?? c;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((x) => !q || x.description?.toLowerCase().includes(q) || catLabel(x.category).toLowerCase().includes(q));
  }, [expenses, search]);

  const total = expenses.reduce((s, x) => s + Number(x.amount), 0);

  function openNew() {
    setEditing(null);
    setForm(emptyExpense);
    setOpen(true);
  }
  function openEdit(x: Expense) {
    setEditing(x);
    setForm({
      category: x.category,
      amount: x.amount,
      description: x.description ?? "",
      spent_at: x.spent_at,
      vehicle_id: x.vehicle_id,
    });
    setOpen(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await save.mutateAsync({ id: editing?.id, values: form });
      toast.success(editing ? "Expense updated" : "Expense added");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save expense");
    }
  }
  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Expense removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description or category…" className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{currency(total)}</span>
        </p>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> Add expense
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Receipt className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No expenses yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {canManage && <TableHead className="w-20" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell className="font-medium">{catLabel(x.category)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{x.description || "—"}</TableCell>
                      <TableCell className="text-sm">{vehicleName(x.vehicle_id)}</TableCell>
                      <TableCell className="text-sm">{x.spent_at}</TableCell>
                      <TableCell className="text-right tabular-nums">{currency(x.amount)}</TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(x)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setToDelete(x)}><Trash2 className="h-4 w-4" /></Button>
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit expense" : "Add expense"}</DialogTitle>
            <DialogDescription>Record an operating cost.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category ?? "other"} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ExpenseInsert["category"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" value={form.amount ?? 0} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="spent_at">Date</Label>
                <Input id="spent_at" type="date" value={form.spent_at ?? today()} onChange={(e) => setForm((f) => ({ ...f, spent_at: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle</Label>
                <Select value={form.vehicle_id ?? NONE} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_id: v === NONE ? null : v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edesc">Description</Label>
              <Textarea id="edesc" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? "Save changes" : "Add expense"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove expense?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
