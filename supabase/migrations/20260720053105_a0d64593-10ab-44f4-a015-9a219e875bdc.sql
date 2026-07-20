
-- Coach verifications table
CREATE TABLE public.coach_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  certificates JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_verifications TO authenticated;
GRANT ALL ON public.coach_verifications TO service_role;
ALTER TABLE public.coach_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches view own verifications" ON public.coach_verifications
  FOR SELECT TO authenticated USING (auth.uid() = coach_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Coaches submit verifications" ON public.coach_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Admins update verifications" ON public.coach_verifications
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Player preferences table
CREATE TABLE public.player_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_sports TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  fitness_goals TEXT,
  level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_preferences TO authenticated;
GRANT ALL ON public.player_preferences TO service_role;
ALTER TABLE public.player_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players manage own preferences" ON public.player_preferences
  FOR ALL TO authenticated USING (auth.uid() = player_id) WITH CHECK (auth.uid() = player_id);
