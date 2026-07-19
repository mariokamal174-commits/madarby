import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, CheckCircle2, Clock3, Coins, Star, TrendingUp, Users, XCircle, Check, X } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/coach-dashboard")({
  component: CoachDashboard,
});

function CoachDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch bookings for this coach
  const bookingsQ = useQuery({
    queryKey: ["coach_bookings_dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*, players:profiles(full_name, phone, avatar_url), sports(name_ar, emoji)")
        .eq("coach_id", user.id)
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Confirm booking mutation
  const confirmBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تأكيد الحجز ✓");
      queryClient.invalidateQueries({ queryKey: ["coach_bookings_dashboard"] });
    },
    onError: () => {
      toast.error("فشل تأكيد الحجز");
    },
  });

  // Complete booking mutation
  const completeBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم إنهاء الجلسة ✓");
      queryClient.invalidateQueries({ queryKey: ["coach_bookings_dashboard"] });
    },
    onError: () => {
      toast.error("فشل إنهاء الجلسة");
    },
  });

  // Cancel booking mutation
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
      queryClient.invalidateQueries({ queryKey: ["coach_bookings_dashboard"] });
    },
    onError: () => {
      toast.error("فشل إلغاء الحجز");
    },
  });

  const bookings = bookingsQ.data || [];
  const now = new Date();
  const pendingBookings = bookings.filter((b: any) => b.status === "pending");
  const confirmedBookings = bookings.filter((b: any) => b.status === "confirmed");
  const upcomingBookings = confirmedBookings.filter((b: any) => new Date(b.start_time) > now);
  const completedBookings = bookings.filter((b: any) => b.status === "completed");
  const totalEarnings = completedBookings.reduce((sum: number, b: any) => sum + (b.price || 0), 0);
  const monthlyEarnings = completedBookings
    .filter((b: any) => {
      const bookingDate = new Date(b.start_time);
      const now = new Date();
      return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, b: any) => sum + (b.price || 0), 0);

  // Analytics data for chart
  const analyticsData = [
    { name: "السبت", bookings: 4 },
    { name: "الأحد", bookings: 3 },
    { name: "الاثنين", bookings: 5 },
    { name: "الثلاثاء", bookings: 7 },
    { name: "الأربعاء", bookings: 6 },
    { name: "الخميس", bookings: 8 },
    { name: "الجمعة", bookings: 2 },
  ];

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground">لوحة المدرب</p>
          <h1 className="font-display font-bold text-2xl">إدارة الأعمال</h1>
        </div>
        <Link to="/earnings" className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          الإيرادات
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "إجمالي الحجوزات", value: bookings.length, icon: CalendarDays },
          { label: "الجلسات القادمة", value: upcomingBookings.length, icon: Clock3 },
          { label: "الأرباح الشهرية", value: `${monthlyEarnings.toLocaleString()} ر.س`, icon: Coins },
          { label: "التقييم", value: "4.8/5", icon: Star },
          { label: "طلبات قيد الانتظار", value: pendingBookings.length, icon: Users },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <Icon className="size-4 text-primary" />
              </div>
              <p className="font-display font-bold text-xl">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">إحصائيات الحجوزات</h2>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5" /> نمو مستمر
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="bookings" radius={[8, 8, 0, 0]} fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg">طلبات الحجز</h2>
      </div>

      <div className="flex flex-col gap-3">
        {bookingsQ.isLoading && (
          <p className="text-center text-muted-foreground text-sm py-4">جاري التحميل...</p>
        )}

        {/* Pending Bookings */}
        {pendingBookings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-600 uppercase">قيد الانتظار ({pendingBookings.length})</h3>
            {pendingBookings.map((booking: any) => (
              <div key={booking.id} className="rounded-3xl border border-amber-500/30 bg-amber-50/10 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-display font-bold text-sm">{booking.players?.full_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {booking.sports?.emoji} {booking.sports?.name_ar} • {new Date(booking.start_time).toLocaleDateString("ar-SA")} • {new Date(booking.start_time).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-800">قيد الانتظار</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{booking.notes || "جلسة جديدة"}</span>
                  <span className="font-bold text-primary">{booking.price} ر.س</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => confirmBookingMutation.mutate(booking.id)}
                    disabled={confirmBookingMutation.isPending}
                    className="rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground disabled:opacity-60"
                  >
                    قبول
                  </button>
                  <button
                    onClick={() => cancelBookingMutation.mutate(booking.id)}
                    disabled={cancelBookingMutation.isPending}
                    className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700 disabled:opacity-60"
                  >
                    رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Confirmed Bookings */}
        {upcomingBookings.length > 0 && (
          <div className="space-y-3 mt-4">
            <h3 className="text-xs font-bold text-primary uppercase">الجلسات القادمة ({upcomingBookings.length})</h3>
            {upcomingBookings.map((booking: any) => (
              <div key={booking.id} className="rounded-3xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-display font-bold text-sm">{booking.players?.full_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {booking.sports?.emoji} {booking.sports?.name_ar} • {new Date(booking.start_time).toLocaleDateString("ar-SA")} • {new Date(booking.start_time).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">مؤكد</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span>{booking.notes || "جلسة جديدة"}</span>
                  <span className="font-bold text-primary">{booking.price} ر.س</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => completeBookingMutation.mutate(booking.id)}
                    disabled={completeBookingMutation.isPending}
                    className="rounded-full bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white disabled:opacity-60 flex-1"
                  >
                    إكمال الجلسة
                  </button>
                  <button
                    onClick={() => cancelBookingMutation.mutate(booking.id)}
                    disabled={cancelBookingMutation.isPending}
                    className="rounded-full bg-neutral-200 px-3 py-2 text-[11px] font-bold text-neutral-700 disabled:opacity-60"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Bookings */}
        {completedBookings.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-bold text-green-600 uppercase mb-2">جلسات مكتملة ({completedBookings.length})</h3>
            <p className="text-sm text-muted-foreground">إجمالي الأرباح: <span className="font-bold text-primary">{totalEarnings} ر.س</span></p>
          </div>
        )}

        {bookings.length === 0 && !bookingsQ.isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            <p>لا توجد حجوزات بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}
