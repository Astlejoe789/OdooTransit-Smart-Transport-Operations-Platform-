import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BarChart3, Truck, Fuel, Wrench, Download, TrendingUp, Route as RouteIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { useVehicles } from "@/lib/fleet";
import { useTrips, useFuel, useMaintenance, useExpenses, currency, TRIP_STATUSES } from "@/lib/ops";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const PIE_COLORS = ["oklch(0.72 0.19 55)", "oklch(0.7 0.15 200)", "oklch(0.75 0.18 145)", "oklch(0.8 0.16 85)", "oklch(0.6 0.02 250)"];

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function download(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: trips = [] } = useTrips();
  const { data: fuel = [] } = useFuel();
  const { data: maintenance = [] } = useMaintenance();
  const { data: expenses = [] } = useExpenses();

  const fuelCost = fuel.reduce((s, f) => s + Number(f.cost), 0);
  const maintCost = maintenance.reduce((s, m) => s + Number(m.cost), 0);
  const expenseCost = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCost = fuelCost + maintCost + expenseCost;
  const completedTrips = trips.filter((t) => t.status === "completed").length;

  const statusData = useMemo(
    () =>
      TRIP_STATUSES.map((s) => ({
        name: s.label,
        value: trips.filter((t) => t.status === s.value).length,
      })).filter((d) => d.value > 0),
    [trips],
  );

  const costByVehicle = useMemo(() => {
    return vehicles
      .map((v) => {
        const f = fuel.filter((x) => x.vehicle_id === v.id).reduce((s, x) => s + Number(x.cost), 0);
        const m = maintenance.filter((x) => x.vehicle_id === v.id).reduce((s, x) => s + Number(x.cost), 0);
        const e = expenses.filter((x) => x.vehicle_id === v.id).reduce((s, x) => s + Number(x.amount), 0);
        return { name: v.label, fuel: f, maintenance: m, expenses: e, total: f + m + e };
      })
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [vehicles, fuel, maintenance, expenses]);

  const kpis = [
    { label: "Completed trips", value: String(completedTrips), icon: RouteIcon, tone: "bg-success/15 text-success" },
    { label: "Fuel spend", value: currency(fuelCost), icon: Fuel, tone: "bg-accent/15 text-accent" },
    { label: "Maintenance spend", value: currency(maintCost), icon: Wrench, tone: "bg-warning/15 text-warning" },
    { label: "Total operating cost", value: currency(totalCost), icon: TrendingUp, tone: "bg-primary/12 text-primary" },
  ];

  function exportAll() {
    const rows = [
      ...fuel.map((f) => ({ type: "fuel", date: f.filled_at, vehicle: vehicles.find((v) => v.id === f.vehicle_id)?.label ?? "", amount: f.cost, detail: `${f.liters} L` })),
      ...maintenance.map((m) => ({ type: "maintenance", date: m.service_date, vehicle: vehicles.find((v) => v.id === m.vehicle_id)?.label ?? "", amount: m.cost, detail: m.service_type })),
      ...expenses.map((e) => ({ type: "expense", date: e.spent_at, vehicle: vehicles.find((v) => v.id === e.vehicle_id)?.label ?? "", amount: e.amount, detail: e.category })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1));
    download("transitops-costs.csv", toCsv(rows));
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <BarChart3 className="h-5.5 w-5.5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">Reports &amp; Analytics</h1>
            <p className="truncate text-sm text-muted-foreground">Fleet utilization and cost breakdown</p>
          </div>
        </div>
        <Button variant="outline" onClick={exportAll} className="shrink-0">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label}>
              <CardContent className="p-5">
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${k.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-display text-2xl font-bold">{k.value}</p>
                <p className="text-sm text-muted-foreground">{k.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Cost by vehicle</CardTitle>
          </CardHeader>
          <CardContent>
            {costByVehicle.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Add fuel, maintenance, or expense records to see cost breakdowns.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={costByVehicle}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 250 / 0.3)" vertical={false} />
                  <XAxis dataKey="name" stroke="oklch(0.65 0.02 250)" fontSize={12} />
                  <YAxis stroke="oklch(0.65 0.02 250)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.2 0.02 250)", border: "1px solid oklch(0.3 0.02 250)", borderRadius: 8, color: "#fff" }}
                    formatter={(v: number) => currency(v)}
                  />
                  <Bar dataKey="fuel" stackId="a" fill={PIE_COLORS[1]} name="Fuel" />
                  <Bar dataKey="maintenance" stackId="a" fill={PIE_COLORS[3]} name="Maintenance" />
                  <Bar dataKey="expenses" stackId="a" fill={PIE_COLORS[0]} name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trips by status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                No trips recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "oklch(0.2 0.02 250)", border: "1px solid oklch(0.3 0.02 250)", borderRadius: 8, color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-4 w-4" /> Fleet summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryStat label="Vehicles" value={vehicles.length} />
          <SummaryStat label="Total trips" value={trips.length} />
          <SummaryStat label="Fuel logs" value={fuel.length} />
          <SummaryStat label="Service records" value={maintenance.length} />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-4">
      <p className="font-display text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
