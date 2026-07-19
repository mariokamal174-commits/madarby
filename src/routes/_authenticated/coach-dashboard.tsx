import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, CheckCircle2, Clock3, Coins, Star, TrendingUp, Users, XCircle } from "lucide-react";
import { toast } from "sonner";
import { analyticsSeed, coachBookingsSeed, getCoachDashboardStats, type BookingStatus, type CoachBooking } from "@/lib/mock-platform";

export const Route = createFileRoute("/_authenticated/coach-dashboard")({
  component: CoachDashboard,
});

const statusMap: Record<BookingStatus, { label: string; cls: string }> = {
  pending: { label: "قيد الانتظار", cls: "bg-amber-100 text-amber-800" },
  accepted: { label: "مقبول", cls: "bg-primary/10 text-primary" },
  rejected: { label: "مرفوض", cls: "bg-red-100 text-red-700" },
  cancelled: { label: "ملغي", cls: "bg-neutral-200 text-neutral-700" },
  completed: { label: "مكتمل", cls: "bg-emerald-100 text-emerald-800" },
};

function CoachDashboard() {
  const stats = useMemo(() => getCoachDashboardStats(), []);
  const [bookings, setBookings] = useState<CoachBooking[]>(() => coachBookingsSeed);

  function updateBooking(id: string, status: BookingStatus) {
    setBookings((current) =>
      current.map((booking) => (booking.id === id ? { ...booking, status, history: [...booking.history, { status, label: `تم تغيير الحالة إلى ${statusMap[status].label}`, timestamp: "الآن" }] } : booking)),
    );
    toast.success("تم تحديث حالة الحجز");
  }

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
          { label: "إجمالي الحجوزات", value: stats.totalBookings, icon: CalendarDays },
          { label: "الجلسات القادمة", value: stats.upcomingSessions, icon: Clock3 },
          { label: "الأرباح الشهرية", value: `${stats.monthlyEarnings.toLocaleString()} ر.س`, icon: Coins },
          { label: "التقييم", value: `${stats.ratingAverage.toFixed(1)}/5`, icon: Star },
          { label: "عدد الطلاب", value: stats.totalStudents, icon: Users },
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
            <BarChart data={analyticsSeed}>
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
        <Link to="/bookings" className="text-xs font-bold text-primary">عرض الكل</Link>
      </div>

      <div className="flex flex-col gap-3">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-display font-bold text-sm">{booking.student}</h3>
                <p className="text-xs text-muted-foreground">{booking.sport} • {booking.date} • {booking.time}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusMap[booking.status].cls}`}>
                {statusMap[booking.status].label}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span>{booking.notes ?? "جلسة جديدة"}</span>
              <span className="font-bold text-primary">{booking.amount} ر.س</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {booking.status === "pending" && (
                <>
                  <button onClick={() => updateBooking(booking.id, "accepted")} className="rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground">
                    قبول
                  </button>
                  <button onClick={() => updateBooking(booking.id, "rejected")} className="rounded-full bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">
                    رفض
                  </button>
                </>
              )}
              {booking.status === "accepted" && (
                <button onClick={() => updateBooking(booking.id, "completed")} className="rounded-full bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white">
                  إكمال
                </button>
              )}
              {(booking.status === "accepted" || booking.status === "pending") && (
                <button onClick={() => updateBooking(booking.id, "cancelled")} className="rounded-full bg-neutral-200 px-3 py-2 text-[11px] font-bold text-neutral-700">
                  إلغاء
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
