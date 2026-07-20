-- Ensure every user gets a profile and a role row automatically, including existing users.

CREATE OR REPLACE FUNCTION public.ensure_profile_and_role_for_user(
  p_user_id UUID,
  p_role public.app_role DEFAULT 'player',
  p_full_name TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, primary_role, created_at, updated_at)
  VALUES (
    p_user_id,
    p_full_name,
    p_role,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    primary_role = COALESCE(public.profiles.primary_role, EXCLUDED.primary_role),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_profile_and_role_for_user(UUID, public.app_role, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_and_role_for_user(UUID, public.app_role, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_value public.app_role;
  full_name_value TEXT;
BEGIN
  role_value := COALESCE(
    CASE
      WHEN NEW.raw_user_meta_data->>'primary_role' IN ('player', 'coach', 'academy', 'admin')
        THEN (NEW.raw_user_meta_data->>'primary_role')::public.app_role
      ELSE 'player'
    END,
    'player'
  );

  full_name_value := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  PERFORM public.ensure_profile_and_role_for_user(NEW.id, role_value, full_name_value);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, full_name, primary_role, created_at, updated_at)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE(
    CASE
      WHEN au.raw_user_meta_data->>'primary_role' IN ('player', 'coach', 'academy', 'admin')
        THEN (au.raw_user_meta_data->>'primary_role')::public.app_role
      ELSE 'player'
    END,
    'player'
  ),
  now(),
  now()
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
  primary_role = COALESCE(public.profiles.primary_role, EXCLUDED.primary_role),
  updated_at = now();

INSERT INTO public.user_roles (user_id, role)
SELECT
  au.id,
  COALESCE(
    CASE
      WHEN au.raw_user_meta_data->>'primary_role' IN ('player', 'coach', 'academy', 'admin')
        THEN (au.raw_user_meta_data->>'primary_role')::public.app_role
      ELSE 'player'
    END,
    'player'
  )
FROM auth.users au
ON CONFLICT (user_id, role) DO NOTHING;
