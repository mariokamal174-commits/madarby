import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";

export type CoachCardData = {
  id: string;
  full_name: string;
  title_ar: string | null;
  avatar_url: string | null;
  rating: number | null;
  price_per_session: number;
  city: string | null;
};

export function CoachCard({ coach }: { coach: CoachCardData }) {
  return (
    <Link
      to="/coaches/$id"
      params={{ id: coach.id }}
      className="flex gap-4 p-4 bg-surface rounded-3xl border border-transparent hover:border-primary/20 transition-all active:scale-[0.99]"
    >
      <div className="size-24 rounded-2xl bg-neutral-200 shrink-0 overflow-hidden">
        {coach.avatar_url ? (
          <img src={coach.avatar_url} alt={coach.full_name} className="w-full h-full object-cover" loading="lazy" />
        ) : null}
      </div>
      <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-display font-bold text-base truncate">{coach.full_name}</h4>
            <span className="flex items-center gap-1 text-xs font-bold shrink-0">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {coach.rating?.toFixed(1) ?? "—"}
            </span>
          </div>
          <p className="text-muted-foreground text-xs truncate">{coach.title_ar}</p>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-display font-bold text-primary text-sm">
            {Number(coach.price_per_session)} ر.س{" "}
            <span className="text-[10px] text-muted-foreground font-normal">/ جلسة</span>
          </span>
          <span className="px-3 py-1.5 bg-foreground text-background text-[10px] font-bold rounded-lg">حجز</span>
        </div>
      </div>
    </Link>
  );
}