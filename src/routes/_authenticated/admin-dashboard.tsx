import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Users, GraduationCap, BarChart3, MessageSquareText, Ticket, CircleDollarSign, Star, BellRing, Check, X, Clock, ExternalLink } from "lucide-react";
import { adminSeed } from "@/lib/mock-platform";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin-dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch pending coach verifications
  const verificationsQ = useQuery({
    queryKey: ["coach_verifications_pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_verifications")
        .select("*, coaches:coach_id(id, full_name, title_ar, user_id)")
        .eq("status", "pending")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  async function handleApprove(verificationId: string, coachUserId: string) {
    setActionLoading(verificationId);
    try {
      // Update verification status
      const { error: verifyError } = await supabase
        .from("coach_verifications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", verificationId);

      if (verifyError) throw verifyError;

      // Update coach verified status
      const { error: coachError } = await supabase
        .from("coaches")
        .update({ verified: true, approved: true })
        .eq("user_id", coachUserId);

      if (coachError) throw coachError;

      toast.success("تم قبول الحساب والتحقق من المدرب");
      verificationsQ.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(verificationId: string) {
    setActionLoading(verificationId);
    try {
      const { error } = await supabase
        .from("coach_verifications")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", verificationId);

      if (error) throw error;
      toast.success("تم رفض الطلب");
      verificationsQ.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setActionLoading(null);
    }
  }

  const sections = [
    { label: "المستخدمون", icon: Users },
    { label: "الحجوزات", icon: CircleDollarSign },
    { label: "المدفوعات", icon: BarChart3 },
    { label: "المراجعات", icon: Star },
    { label: "الإشعارات", icon: BellRing },
    { label: "الدعم", icon: Ticket },
    { label: "الرسائل", icon: MessageSquareText },
  ];

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">لوحة الإدارة</p>
        <h1 className="font-display font-bold text-2xl">الإدارة</h1>
      </div>

      {/* Quick stats */}
      <div className="rounded-3xl border border-border bg-primary/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="size-5 text-primary" />
          <h2 className="font-display font-bold text-lg">نظرة سريعة</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {adminSeed.map((item) => (
            <div key={item.title} className="rounded-2xl bg-background/90 p-3">
              <p className="text-[11px] text-muted-foreground">{item.title}</p>
              <p className="font-display font-bold text-lg">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Coach Verifications */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="size-5 text-primary" />
          <h2 className="font-display font-bold text-lg">
            طلبات التحقق من المدربين
            {verificationsQ.data && verificationsQ.data.length > 0 && (
              <span className="ml-2 text-sm bg-primary text-primary-foreground rounded-full px-3 py-1">
                {verificationsQ.data.length}
              </span>
            )}
          </h2>
        </div>

        {verificationsQ.isLoading && (
          <div className="text-center text-muted-foreground py-8">جارٍ التحميل...</div>
        )}

        {verificationsQ.data?.length === 0 && (
          <div className="text-center text-muted-foreground py-8 text-sm">
            لا توجد طلبات معلقة
          </div>
        )}

        <div className="space-y-3">
          {verificationsQ.data?.map((verification: any) => (
            <div
              key={verification.id}
              className="rounded-3xl border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-bold">
                    {verification.coaches?.full_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {verification.coaches?.title_ar}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-600">
                  <Clock className="size-4" />
                  <span className="text-xs font-bold">معلق</span>
                </div>
              </div>

              {/* Documents Preview */}
              <div className="mb-4 space-y-2">
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">
                    📜 الشهادات
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {verification.certificates?.map((cert: string, idx: number) => (
                      <a
                        key={idx}
                        href={cert}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-primary/10 text-primary rounded-lg px-2 py-1 hover:bg-primary/20 transition-colors inline-flex items-center gap-1"
                      >
                        الشهادة {idx + 1}
                        <ExternalLink className="size-3" />
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">
                    🏢 كارنيه النقابة
                  </p>
                  <a
                    href={verification.license_card_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-green-500/10 text-green-600 rounded-lg px-2 py-1 hover:bg-green-500/20 transition-colors inline-flex items-center gap-1"
                  >
                    عرض الكارنيه
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleApprove(verification.id, verification.coach_id)
                  }
                  disabled={actionLoading === verification.id}
                  className="flex-1 h-10 rounded-xl bg-green-600 text-white font-display font-bold text-sm flex items-center justify-center gap-1 hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  <Check className="size-4" />
                  قبول
                </button>
                <button
                  onClick={() => handleReject(verification.id)}
                  disabled={actionLoading === verification.id}
                  className="flex-1 h-10 rounded-xl bg-red-600 text-white font-display font-bold text-sm flex items-center justify-center gap-1 hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  <X className="size-4" />
                  رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Other Sections */}
      <div className="grid grid-cols-2 gap-3">
        {sections.map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-border bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="size-4 text-primary" />
              <h3 className="font-display font-bold text-sm">{label}</h3>
            </div>
            <p className="text-xs text-muted-foreground">متاح في لوحة الإدارة مع الدعم الكامل للترشيحات والمرشحات.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
