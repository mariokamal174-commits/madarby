import { Link } from "@tanstack/react-router";
import { Star, CheckCircle } from "lucide-react";

export type CoachCardData = {
  id: string;
  full_name: string;
  title_ar: string | null;
  avatar_url: string | null;
  rating: number | null;
  price_per_session: number;
  min_price?: number;
  max_price?: number;
  city: string | null;
  verified?: boolean;
};

export function CoachCard({ coach }: { coach: CoachCardData }) {
  return (
    <Link
      to="/coaches/$id"
      params={{ id: coach.id }}
      className="group relative flex gap-4 overflow-hidden rounded-[24px] border border-border/70 bg-card/95 p-4 shadow-sm surface-lift active:scale-[0.99]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative size-24 shrink-0 overflow-hidden rounded-[18px] bg-neutral-200">
        {coach.avatar_url ? (
          <img src={coach.avatar_url} alt={coach.full_name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
            {coach.full_name?.charAt(0)}
          </div>
        )}
      </div>
      <div className="relative flex flex-col justify-between py-1 flex-1 min-w-0">
        <div>
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <h4 className="font-display font-bold text-base truncate">{coach.full_name}</h4>
              {coach.verified && (
                <CheckCircle className="size-4 text-green-600 shrink-0" />
              )}
            </div>
            <span className="flex items-center gap-1 text-xs font-bold shrink-0">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {coach.rating?.toFixed(1) ?? "—"}
            </span>
          </div>
          <p className="text-muted-foreground text-xs truncate">{coach.title_ar}</p>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-display font-bold text-primary text-sm">
            {coach.max_price && coach.min_price !== undefined && coach.max_price !== coach.min_price
              ? `من ${Number(coach.min_price)} إلى ${Number(coach.max_price)} ج.م`
              : `بدءاً من ${Number(coach.min_price ?? coach.price_per_session)} ج.م`}
            <span className="text-[10px] text-muted-foreground font-normal">/ جلسة</span>
          </span>
          <span className="px-3 py-1.5 bg-foreground text-background text-[10px] font-bold rounded-lg">حجز</span>
        </div>
      </div>
    </Link>
  );
}