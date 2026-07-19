import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Heart, Settings, HelpCircle, Star, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name ?? "لاعب جديد";
  const email = user?.email ?? "";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const items = [
    { icon: Heart, label: "المفضلة" },
    { icon: Star, label: "تقييماتي" },
    { icon: Settings, label: "الإعدادات" },
    { icon: HelpCircle, label: "المساعدة" },
  ];

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display font-bold text-2xl mb-6">حسابي</h1>

      <div className="bg-surface rounded-3xl p-5 flex items-center gap-4 mb-6">
        <div className="size-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-2xl">
          {name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold truncate">{name}</h2>
          <p className="text-muted-foreground text-xs truncate">{email}</p>
        </div>
      </div>

      <div className="bg-surface rounded-3xl overflow-hidden mb-6">
        {items.map((it, idx) => (
          <button
            key={it.label}
            className={`w-full flex items-center gap-3 px-5 py-4 text-right ${
              idx < items.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <it.icon className="size-5 text-primary" />
            <span className="flex-1 font-display font-bold text-sm">{it.label}</span>
            <ChevronLeft className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <button
        onClick={signOut}
        className="w-full h-14 rounded-2xl bg-red-50 text-red-600 font-display font-bold text-sm flex items-center justify-center gap-2"
      >
        <LogOut className="size-5" />
        تسجيل الخروج
      </button>
    </div>
  );
}