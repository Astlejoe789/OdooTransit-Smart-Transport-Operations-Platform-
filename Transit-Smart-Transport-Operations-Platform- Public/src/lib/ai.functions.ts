import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ question: z.string().trim().min(1).max(500) });

// Build 7 — AI: natural-language fleet copilot.
// Runs as the signed-in user (RLS applies), gathers a compact snapshot of the
// fleet, and asks Lovable AI to answer using only that data.
export const askFleetAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured on this project.");

    const { supabase } = context;
    const [veh, drv, trips, exp, fuel, maint] = await Promise.all([
      supabase.from("vehicles").select("label,plate,make,model,status,type,odometer"),
      supabase.from("drivers").select("full_name,status,license_expiry"),
      supabase
        .from("trips")
        .select("reference,origin,destination,status,scheduled_at,distance_km")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("expenses")
        .select("category,amount,spent_at")
        .order("spent_at", { ascending: false })
        .limit(100),
      supabase
        .from("fuel_logs")
        .select("liters,cost,filled_at")
        .order("filled_at", { ascending: false })
        .limit(100),
      supabase
        .from("maintenance_logs")
        .select("service_type,cost,service_date,next_service_date")
        .order("service_date", { ascending: false })
        .limit(50),
    ]);

    const snapshot = {
      vehicles: veh.data ?? [],
      drivers: drv.data ?? [],
      recent_trips: trips.data ?? [],
      recent_expenses: exp.data ?? [],
      recent_fuel: fuel.data ?? [],
      recent_maintenance: maint.data ?? [],
      today: new Date().toISOString().slice(0, 10),
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are TransitOps Copilot, an assistant for a fleet operations team. " +
              "Answer concisely using ONLY the JSON fleet snapshot provided by the user. " +
              "Prefer short markdown tables or bullet lists. Compute totals/averages from the data when asked. " +
              "If the snapshot lacks the answer, say so plainly. Never invent vehicles, drivers, or numbers.",
          },
          {
            role: "user",
            content: `Fleet snapshot (JSON):\n${JSON.stringify(snapshot)}\n\nQuestion: ${data.question}`,
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("The assistant is rate limited. Try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted. Add credits in workspace settings.");
    if (!res.ok) throw new Error("The assistant could not answer right now.");

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return { answer: json.choices?.[0]?.message?.content?.trim() || "I couldn't produce an answer." };
  });
