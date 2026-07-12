import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

// Build 9 — Audit & Compliance.
// Fetch the full hash-chained trail in chronological order so the chain can be
// verified link-by-link (each row's prev_hash must equal the previous row's hash).
export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit_logs"],
    queryFn: async (): Promise<AuditLog[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface ChainStatus {
  ok: boolean;
  brokenAt: number | null;
}

// Structural integrity check: verify the chain is continuous. A broken link
// (prev_hash not matching the preceding row's hash) indicates tampering.
export function verifyChain(logs: AuditLog[]): ChainStatus {
  for (let i = 1; i < logs.length; i++) {
    if (logs[i].prev_hash !== logs[i - 1].hash) {
      return { ok: false, brokenAt: i };
    }
  }
  return { ok: true, brokenAt: null };
}

export const ACTION_TONE: Record<string, string> = {
  INSERT: "success",
  UPDATE: "accent",
  DELETE: "warning",
};

export const ENTITY_LABEL: Record<string, string> = {
  trips: "Trip",
  vehicles: "Vehicle",
  drivers: "Driver",
  maintenance_logs: "Maintenance",
  fuel_logs: "Fuel log",
  expenses: "Expense",
};
