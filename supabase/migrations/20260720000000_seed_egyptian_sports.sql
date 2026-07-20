-- ============ SEED EGYPTIAN SPORTS ============
-- Comprehensive list of sports available for Egyptian players and coaches

INSERT INTO public.sports (slug, name_ar, emoji, sort_order) VALUES
-- Football/Soccer
('football', 'كرة القدم', '⚽', 1),

-- Other Ball Sports
('basketball', 'كرة السلة', '🏀', 2),
('volleyball', 'كرة الطائرة', '🏐', 3),
('handball', 'كرة اليد', '🤾', 4),
('tennis', 'كرة المضرب', '🎾', 5),
('squash', 'الإسكواش', '🎾', 6),
('badminton', 'الريشة الطائرة', '🏸', 7),
('table-tennis', 'تنس الطاولة', '🏓', 8),

-- Combat Sports
('boxing', 'الملاكمة', '🥊', 9),
('wrestling', 'المصارعة', '🤼', 10),
('judo', 'الجودو', '🥋', 11),
('karate', 'الكاراتيه', '🥋', 12),
('taekwondo', 'التايكواندو', '🥋', 13),
('kickboxing', 'الكيك بوكسينج', '🥊', 14),
('mma', 'الفنون القتالية المختلطة', '🥊', 15),

-- Gymnastics & Athletics
('gymnastics', 'الجمباز', '🤸', 16),
('athletics', 'ألعاب القوى', '🏃', 17),
('running', 'الجري', '🏃', 18),
('swimming', 'السباحة', '🏊', 19),
('diving', 'الغطس', '🤿', 20),
('gymnastics-rhythmic', 'الجمباز الإيقاعي', '🎀', 21),
('weightlifting', 'رفع الأثقال', '🏋️', 22),

-- Racquet Sports
('racquetball', 'كرة الجدار', '🎾', 23),

-- Cycling & Wheeled Sports
('cycling', 'ركوب الدراجات', '🚴', 24),
('skateboarding', 'التزلج على الألواح', '🛹', 25),
('rollerskating', 'التزلج على عجلات', '🛼', 26),

-- Water Sports
('kayaking', 'الكاياك', '🛶', 27),
('surfing', 'ركوب الأمواج', '🏄', 28),
('windsurfing', 'ركوب الأمواج الشراعية', '🏄', 29),
('water-skiing', 'التزلج على الماء', '🏂', 30),

-- Winter Sports (for indoor facilities)
('ice-skating', 'التزلج على الجليد', '⛸️', 31),
('ice-hockey', 'هوكي الجليد', '🏒', 32),

-- Outdoor & Adventure Sports
('hiking', 'المشي في الطبيعة', '⛰️', 33),
('rock-climbing', 'تسلق الصخور', '🧗', 34),
('skateboard', 'الانزلاق', '🛹', 35),
('parkour', 'الباركور', '🏃', 36),

-- Mind Sports
('chess', 'الشطرنج', '♟️', 37),
('archery', 'الرماية', '🏹', 38),
('bowling', 'البولينج', '🎳', 39),
('billiards', 'البلياردو', '🎱', 40),

-- Dance & Movement
('dance', 'الرقص', '💃', 41),
('belly-dancing', 'الرقص الشرقي', '💃', 42),
('hip-hop-dance', 'رقص الهيب هوب', '🎤', 43),
('contemporary-dance', 'الرقص المعاصر', '💃', 44),
('ballet', 'الباليه', '🩰', 45),

-- Equestrian
('horse-riding', 'ركوب الخيل', '🐴', 46),

-- Niche Sports
('golf', 'الجولف', '⛳', 47),
('fencing', 'المبارزة', '🤺', 48),
('curling', 'الكيرلينج', '🥌', 49),
('weightlifting-powerlifting', 'القوة واللياقة', '🏋️', 50),
('crossfit', 'كروس فيت', '💪', 51),
('yoga', 'اليوجا', '🧘', 52),
('pilates', 'البيلاتس', '🧘‍♀️', 53),
('zumba', 'الزومبا', '🎵', 54),
('fitness', 'اللياقة البدنية', '💪', 55),
('personal-training', 'التدريب الشخصي', '💪', 56)
ON CONFLICT (slug) DO UPDATE SET 
  name_ar = EXCLUDED.name_ar,
  emoji = EXCLUDED.emoji,
  sort_order = EXCLUDED.sort_order;

-- Verify insert
SELECT COUNT(*) as total_sports FROM public.sports;
