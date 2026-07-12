-- Harden public.user_roles with explicit restrictive write policies so that
-- only admins can insert/update/delete roles. SELECT is intentionally left
-- untouched so users can still view their own roles. The handle_new_user
-- trigger is SECURITY DEFINER and bypasses RLS, so signup role assignment
-- is unaffected.

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));