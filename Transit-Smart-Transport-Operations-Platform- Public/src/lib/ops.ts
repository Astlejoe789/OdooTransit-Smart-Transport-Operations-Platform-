import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// ---- Types ----
export type Trip = Database["public"]["Tables"]["trips"]["Row"];
export type TripInsert = Database["public"]["Tables"]["trips"]["Insert"];
export type MaintenanceLog = Database["public"]["Tables"]["maintenance_logs"]["Row"];
export type MaintenanceInsert = Database["public"]["Tables"]["maintenance_logs"]["Insert"];
export type FuelLog = Database["public"]["Tables"]["fuel_logs"]["Row"];
export type FuelInsert = Database["public"]["Tables"]["fuel_logs"]["Insert"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];

export type TripStatus = Database["public"]["Enums"]["trip_status"];
export type MaintenanceType = Database["public"]["Enums"]["maintenance_type"];
export type ExpenseCategory = Database["public"]["Enums"]["expense_category"];

export const TRIP_STATUSES: { value: TripStatus; label: string; tone: string }[] = [
  { value: "scheduled", label: "Scheduled", tone: "muted" },
  { value: "dispatched", label: "Dispatched", tone: "accent" },
  { value: "in_progress", label: "In Progress", tone: "primary" },
  { value: "completed", label: "Completed", tone: "success" },
  { value: "cancelled", label: "Cancelled", tone: "warning" },
];

export const MAINTENANCE_TYPES: { value: MaintenanceType; label: string }[] = [
  { value: "routine", label: "Routine service" },
  { value: "repair", label: "Repair" },
  { value: "inspection", label: "Inspection" },
  { value: "tire", label: "Tires" },
  { value: "oil_change", label: "Oil change" },
  { value: "other", label: "Other" },
];

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "toll", label: "Toll" },
  { value: "parking", label: "Parking" },
  { value: "insurance", label: "Insurance" },
  { value: "registration", label: "Registration" },
  { value: "repair", label: "Repair" },
  { value: "supplies", label: "Supplies" },
  { value: "other", label: "Other" },
];

export function statusMeta<T extends { value: string; tone: string; label: string }>(
  list: T[],
  value: string,
) {
  return list.find((s) => s.value === value) ?? { label: value, tone: "muted", value };
}

// Generic CRUD factory for a table with { id, values } mutation shape.
type TableName = "trips" | "maintenance_logs" | "fuel_logs" | "expenses";

function makeCrud<Row, Insert>(table: TableName, key: string, orderCol: string) {
  function useList() {
    return useQuery({
      queryKey: [key],
      queryFn: async (): Promise<Row[]> => {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .order(orderCol, { ascending: false });
        if (error) throw error;
        return (data ?? []) as Row[];
      },
    });
  }
  function useSave() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, values }: { id?: string; values: Insert }) => {
        if (id) {
          const { error } = await supabase.from(table).update(values as never).eq("id", id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(table).insert(values as never);
          if (error) throw error;
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    });
  }
  function useRemove() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    });
  }
  return { useList, useSave, useRemove };
}

const tripsCrud = makeCrud<Trip, TripInsert>("trips", "trips", "created_at");
export const useTrips = tripsCrud.useList;
export const useSaveTrip = tripsCrud.useSave;
export const useDeleteTrip = tripsCrud.useRemove;

const maintCrud = makeCrud<MaintenanceLog, MaintenanceInsert>(
  "maintenance_logs",
  "maintenance_logs",
  "service_date",
);
export const useMaintenance = maintCrud.useList;
export const useSaveMaintenance = maintCrud.useSave;
export const useDeleteMaintenance = maintCrud.useRemove;

const fuelCrud = makeCrud<FuelLog, FuelInsert>("fuel_logs", "fuel_logs", "filled_at");
export const useFuel = fuelCrud.useList;
export const useSaveFuel = fuelCrud.useSave;
export const useDeleteFuel = fuelCrud.useRemove;

const expenseCrud = makeCrud<Expense, ExpenseInsert>("expenses", "expenses", "spent_at");
export const useExpenses = expenseCrud.useList;
export const useSaveExpense = expenseCrud.useSave;
export const useDeleteExpense = expenseCrud.useRemove;

export function currency(n: number | null | undefined) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n ?? 0);
}
