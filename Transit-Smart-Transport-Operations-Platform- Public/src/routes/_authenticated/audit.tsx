import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, ShieldAlert, Loader2, Link2 } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useAuditLogs, verifyChain, ACTION_TONE, ENTITY_LABEL } from "@/lib/audit";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/fleet/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/audit")({
  component: AuditPage,
});

function entityName(details: unknown): string {
  if (details && typeof details === "object") {
    const d = details as Record<string, unknown>;
    return (
      (d.reference as string) ||
      (d.label as string) ||
      (d.full_name as string) ||
      (d.description as string) ||
      ""
    );
  }
  return "";
}

function AuditPage() {
  const { hasAnyRole } = useAuth();
  const allowed = hasAnyRole(["admin", "manager"]);
  const { data: logs = [], isLoading, error } = useAuditLogs();

  // Newest first for display; chain is verified in chronological order.
  const chain = useMemo(() => verifyChain(logs), [logs]);
  const rows = useMemo(() => [...logs].reverse(), [logs]);

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          The audit trail is restricted to administrators and fleet managers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <ShieldCheck className="h-5.5 w-5.5" />
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold">Audit &amp; Compliance</h1>
          <p className="truncate text-sm text-muted-foreground">
            {logs.length} tamper-evident event{logs.length === 1 ? "" : "s"} on the hash chain
          </p>
        </div>
      </header>

      <Card className={chain.ok ? "border-success/40" : "border-warning/50"}>
        <CardContent className="flex items-center gap-3 p-4">
          {chain.ok ? (
            <ShieldCheck className="h-5 w-5 shrink-0 text-success" />
          ) : (
            <ShieldAlert className="h-5 w-5 shrink-0 text-warning" />
          )}
          <div className="text-sm">
            <p className="font-medium">
              {chain.ok ? "Chain integrity verified" : "Chain integrity broken"}
            </p>
            <p className="text-muted-foreground">
              {chain.ok
                ? "Every entry links to the previous one — no records have been altered or removed."
                : `A discontinuity was detected at entry #${(chain.brokenAt ?? 0) + 1}. Records may have been tampered with.`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-destructive">
              Could not load the audit trail.
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No events recorded yet. Changes to vehicles, trips, drivers, maintenance, fuel and
                expenses will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Record</TableHead>
                    <TableHead>Hash</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={r.action}
                          tone={ACTION_TONE[r.action] ?? "muted"}
                        />
                      </TableCell>
                      <TableCell className="text-sm">{ENTITY_LABEL[r.entity] ?? r.entity}</TableCell>
                      <TableCell className="max-w-[16rem] truncate text-sm text-muted-foreground">
                        {entityName(r.details) || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                          <Link2 className="h-3 w-3 shrink-0" />
                          {r.hash.slice(0, 12)}…
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
