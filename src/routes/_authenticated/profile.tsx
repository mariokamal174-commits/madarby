import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { LogOut, Heart, Settings, HelpCircle, Star, ChevronLeft, Building2, BarChart3, ShieldCheck, Edit2, Wallet, BookOpen, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = user?.user_metadata?.full_name ?? "لاعب جديد";
  const email = user?.email ?? "";

  // Stats
  const statsQ = useQuery({
    queryKey: ["profile_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { bookings: 0, favorites: 0, totalSpent: 0, rating: 0 };
      
      const bookingsRes = await supabase
        .from("bookings")
        .select("id, price")
        .eq("player_id", user.id)
        .eq("status", "completed");

      const favoritesRes = await supabase
        .from("player_preferences")
        .select("favorite_sports")
        .eq("player_id", user.id)
        .single();

      const totalSpent = (bookingsRes.data ?? []).reduce((sum: number, b: any) => sum + (b.price || 0), 0);

      return {
        bookings: bookingsRes.data?.length ?? 0,
        favorites: favoritesRes.data?.favorite_sports?.length ?? 0,
        totalSpent,
        rating: 4.8,
      };
    },
    enabled: !!user?.id,
  });

  async function signOut() {
    try {
      await supabase.auth.signOut();
      navigate({ to: "/auth" });
      toast.success("تم تسجيل الخروج");
    } catch (err) {
      toast.error("فشل تسجيل الخروج");
    }
  }

  const menuItems = [
    { icon: Edit2, label: "البيانات الشخصية", desc: "بيانات، الحجوزات، المفضلة", color: "text-blue-600", bgColor: "bg-blue-500/10", to: "/profile/edit" },
    { icon: Wallet, label: "وسائل الدفع", desc: "المحفظة والبيانات المصرفية", color: "text-green-600", bgColor: "bg-green-500/10", to: "/profile/payment" },
    { icon: Settings, label: "الإعدادات", desc: "الإشعارات والخصوصية واللغة", color: "text-purple-600", bgColor: "bg-purple-500/10", to: "/profile/settings" },
    { icon: HelpCircle, label: "الدعم الفني", desc: "الأسئلة الشائعة والمساعدة", color: "text-orange-600", bgColor: "bg-orange-500/10", to: "/profile/support" },
  ];

  return (
    <div className="px-5 pt-6 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-2xl">الملف الشخصي</h1>
        <button onClick={() => navigate({ to: "/home" })} className="size-10 rounded-full bg-surface flex items-center justify-center">
          <ChevronLeft className="size-5" />
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-cyan-500/10 border border-primary/20 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">مرحباً 👋</p>
            <h2 className="font-display font-bold text-2xl">{name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{email}</p>
          </div>
          <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="size-7 text-primary" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/60 p-3 text-center">
            <p className="font-display font-bold text-lg text-primary">{statsQ.data?.bookings ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">جلسات</p>
          </div>
          <div className="rounded-xl bg-white/60 p-3 text-center">
            <p className="font-display font-bold text-lg text-primary">{statsQ.data?.rating}</p>
            <p className="text-[10px] text-muted-foreground">⭐ تقييمي</p>
          </div>
          <div className="rounded-xl bg-white/60 p-3 text-center">
            <p className="font-display font-bold text-lg text-primary">{statsQ.data?.totalSpent || 0}</p>
            <p className="text-[10px] text-muted-foreground">ج.م</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-3 mb-6">
        {menuItems.map((item) => (
          <Link
            key={item.to}
            to={item.to as any}
            className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between hover:bg-background transition-all"
          >
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-full ${item.bgColor} flex items-center justify-center`}>
                <item.icon className={`size-5 ${item.color}`} />
              </div>
              <div>
                <p className="font-bold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <ChevronLeft className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={signOut}
        className="w-full h-12 rounded-2xl border border-red-500/30 bg-red-50/10 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
      >
        <LogOut className="size-4" />
        تسجيل الخروج
      </button>
    </div>
  );
}