import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile/favorites")({
  component: Favorites,
});

function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const favoritesQ = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return { coaches: [], academies: [] };
      
      // Get favorite coaches
      const coachesRes = await supabase
        .from("bookings")
        .select("coach_id, coaches(id, full_name, title_ar, rating, avatar_url, price_per_session)")
        .eq("player_id", user.id)
        .eq("status", "completed")
        .limit(10);

      // Get favorite academies
      const academiesRes = await supabase
        .from("academy_bookings")
        .select("academy_id, academies(id, name_ar, rating, cover_url)")
        .eq("player_id", user.id)
        .limit(10);

      return {
        coaches: coachesRes.data ?? [],
        academies: academiesRes.data ?? [],
      };
    },
    enabled: !!user?.id,
  });

  return (
    <div className="px-5 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate({ to: "/profile" })} className="size-10 rounded-full bg-surface flex items-center justify-center">
          <ArrowRight className="size-5" />
        </button>
        <h1 className="font-display font-bold text-2xl">المفضلة</h1>
      </div>

      {/* Favorite Coaches */}
      {favoritesQ.data?.coaches && favoritesQ.data.coaches.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Heart className="size-4 text-red-600" /> المدربون المفضلون
          </h2>
          <div className="space-y-3">
            {favoritesQ.data.coaches.map((item: any) => (
              <Link
                key={item.coach_id}
                to={`/coaches/${item.coaches.id}`}
                className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between hover:bg-background transition-all"
              >
                <div className="flex items-center gap-3">
                  {item.coaches.avatar_url && (
                    <img src={item.coaches.avatar_url} alt="" className="size-12 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-bold text-sm">{item.coaches.full_name}</p>
                    <p className="text-xs text-muted-foreground">{item.coaches.title_ar}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-primary">{item.coaches.price_per_session} ج.م</p>
                  <p className="text-xs text-muted-foreground">⭐ {item.coaches.rating}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Favorite Academies */}
      {favoritesQ.data?.academies && favoritesQ.data.academies.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <Heart className="size-4 text-red-600" /> الأكاديميات المفضلة
          </h2>
          <div className="space-y-3">
            {favoritesQ.data.academies.map((item: any) => (
              <Link
                key={item.academy_id}
                to={`/academies/${item.academy_id}`}
                className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between hover:bg-background transition-all"
              >
                <div className="flex items-center gap-3 flex-1">
                  {item.academies?.cover_url && (
                    <img src={item.academies.cover_url} alt="" className="size-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-bold text-sm">{item.academies?.name_ar}</p>
                    <p className="text-xs text-muted-foreground">⭐ {item.academies?.rating}</p>
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {favoritesQ.data && favoritesQ.data.coaches.length === 0 && favoritesQ.data.academies.length === 0 && (
        <div className="text-center py-12">
          <Heart className="size-16 mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-display font-bold text-sm mb-2">لا توجد مفضلة بعد</p>
          <p className="text-xs text-muted-foreground">ابدأ بحجز جلسات لإضافة المدربين للمفضلة</p>
        </div>
      )}
    </div>
  );
}
