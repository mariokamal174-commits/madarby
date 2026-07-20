import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PhoneShell } from "@/components/PhoneShell";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, User, Trash2, CheckCircle, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/bookings")({
  component: PlayerBookings,
});

function PlayerBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bookingsQ = useQuery({
    queryKey: ["player_bookings_detail", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*, coaches(full_name, title_ar, avatar_url), sports(name_ar, emoji)")
        .eq("player_id", user.id)
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إلغاء الحجز");
      queryClient.invalidateQueries({ queryKey: ["player_bookings_detail"] });
    },
    onError: () => {
      toast.error("فشل إلغاء الحجز");
    },
  });

  const upcomingBookings = bookingsQ.data?.filter(
    (b: any) => b.status === "confirmed" && new Date(b.start_time) > new Date()
  ) || [];

  const pastBookings = bookingsQ.data?.filter(
    (b: any) => b.status === "completed" || (b.status === "confirmed" && new Date(b.start_time) <= new Date())
  ) || [];

  const cancelledBookings = bookingsQ.data?.filter((b: any) => b.status === "cancelled") || [];

  return (
    <PhoneShell>
      <div className="px-5 pt-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display font-bold text-2xl">حجوزاتي</h1>
          <Link
            to="/booking-flow"
            className="h-10 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center"
          >
            حجز جديد
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-surface rounded-2xl p-3 text-center">
            <p className="font-display font-bold text-lg text-primary">{upcomingBookings.length}</p>
            <p className="text-xs text-muted-foreground">قادمة</p>
          </div>
          <div className="bg-surface rounded-2xl p-3 text-center">
            <p className="font-display font-bold text-lg text-green-600">
              {pastBookings.length - cancelledBookings.length}
            </p>
            <p className="text-xs text-muted-foreground">مكتملة</p>
          </div>
          <div className="bg-surface rounded-2xl p-3 text-center">
            <p className="font-display font-bold text-lg text-red-600">{cancelledBookings.length}</p>
            <p className="text-xs text-muted-foreground">ملغاة</p>
          </div>
        </div>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="size-4 text-primary" />
              الجلسات القادمة
            </h2>
            <div className="space-y-3">
              {upcomingBookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-border bg-surface overflow-hidden hover:border-primary transition-colors"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-bold">{booking.coaches?.full_name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {booking.coaches?.title_ar}
                        </p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary rounded-lg px-2 py-1 font-bold shrink-0 ml-2">
                        {booking.sports?.emoji} {booking.sports?.name_ar}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs mb-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="size-4" />
                        {new Date(booking.start_time).toLocaleDateString("ar-SA", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4" />
                        {new Date(booking.start_time).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          {booking.price} ر.س
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => cancelBookingMutation.mutate(booking.id)}
                        disabled={cancelBookingMutation.isPending}
                        className="flex-1 h-9 rounded-lg border border-red-500/30 text-red-600 font-bold text-xs hover:bg-red-50/10 transition-colors disabled:opacity-60 flex items-center justify-center gap-1"
                      >
                        <Trash2 className="size-3" />
                        إلغاء
                      </button>
                      <button className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:shadow-lg transition-all">
                        تفاصيل
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Bookings */}
        {pastBookings.length - cancelledBookings.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <CheckCircle className="size-4 text-green-600" />
              جلسات مكتملة
            </h2>
            <div className="space-y-2">
              {pastBookings
                .filter((b: any) => b.status !== "cancelled")
                .slice(0, 3)
                .map((booking: any) => (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-border/50 bg-surface/50 p-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-xs">
                          {booking.coaches?.full_name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(booking.start_time).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                      <span className="text-[10px] text-green-600 font-bold">
                        ✓ مكتملة
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Cancelled Bookings */}
        {cancelledBookings.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="size-4 text-red-600" />
              جلسات ملغاة
            </h2>
            <div className="space-y-2">
              {cancelledBookings.slice(0, 3).map((booking: any) => (
                <div key={booking.id} className="rounded-xl border border-red-500/20 bg-red-50/10 p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-xs">
                        {booking.coaches?.full_name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(booking.start_time).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                    <span className="text-[10px] text-red-600 font-bold">
                      ✕ ملغاة
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {bookingsQ.data?.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="size-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-display font-bold text-sm mb-2">لا توجد حجوزات بعد</p>
            <p className="text-xs text-muted-foreground mb-4">
              ابدأ رحلتك بحجز جلسة تدريبية مع مدرب محترف
            </p>
            <Link
              to="/booking-flow"
              className="inline-block h-10 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
            >
              احجز الآن
            </Link>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
