-- ========== Build 9: Audit & Compliance (hash-chained audit log) ==========
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  details jsonb,
  prev_hash text,
  hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins and managers may read the compliance trail
CREATE POLICY "Admins and managers can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- Writes only happen through the SECURITY DEFINER trigger; block direct client inserts
CREATE POLICY "No direct client inserts to audit logs"
  ON public.audit_logs AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);

-- Hash-chaining trigger: each row hashes the previous row's hash + its own payload
CREATE OR REPLACE FUNCTION public.write_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_prev text;
  v_entity_id uuid;
  v_action text;
  v_details jsonb;
  v_hash text;
BEGIN
  v_action := TG_OP;
  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.id;
    v_details := to_jsonb(OLD);
  ELSE
    v_entity_id := NEW.id;
    v_details := to_jsonb(NEW);
  END IF;

  SELECT hash INTO v_prev FROM public.audit_logs ORDER BY created_at DESC, id DESC LIMIT 1;

  v_hash := encode(
    digest(
      coalesce(v_prev, '') || TG_TABLE_NAME || v_action ||
      coalesce(v_entity_id::text, '') || coalesce(v_details::text, ''),
      'sha256'
    ),
    'hex'
  );

  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details, prev_hash, hash)
  VALUES (auth.uid(), v_action, TG_TABLE_NAME, v_entity_id, v_details, v_prev, v_hash);

  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_trips AFTER INSERT OR UPDATE OR DELETE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_vehicles AFTER INSERT OR UPDATE OR DELETE ON public.vehicles FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_drivers AFTER INSERT OR UPDATE OR DELETE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_maintenance AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_logs FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_fuel AFTER INSERT OR UPDATE OR DELETE ON public.fuel_logs FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.write_audit();

-- ========== Build 8: Driver Portal write access ==========
-- Drivers can update the status/checklist of trips assigned to them
CREATE POLICY "Drivers can update their assigned trips"
  ON public.trips FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = trips.driver_id AND d.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.drivers d WHERE d.id = trips.driver_id AND d.user_id = auth.uid()));

-- Drivers can submit their own fuel logs (receipt/odometer entry)
CREATE POLICY "Drivers can submit fuel logs"
  ON public.fuel_logs FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_role(auth.uid(), 'driver'));