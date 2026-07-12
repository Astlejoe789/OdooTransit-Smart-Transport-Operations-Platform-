REVOKE EXECUTE ON FUNCTION public.can_manage_fleet(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_fleet(uuid) TO authenticated;