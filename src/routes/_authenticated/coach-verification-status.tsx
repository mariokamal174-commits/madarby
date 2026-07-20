import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Check, X, Edit } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/_authenticated/coach-verification-status")({
  component: CoachVerificationStatus,
});

function CoachVerificationStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const verificationQ = useQuery({
    queryKey: ["my_verification", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("coach_verifications")
        .select("*")
        .eq("coach_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const coachQ = useQuery({
    queryKey: ["my_coach", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("coaches")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const verification = verificationQ.data;
  const coach = coachQ.data;

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      label: "قيد المراجعة",
      description: "يتم مراجعة وثائقك من قبل فريق التحقق",
    },
    approved: {
      icon: Check,
      color: "text-green-600",
      bgColor: "bg-green-50",
      label: "موافق عليه ✓",
      description: "تم قبول حسابك والتحقق من جميع وثائقك",
    },
    rejected: {
      icon: X,
      color: "text-red-600",
      bgColor: "bg-red-50",
      label: "مرفوض",
      description: "لم يتم قبول طلبك. يمكنك إعادة المحاولة",
    },
  };

  const status = verification?.status || "pending";
  const config = statusConfig[status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  return (
    <PhoneShell>
      <div className="px-5 pt-6 pb-8">
        <h1 className="font-display font-bold text-2xl mb-2">حالة التحقق</h1>
        <p className="text-muted-foreground text-xs mb-6">
          متابعة حالة الموافقة على حسابك
        </p>

        {/* Status Card */}
        <div className={`rounded-3xl ${config.bgColor} p-6 mb-6`}>
          <div className="flex items-start gap-4">
            <div className={`size-12 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
              <StatusIcon className={`size-6 ${config.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`font-display font-bold text-lg ${config.color}`}>
                {config.label}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {config.description}
              </p>
            </div>
          </div>
        </div>

        {/* Documents Summary */}
        {verification && (
          <div className="rounded-3xl border border-border bg-surface p-4 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">الوثائق المقدمة</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2">
                  📜 الشهادات
                </p>
                <p className="text-sm">
                  تم تحميل {Array.isArray(verification.certificates) ? verification.certificates.length : 0} شهادة
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2">
                  🏢 كارنيه النقابة
                </p>
                <p className="text-sm">تم تحميل بنجاح</p>
              </div>
              {verification.submitted_at && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-2">
                    📅 تاريخ التقديم
                  </p>
                  <p className="text-sm">
                    {new Date(verification.submitted_at).toLocaleDateString("ar-SA")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coach Profile Info */}
        {coach && (
          <div className="rounded-3xl border border-border bg-surface p-4 mb-6">
            <h3 className="font-display font-bold text-sm mb-4">معلومات الملف</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-muted-foreground">الاسم</p>
                <p className="text-sm font-bold">{coach.full_name}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">التخصص</p>
                <p className="text-sm">{coach.title_ar || "لم يتم تحديده"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  سعر الجلسة
                </p>
                <p className="text-sm font-bold">
                  {coach.price_per_session} ج.م
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground">النبذة</p>
                <p className="text-sm">{coach.bio_ar || "لم يتم إضافة نبذة"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        {status === "pending" && (
          <div className="rounded-3xl border border-amber-300/30 bg-amber-50/50 p-4 mb-6">
            <h3 className="font-display font-bold text-sm mb-3">الخطوات التالية</h3>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>✓ تم تقديم الوثائق</li>
              <li>⏳ قيد المراجعة من قبل الفريق</li>
              <li className="text-muted-foreground/50">ستتلقى بريداً إلكترونياً بالنتيجة</li>
            </ul>
          </div>
        )}

        {status === "approved" && (
          <div className="rounded-3xl border border-green-300/30 bg-green-50/50 p-4 mb-6">
            <h3 className="font-display font-bold text-sm mb-3">مبروك! 🎉</h3>
            <p className="text-sm text-muted-foreground mb-4">
              حسابك مفعل الآن وجاهز للاستقبال من الطلاب. يمكنك الآن:
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>✓ استقبال طلبات الحجز</li>
              <li>✓ إدارة جدول المواعيد</li>
              <li>✓ تحقيق الدخل من الجلسات</li>
            </ul>
          </div>
        )}

        {status === "rejected" && (
          <div className="rounded-3xl border border-red-300/30 bg-red-50/50 p-4 mb-6">
            <h3 className="font-display font-bold text-sm mb-3">لم يتم قبول الطلب</h3>
            <p className="text-sm text-muted-foreground mb-4">
              يمكنك إعادة محاولة تقديم الوثائق مع مراعاة التعليقات
            </p>
            <Link
              to="/coach-verification"
              className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
            >
              إعادة المحاولة
            </Link>
          </div>
        )}

        {/* Back to Dashboard */}
        <Link
          to="/coach-dashboard"
          className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center hover:shadow-lg hover:shadow-primary/30 transition-all"
        >
          العودة للوحة المدرب
        </Link>
      </div>
    </PhoneShell>
  );
}
