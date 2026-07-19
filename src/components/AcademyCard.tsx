import { Link } from "@tanstack/react-router";
import { Star, MapPin } from "lucide-react";

export type AcademyCardData = {
  id: string;
  name_ar: string;
  city: string | null;
  cover_url: string | null;
  rating: number | null;
};

export function AcademyCard({ academy }: { academy: AcademyCardData }) {
  return (
    <Link
      to="/academies/$id"
      params={{ id: academy.id }}
      className="group shrink-0 w-56 overflow-hidden rounded-[24px] border border-border/70 bg-card/95 shadow-sm surface-lift active:scale-[0.99]"
    >
      <div className="relative h-32 bg-neutral-200">
        {academy.cover_url ? (
          <img src={academy.cover_url} alt={academy.name_ar} className="w-full h-full object-cover" loading="lazy" />
        ) : null}
        <div className="absolute top-2 left-2 rounded-lg bg-background/95 px-2 py-1 backdrop-blur flex items-center gap-1 text-xs font-bold">
          <Star className="size-3 fill-amber-400 text-amber-400" />
          {academy.rating?.toFixed(1) ?? "—"}
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-display font-bold text-sm truncate">{academy.name_ar}</h4>
        <p className="flex items-center gap-1 text-muted-foreground text-xs mt-1">
          <MapPin className="size-3" />
          {academy.city}
        </p>
      </div>
    </Link>
  );
}