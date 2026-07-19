-- ============ ENUMS ============
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- ============ ENUMS ============
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- ============ COACH VERIFICATIONS ============
CREATE TABLE public.coach_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificates TEXT[] NOT NULL,
  license_card_url TEXT NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coach_verifications TO authenticated;
GRANT INSERT ON public.coach_verifications TO authenticated;
GRANT ALL ON public.coach_verifications TO service_role;

ALTER TABLE public.coach_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_verifications_select_own" ON public.coach_verifications
  FOR SELECT USING (auth.uid() = coach_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "coach_verifications_insert_own" ON public.coach_verifications
  FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "coach_verifications_update_admin" ON public.coach_verifications
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
