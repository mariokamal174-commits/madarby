import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoachCard, type CoachCardData } from "@/components/CoachCard";
import { AcademyCard, type AcademyCardData } from "@/components/AcademyCard";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { Search, Filter, MapPin, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState(4.0);
  const [searchType, setSearchType] = useState<"coaches" | "academies">("coaches");

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
    queryKey: ["search-coaches", q, selectedSport, city, minRating],
    queryFn: async () => {
      let query = supabase
        .from("coaches")
        .select("id, full_name, title_ar, avatar_url, rating, price_per_session, city, verified")
        .eq("approved", true)
        .eq("verified", true)
        .gte("rating", minRating)
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

        {/* Filters */}
        <div className="mb-4 space-y-3">
          {/* City Filter */}
          <input
            type="text"
            placeholder="المدينة"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-10 rounded-xl bg-surface border border-border px-3 text-right text-xs placeholder:text-muted-foreground"
          />

          {/* Sport Filter - Only for Coaches */}
          {searchType === "coaches" && (
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
          )}

          {/* Rating Filter - Only for Coaches */}
          {searchType === "coaches" && (
            <div>
              <label className="text-xs text-muted-foreground block mb-2">التقييم الأدنى: {minRating}</label>
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full"
              />
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
