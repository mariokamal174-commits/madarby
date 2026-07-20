-- Safe, idempotent SQL to ensure profiles, user_roles, and the auth trigger exist.
-- Run this directly in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  city TEXT,
  primary_role public.app_role NOT NULL DEFAULT 'player',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_all'
  ) THEN
    CREATE POLICY profiles_select_all ON public.profiles FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_insert_own'
  ) THEN
    CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_update_own'
  ) THEN
    CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'user_roles_select_own'
  ) THEN
    CREATE POLICY user_roles_select_own ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

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
      WHEN NEW.raw_user_meta_data->>'primary_role' IN ('player','coach','academy','admin')
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
      WHEN au.raw_user_meta_data->>'primary_role' IN ('player','coach','academy','admin')
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
      WHEN au.raw_user_meta_data->>'primary_role' IN ('player','coach','academy','admin')
        THEN (au.raw_user_meta_data->>'primary_role')::public.app_role
      ELSE 'player'
    END,
    'player'
  )
FROM auth.users au
ON CONFLICT (user_id, role) DO NOTHING;
