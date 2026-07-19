import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BellRing, CheckCheck } from "lucide-react";
import { notificationsSeed, type NotificationItem } from "@/lib/mock-platform";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(() => notificationsSeed);

  function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, unread: false })));
  }

  function toggleRead(id: string) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, unread: !item.unread } : item)));
  }

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground">الإشعارات</p>
          <h1 className="font-display font-bold text-2xl">المركز</h1>
        </div>
        <button onClick={markAllRead} className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          <CheckCheck className="size-4" /> تعليم الكل كمقروء
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <button key={item.id} onClick={() => toggleRead(item.id)} className={`w-full rounded-3xl border p-4 text-right ${item.unread ? "border-primary/30 bg-primary/5" : "border-border bg-surface"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BellRing className="size-4 text-primary" />
                  <p className="font-display font-bold text-sm">{item.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">{item.body}</p>
              </div>
              <span className="text-[11px] text-muted-foreground">{item.time}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
