import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PhoneShell } from "@/components/PhoneShell";
import { getBookingDisplayDate, getBookingDisplayTime, isBookingUpcoming } from "@/lib/bookings";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, User, Trash2, CheckCircle, AlertCircle, Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/bookings")({
  beforeLoad: async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) throw redirect({ to: "/auth" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_role")
      .eq("id", userData.user.id)
      .single();

    if (profile?.primary_role === "coach") {
      throw redirect({ to: "/home" });
    }
  },
  component: PlayerBookings,
});

function PlayerBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingValue, setRatingValue] = useState(5);

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

  const ratingMutation = useMutation({
    mutationFn: async ({ bookingId, rating }: { bookingId: string; rating: number }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ rating, status: "completed" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("شكراً على تقييمك!");
      setRatingBookingId(null);
      setRatingValue(5);
      queryClient.invalidateQueries({ queryKey: ["player_bookings_detail"] });
    },
    onError: () => {
      toast.error("فشل حفظ التقييم");
    },
  });

  const upcomingBookings = bookingsQ.data?.filter((b: any) => isBookingUpcoming(b) && b.status !== "cancelled") || [];

  const pastBookings = bookingsQ.data?.filter((b: any) => !isBookingUpcoming(b) && b.status !== "cancelled") || [];

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
                        {getBookingDisplayDate(booking)}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="size-4" />
                        {getBookingDisplayTime(booking)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          {booking.price} ج.م
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
                .map((booking: any) => (
                  <div key={booking.id} className="rounded-xl border border-border/50 bg-surface/50 p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-xs">{booking.coaches?.full_name}</h4>
                        <p className="text-[10px] text-muted-foreground">{getBookingDisplayDate(booking)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!booking.rating && (
                          <button
                            onClick={() => setRatingBookingId(booking.id)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                          >
                            قيّم
                          </button>
                        )}
                        {booking.rating && (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`size-3 ${
                                  star <= booking.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        <span className="text-[10px] text-green-600 font-bold">✓ مكتملة</span>
                      </div>
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

        {/* Rating Modal */}
        {ratingBookingId && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur z-50 flex items-end">
            <div className="w-full bg-background rounded-t-3xl p-6 animate-in slide-in-from-bottom">
              <h2 className="font-display font-bold text-xl mb-2">قيّم الجلسة</h2>
              <p className="text-xs text-muted-foreground mb-6">شارك رأيك عن جودة الجلسة</p>

              <div className="mb-6 p-4 rounded-2xl bg-surface border border-border">
                <p className="text-xs text-muted-foreground mb-2">المدرب</p>
                <p className="font-bold text-sm">
                  {pastBookings.find((b: any) => b.id === ratingBookingId)?.coaches?.full_name}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-3">التقييم</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingValue(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`size-8 cursor-pointer ${
                          star <= ratingValue
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setRatingBookingId(null)}
                  className="flex-1 h-12 rounded-2xl border border-border bg-background font-bold"
                >
                  إلغاء
                </button>
                <button
                  onClick={() =>
                    ratingMutation.mutate({
                      bookingId: ratingBookingId,
                      rating: ratingValue,
                    })
                  }
                  disabled={ratingMutation.isPending}
                  className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-60"
                >
                  {ratingMutation.isPending ? "جارٍ الحفظ..." : "إرسال التقييم"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
