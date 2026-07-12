import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Fuel,
  BarChart3,
  ShieldCheck,
  IdCard,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type AppRole } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  roles?: AppRole[];
  soon?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
      { label: "Trips & Dispatch", icon: RouteIcon, to: "/trips", roles: ["admin", "manager", "dispatcher", "driver", "viewer"] },
      { label: "Fleet Copilot", icon: Sparkles, to: "/assistant", roles: ["admin", "manager", "dispatcher", "viewer"] },
    ],
  },
  {
    title: "Fleet",
    items: [
      { label: "Vehicles", icon: Truck, to: "/vehicles" },
      { label: "Drivers", icon: Users, to: "/drivers" },
      { label: "Maintenance", icon: Wrench, to: "/maintenance" },
      { label: "Fuel & Expenses", icon: Fuel, to: "/fuel" },
    ],
  },
  {
    title: "Insights",
    items: [
      { label: "Reports", icon: BarChart3, to: "/reports", roles: ["admin", "manager", "viewer"] },
      { label: "Audit & Compliance", icon: ShieldCheck, to: "/audit", roles: ["admin", "manager"] },
      { label: "Driver Portal", icon: IdCard, to: "/portal", roles: ["admin", "driver", "manager", "dispatcher"] },
    ],
  },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { hasAnyRole } = useAuth();

  const canSee = (item: NavItem) => !item.roles || hasAnyRole(item.roles);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Truck className="h-5 w-5" />
        </span>
        <span className="font-display text-lg font-bold tracking-tight">TransitOps</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV.map((group) => {
          const visible = group.items.filter(canSee);
          if (visible.length === 0) return null;
          return (
            <div key={group.title}>
              <p className="px-3 pb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <ul className="space-y-1">
                {visible.map((item) => {
                  const active = item.to && location.pathname === item.to;
                  const Icon = item.icon;
                  const base =
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
                  if (item.soon || !item.to) {
                    return (
                      <li key={item.label}>
                        <span
                          className={cn(
                            base,
                            "cursor-not-allowed text-muted-foreground/70",
                          )}
                        >
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          <Badge variant="outline" className="h-5 border-sidebar-border px-1.5 text-[0.6rem] text-muted-foreground">
                            Soon
                          </Badge>
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        onClick={onNavigate}
                        className={cn(
                          base,
                          active
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-4">
        <p className="text-[0.65rem] leading-relaxed text-muted-foreground">
          All modules live — fleet, dispatch, maintenance, fuel, reports, AI copilot, driver portal &amp; audit.
        </p>
      </div>
    </div>
  );
}
