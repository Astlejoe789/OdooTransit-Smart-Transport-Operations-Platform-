import type { AppRole } from "@/lib/auth";

export const ROLE_META: Record<AppRole, { label: string; description: string }> = {
  admin: { label: "Administrator", description: "Full access to every module and settings." },
  manager: { label: "Fleet Manager", description: "Manage vehicles, drivers, reports and maintenance." },
  dispatcher: { label: "Dispatcher", description: "Create trips and run the dispatch workflow." },
  driver: { label: "Driver", description: "View assigned trips and submit logs." },
  viewer: { label: "Viewer", description: "Read-only access to dashboards and reports." },
};

export function primaryRole(roles: AppRole[]): AppRole {
  const order: AppRole[] = ["admin", "manager", "dispatcher", "driver", "viewer"];
  return order.find((r) => roles.includes(r)) ?? "viewer";
}

export function roleLabel(role: AppRole): string {
  return ROLE_META[role]?.label ?? role;
}
