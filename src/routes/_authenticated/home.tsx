import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SportChip } from "@/components/SportChip";
import { CoachCard, type CoachCardData } from "@/components/CoachCard";
import { AcademyCard, type AcademyCardData } from "@/components/AcademyCard";
import { useState } from "react";
import { Bell, Search, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const [sport, setSport] = useState<string | null>(null);

  const sportsQ = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sports").select("*").order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const coachesQ = useQuery({
    queryKey: ["coaches", sport],
    queryFn: async () => {
      let q = supabase
        .from("coaches")
        .select("id, full_name, title_ar, avatar_url, rating, price_per_session, city")
        .order("rating", { ascending: false })
        .limit(10);
      if (sport) {
        const { data: linked } = await supabase.from("coach_sports").select("coach_id").eq("sport_id", sport);
        const ids = (linked ?? []).map((r) => r.coach_id);
        if (ids.length === 0) return [] as CoachCardData[];
        q = q.in("id", ids);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as CoachCardData[];
    },
  });

  const academiesQ = useQuery({
    queryKey: ["academies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academies")
        .select("id, name_ar, city, cover_url, rating")
        .order("rating", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as AcademyCardData[];
    },
  });

  const firstName = user?.user_metadata?.full_name?.split(" ")?.[0] ?? "بطلنا";

  return (
    <div className="px-5 pt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground text-xs mb-1">مرحباً 👋</p>
          <h1 className="font-display font-bold text-xl">{firstName}</h1>
          <p className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
            <MapPin className="size-3" />
            الرياض
          </p>
        </div>
        <button className="size-11 rounded-full bg-surface flex items-center justify-center relative">
          <Bell className="size-5" />
          <span className="absolute top-2 left-2 size-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* Search bar */}
      <Link
        to="/search"
        className="flex items-center gap-3 h-14 bg-surface rounded-2xl px-4 mb-6 text-muted-foreground text-sm"
      >
        <Search className="size-5" />
        ابحث عن مدرب، رياضة، أو أكاديمية...
      </Link>

      {/* Hero card */}
      <div className="animate-soft-glow relative h-40 overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-blue-600 to-cyan-500 p-6 text-primary-foreground mb-4">
        <div className="relative z-10 max-w-[60%]">
          <span className="text-[10px] font-bold uppercase opacity-80">عرض خاص</span>
          <h3 className="font-display font-bold text-2xl mt-1 leading-tight">خصم ٢٠٪ على أول حجز</h3>
          <p className="text-xs opacity-90 mt-2">استخدم كود ATHLETE20</p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400"
          alt=""
          className="absolute left-0 bottom-0 top-0 w-1/2 object-cover opacity-40 mix-blend-overlay"
        />
      </div>

      <Link to="/academy-dashboard" className="animate-rise flex items-center justify-between rounded-[24px] border border-border/70 bg-card/95 p-4 mb-6 shadow-sm surface-lift">
        <div>
          <p className="text-[10px] text-primary font-bold">لوحة أكاديمية</p>
          <h3 className="font-display font-bold text-sm mt-1">إدارة الجلسات والمدربين والإيرادات</h3>
        </div>
        <span className="text-sm font-bold text-primary">فتح</span>
      </Link>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/coach-dashboard" className="rounded-[24px] border border-border/70 bg-card/95 p-4 shadow-sm surface-lift">
          <p className="text-[10px] text-primary font-bold">لوحة المدرب</p>
          <p className="font-display font-bold text-sm mt-1">إدارة الحجوزات</p>
        </Link>
        <Link to="/booking-flow" className="rounded-[24px] border border-border/70 bg-card/95 p-4 shadow-sm surface-lift">
          <p className="text-[10px] text-primary font-bold">حجز جديد</p>
          <p className="font-display font-bold text-sm mt-1">ابدأ جلسة جديدة</p>
        </Link>
      </div>

      {/* Sports chips */}
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="font-display font-bold text-lg">الرياضات</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-2 mb-6 scrollbar-none">
        <SportChip emoji="✨" label="الكل" active={sport === null} onClick={() => setSport(null)} />
        {sportsQ.data?.map((s) => (
          <SportChip
            key={s.id}
            emoji={s.emoji ?? "⚽"}
            label={s.name_ar}
            active={sport === s.id}
            onClick={() => setSport(s.id)}
          />
        ))}
      </div>

      {/* Academies */}
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="font-display font-bold text-lg">أكاديميات مميّزة</h2>
        <Link to="/search" className="text-primary text-xs font-bold">
          عرض الكل
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 mb-8 scrollbar-none">
        {academiesQ.data?.map((a) => (
          <AcademyCard key={a.id} academy={a} />
        ))}
      </div>

      {/* Coaches list */}
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="font-display font-bold text-lg">أفضل المدربين</h2>
        <Link to="/search" className="text-primary text-xs font-bold">
          عرض الكل
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {coachesQ.isLoading && (
          <div className="text-center text-muted-foreground py-8 text-sm">جارٍ التحميل...</div>
        )}
        {coachesQ.data?.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">لا يوجد مدربون لهذه الرياضة</div>
        )}
        {coachesQ.data?.map((c) => (
          <CoachCard key={c.id} coach={c} />
        ))}
      </div>
    </div>
  );
}