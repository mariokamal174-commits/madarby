import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoachCard, type CoachCardData } from "@/components/CoachCard";
import { AcademyCard, type AcademyCardData } from "@/components/AcademyCard";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { Search, Filter, MapPin, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/search")({
  beforeLoad: async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) throw redirect({ to: "/auth" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("primary_role")
      .eq("id", userData.user.id)
      .single();

    if (profile?.primary_role === "coach") {
      throw redirect({ to: "/home" });
    }
  },
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [sessionType, setSessionType] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"coaches" | "academies">("coaches");
  const [showFilters, setShowFilters] = useState(false);

  const sportsQ = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sports")
        .select("id, name_ar, emoji")
        .order("name_ar");
      if (error) throw error;
      return data || [];
    },
  });

  const coachesQ = useQuery({
    queryKey: ["search-coaches", q, selectedSport, city, minRating, maxPrice],
    queryFn: async () => {
      let query = supabase
        .from("coaches")
        .select("id, full_name, title_ar, avatar_url, rating, price_per_session, city")
        .eq("approved", true)
        .eq("verified", true)
        .gte("rating", minRating)
        .lte("price_per_session", maxPrice)
        .order("rating", { ascending: false })
        .limit(30);
      
      if (q.trim()) {
        query = query.or(`full_name.ilike.%${q}%,title_ar.ilike.%${q}%`);
      }
      if (city.trim()) {
        query = query.ilike("city", `%${city}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CoachCardData[];
    },
  });

  const academiesQ = useQuery({
    queryKey: ["search-academies", q, city],
    queryFn: async () => {
      let query = supabase
        .from("academies")
        .select("id, name_ar, city, cover_url, rating")
        .eq("approved", true)
        .order("rating", { ascending: false })
        .limit(30);
      
      if (q.trim()) {
        query = query.ilike("name_ar", `%${q}%`);
      }
      if (city.trim()) {
        query = query.ilike("city", `%${city}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AcademyCardData[];
    },
  });

  const results = searchType === "coaches" ? coachesQ : academiesQ;

  return (
    <PhoneShell>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <h1 className="font-display font-bold text-2xl mb-6">ابحث</h1>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={searchType === "coaches" ? "ابحث عن مدرب..." : "ابحث عن أكاديمية..."}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full h-12 rounded-2xl bg-surface border border-border px-4 pr-10 text-right font-bold text-sm placeholder:text-muted-foreground"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchType("coaches")}
            className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all ${
              searchType === "coaches"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-surface border border-border"
            }`}
          >
            المدربون
          </button>
          <button
            onClick={() => setSearchType("academies")}
            className={`flex-1 h-10 rounded-xl font-bold text-xs transition-all ${
              searchType === "academies"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-surface border border-border"
            }`}
          >
            الأكاديميات
          </button>
        </div>

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full h-10 rounded-xl bg-surface border border-border font-bold text-xs flex items-center justify-center gap-2 mb-4 transition-all"
        >
          <Filter className="size-4" />
          {showFilters ? "إخفاء الفلاتر" : "إظهار الفلاتر المتقدمة"}
        </button>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mb-4 p-4 rounded-2xl bg-surface border border-border space-y-3">
            {/* City Filter */}
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-2">📍 المدينة</label>
              <input
                type="text"
                placeholder="البحث بالمدينة"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-9 rounded-lg bg-background border border-border px-3 text-right text-xs"
              />
            </div>

            {/* Price Filter - Only for Coaches */}
            {searchType === "coaches" && (
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">💰 السعر: حتى {maxPrice} ج.م</label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Rating Filter - Only for Coaches */}
            {searchType === "coaches" && (
              <div>
                <label className="text-xs font-bold text-muted-foreground block mb-2">⭐ التقييم الأدنى: {minRating}</label>
                <div className="flex gap-2">
                  {[0, 3, 3.5, 4, 4.5, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(rating)}
                      className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${
                        minRating === rating
                          ? "bg-primary text-primary-foreground"
                          : "bg-background border border-border"
                      }`}
                    >
                      {rating === 0 ? "الكل" : rating}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 space-y-2">
          {/* Sport Filter - Only for Coaches */}
          {searchType === "coaches" && (
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-2">🏆 الرياضة</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedSport(null)}
                  className={`h-9 px-3 rounded-lg whitespace-nowrap font-bold text-xs transition-all shrink-0 ${
                    selectedSport === null
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface border border-border"
                  }`}
                >
                  الكل
                </button>
                {sportsQ.data?.map((sport: any) => (
                  <button
                    key={sport.id}
                    onClick={() => setSelectedSport(sport.id)}
                    className={`h-9 px-3 rounded-lg whitespace-nowrap font-bold text-xs transition-all shrink-0 ${
                      selectedSport === sport.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface border border-border"
                    }`}
                  >
                    {sport.emoji} {sport.name_ar}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {results.isLoading && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              جاري البحث...
            </div>
          )}

          {results.data?.length === 0 && !results.isLoading && (
            <div className="text-center py-8">
              <Search className="size-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">لم يتم العثور على نتائج</p>
              <p className="text-xs text-muted-foreground mt-1">حاول تعديل معايير البحث</p>
            </div>
          )}

          {searchType === "coaches" && (
            <div className="space-y-3">
              {(results.data as CoachCardData[])?.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          )}

          {searchType === "academies" && (
            <div className="space-y-3">
              {(results.data as AcademyCardData[])?.map((academy) => (
                <AcademyCard key={academy.id} academy={academy} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}
