
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('player','coach','academy','admin');
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','completed','cancelled','rejected');
CREATE TYPE public.gender_type AS ENUM ('male','female');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  gender public.gender_type,
  birth_date DATE,
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
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role) $$;

-- ============ AUTO PROFILE + ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, primary_role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'primary_role')::public.app_role, 'player')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'primary_role')::public.app_role, 'player'));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SPORTS ============
CREATE TABLE public.sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '⚽',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.sports TO anon, authenticated;
GRANT ALL ON public.sports TO service_role;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sports_public_read" ON public.sports FOR SELECT USING (true);

-- ============ COACHES (public profiles; user_id optional so we can seed demo data) ============
CREATE TABLE public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title_ar TEXT,
  bio_ar TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  city TEXT,
  gender public.gender_type,
  experience_years INT DEFAULT 0,
  price_per_session NUMERIC(10,2) NOT NULL DEFAULT 150,
  session_duration_min INT NOT NULL DEFAULT 60,
  languages TEXT[] DEFAULT ARRAY['ar'],
  rating NUMERIC(2,1) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coaches TO anon, authenticated;
GRANT INSERT, UPDATE ON public.coaches TO authenticated;
GRANT ALL ON public.coaches TO service_role;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_public_read" ON public.coaches FOR SELECT USING (approved = true OR auth.uid() = user_id);
CREATE POLICY "coaches_insert_own" ON public.coaches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "coaches_update_own" ON public.coaches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "coaches_admin_all" ON public.coaches FOR ALL USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.coach_sports (
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  PRIMARY KEY (coach_id, sport_id)
);
GRANT SELECT ON public.coach_sports TO anon, authenticated;
GRANT INSERT, DELETE ON public.coach_sports TO authenticated;
GRANT ALL ON public.coach_sports TO service_role;
ALTER TABLE public.coach_sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coach_sports_read" ON public.coach_sports FOR SELECT USING (true);
CREATE POLICY "coach_sports_manage_own" ON public.coach_sports FOR ALL
  USING (EXISTS(SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()));

CREATE TABLE public.coach_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);
GRANT SELECT ON public.coach_availability TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coach_availability TO authenticated;
GRANT ALL ON public.coach_availability TO service_role;
ALTER TABLE public.coach_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avail_read" ON public.coach_availability FOR SELECT USING (true);
CREATE POLICY "avail_manage_own" ON public.coach_availability FOR ALL
  USING (EXISTS(SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()));

-- ============ ACADEMIES ============
CREATE TABLE public.academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  description_ar TEXT,
  logo_url TEXT,
  cover_url TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academies TO anon, authenticated;
GRANT INSERT, UPDATE ON public.academies TO authenticated;
GRANT ALL ON public.academies TO service_role;
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "academies_public_read" ON public.academies FOR SELECT USING (approved = true OR auth.uid() = owner_id);
CREATE POLICY "academies_insert_own" ON public.academies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "academies_update_own" ON public.academies FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "academies_admin_all" ON public.academies FOR ALL USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.academy_sports (
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  PRIMARY KEY (academy_id, sport_id)
);
GRANT SELECT ON public.academy_sports TO anon, authenticated;
GRANT INSERT, DELETE ON public.academy_sports TO authenticated;
GRANT ALL ON public.academy_sports TO service_role;
ALTER TABLE public.academy_sports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "academy_sports_read" ON public.academy_sports FOR SELECT USING (true);
CREATE POLICY "academy_sports_manage_own" ON public.academy_sports FOR ALL
  USING (EXISTS(SELECT 1 FROM public.academies a WHERE a.id = academy_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM public.academies a WHERE a.id = academy_id AND a.owner_id = auth.uid()));

-- ============ BOOKINGS ============
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE SET NULL,
  academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
  sport_id UUID REFERENCES public.sports(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_min INT NOT NULL DEFAULT 60,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  qr_code TEXT NOT NULL DEFAULT encode(gen_random_bytes(12),'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_player_read" ON public.bookings FOR SELECT USING (auth.uid() = player_id);
CREATE POLICY "bookings_coach_read" ON public.bookings FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()));
CREATE POLICY "bookings_academy_read" ON public.bookings FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.academies a WHERE a.id = academy_id AND a.owner_id = auth.uid()));
CREATE POLICY "bookings_player_insert" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "bookings_player_update" ON public.bookings FOR UPDATE USING (auth.uid() = player_id);
CREATE POLICY "bookings_coach_update" ON public.bookings FOR UPDATE
  USING (EXISTS(SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.user_id = auth.uid()));

-- ============ REVIEWS ============
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((coach_id IS NOT NULL) OR (academy_id IS NOT NULL))
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "reviews_update_own" ON public.reviews FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "reviews_delete_own" ON public.reviews FOR DELETE USING (auth.uid() = author_id);

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES public.coaches(id) ON DELETE CASCADE,
  academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, coach_id),
  UNIQUE (user_id, academy_id),
  CHECK ((coach_id IS NOT NULL) OR (academy_id IS NOT NULL))
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favs_own_all" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ SEED SPORTS ============
INSERT INTO public.sports (slug, name_ar, emoji, sort_order) VALUES
 ('football','كرة قدم','⚽',1),
 ('padel','بادل','🎾',2),
 ('tennis','تنس','🎾',3),
 ('basketball','كرة سلة','🏀',4),
 ('swimming','سباحة','🏊',5),
 ('gym','لياقة','🏋️',6),
 ('boxing','ملاكمة','🥊',7),
 ('karate','كاراتيه','🥋',8),
 ('yoga','يوغا','🧘',9),
 ('running','جري','🏃',10),
 ('cycling','دراجات','🚴',11),
 ('volleyball','كرة طائرة','🏐',12);

-- ============ SEED DEMO COACHES ============
WITH s AS (SELECT id, slug FROM public.sports)
INSERT INTO public.coaches (full_name, title_ar, bio_ar, city, gender, experience_years, price_per_session, rating, reviews_count, verified, avatar_url, cover_url)
VALUES
 ('كابتن يوسف أحمد','خبير لياقة بدنية وكمال أجسام','مدرب معتمد بخبرة تزيد عن ١٠ سنوات في تطوير اللياقة والقوة البدنية.','الرياض','male',10,180,4.9,245,true,
   'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200'),
 ('سارة المنصور','مدربة تنس معتمدة دولياً','متخصصة في تدريب المبتدئين والمحترفين في رياضة التنس.','جدة','female',8,200,4.8,182,true,
   'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400','https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200'),
 ('كابتن فيصل العتيبي','مدرب بادل وتنس محترف','خبرة ٨ سنوات في تدريب البادل والتنس بأسلوب احترافي وممتع.','الرياض','male',8,150,4.9,320,true,
   'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400','https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1200'),
 ('أمل السعدون','مدربة سباحة للسيدات والأطفال','تدريب سباحة احترافي مع التركيز على السلامة والتقنية.','الدمام','female',6,180,4.7,98,true,
   'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400','https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=1200'),
 ('كابتن سامي الحربي','مدرب كرة قدم للناشئين','مدرب سابق في أندية محترفة، متخصص في تطوير مهارات الناشئين.','الرياض','male',12,160,4.8,412,true,
   'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400','https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200'),
 ('ياسر بن محمد','كبير مدربي الملاكمة','متخصص في تدريب الملاكمة للمحترفين والمبتدئين.','جدة','male',9,220,5.0,156,true,
   'https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400','https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=1200');

-- Link coaches to sports
INSERT INTO public.coach_sports (coach_id, sport_id)
SELECT c.id, s.id FROM public.coaches c, public.sports s
WHERE (c.full_name='كابتن يوسف أحمد' AND s.slug IN ('gym','running'))
   OR (c.full_name='سارة المنصور' AND s.slug IN ('tennis'))
   OR (c.full_name='كابتن فيصل العتيبي' AND s.slug IN ('padel','tennis'))
   OR (c.full_name='أمل السعدون' AND s.slug IN ('swimming'))
   OR (c.full_name='كابتن سامي الحربي' AND s.slug IN ('football'))
   OR (c.full_name='ياسر بن محمد' AND s.slug IN ('boxing'));

-- Seed weekly availability for all coaches: Sun/Mon/Tue/Wed/Thu 4pm-9pm
INSERT INTO public.coach_availability (coach_id, day_of_week, start_time, end_time)
SELECT c.id, d, '16:00'::time, '21:00'::time
FROM public.coaches c CROSS JOIN generate_series(0,4) AS d;

-- ============ SEED DEMO ACADEMIES ============
INSERT INTO public.academies (name_ar, description_ar, city, address, phone, rating, reviews_count, verified, logo_url, cover_url) VALUES
 ('أكاديمية النخبة الرياضية','أكاديمية شاملة لتدريب جميع الرياضات لكل الأعمار.','الرياض','حي الملقا، شارع الأمير محمد','+966501112233',4.8,320,true,
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200','https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200'),
 ('نادي الأبطال','متخصصون في كرة القدم والبادل مع ملاعب حديثة.','جدة','حي الروضة','+966502223344',4.6,210,true,
  'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=200','https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200'),
 ('أكاديمية المحترفين','برامج تدريبية للسباحة والجيم بأعلى المعايير.','الدمام','شارع الملك فهد','+966503334455',4.7,178,true,
  'https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=200','https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200');

INSERT INTO public.academy_sports (academy_id, sport_id)
SELECT a.id, s.id FROM public.academies a, public.sports s
WHERE (a.name_ar='أكاديمية النخبة الرياضية' AND s.slug IN ('football','tennis','padel','swimming','gym'))
   OR (a.name_ar='نادي الأبطال' AND s.slug IN ('football','padel'))
   OR (a.name_ar='أكاديمية المحترفين' AND s.slug IN ('swimming','gym','boxing'));
