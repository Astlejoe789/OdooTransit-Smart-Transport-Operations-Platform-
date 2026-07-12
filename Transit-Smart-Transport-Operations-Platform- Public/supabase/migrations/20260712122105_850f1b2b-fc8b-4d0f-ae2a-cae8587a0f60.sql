-- Tighten overly permissive SELECT policies flagged by security scan.
DROP POLICY IF EXISTS "Signed-in users can view vehicles" ON public.vehicles;
CREATE POLICY "Fleet roles and drivers can view vehicles"
  ON public.vehicles FOR SELECT TO authenticated
  USING (
    public.can_manage_fleet(auth.uid())
    OR public.has_role(auth.uid(), 'viewer')
    OR public.has_role(auth.uid(), 'driver')
  );

DROP POLICY IF EXISTS "Signed-in users can view drivers" ON public.drivers;
CREATE POLICY "Fleet roles can view all drivers; drivers can view own record"
  ON public.drivers FOR SELECT TO authenticated
  USING (
    public.can_manage_fleet(auth.uid())
    OR public.has_role(auth.uid(), 'viewer')
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Signed-in users can view trips" ON public.trips;
CREATE POLICY "Fleet roles can view all trips; drivers can view assigned trips"
  ON public.trips FOR SELECT TO authenticated
  USING (
    public.can_manage_fleet(auth.uid())
    OR public.has_role(auth.uid(), 'viewer')
    OR EXISTS (
      SELECT 1 FROM public.drivers d
      WHERE d.id = trips.driver_id AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Signed-in users can view maintenance" ON public.maintenance_logs;
CREATE POLICY "Fleet roles can view maintenance"
  ON public.maintenance_logs FOR SELECT TO authenticated
  USING (
    public.can_manage_fleet(auth.uid())
    OR public.has_role(auth.uid(), 'viewer')
  );

DROP POLICY IF EXISTS "Signed-in users can view fuel" ON public.fuel_logs;
CREATE POLICY "Fleet roles can view all fuel logs; drivers can view their own"
  ON public.fuel_logs FOR SELECT TO authenticated
  USING (
    public.can_manage_fleet(auth.uid())
    OR created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Signed-in users can view expenses" ON public.expenses;
CREATE POLICY "Admin and manager can view expenses"
  ON public.expenses FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
  );
