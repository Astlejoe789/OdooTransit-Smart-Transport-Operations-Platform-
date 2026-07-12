-- Enums
CREATE TYPE public.vehicle_status AS ENUM ('available', 'on_trip', 'in_shop', 'retired');
CREATE TYPE public.vehicle_type AS ENUM ('van', 'truck', 'car', 'bus', 'trailer', 'other');
CREATE TYPE public.driver_status AS ENUM ('active', 'off_duty', 'suspended');

-- Helper: can the current user manage fleet data?
CREATE OR REPLACE FUNCTION public.can_manage_fleet(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::public.app_role)
      OR public.has_role(_user_id, 'manager'::public.app_role)
      OR public.has_role(_user_id, 'dispatcher'::public.app_role)
$$;

-- Vehicles
CREATE TABLE public.vehicles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  plate text,
  make text,
  model text,
  year integer,
  type public.vehicle_type NOT NULL DEFAULT 'van',
  status public.vehicle_status NOT NULL DEFAULT 'available',
  odometer integer NOT NULL DEFAULT 0,
  capacity integer,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view vehicles"
  ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fleet managers can insert vehicles"
  ON public.vehicles FOR INSERT TO authenticated WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet managers can update vehicles"
  ON public.vehicles FOR UPDATE TO authenticated USING (public.can_manage_fleet(auth.uid())) WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet managers can delete vehicles"
  ON public.vehicles FOR DELETE TO authenticated USING (public.can_manage_fleet(auth.uid()));

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drivers
CREATE TABLE public.drivers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  email text,
  phone text,
  license_number text,
  license_expiry date,
  status public.driver_status NOT NULL DEFAULT 'active',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT ALL ON public.drivers TO service_role;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view drivers"
  ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fleet managers can insert drivers"
  ON public.drivers FOR INSERT TO authenticated WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet managers can update drivers"
  ON public.drivers FOR UPDATE TO authenticated USING (public.can_manage_fleet(auth.uid())) WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet managers can delete drivers"
  ON public.drivers FOR DELETE TO authenticated USING (public.can_manage_fleet(auth.uid()));

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();