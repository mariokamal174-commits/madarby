import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Star, MapPin, Clock, Award } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coaches/$id")({
  component: CoachDetail,
});

function CoachDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(false);

  const q = useQuery({
    queryKey: ["coach", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("coaches").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  async function bookNow() {
    if (!user || !q.data) return;
    setBooking(true);
    try {
      const now = new Date();
      now.setDate(now.getDate() + 1);
      const date = now.toISOString().slice(0, 10);
      const { error } = await supabase.from("bookings").insert({
        player_id: user.id,
        coach_id: q.data.id,
        booking_date: date,
        start_time: "18:00:00",
        duration_min: 60,
        price: q.data.price_per_session,
        status: "pending",
      });
      if (error) throw error;
      toast.success("تم إنشاء الحجز — قيد الانتظار");
      navigate({ to: "/bookings" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحجز");
    } finally {
      setBooking(false);
    }
  }

  if (q.isLoading) return <p className="p-8 text-center text-muted-foreground text-sm">جارٍ التحميل...</p>;
  const c = q.data;
  if (!c) return <p className="p-8 text-center text-muted-foreground text-sm">غير موجود</p>;

  return (
    <div>
      <div className="relative h-72">
        {c.avatar_url && <img src={c.avatar_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <Link
          to="/home"
          className="absolute top-6 right-6 size-11 rounded-full bg-background/95 backdrop-blur flex items-center justify-center"
        >
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
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {c.city}
            </span>
            <span className="flex items-center gap-1">
              <Award className="size-3.5" /> {c.experience_years} سنة خبرة
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6">
        <h3 className="font-display font-bold mb-2">نبذة</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{c.bio_ar ?? "لا توجد نبذة."}</p>
      </div>

      <div className="px-5 mt-6">
        <h3 className="font-display font-bold mb-3">التسعير</h3>
        <div className="bg-surface rounded-3xl p-5 flex justify-between items-center">
          <div>
            <p className="text-muted-foreground text-xs mb-1">الجلسة الواحدة</p>
            <p className="font-display font-bold text-2xl text-primary">
              {Number(c.price_per_session)} <span className="text-sm">ر.س</span>
            </p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <Clock className="size-3.5" />
            ٦٠ دقيقة
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 inset-x-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-[430px] px-5 pointer-events-auto">
          <button
            onClick={bookNow}
            disabled={booking}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-base shadow-xl shadow-primary/40 disabled:opacity-60"
          >
            {booking ? "جارٍ الحجز..." : "احجز الآن"}
          </button>
        </div>
      </div>
      <div className="h-20" />
    </div>
  );
}