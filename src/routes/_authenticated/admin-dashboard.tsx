import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Users, GraduationCap, BarChart3, MessageSquareText, Ticket, CircleDollarSign, Star, BellRing } from "lucide-react";
import { adminSeed } from "@/lib/mock-platform";

export const Route = createFileRoute("/_authenticated/admin-dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const sections = [
    { label: "المستخدمون", icon: Users },
    { label: "المدربون", icon: GraduationCap },
    { label: "الحجوزات", icon: CircleDollarSign },
    { label: "المدفوعات", icon: BarChart3 },
    { label: "المراجعات", icon: Star },
    { label: "الإشعارات", icon: BellRing },
    { label: "الدعم", icon: Ticket },
    { label: "الرسائل", icon: MessageSquareText },
  ];

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">لوحة الإدارة</p>
        <h1 className="font-display font-bold text-2xl">الإدارة</h1>
      </div>

      <div className="rounded-3xl border border-border bg-primary/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="size-5 text-primary" />
          <h2 className="font-display font-bold text-lg">نظرة سريعة</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {adminSeed.map((item) => (
            <div key={item.title} className="rounded-2xl bg-background/90 p-3">
              <p className="text-[11px] text-muted-foreground">{item.title}</p>
              <p className="font-display font-bold text-lg">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {sections.map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="size-4 text-primary" />
              <h3 className="font-display font-bold text-sm">{label}</h3>
            </div>
            <p className="text-xs text-muted-foreground">متاح في لوحة الإدارة مع الدعم الكامل للترشيحات والمرشحات.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
