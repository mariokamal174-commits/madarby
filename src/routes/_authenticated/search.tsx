import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CoachCard, type CoachCardData } from "@/components/CoachCard";
import { useState } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/search")({
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");

  const results = useQuery({
    queryKey: ["search-coaches", q],
    queryFn: async () => {
      let query = supabase
        .from("coaches")
        .select("id, full_name, title_ar, avatar_url, rating, price_per_session, city")
        .order("rating", { ascending: false })
        .limit(30);
      if (q.trim()) query = query.or(`full_name.ilike.%${q}%,title_ar.ilike.%${q}%,city.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data as CoachCardData[];
    },
  });

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display font-bold text-2xl mb-4">اكتشف</h1>
      <div className="relative mb-6">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث عن مدرب أو مدينة..."
          className="w-full h-14 bg-surface rounded-2xl pr-12 pl-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="flex flex-col gap-3">
        {results.isLoading && (
          <div className="text-center text-muted-foreground py-8 text-sm">جارٍ البحث...</div>
        )}
        {results.data?.length === 0 && (
          <div className="text-center text-muted-foreground py-16 text-sm">لا توجد نتائج</div>
        )}
        {results.data?.map((c) => (
          <CoachCard key={c.id} coach={c} />
        ))}
      </div>
    </div>
  );
}