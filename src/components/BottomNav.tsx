import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Home, Search, CalendarDays, Clock3, User } from "lucide-react";

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("profiles").select("primary_role").eq("id", user.id).single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const role = (profileQ.data as { primary_role?: string } | null)?.primary_role;
  const items = role === "coach"
    ? [
        { to: "/home", label: "الرئيسية", icon: Home },
        { to: "/coach-dashboard", label: "الحجوزات", icon: CalendarDays },
        { to: "/coach-availability", label: "المواعيد", icon: Clock3 },
        { to: "/profile", label: "حسابي", icon: User },
      ]
    : [
        { to: "/home", label: "الرئيسية", icon: Home },
        { to: "/search", label: "بحث", icon: Search },
        { to: "/bookings", label: "حجوزاتي", icon: CalendarDays },
        { to: "/profile", label: "حسابي", icon: User },
      ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-[430px] px-3 pb-3 pointer-events-auto">
        <div className="glass-card rounded-[20px] px-2 py-2 flex justify-between items-center">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all duration-200 ${
                  active ? "text-primary bg-primary/10 scale-[1.02]" : "text-muted-foreground"
                }`}
              >
                {active ? <span className="absolute inset-x-3 top-1 h-0.5 rounded-full bg-primary" /> : null}
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