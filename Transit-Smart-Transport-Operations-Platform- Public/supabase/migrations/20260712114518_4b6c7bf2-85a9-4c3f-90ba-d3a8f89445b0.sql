
-- Enums
CREATE TYPE public.trip_status AS ENUM ('scheduled', 'dispatched', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.maintenance_type AS ENUM ('routine', 'repair', 'inspection', 'tire', 'oil_change', 'other');
CREATE TYPE public.expense_category AS ENUM ('toll', 'parking', 'insurance', 'registration', 'repair', 'supplies', 'other');

-- ============ TRIPS ============
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  status public.trip_status NOT NULL DEFAULT 'scheduled',
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cargo TEXT,
  distance_km NUMERIC,
  checklist_passed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT ALL ON public.trips TO service_role;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view trips" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fleet roles can insert trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet roles can update trips" ON public.trips FOR UPDATE TO authenticated USING (public.can_manage_fleet(auth.uid())) WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet roles can delete trips" ON public.trips FOR DELETE TO authenticated USING (public.can_manage_fleet(auth.uid()));

-- ============ MAINTENANCE ============
CREATE TABLE public.maintenance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type public.maintenance_type NOT NULL DEFAULT 'routine',
  description TEXT,
  cost NUMERIC NOT NULL DEFAULT 0,
  odometer NUMERIC,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_service_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_logs TO authenticated;
GRANT ALL ON public.maintenance_logs TO service_role;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view maintenance" ON public.maintenance_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fleet roles can insert maintenance" ON public.maintenance_logs FOR INSERT TO authenticated WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet roles can update maintenance" ON public.maintenance_logs FOR UPDATE TO authenticated USING (public.can_manage_fleet(auth.uid())) WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet roles can delete maintenance" ON public.maintenance_logs FOR DELETE TO authenticated USING (public.can_manage_fleet(auth.uid()));

-- ============ FUEL ============
CREATE TABLE public.fuel_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  liters NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC NOT NULL DEFAULT 0,
  odometer NUMERIC,
  station TEXT,
  filled_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fuel_logs TO authenticated;
GRANT ALL ON public.fuel_logs TO service_role;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view fuel" ON public.fuel_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fleet roles can insert fuel" ON public.fuel_logs FOR INSERT TO authenticated WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet roles can update fuel" ON public.fuel_logs FOR UPDATE TO authenticated USING (public.can_manage_fleet(auth.uid())) WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet roles can delete fuel" ON public.fuel_logs FOR DELETE TO authenticated USING (public.can_manage_fleet(auth.uid()));

-- ============ EXPENSES ============
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category public.expense_category NOT NULL DEFAULT 'other',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  spent_at DATE NOT NULL DEFAULT CURRENT_DATE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can view expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Fleet roles can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet roles can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (public.can_manage_fleet(auth.uid())) WITH CHECK (public.can_manage_fleet(auth.uid()));
CREATE POLICY "Fleet roles can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (public.can_manage_fleet(auth.uid()));

-- ============ updated_at triggers ============
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON public.maintenance_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fuel_updated_at BEFORE UPDATE ON public.fuel_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
