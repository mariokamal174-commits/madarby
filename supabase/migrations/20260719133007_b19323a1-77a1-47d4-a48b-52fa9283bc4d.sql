
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
-- keep EXECUTE for authenticated on has_role because RLS policies use it and it's SECURITY DEFINER (safe)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
