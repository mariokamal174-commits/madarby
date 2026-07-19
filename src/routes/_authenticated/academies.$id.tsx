import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Star, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/academies/$id")({
  component: AcademyDetail,
});

function AcademyDetail() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["academy", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("academies").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  if (q.isLoading) return <p className="p-8 text-center text-muted-foreground text-sm">جارٍ التحميل...</p>;
  const a = q.data;
  if (!a) return <p className="p-8 text-center text-muted-foreground text-sm">غير موجود</p>;

  return (
    <div>
      <div className="relative h-64">
        {a.cover_url && <img src={a.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <Link
          to="/home"
          className="absolute top-6 right-6 size-11 rounded-full bg-background/95 backdrop-blur flex items-center justify-center"
        >
          <ArrowRight className="size-5" />
        </Link>
      </div>

      <div className="px-5 mt-4">
        <h1 className="font-display font-bold text-2xl">{a.name_ar}</h1>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {a.rating?.toFixed(1) ?? "—"}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {a.city}
          </span>
          {a.phone && (
            <span className="flex items-center gap-1">
              <Phone className="size-3.5" />
              {a.phone}
            </span>
          )}
        </div>

        <p className="mt-6 text-sm text-muted-foreground leading-relaxed">{a.description_ar ?? "لا يوجد وصف."}</p>
      </div>
    </div>
  );
}