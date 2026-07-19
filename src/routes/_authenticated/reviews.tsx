import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { EyeOff, ShieldCheck, Trash2, XCircle, CheckCircle2 } from "lucide-react";
import { reviewSeed, shouldFilterReview, type ReviewRecord, type ReviewStatus } from "@/lib/mock-platform";

export const Route = createFileRoute("/_authenticated/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>(() => reviewSeed);

  function updateReview(id: string, status: ReviewStatus) {
    setReviews((current) => current.map((review) => (review.id === id ? { ...review, status } : review)));
  }

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">إدارة المراجعات</p>
        <h1 className="font-display font-bold text-2xl">المراجعات</h1>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => {
          const flagged = shouldFilterReview(review.comment);
          return (
            <div key={review.id} className="rounded-3xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <p className="font-display font-bold text-sm">{review.student}</p>
                  <p className="text-xs text-muted-foreground">{review.createdAt}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${review.status === "approved" ? "bg-emerald-100 text-emerald-800" : review.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                  {review.status}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>
              {flagged && (
                <div className="mb-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                  محتوى يحتاج مراجعة لغوية
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button onClick={() => updateReview(review.id, "approved")} className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground">
                  <CheckCircle2 className="size-3.5" /> موافقة
                </button>
                <button onClick={() => updateReview(review.id, "rejected")} className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">
                  <XCircle className="size-3.5" /> رفض
                </button>
                <button onClick={() => updateReview(review.id, "hidden" as ReviewStatus)} className="flex items-center gap-1 rounded-full bg-surface px-3 py-2 text-[11px] font-bold">
                  <EyeOff className="size-3.5" /> إخفاء
                </button>
                <button onClick={() => setReviews((current) => current.filter((item) => item.id !== review.id))} className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-2 text-[11px] font-bold text-neutral-700">
                  <Trash2 className="size-3.5" /> حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
