import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SportChip } from "@/components/SportChip";
import { CoachCard, type CoachCardData } from "@/components/CoachCard";
import { AcademyCard, type AcademyCardData } from "@/components/AcademyCard";
import { useState } from "react";
import { Bell, Search, MapPin, BarChart3, TrendingUp, Calendar, Wallet, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const [sport, setSport] = useState<string | null>(null);

  // Get user profile to check role
  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
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

  const sportsQ = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sports").select("*").order("name_ar");
      if (error) throw error;
      return data;
    },
  });

  const coachesQ = useQuery({
    queryKey: ["coaches", sport],
    queryFn: async () => {
      let q = supabase
        .from("coaches")
        .select("id, full_name, title_ar, avatar_url, rating, price_per_session, city")
        .eq("approved", true)
        .eq("verified", true)
        .order("rating", { ascending: false })
        .limit(10);
      if (sport) {
        const { data: linked } = await supabase.from("coach_sports").select("coach_id").eq("sport_id", sport);
        const ids = (linked ?? []).map((r) => r.coach_id);
        if (ids.length === 0) return [] as CoachCardData[];
        q = q.in("id", ids);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as CoachCardData[];
    },
  });

  const academiesQ = useQuery({
    queryKey: ["academies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academies")
        .select("id, name_ar, city, cover_url, rating")
        .order("rating", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as AcademyCardData[];
    },
  });

  // Coach bookings
  const coachBookingsQ = useQuery({
    queryKey: ["coach_bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("coach_id", user.id)
        .order("start_time", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && profileQ.data?.primary_role === "coach",
  });

  // Coach earnings
  const coachEarningsQ = useQuery({
    queryKey: ["coach_earnings", user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, pending: 0, completed: 0 };
      const { data, error } = await supabase
        .from("bookings")
        .select("price")
        .eq("coach_id", user.id);
      if (error) throw error;
      
      const total = (data ?? []).reduce((sum, b) => sum + (b.price || 0), 0);
      return { total, pending: total * 0.2, completed: total * 0.8 };
    },
    enabled: !!user?.id && profileQ.data?.primary_role === "coach",
  });

  // Player bookings
  const playerBookingsQ = useQuery({
    queryKey: ["player_bookings", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select("*, coaches(full_name, title_ar), sports(name_ar)")
        .eq("player_id", user.id)
        .order("start_time", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && profileQ.data?.primary_role === "player",
  });

  // Player preferences
  const playerPrefsQ = useQuery({
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
    enabled: !!user?.id && profileQ.data?.primary_role === "player",
  });

  const role = profileQ.data?.primary_role;
  const firstName = user?.user_metadata?.full_name?.split(" ")?.[0] ?? profileQ.data?.full_name?.split(" ")?.[0] ?? "بطلنا";

  // ===== COACH DASHBOARD =====
  if (role === "coach") {
    // Check verification status
    const verificationQ = useQuery({
      queryKey: ["coach_verification", user?.id],
      queryFn: async () => {
        if (!user?.id) return null;
        const { data, error } = await supabase
          .from("coach_verifications")
          .select("status")
          .eq("coach_id", user.id)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .single();
        if (error) return null;
        return data;
      },
      enabled: !!user?.id,
    });

    const verificationStatus = (verificationQ.data as { status?: string } | null)?.status;
    const isVerified = verificationStatus === "approved";

    return (
      <div className="px-5 pt-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-muted-foreground text-xs mb-1">مرحباً 👋</p>
            <h1 className="font-display font-bold text-2xl">{firstName}</h1>
            <p className="text-muted-foreground text-xs mt-1">لوحة المدرب</p>
          </div>
          <button className="size-11 rounded-full bg-surface flex items-center justify-center relative">
            <Bell className="size-5" />
            <span className="absolute top-2 left-2 size-2 rounded-full bg-primary" />
          </button>
        </div>

        {/* Verification Banner */}
        {!isVerified && verificationStatus === "pending" && (
          <div className="rounded-3xl border border-amber-300/30 bg-amber-50/50 p-4 mb-6">
            <p className="text-sm font-bold text-amber-900 mb-2">⏳ قيد المراجعة</p>
            <p className="text-xs text-muted-foreground mb-3">
              وثائقك قيد المراجعة. ستتلقى بريداً عند الموافقة
            </p>
            <Link
              to="/coach-verification-status"
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              عرض التفاصيل →
            </Link>
          </div>
        )}

        {!isVerified && verificationStatus === "rejected" && (
          <div className="rounded-3xl border border-red-300/30 bg-red-50/50 p-4 mb-6">
            <p className="text-sm font-bold text-red-900 mb-2">❌ تم رفض الطلب</p>
            <p className="text-xs text-muted-foreground mb-3">
              يمكنك إعادة تقديم وثائقك
            </p>
            <Link
              to="/coach-verification"
              className="inline-block text-xs font-bold text-red-600 hover:underline"
            >
              إعادة المحاولة →
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            to="/coach-dashboard"
            className="h-24 bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-3xl p-4 flex flex-col justify-between surface-lift hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">الحجوزات القادمة</span>
            </div>
            <div>
              <p className="font-display font-bold text-2xl">{coachBookingsQ.data?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">جلسة</p>
            </div>
          </Link>

          <Link
            to="/earnings"
            className="h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-4 flex flex-col justify-between surface-lift hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-green-600" />
              <span className="text-xs text-muted-foreground">إجمالي الأرباح</span>
            </div>
            <div>
              <p className="font-display font-bold text-2xl">{coachEarningsQ.data?.total?.toLocaleString() ?? 0}</p>
              <p className="text-xs text-muted-foreground">ر.س</p>
            </div>
          </Link>

          <Link
            to="/coach-availability"
            className="h-24 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-3xl p-4 flex flex-col justify-between surface-lift hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">مواعيدي</span>
            </div>
            <div>
              <p className="font-display font-bold text-2xl">5</p>
              <p className="text-xs text-muted-foreground">متاح</p>
            </div>
          </Link>

          <Link
            to="/analytics"
            className="h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-4 flex flex-col justify-between surface-lift hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">الإحصائيات</span>
            </div>
            <div>
              <p className="font-display font-bold text-2xl">4.8</p>
              <p className="text-xs text-muted-foreground">تقييمي</p>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface rounded-3xl p-4 mb-6">
          <h2 className="font-display font-bold text-lg mb-3">الإجراءات السريعة</h2>
          <div className="space-y-2">
            <Link
              to="/coach-dashboard"
              className="h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center hover:shadow-lg hover:shadow-primary/30 transition-all"
            >
              إدارة الحجوزات
            </Link>
            <Link
              to="/coach-availability"
              className="h-12 rounded-2xl bg-background border border-border font-display font-bold flex items-center justify-center hover:bg-surface transition-all"
            >
              تحديث المواعيد
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== PLAYER DASHBOARD =====
  if (role === "player") {
    const upcomingBookings = playerBookingsQ.data?.filter(
      (b: any) => b.status === "confirmed" && new Date(b.start_time) > new Date()
    ) || [];
    const completedBookings = playerBookingsQ.data?.filter((b: any) => b.status === "completed") || [];

    // Recommended coaches for player
    const recommendedCoachesQ = useQuery({
      queryKey: ["recommended_coaches", playerPrefsQ.data?.favorite_sports?.[0]],
      queryFn: async () => {
        let q = supabase
          .from("coaches")
          .select("id, full_name, title_ar, avatar_url, rating, price_per_session, city")
          .eq("approved", true)
          .eq("verified", true)
          .order("rating", { ascending: false })
          .limit(5);
        
        if (playerPrefsQ.data?.favorite_sports?.[0]) {
          const { data: linked } = await supabase
            .from("coach_sports")
            .select("coach_id")
            .eq("sport_id", playerPrefsQ.data.favorite_sports[0]);
          const ids = (linked ?? []).map((r) => r.coach_id);
          if (ids.length > 0) {
            q = q.in("id", ids);
          }
        }
        
        const { data, error } = await q;
        if (error) throw error;
        return data as CoachCardData[];
      },
      enabled: !!playerPrefsQ.data,
    });

    return (
      <div className="px-5 pt-6 pb-28">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-muted-foreground text-xs mb-1">مرحباً 👋</p>
            <h1 className="font-display font-bold text-2xl">{firstName}</h1>
            <p className="text-muted-foreground text-xs mt-1">متدرب</p>
          </div>
          <button className="size-11 rounded-full bg-surface flex items-center justify-center relative">
            <Bell className="size-5" />
            <span className="absolute top-2 left-2 size-2 rounded-full bg-primary" />
          </button>
        </div>

        {/* Today's Offers Banner */}
        <div className="animate-soft-glow relative h-32 overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-6 text-white mb-6">
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase opacity-90">🎁 عرض اليوم</p>
            <h3 className="font-display font-bold text-xl mt-1 leading-tight">خصم حتى 30٪ على جلستك الأولى</h3>
            <p className="text-xs opacity-90 mt-2">استخدم كود FIRSTFIT</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            to="/bookings"
            className="h-24 bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-3xl p-4 flex flex-col justify-between surface-lift hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">الجلسات القادمة</span>
            </div>
            <div>
              <p className="font-display font-bold text-2xl">{upcomingBookings.length}</p>
              <p className="text-xs text-muted-foreground">جلسة</p>
            </div>
          </Link>

          <div className="h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-3xl p-4 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">إجمالي الجلسات</span>
            </div>
            <div>
              <p className="font-display font-bold text-2xl">{completedBookings.length}</p>
              <p className="text-xs text-muted-foreground">مكتملة</p>
            </div>
          </div>

          {playerPrefsQ.data?.favorite_sports && (
            <div className="h-24 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl p-4 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-orange-600" />
                <span className="text-xs text-muted-foreground">رياضاتي</span>
              </div>
              <div>
                <p className="font-display font-bold text-2xl">
                  {playerPrefsQ.data.favorite_sports.length}
                </p>
                <p className="text-xs text-muted-foreground">متابعة</p>
              </div>
            </div>
          )}

          <Link
            to="/booking-flow"
            className="h-24 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-4 flex flex-col justify-between surface-lift hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-green-600" />
              <span className="text-xs text-muted-foreground">حجز جديد</span>
            </div>
            <div>
              <p className="font-display font-bold text-sm">حجز جلسة</p>
              <p className="text-xs text-muted-foreground">اختر مدرب</p>
            </div>
          </Link>
        </div>

        {/* Hero card */}
        {playerPrefsQ.data?.fitness_goals && (
          <div className="animate-soft-glow relative h-32 overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-blue-600 to-cyan-500 p-6 text-primary-foreground mb-6">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase opacity-80">أهدافك</p>
              <h3 className="font-display font-bold text-lg mt-1 leading-tight">
                {playerPrefsQ.data.fitness_goals}
              </h3>
            </div>
          </div>
        )}

        {/* Upcoming Sessions */}
        {upcomingBookings.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-lg mb-3">الجلسات القادمة</h2>
            <div className="space-y-3">
              {upcomingBookings.slice(0, 3).map((booking: any) => (
                <div
                  key={booking.id}
                  className="rounded-3xl border border-border bg-surface p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-display font-bold text-sm">
                        {booking.coaches?.full_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {booking.coaches?.title_ar}
                      </p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary rounded-lg px-2 py-1 font-bold">
                      {new Date(booking.start_time).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⏰ {new Date(booking.start_time).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Coaches */}
        {playerPrefsQ.data?.favorite_sports && recommendedCoachesQ.data && recommendedCoachesQ.data.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-display font-bold text-lg">⭐ مدربون مخصصين لك</h2>
              <Link to="/search" className="text-primary text-xs font-bold">
                عرض الكل
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {recommendedCoachesQ.data.slice(0, 3).map((c) => (
                <CoachCard key={c.id} coach={c} />
              ))}
            </div>
          </div>
        )}

        {/* Search and Browse */}
        <div>
          <h2 className="font-display font-bold text-lg mb-3">ابحث عن مدرب جديد</h2>
          <Link
            to="/search"
            className="flex items-center gap-3 h-12 bg-surface rounded-2xl px-4 mb-6 text-muted-foreground text-sm"
          >
            <Search className="size-5" />
            ابحث عن مدرب أو أكاديمية...
          </Link>
        </div>
      </div>
    );
  }

  // ===== PLAYER/ACADEMY DEFAULT DASHBOARD =====
  return (
    <div className="px-5 pt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground text-xs mb-1">مرحباً 👋</p>
          <h1 className="font-display font-bold text-2xl">{profileQ.data?.full_name ?? ""}</h1>
        </div>
        <button className="size-11 rounded-full bg-surface flex items-center justify-center relative">
          <Bell className="size-5" />
          <span className="absolute top-2 left-2 size-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* Search bar */}
      <Link
        to="/search"
        className="flex items-center gap-3 h-12 bg-surface rounded-2xl px-4 mb-6 text-muted-foreground text-sm"
      >
        <Search className="size-5" />
        ابحث عن مدرب أو أكاديمية...
      </Link>

      {/* Hero card */}
      <div className="animate-soft-glow relative h-40 overflow-hidden rounded-[28px] bg-gradient-to-br from-primary via-blue-600 to-cyan-500 p-6 text-primary-foreground mb-4">
        <div className="relative z-10 max-w-[60%]">
          <span className="text-[10px] font-bold uppercase opacity-80">عرض خاص</span>
          <h3 className="font-display font-bold text-2xl mt-1 leading-tight">خصم ٢٠٪ على أول حجز</h3>
          <p className="text-xs opacity-90 mt-2">استخدم كود ATHLETE20</p>
        </div>
      </div>

      {/* Academy Dashboard Link - for players interested in management */}
      <Link
        to="/academy-dashboard"
        className="animate-rise flex items-center justify-between rounded-[24px] border border-border/70 bg-card/95 p-4 mb-6 shadow-sm surface-lift"
      >
        <div>
          <p className="text-[10px] text-primary font-bold">قسم الإدارة</p>
          <h3 className="font-display font-bold text-sm mt-1">إدارة الجلسات والإيرادات</h3>
        </div>
        <span className="text-sm font-bold text-primary">→</span>
      </Link>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          to="/bookings"
          className="rounded-[24px] border border-border/70 bg-card/95 p-4 shadow-sm surface-lift"
        >
          <p className="text-[10px] text-primary font-bold">حجوزاتي</p>
          <p className="font-display font-bold text-sm mt-1">الجلسات المحجوزة</p>
        </Link>
        <Link
          to="/booking-flow"
          className="rounded-[24px] border border-border/70 bg-card/95 p-4 shadow-sm surface-lift"
        >
          <p className="text-[10px] text-primary font-bold">حجز جديد</p>
          <p className="font-display font-bold text-sm mt-1">ابدأ جلسة جديدة</p>
        </Link>
      </div>

      {/* Today's Offers */}
      <div className="animate-soft-glow relative h-32 overflow-hidden rounded-[28px] bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-6 text-white mb-6">
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase opacity-90">🎁 عرض اليوم</p>
          <h3 className="font-display font-bold text-xl mt-1 leading-tight">خصم حتى 30٪ على جلستك الأولى</h3>
          <p className="text-xs opacity-90 mt-2">استخدم كود FIRSTFIT</p>
        </div>
      </div>

      {/* Sports chips */}
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="font-display font-bold text-lg">الرياضات</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-2 mb-6 scrollbar-none">
        <SportChip emoji="✨" label="الكل" active={sport === null} onClick={() => setSport(null)} />
        {sportsQ.data?.map((s) => (
          <SportChip
            key={s.id}
            emoji={s.emoji ?? "⚽"}
            label={s.name_ar}
            active={sport === s.id}
            onClick={() => setSport(s.id)}
          />
        ))}
      </div>

      {/* Academies */}
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="font-display font-bold text-lg">أكاديميات مميّزة</h2>
        <Link to="/search" className="text-primary text-xs font-bold">
          عرض الكل
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 mb-8 scrollbar-none">
        {academiesQ.data?.map((a) => (
          <AcademyCard key={a.id} academy={a} />
        ))}
      </div>

      {/* Coaches list */}
      <div className="flex justify-between items-baseline mb-3">
        <h2 className="font-display font-bold text-lg">أفضل المدربين</h2>
        <Link to="/search" className="text-primary text-xs font-bold">
          عرض الكل
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {coachesQ.isLoading && (
          <div className="text-center text-muted-foreground py-8 text-sm">جارٍ التحميل...</div>
        )}
        {coachesQ.data?.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">لا يوجد مدربون لهذه الرياضة</div>
        )}
        {coachesQ.data?.map((c) => (
          <CoachCard key={c.id} coach={c} />
        ))}
      </div>
    </div>
  );
}