import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { User, Edit, Heart, Target, MapPin, Calendar, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/player-profile")({
  component: PlayerProfile,
});

function PlayerProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const profileQ = useQuery({
    queryKey: ["player_profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const prefsQ = useQuery({
    queryKey: ["player_prefs", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("player_preferences")
        .select("*")
        .eq("player_id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const bookingsQ = useQuery({
    queryKey: ["player_bookings_stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return { upcoming: 0, completed: 0, cancelled: 0 };
      const { data, error } = await supabase
        .from("bookings")
        .select("status")
        .eq("player_id", user.id);
      if (error) throw error;

      const stats = {
        upcoming: (data || []).filter((b: any) => b.status === "confirmed").length,
        completed: (data || []).filter((b: any) => b.status === "completed").length,
        cancelled: (data || []).filter((b: any) => b.status === "cancelled").length,
      };
      return stats;
    },
    enabled: !!user?.id,
  });

  const profile = profileQ.data;
  const prefs = prefsQ.data;
  const stats = bookingsQ.data;

  return (
    <div className="px-5 pt-6 pb-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-2xl">ملفي الشخصي</h1>
        <Link
          to="/profile"
          className="size-10 rounded-full bg-surface flex items-center justify-center hover:bg-background transition-colors"
        >
          <Edit className="size-5" />
        </Link>
      </div>

      {/* Profile Card */}
      <div className="bg-surface rounded-3xl p-6 flex items-center gap-4 mb-6">
        <div className="size-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-3xl shrink-0">
          {user?.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-lg truncate">
            {profile?.full_name || user?.email}
          </h2>
          <p className="text-muted-foreground text-xs truncate">{user?.email}</p>
          <p className="text-xs text-primary font-bold mt-1">متدرب</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-surface rounded-2xl p-3 text-center">
          <p className="font-display font-bold text-xl text-primary">{stats?.upcoming ?? 0}</p>
          <p className="text-xs text-muted-foreground">جلسات قادمة</p>
        </div>
        <div className="bg-surface rounded-2xl p-3 text-center">
          <p className="font-display font-bold text-xl text-green-600">
            {stats?.completed ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">مكتملة</p>
        </div>
        <div className="bg-surface rounded-2xl p-3 text-center">
          <p className="font-display font-bold text-xl text-amber-600">
            {prefs?.favorite_sports?.length ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">رياضات</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="rounded-3xl border border-border bg-surface p-4 mb-6">
        <h3 className="font-display font-bold text-sm mb-4">معلومات أساسية</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            <span className="text-sm">
              <span className="text-muted-foreground">المدينة:</span> {profile?.city || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="size-4 text-primary" />
            <span className="text-sm">
              <span className="text-muted-foreground">الهاتف:</span> {profile?.phone || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Training Info */}
      <div className="rounded-3xl border border-border bg-surface p-4 mb-6">
        <h3 className="font-display font-bold text-sm mb-4">معلومات التدريب</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="size-4 text-primary" />
            <span className="text-sm">
              <span className="text-muted-foreground">مستوى المهارة:</span> {prefs?.level || "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="size-4 text-primary" />
            <div className="flex-1">
              <span className="text-sm text-muted-foreground block mb-1">الرياضات المفضلة:</span>
              {prefs?.favorite_sports && prefs.favorite_sports.length > 0 ? (
                <div className="flex gap-1 flex-wrap">
                  {prefs.favorite_sports.map((sport) => (
                    <span
                      key={sport}
                      className="text-xs bg-primary/10 text-primary rounded-lg px-2 py-1 font-bold"
                    >
                      {sport}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">لم تختر بعد</span>
              )}
            </div>
          </div>
          {prefs?.fitness_goals && (
            <div className="flex items-start gap-2">
              <Award className="size-4 text-primary mt-1" />
              <div className="flex-1">
                <span className="text-sm text-muted-foreground block mb-1">الأهداف:</span>
                <p className="text-sm">{prefs.fitness_goals}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Link
          to="/bookings"
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          عرض جلساتي
        </Link>
        <Link
          to="/booking-flow"
          className="w-full h-12 rounded-2xl bg-background border border-border font-display font-bold flex items-center justify-center hover:bg-surface transition-all"
        >
          احجز جلسة جديدة
        </Link>
      </div>
    </div>
  );
}
