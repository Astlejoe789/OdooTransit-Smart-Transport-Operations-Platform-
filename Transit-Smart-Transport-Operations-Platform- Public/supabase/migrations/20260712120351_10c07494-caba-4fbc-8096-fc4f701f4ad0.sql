-- Allow admins and managers to view all profiles so they can link driver
-- records to user accounts for the Driver Portal.
GRANT SELECT ON public.profiles TO authenticated;

CREATE POLICY "Admins and managers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'manager'::public.app_role)
);