import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { analyticsSeed, adminSeed, type AnalyticsPoint } from "@/lib/mock-platform";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="px-5 pt-6 pb-28">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">التحليلات</p>
        <h1 className="font-display font-bold text-2xl">لوحة القياس</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {adminSeed.map((item) => (
          <div key={item.title} className="rounded-3xl border border-border bg-surface p-4">
            <p className="text-[11px] text-muted-foreground">{item.title}</p>
            <p className="font-display font-bold text-lg mt-1">{item.value}</p>
            <p className="text-xs text-primary mt-1">{item.trend}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 mb-6">
        <h2 className="font-display font-bold text-lg mb-4">الإيراد والت bookings</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsSeed}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-4">
        <h2 className="font-display font-bold text-lg mb-4">الأداء حسب المدينة</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsSeed}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="users" radius={[8, 8, 0, 0]} fill="var(--color-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
