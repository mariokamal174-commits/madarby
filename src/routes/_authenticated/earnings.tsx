import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Wallet, CircleDollarSign, BadgeCheck, TrendingUp } from "lucide-react";
import { analyticsSeed, earningsSeed, type EarningsTransaction } from "@/lib/mock-platform";

export const Route = createFileRoute("/_authenticated/earnings")({
  component: EarningsPage,
});

function EarningsPage() {
  const [transactions] = useState<EarningsTransaction[]>(() => earningsSeed);
  const totals = useMemo(() => {
    const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const pending = transactions.filter((tx) => tx.status === "pending").reduce((sum, tx) => sum + tx.net, 0);
    const completed = transactions.filter((tx) => tx.status === "completed").reduce((sum, tx) => sum + tx.net, 0);
    const commission = transactions.reduce((sum, tx) => sum + tx.commission, 0);
    return { total, pending, completed, commission };
  }, [transactions]);

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground">الأرباح والرصيد</p>
          <h1 className="font-display font-bold text-2xl">الإيرادات</h1>
        </div>
        <button className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          <Download className="size-4" /> تصدير
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "إجمالي الإيرادات", value: `${totals.total} ج.م`, icon: Wallet },
          { label: "مدفوعات معتمدة", value: `${totals.completed} ج.م`, icon: BadgeCheck },
          { label: "معلقة", value: `${totals.pending} ج.م`, icon: CircleDollarSign },
          { label: "عمولة المنصة", value: `${totals.commission} ج.م`, icon: TrendingUp },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <Icon className="size-4 text-primary" />
              </div>
              <p className="font-display font-bold text-lg">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-surface p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg">طرق الدفع</h2>
          <span className="text-xs text-muted-foreground">افتراضي</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-2xl bg-background px-3 py-3">
            <span>فيزا • 4242</span>
            <span className="font-bold text-primary">مفعّل</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-background px-3 py-3">
            <span>تحويل بنكي</span>
            <span className="text-muted-foreground">2-3 أيام</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-background px-3 py-3">
            <span>محفظة إلكترونية</span>
            <span className="text-muted-foreground">فوري</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">الرسم الشهري</h2>
          <span className="text-xs text-muted-foreground">آخر 6 أشهر</span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsSeed}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg">سجل المعاملات</h2>
        <span className="text-xs text-muted-foreground">آخر 10 عناصر</span>
      </div>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-display font-bold text-sm">{transaction.booking}</p>
                <p className="text-xs text-muted-foreground">{transaction.student}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold text-primary">{transaction.status}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>المبلغ: {transaction.amount} ج.م</span>
              <span>العمولة: {transaction.commission} ج.م</span>
              <span>الصافي: {transaction.net} ج.م</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
