import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  TrendingUp,
  Fuel,
  ArrowUpRight,
  CircleDot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { primaryRole, roleLabel } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

interface Kpi {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
  tone: "primary" | "accent" | "success" | "warning";
}


const toneMap: Record<Kpi["tone"], string> = {
  primary: "bg-primary/12 text-primary",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
};

const ACTIVITY = [
  { icon: RouteIcon, text: "Trip #TR-2048 dispatched to Route 9 — checklist passed", time: "8m ago", tone: "success" },
  { icon: Wrench, text: "Vehicle VH-112 flagged for scheduled service", time: "34m ago", tone: "warning" },
  { icon: Fuel, text: "Fuel log added for VH-104 — 68 L", time: "1h ago", tone: "accent" },
  { icon: Truck, text: "Vehicle VH-131 marked Available after maintenance", time: "2h ago", tone: "primary" },
] as const;

function DashboardPage() {
  const { profile, user, roles } = useAuth();
  const name = profile?.full_name || user?.email?.split("@")[0] || "there";
  const role = primaryRole(roles);

  const { data: teamCount } = useQuery({
    queryKey: ["team-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: fleetStats } = useQuery({
    queryKey: ["fleet-stats"],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const [vehicles, activeVehicles, drivers, activeDrivers, activeTrips, spend] = await Promise.all([
        supabase.from("vehicles").select("id", { count: "exact", head: true }),
        supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "available"),
        supabase.from("drivers").select("id", { count: "exact", head: true }),
        supabase.from("drivers").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("trips").select("id", { count: "exact", head: true }).in("status", ["dispatched", "in_progress"]),
        supabase.from("expenses").select("amount").gte("spent_at", startOfDay.toISOString().slice(0, 10)),
      ]);
      const monthSpend = (spend.data ?? []).reduce((s, e) => s + Number(e.amount), 0);
      return {
        vehicles: vehicles.count ?? 0,
        availableVehicles: activeVehicles.count ?? 0,
        drivers: drivers.count ?? 0,
        activeDrivers: activeDrivers.count ?? 0,
        activeTrips: activeTrips.count ?? 0,
        monthSpend,
      };
    },
  });

  const kpis: Kpi[] = [
    {
      label: "Total Vehicles",
      value: String(fleetStats?.vehicles ?? 0),
      delta: `${fleetStats?.availableVehicles ?? 0} available`,
      icon: Truck,
      tone: "primary",
    },
    {
      label: "Active Drivers",
      value: String(fleetStats?.activeDrivers ?? 0),
      delta: `${fleetStats?.drivers ?? 0} on record`,
      icon: Users,
      tone: "accent",
    },
    {
      label: "Active Trips",
      value: String(fleetStats?.activeTrips ?? 0),
      delta: "dispatched or in progress",
      icon: RouteIcon,
      tone: "success",
    },
    {
      label: "Spend Today",
      value: new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(fleetStats?.monthSpend ?? 0),
      delta: "logged expenses",
      icon: TrendingUp,
      tone: "warning",
    },
  ];


  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="absolute inset-0 grid-hatch opacity-50" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{roleLabel(role)}</Badge>
              <span className="flex items-center gap-1.5 text-xs text-success">
                <CircleDot className="h-3.5 w-3.5" /> All systems operational
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              Welcome back, {name.charAt(0).toUpperCase() + name.slice(1)}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Here's the pulse of your fleet. Modules for dispatch, maintenance, fuel, and reporting
              plug into this console as they come online.
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-border bg-background/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">Workspace members</p>
            <p className="font-display text-2xl font-bold">{teamCount ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <span className={`grid h-10 w-10 place-items-center rounded-lg ${toneMap[kpi.tone]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-4 font-display text-2xl font-bold">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="mt-1 text-xs text-muted-foreground/80">{kpi.delta}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity + roadmap */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {ACTIVITY.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${toneMap[item.tone]}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm">{item.text}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
                </div>
              );
            })}
            <p className="px-2 pt-2 text-xs text-muted-foreground">
              Sample activity — live events populate once the dispatch and fleet modules are enabled.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rollout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { n: "1", label: "Foundation & Auth", done: true },
              { n: "2", label: "Fleet Management", done: true },
              { n: "3", label: "Trips & Dispatch", done: true },
              { n: "4", label: "Maintenance", done: true },
              { n: "5", label: "Fuel & Expenses", done: true },
              { n: "6", label: "Reports & Analytics", done: true },
              { n: "7", label: "AI Fleet Copilot", done: true },
              { n: "8", label: "Driver Portal", done: true },
              { n: "9", label: "Audit & Compliance", done: true },
              { n: "10", label: "Production Polish", done: true },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-3">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    step.done
                      ? "bg-success/20 text-success"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {step.n}
                </span>
                <span className={`text-sm ${step.done ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
                {step.done && <Badge variant="secondary" className="ml-auto">Live</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
