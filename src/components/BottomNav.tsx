import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, CalendarDays, MessageCircle, User } from "lucide-react";

const items = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/search", label: "بحث", icon: Search },
  { to: "/bookings", label: "حجوزاتي", icon: CalendarDays },
  { to: "/chat", label: "محادثات", icon: MessageCircle },
  { to: "/profile", label: "حسابي", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-[430px] px-3 pb-3 pointer-events-auto">
        <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg px-2 py-2 flex justify-between items-center">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 flex-1 py-1.5 rounded-xl transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-bold">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}