-- Reset app data and create a fresh admin account
-- Run this in Supabase SQL Editor

-- 1) Delete public app data if tables exist
DO $$
BEGIN
  IF to_regclass('public.coach_verifications') IS NOT NULL THEN
    DELETE FROM public.coach_verifications;
  END IF;

  IF to_regclass('public.player_preferences') IS NOT NULL THEN
    DELETE FROM public.player_preferences;
  END IF;

  IF to_regclass('public.favorites') IS NOT NULL THEN
    DELETE FROM public.favorites;
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL THEN
    DELETE FROM public.reviews;
  END IF;

  IF to_regclass('public.bookings') IS NOT NULL THEN
    DELETE FROM public.bookings;
  END IF;

  IF to_regclass('public.coach_availability') IS NOT NULL THEN
    DELETE FROM public.coach_availability;
  END IF;

  IF to_regclass('public.coach_sports') IS NOT NULL THEN
    DELETE FROM public.coach_sports;
  END IF;

  IF to_regclass('public.academy_sports') IS NOT NULL THEN
    DELETE FROM public.academy_sports;
  END IF;

  IF to_regclass('public.coaches') IS NOT NULL THEN
    DELETE FROM public.coaches;
  END IF;

  IF to_regclass('public.academies') IS NOT NULL THEN
    DELETE FROM public.academies;
  END IF;

  IF to_regclass('public.profiles') IS NOT NULL THEN
    DELETE FROM public.profiles;
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL THEN
    DELETE FROM public.user_roles;
  END IF;

  IF to_regclass('public.sports') IS NOT NULL THEN
    DELETE FROM public.sports;
  END IF;
END $$;

-- 3) Recreate the core tables and trigger if missing
-- This is safe to run more than once.
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

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, primary_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'primary_role')::public.app_role, 'player')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'primary_role')::public.app_role, 'player'))
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Create the admin user through signup flow data
-- Use the email/password you want below
-- If the user already exists, this will just ensure the role/profile are set.
WITH existing_user AS (
  SELECT id FROM auth.users WHERE email = 'admin@madarby.local' LIMIT 1
),
new_user AS (
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  )
  SELECT
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@madarby.local',
    crypt('AdminReset123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name":"Admin","primary_role":"admin"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM existing_user)
  RETURNING id
)
INSERT INTO public.profiles (id, full_name, phone, city, primary_role, onboarded, created_at, updated_at)
SELECT COALESCE((SELECT id FROM new_user LIMIT 1), (SELECT id FROM existing_user LIMIT 1)), 'Admin', '', '', 'admin', true, now(), now()
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  primary_role = EXCLUDED.primary_role,
  onboarded = true,
  updated_at = now();

WITH target_user AS (
  SELECT COALESCE((SELECT id FROM auth.users WHERE email = 'admin@madarby.local' LIMIT 1), NULL::uuid) AS id
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM target_user
WHERE id IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 5) Confirm the admin account and set a working password so login succeeds
DO $$
BEGIN
  UPDATE auth.users
  SET
    encrypted_password = crypt('AdminReset123!', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now(),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"full_name":"Admin","primary_role":"admin"}'::jsonb
  WHERE email = 'admin@madarby.local';
END $$;

-- 6) Optional: make sure the profile exists for the admin
SELECT id, full_name, primary_role FROM public.profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@madarby.local'
);
