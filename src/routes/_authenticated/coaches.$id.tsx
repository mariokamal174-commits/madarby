import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Star, MapPin, Clock, Award, Sparkles, CalendarDays, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coaches/$id")({
  component: CoachDetail,
});

function CoachDetail() {
  const { id } = Route.useParams();

  const q = useQuery({
    queryKey: ["coach", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("coaches").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) return <p className="p-8 text-center text-muted-foreground text-sm">جارٍ التحميل...</p>;
  const c = q.data;
  if (!c) return <p className="p-8 text-center text-muted-foreground text-sm">غير موجود</p>;

  const profileSections = [
    { title: "نبذة", body: c.bio_ar ?? "لا توجد نبذة." },
    { title: "الشهادات", body: "أكاديمية رياضية معتمدة • تدريب في المجال الرياضي لمدة 8 سنوات" },
    { title: "الخبرة", body: `${c.experience_years ?? 5} سنة خبرة في التدريب والقيادة` },
    { title: "الرياضات", body: "كرة قدم • يوغا • لياقة" },
    { title: "الموقع", body: `${c.city ?? "الرياض"} • متاح للتدريب المنزلي والرقمي` },
  ];

  return (
    <div className="pb-28">
      <div className="relative h-72">
        {c.avatar_url && <img src={c.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <Link to="/home" className="absolute top-6 right-6 size-11 rounded-full bg-background/95 backdrop-blur flex items-center justify-center">
          <ArrowRight className="size-5" />
        </Link>
      </div>

      <div className="px-5 -mt-10 relative">
        <div className="bg-background rounded-3xl border border-border p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="font-display font-bold text-2xl">{c.full_name}</h1>
              <p className="text-muted-foreground text-sm mt-1">{c.title_ar}</p>
            </div>
            <span className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-sm font-bold">
              <Star className="size-4 fill-primary" />
              {c.rating?.toFixed(1) ?? "—"}
            </span>
          </div>

          <div className="flex gap-4 text-xs text-muted-foreground border-t border-border pt-3 mt-3">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {c.city}</span>
            <span className="flex items-center gap-1"><Award className="size-3.5" /> {c.experience_years} سنة خبرة</span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        <div className="bg-surface rounded-3xl p-5 flex justify-between items-center">
          <div>
            <p className="text-muted-foreground text-xs mb-1">الجلسة الواحدة</p>
            <p className="font-display font-bold text-2xl text-primary">{Number(c.price_per_session)} <span className="text-sm">ر.س</span></p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs"><Clock className="size-3.5" /> ٦٠ دقيقة</div>
        </div>
      </div>

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

      <div className="px-5 mt-6 rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-base">التوافر</h3>
          <span className="text-xs text-muted-foreground">متاح اليوم</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">متاح</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">تدريب منزلي</span>
          <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-bold text-muted-foreground">تدريب عن بعد</span>
        </div>
      </div>

      <div className="fixed bottom-24 inset-x-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-[430px] px-5 pointer-events-auto">
          <Link to="/booking-flow" className="flex h-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-display font-bold text-base shadow-xl shadow-primary/40">
            احجز الآن
          </Link>
        </div>
      </div>
      <div className="h-20" />
    </div>
  );
}