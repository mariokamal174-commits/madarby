import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, CalendarDays, ChartColumnIncreasing, Sparkles, Users, ArrowLeft } from "lucide-react";
import { academySeed } from "@/lib/mock-platform";

export const Route = createFileRoute("/_authenticated/academy-dashboard")({
  component: AcademyDashboardPage,
});

function AcademyDashboardPage() {
  const highlights = [
    { title: "المدربون النشطون", value: "19", hint: "3 مدربين جدد خلال هذا الشهر", icon: Users },
    { title: "الجلسات القادمة", value: "34", hint: "متوسط الحضور 92%", icon: CalendarDays },
    { title: "الإيرادات", value: "SAR 24K", hint: "متوقعة للأسبوع الحالي", icon: ChartColumnIncreasing },
    { title: "البرامج", value: "8", hint: "تدريب فردي وجماعي واشتراكات", icon: Sparkles },
  ];

  const sessions = [
    { title: "تدريب كرة قدم", coach: "سالم الزهراني", time: "اليوم • 18:30" },
    { title: "جلسة يوجا", coach: "نورة الشهري", time: "غدًا • 08:30" },
    { title: "تنس مهاري", coach: "فهد العتيبي", time: "الأحد • 17:00" },
  ];

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">لوحة الأكاديمية</p>
        <h1 className="font-display font-bold text-2xl">إدارة الأكاديمية</h1>
      </div>

      <div className="rounded-3xl border border-border bg-primary/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="size-5 text-primary" />
          <h2 className="font-display font-bold text-lg">نظرة تشغيلية</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {academySeed.map((item) => (
            <div key={item.title} className="rounded-2xl bg-background/90 p-3">
              <p className="text-[11px] text-muted-foreground">{item.title}</p>
              <p className="font-display font-bold text-lg mt-1">{item.value}</p>
              <p className="text-[10px] text-primary mt-1">{item.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {highlights.map(({ title, value, hint, icon: Icon }) => (
          <div key={title} className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <Icon className="size-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">{hint}</span>
            </div>
            <p className="font-display font-bold text-lg">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{title}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">الجلسات القادمة</h2>
          <Link to="/bookings" className="text-sm font-bold text-primary">
            عرض الكل
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <div key={session.title} className="flex items-center justify-between rounded-2xl bg-surface px-3 py-3">
              <div>
                <p className="font-display font-bold text-sm">{session.title}</p>
                <p className="text-xs text-muted-foreground">{session.coach}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary font-bold">{session.time}</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <ArrowLeft className="size-3" />
                  متابعة
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/coach-dashboard" className="rounded-3xl border border-border bg-surface p-4">
          <p className="font-display font-bold text-sm">لوحة المدرب</p>
          <p className="text-xs text-muted-foreground mt-1">إدارة الحجوزات والقدرة</p>
        </Link>
        <Link to="/analytics" className="rounded-3xl border border-border bg-surface p-4">
          <p className="font-display font-bold text-sm">التحليلات</p>
          <p className="text-xs text-muted-foreground mt-1">متابعة النمو والإيرادات</p>
        </Link>
      </div>
    </div>
  );
}
