-- ============ PLAYER PREFERENCES ============
CREATE TABLE public.player_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'بداية',
  favorite_sports TEXT[] DEFAULT ARRAY[]::TEXT[],
  fitness_goals TEXT,
  followed_coaches UUID[] DEFAULT ARRAY[]::UUID[],
  followed_academies UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.player_preferences TO authenticated;
GRANT ALL ON public.player_preferences TO service_role;

ALTER TABLE public.player_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "player_prefs_select_own" ON public.player_preferences
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "player_prefs_insert_own" ON public.player_preferences
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "player_prefs_update_own" ON public.player_preferences
  FOR UPDATE USING (auth.uid() = player_id);

-- ============ PLAYER BOOKINGS ============
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
  sport_id UUID REFERENCES public.sports(id) ON DELETE SET NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  session_type TEXT DEFAULT 'individual',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (auth.uid() = player_id OR auth.uid() = coach_id);

CREATE POLICY "bookings_insert_player" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE USING (auth.uid() = player_id OR auth.uid() = coach_id);
