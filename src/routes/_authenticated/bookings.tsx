import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, Clock, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bookings")({
  component: Bookings,
});

function Bookings() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, booking_date, start_time, duration_min, price, status, qr_code, notes, coach:coaches(full_name, avatar_url)",
        )
        .eq("player_id", user!.id)
        .order("booking_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">حجوزاتي</h1>
        <Link to="/booking-flow" className="rounded-2xl bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground">
          حجز جديد
        </Link>
      </div>
      {q.isLoading && <p className="text-center text-muted-foreground py-8 text-sm">جارٍ التحميل...</p>}
      {q.data?.length === 0 && (
        <div className="text-center py-16">
          <div className="size-20 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
            <CalendarDays className="size-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm mb-6">لا توجد حجوزات بعد</p>
          <Link
            to="/home"
            className="inline-block bg-primary text-primary-foreground px-6 h-12 rounded-2xl font-display font-bold text-sm leading-[3rem]"
          >
            ابدأ الحجز الآن
          </Link>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {q.data?.map((b) => {
          const d = new Date(`${b.booking_date}T${b.start_time}`);
          const statusMap: Record<string, { label: string; cls: string }> = {
            pending: { label: "قيد الانتظار", cls: "bg-amber-100 text-amber-800" },
            confirmed: { label: "مؤكد", cls: "bg-primary/10 text-primary" },
            completed: { label: "منتهي", cls: "bg-neutral-200 text-neutral-700" },
            cancelled: { label: "ملغى", cls: "bg-red-100 text-red-700" },
          };
          const s = statusMap[b.status] ?? { label: b.status, cls: "bg-surface" };
          return (
            <div key={b.id} className="bg-surface rounded-3xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-neutral-200 overflow-hidden">
                    {b.coach?.avatar_url && (
                      <img src={b.coach.avatar_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm">{b.coach?.full_name}</h4>
                    <p className="text-muted-foreground text-xs">{b.duration_min} دقيقة</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${s.cls}`}>{s.label}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  {d.toLocaleDateString("ar-SA")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </span>
                {b.notes && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {b.notes}
                  </span>
                )}
              </div>
              {b.status === "confirmed" && b.qr_code && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] font-bold text-muted-foreground mb-1">رمز الدخول</p>
                  <p className="font-mono text-primary font-bold text-sm">{b.qr_code}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}