import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Star, MapPin, Clock, Award, Sparkles, CalendarDays, ShieldCheck, Users, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coaches/$id")({
  component: CoachDetail,
});

function CoachDetail() {
  const { id } = Route.useParams();

  const q = useQuery({
    queryKey: ["coach", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaches")
        .select("*")
        .eq("id", id)
        .eq("approved", true)
        .eq("verified", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Get coach sports
  const sportsQ = useQuery({
    queryKey: ["coach_sports", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_sports")
        .select("sport_id, sports(emoji, name_ar)")
        .eq("coach_id", id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  // Get coach reviews
  const reviewsQ = useQuery({
    queryKey: ["coach_reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("coach_id", id)
        .eq("status", "completed")
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id,
  });

  if (q.isLoading) return <p className="p-8 text-center text-muted-foreground text-sm">جارٍ التحميل...</p>;
  const c = q.data;
  if (!c) return <p className="p-8 text-center text-muted-foreground text-sm">غير موجود</p>;

  const profileSections = [
    { title: "نبذة", body: c.bio_ar ?? "لا توجد نبذة." },
    { title: "الخبرة", body: `${c.experience_years ?? 5} سنة خبرة في التدريب والقيادة` },
    { title: "الموقع", body: `${c.city ?? "القاهرة"} • متاح للتدريب المنزلي والرقمي` },
  ];

  return (
    <div className="pb-28">
      <div className="relative h-72">
        {c.avatar_url && <img src={c.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <Link to="/search" className="absolute top-6 right-6 size-11 rounded-full bg-background/95 backdrop-blur flex items-center justify-center">
          <ArrowRight className="size-5" />
        </Link>
      </div>

      <div className="px-5 -mt-10 relative">
        <div className="bg-background rounded-3xl border border-border p-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h1 className="font-display font-bold text-2xl">{c.full_name}</h1>
              <p className="text-primary font-bold text-sm mt-1">{c.title_ar}</p>
            </div>
            <span className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-sm font-bold">
              <Star className="size-4 fill-primary" />
              {c.rating?.toFixed(1) ?? "—"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-3.5" /> {c.city}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Award className="size-3.5" /> {c.experience_years} سنوات</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Users className="size-3.5" /> {reviewsQ.data?.length ?? 0} جلسات</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold"><ShieldCheck className="size-3.5" /> معتمد</span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        <div className="bg-surface rounded-3xl p-5 flex justify-between items-center border border-border">
          <div>
            <p className="text-muted-foreground text-xs mb-1">يبدأ السعر من</p>
            <p className="font-display font-bold text-2xl text-primary">{Number(c.price_per_session)} <span className="text-sm">ج.م</span></p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs"><Clock className="size-3.5" /> {c.session_duration_min ?? 60} دقيقة</div>
        </div>
      </div>

      {/* Sports */}
      {sportsQ.data && sportsQ.data.length > 0 && (
        <div className="px-5 mt-6">
          <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Briefcase className="size-4" /> الرياضات المتخصص فيها
          </h3>
          <div className="flex gap-2 flex-wrap">
            {sportsQ.data.map((item: any) => (
              <span key={item.sport_id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                {item.sports?.emoji} {item.sports?.name_ar}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 mt-6 space-y-3">
        {profileSections.map((section) => (
          <div key={section.title} className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="font-display font-bold text-sm">{section.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>

      {/* Reviews Summary */}
      <div className="px-5 mt-6 rounded-3xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base">التقييمات</h3>
          <span className="text-xs text-muted-foreground">{reviewsQ.data?.length ?? 0} جلسات مكتملة</span>
        </div>
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className={`size-4 ${star <= Math.round(c.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{c.rating?.toFixed(1) ?? "—"} من 5 • بناءً على {reviewsQ.data?.length ?? 0} تقييمات</p>
      </div>

      {/* Availability */}
      <div className="px-5 mt-6 rounded-3xl border border-border bg-surface p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base">التوافر</h3>
          <span className="text-xs text-emerald-600 font-bold">متاح اليوم</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">جلسات فردية</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">تدريب منزلي</span>
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-600">أونلاين</span>
        </div>
      </div>

      <div className="fixed bottom-24 inset-x-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-[430px] px-5 pointer-events-auto">
          <Link to="/booking-flow" search={{ coach: id }} className="flex h-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display font-bold text-base shadow-xl shadow-primary/40 hover:shadow-xl hover:shadow-primary/50 transition-all">
            احجز الآن
          </Link>
        </div>
      </div>
      <div className="h-20" />
    </div>
  );
}