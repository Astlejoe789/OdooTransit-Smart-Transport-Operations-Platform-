import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Truck,
  Route as RouteIcon,
  Wrench,
  Fuel,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURES = [
  { icon: RouteIcon, title: "Trips & Dispatch", desc: "Rules-driven dispatch with an availability-aware checklist and plain-English rationale." },
  { icon: Truck, title: "Fleet Registry", desc: "Vehicles and drivers with full lifecycle status, documents, and capacity tracking." },
  { icon: Wrench, title: "Maintenance", desc: "Service reminders, records, and automatic vehicle status transitions." },
  { icon: Fuel, title: "Fuel & Expenses", desc: "Log fuel and costs, capture receipts, and read them with built-in OCR." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Utilization, ROI, and fuel efficiency with charts and CSV export." },
  { icon: ShieldCheck, title: "Audit & Compliance", desc: "Hash-chained audit log with tamper-evident compliance history." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">TransitOps</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ redirect: "/dashboard" }}>
                Get started
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-hatch opacity-40" />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Rules-driven dispatch with an auditable trail
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            The operations console
            <br />
            for <span className="text-primary">modern fleets</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Run trips, dispatch, maintenance, fuel, and compliance from one place — with a
            rules engine that explains every decision and a tamper-evident audit log.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/auth" search={{ redirect: "/dashboard" }}>
                Launch dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Role-based access", "Hash-chained audit", "AI-assisted dispatch"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">Everything, one platform</h2>
          <p className="mt-3 text-muted-foreground">
            A modular suite that grows with your operation — from a two-van shop to a national fleet.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/12 text-primary transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 text-center glow-primary">
          <div className="absolute inset-0 grid-hatch opacity-40" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold tracking-tight">Ready to take control?</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              The first account you create becomes the workspace administrator. Get your fleet online
              in minutes.
            </p>
            <Button size="lg" className="mt-7" asChild>
              <Link to="/auth" search={{ redirect: "/dashboard" }}>
                Create your workspace <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-foreground">TransitOps</span>
          </div>
          <p>© {new Date().getFullYear()} TransitOps. Fleet operations, done right.</p>
        </div>
      </footer>
    </div>
  );
}
