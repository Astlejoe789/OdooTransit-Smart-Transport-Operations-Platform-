import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type VehicleInsert = Database["public"]["Tables"]["vehicles"]["Insert"];
export type Driver = Database["public"]["Tables"]["drivers"]["Row"];
export type DriverInsert = Database["public"]["Tables"]["drivers"]["Insert"];

export type VehicleStatus = Database["public"]["Enums"]["vehicle_status"];
export type VehicleType = Database["public"]["Enums"]["vehicle_type"];
export type DriverStatus = Database["public"]["Enums"]["driver_status"];

export const VEHICLE_STATUSES: { value: VehicleStatus; label: string; tone: string }[] = [
  { value: "available", label: "Available", tone: "success" },
  { value: "on_trip", label: "On Trip", tone: "accent" },
  { value: "in_shop", label: "In Shop", tone: "warning" },
  { value: "retired", label: "Retired", tone: "muted" },
];

export const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "van", label: "Van" },
  { value: "truck", label: "Truck" },
  { value: "car", label: "Car" },
  { value: "bus", label: "Bus" },
  { value: "trailer", label: "Trailer" },
  { value: "other", label: "Other" },
];

export const DRIVER_STATUSES: { value: DriverStatus; label: string; tone: string }[] = [
  { value: "active", label: "Active", tone: "success" },
  { value: "off_duty", label: "Off Duty", tone: "muted" },
  { value: "suspended", label: "Suspended", tone: "warning" },
];

export function statusMeta<T extends { value: string; tone: string; label: string }>(
  list: T[],
  value: string,
) {
  return list.find((s) => s.value === value) ?? { label: value, tone: "muted", value };
}

// ---- Vehicles ----
export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: VehicleInsert }) => {
      if (id) {
        const { error } = await supabase.from("vehicles").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

// ---- Drivers ----
export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: async (): Promise<Driver[]> => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: DriverInsert }) => {
      if (id) {
        const { error } = await supabase.from("drivers").update(values).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("drivers").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

// Link (or unlink) a driver record to a user account so that person's
// Driver Portal shows their assigned trips. Admin/manager/dispatcher only (RLS).
export function useLinkDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, user_id }: { id: string; user_id: string | null }) => {
      const { error } = await supabase.from("drivers").update({ user_id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

export type TeamProfile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "email" | "full_name"
>;

// Admins and managers can read all profiles (RLS policy) to link driver accounts.
export function useTeamProfiles(enabled: boolean) {
  return useQuery({
    queryKey: ["team-profiles"],
    enabled,
    queryFn: async (): Promise<TeamProfile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
