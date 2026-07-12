import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IdCard, Loader2, MapPin, CheckCircle2, Fuel } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useVehicles } from "@/lib/fleet";
import {
  useSaveTrip,
  useSaveFuel,
  TRIP_STATUSES,
  statusMeta,
  type Trip,
  type FuelInsert,
} from "@/lib/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/fleet/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/portal")({
  component: DriverPortalPage,
});

function DriverPortalPage() {
  const { user } = useAuth();
  const { data: vehicles = [] } = useVehicles();
  const saveTrip = useSaveTrip();
  const saveFuel = useSaveFuel();

  const { data: driver, isLoading: driverLoading } = useQuery({
    queryKey: ["my-driver", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["my-trips", driver?.id],
    enabled: !!driver,
    queryFn: async (): Promise<Trip[]> => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("driver_id", driver!.id)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [fuelTrip, setFuelTrip] = useState<Trip | null>(null);
  const [fuel, setFuel] = useState({ liters: "", cost: "", odometer: "", station: "" });

  const vehicleName = (id: string | null) => vehicles.find((v) => v.id === id)?.label ?? "—";
  const active = useMemo(
    () => trips.filter((t) => t.status !== "completed" && t.status !== "cancelled"),
    [trips],
  );

  async function advance(trip: Trip, status: Trip["status"], checklist?: boolean) {
    if ((status === "dispatched" || status === "in_progress") && !(checklist ?? trip.checklist_passed)) {
      toast.error("Complete the pre-trip checklist first.");
      return;
    }
    try {
      await saveTrip.mutateAsync({
        id: trip.id,
        values: {
          reference: trip.reference,
          origin: trip.origin,
          destination: trip.destination,
          status,
          checklist_passed: checklist ?? trip.checklist_passed,
          completed_at: status === "completed" ? new Date().toISOString() : trip.completed_at,
        },
      });
      toast.success("Trip updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update trip");
    }
  }

  async function submitFuel(e: React.FormEvent) {
    e.preventDefault();
    if (!fuelTrip || !fuelTrip.vehicle_id) return;
    if (!fuel.liters || !fuel.cost) {
      toast.error("Litres and cost are required");
      return;
    }
    try {
      const values: FuelInsert = {
        vehicle_id: fuelTrip.vehicle_id,
        liters: Number(fuel.liters),
        cost: Number(fuel.cost),
        odometer: fuel.odometer ? Number(fuel.odometer) : null,
        station: fuel.station || null,
        filled_at: new Date().toISOString().slice(0, 10),
        created_by: user?.id ?? null,
      };
      await saveFuel.mutateAsync({ values });
      toast.success("Fuel log submitted");
      setFuelTrip(null);
      setFuel({ liters: "", cost: "", odometer: "", station: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit fuel log");
    }
  }

  if (driverLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <IdCard className="h-8 w-8 text-muted-foreground/50" />
        <p className="max-w-sm text-sm text-muted-foreground">
          Your account isn't linked to a driver profile yet. Ask a dispatcher or manager to link
          your driver record so your assigned trips appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <IdCard className="h-5.5 w-5.5" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold">Driver Portal</h1>
          <p className="truncate text-sm text-muted-foreground">
            {driver.full_name} · {active.length} active assignment{active.length === 1 ? "" : "s"}
          </p>
        </div>
      </header>

      {tripsLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No trips assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((t) => (
            <Card key={t.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-mono text-sm">{t.reference}</CardTitle>
                <StatusBadge {...statusMeta(TRIP_STATUSES, t.status)} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {t.origin} → {t.destination}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vehicle: {vehicleName(t.vehicle_id)}
                  {t.scheduled_at && ` · ${new Date(t.scheduled_at).toLocaleString()}`}
                </p>

                {t.status !== "completed" && t.status !== "cancelled" && (
                  <>
                    <label className="flex items-center gap-2.5 rounded-lg border border-border p-2.5 text-sm">
                      <Checkbox
                        checked={!!t.checklist_passed}
                        onCheckedChange={(c) => advance(t, t.status, !!c)}
                        disabled={saveTrip.isPending}
                      />
                      Pre-trip checklist passed
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {t.status === "scheduled" && (
                        <Button size="sm" onClick={() => advance(t, "dispatched")} disabled={saveTrip.isPending}>
                          Accept &amp; dispatch
                        </Button>
                      )}
                      {t.status === "dispatched" && (
                        <Button size="sm" onClick={() => advance(t, "in_progress")} disabled={saveTrip.isPending}>
                          Start trip
                        </Button>
                      )}
                      {t.status === "in_progress" && (
                        <Button size="sm" onClick={() => advance(t, "completed")} disabled={saveTrip.isPending}>
                          <CheckCircle2 className="h-4 w-4" /> Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFuelTrip(t)}
                        disabled={!t.vehicle_id}
                      >
                        <Fuel className="h-4 w-4" /> Log fuel
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!fuelTrip} onOpenChange={(o) => !o && setFuelTrip(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Log fuel</DialogTitle>
            <DialogDescription>
              Record a fill-up for {fuelTrip ? vehicleName(fuelTrip.vehicle_id) : ""}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitFuel} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="liters">Litres *</Label>
                <Input
                  id="liters"
                  type="number"
                  step="0.1"
                  value={fuel.liters}
                  onChange={(e) => setFuel((f) => ({ ...f, liters: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Cost *</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={fuel.cost}
                  onChange={(e) => setFuel((f) => ({ ...f, cost: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="odometer">Odometer</Label>
                <Input
                  id="odometer"
                  type="number"
                  value={fuel.odometer}
                  onChange={(e) => setFuel((f) => ({ ...f, odometer: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="station">Station</Label>
                <Input
                  id="station"
                  value={fuel.station}
                  onChange={(e) => setFuel((f) => ({ ...f, station: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFuelTrip(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveFuel.isPending}>
                {saveFuel.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
